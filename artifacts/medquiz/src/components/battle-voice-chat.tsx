import { useEffect, useRef, useState, useCallback } from 'react';
import { Icon } from '@/components/chrome';
import {
  webrtcFetchPeers,
  webrtcFetchSignals,
  webrtcHeartbeat,
  webrtcJoinVoice,
  webrtcLeaveVoice,
  webrtcSendSignal,
} from '@/lib/model';
import type { Me, VoicePeer, WebRTCSignal } from '@/lib/types';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface VoiceState {
  joined: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  peersCount: number;
}

export function BattleVoiceChat({
  roomCode,
  me,
  open,
  onClose,
  hideFloatingButton = false,
  onStateChange,
}: {
  roomCode: string;
  me: Me | null;
  open?: boolean;
  onClose?: () => void;
  hideFloatingButton?: boolean;
  onStateChange?: (state: VoiceState) => void;
}) {
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [isHoldingPTT, setIsHoldingPTT] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [peers, setPeers] = useState<VoicePeer[]>([]);
  const [micError, setMicError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSignalTimeRef = useRef<number>(0);
  const isJoinedRef = useRef(false);
  const myPeerId = me?.id || 'guest';

  // Keep ref in sync
  useEffect(() => {
    isJoinedRef.current = joined;
  }, [joined]);

  // Clean disconnect
  const disconnectAll = useCallback(() => {
    // 1. Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    // 2. Close peer connections
    connectionsRef.current.forEach((pc) => pc.close());
    connectionsRef.current.clear();
    // 3. Remove audio elements
    audioElementsRef.current.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    });
    audioElementsRef.current.clear();
    // 4. Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    // 5. Leave server
    if (roomCode && myPeerId) {
      webrtcLeaveVoice(roomCode, myPeerId);
    }
    setJoined(false);
    setIsSpeaking(false);
    setPeers([]);
  }, [roomCode, myPeerId]);

  // Connect to a remote peer
  const connectToPeer = useCallback(
    async (remotePeerId: string, shouldOffer: boolean) => {
      if (connectionsRef.current.has(remotePeerId)) return;
      const pc = new RTCPeerConnection(RTC_CONFIG);
      connectionsRef.current.set(remotePeerId, pc);

      // Add local audio tracks if available
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          webrtcSendSignal({
            roomCode,
            fromPeerId: myPeerId,
            toPeerId: remotePeerId,
            type: 'candidate',
            data: event.candidate,
          });
        }
      };

      // Handle remote audio stream
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) {
          let audio = audioElementsRef.current.get(remotePeerId);
          if (!audio) {
            audio = new Audio();
            audio.autoplay = true;
            audioElementsRef.current.set(remotePeerId, audio);
          }
          audio.srcObject = stream;
          audio.play().catch(() => {});
        }
      };

      // If polite peer (myPeerId < remotePeerId), initiate offer
      if (shouldOffer) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await webrtcSendSignal({
            roomCode,
            fromPeerId: myPeerId,
            toPeerId: remotePeerId,
            type: 'offer',
            data: offer,
          });
        } catch {}
      }
    },
    [roomCode, myPeerId]
  );

  // Handle incoming signaling
  const handleSignal = useCallback(
    async (sig: WebRTCSignal) => {
      if (!isJoinedRef.current) return;
      if (sig.toPeerId !== myPeerId || sig.fromPeerId === myPeerId) return;

      let pc = connectionsRef.current.get(sig.fromPeerId);
      if (!pc) {
        await connectToPeer(sig.fromPeerId, false);
        pc = connectionsRef.current.get(sig.fromPeerId);
      }
      if (!pc) return;

      try {
        if (sig.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await webrtcSendSignal({
            roomCode,
            fromPeerId: myPeerId,
            toPeerId: sig.fromPeerId,
            type: 'answer',
            data: answer,
          });
        } else if (sig.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
          }
        } else if (sig.type === 'candidate' && sig.data) {
          await pc.addIceCandidate(new RTCIceCandidate(sig.data)).catch(() => {});
        }
      } catch {}
    },
    [myPeerId, roomCode, connectToPeer]
  );

  // Join Voice Channel
  const handleJoin = async () => {
    if (!me || !roomCode) return;
    setMicError(null);

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;

      // Audio analysis for speaking detection
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;
        }
      } catch {}
    } catch {
      setMicError('Mikrofonga ruxsat berilmadi. Tinglovchi rejimida ulanyapsiz.');
    }

    setJoined(true);
    await webrtcJoinVoice(roomCode, myPeerId, me?.name || 'Talaba', me?.avatar || null, isMuted);
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (!joined) return;
    const next = !isMuted;
    setIsMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !next;
      });
    }
  };

  // Push to talk hold handlers
  const handlePTTDown = () => {
    if (!joined || !pushToTalk) return;
    setIsHoldingPTT(true);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }
  };

  const handlePTTUp = () => {
    if (!joined || !pushToTalk) return;
    setIsHoldingPTT(false);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  };

  // Keyboard Space for PTT
  useEffect(() => {
    if (!joined || !pushToTalk) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handlePTTDown();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handlePTTUp();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [joined, pushToTalk]);

  // Speaking Detection Loop
  useEffect(() => {
    if (!joined || !analyserRef.current) return;
    const analyser = analyserRef.current;
    const buffer = new Uint8Array(analyser.frequencyBinCount);

    const interval = window.setInterval(() => {
      analyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i];
      }
      const avg = sum / buffer.length;
      const speaking = !isMuted && (!pushToTalk || isHoldingPTT) && avg > 18;
      setIsSpeaking(speaking);
    }, 200);

    return () => window.clearInterval(interval);
  }, [joined, isMuted, pushToTalk, isHoldingPTT]);

  // Heartbeat & peer tracking
  useEffect(() => {
    if (!joined || !roomCode || !myPeerId) return;

    const interval = window.setInterval(async () => {
      const activeMuted = pushToTalk ? !isHoldingPTT : isMuted;
      await webrtcHeartbeat(roomCode, myPeerId, activeMuted, isSpeaking);

      // Fetch peers
      const fetchedPeers = await webrtcFetchPeers(roomCode);
      const otherPeers = fetchedPeers.filter((p) => p.peerId !== myPeerId);
      setPeers(otherPeers);

      // Connect to any new peer
      for (const p of otherPeers) {
        if (!connectionsRef.current.has(p.peerId)) {
          const shouldOffer = myPeerId < p.peerId;
          connectToPeer(p.peerId, shouldOffer);
        }
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [joined, roomCode, myPeerId, isMuted, pushToTalk, isHoldingPTT, isSpeaking, connectToPeer]);

  // Listen for signals (local & server)
  useEffect(() => {
    if (!joined || !roomCode || !myPeerId) return;

    // Local custom event
    const onLocalSig = (e: Event) => {
      const sig = (e as CustomEvent<WebRTCSignal>).detail;
      if (sig && sig.roomCode.toLowerCase() === roomCode.toLowerCase()) {
        handleSignal(sig);
      }
    };
    window.addEventListener('medquiz-webrtc-signal', onLocalSig);

    // Server polling
    const pollInterval = window.setInterval(async () => {
      const signals = await webrtcFetchSignals(roomCode, myPeerId, lastSignalTimeRef.current);
      if (signals.length > 0) {
        let maxTime = lastSignalTimeRef.current;
        for (const s of signals) {
          if (s.createdAt > maxTime) maxTime = s.createdAt;
          handleSignal(s);
        }
        lastSignalTimeRef.current = maxTime;
      }
    }, 1000);

    return () => {
      window.removeEventListener('medquiz-webrtc-signal', onLocalSig);
      window.clearInterval(pollInterval);
    };
  }, [joined, roomCode, myPeerId, handleSignal]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      disconnectAll();
    };
  }, [disconnectAll]);

  const activeMuted = pushToTalk ? !isHoldingPTT : isMuted;
  const [expanded, setExpanded] = useState(false);

  const isModalOpen = open !== undefined ? open : expanded;
  const handleClose = () => {
    if (open !== undefined) {
      onClose?.();
    } else {
      setExpanded(false);
    }
  };

  useEffect(() => {
    onStateChange?.({
      joined,
      isMuted: activeMuted,
      isSpeaking,
      peersCount: peers.length + 1,
    });
  }, [joined, activeMuted, isSpeaking, peers.length, onStateChange]);

  const modalContent = (
    <div className="w-full sm:w-80 rounded-2xl border border-slate-700/70 bg-slate-900/98 text-white p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {joined ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500" />
                )}
              </span>
              <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                <Icon name="ri-headphone-fill" className="text-emerald-400" />
                Ovozli aloqa
              </span>
              {joined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 font-mono font-bold text-emerald-300">
                  {peers.length + 1} qatnashchi
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Yashirish"
              aria-label="Yashirish"
            >
              <Icon name="ri-close-line" className="text-lg" />
            </button>
          </div>

          {/* Not Joined State */}
          {!joined ? (
            <div className="py-2 text-center">
              <p className="text-xs text-slate-300 mb-3">
                Guruh bilan birga ovozli gaplashish va testni muhokama qilish uchun ulaning.
              </p>
              <button
                type="button"
                onClick={handleJoin}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Icon name="ri-phone-fill" className="text-base" />
                <span>Ovozli xonaga ulanish</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Main Speak / Mute Button */}
              {pushToTalk ? (
                <button
                  type="button"
                  onMouseDown={handlePTTDown}
                  onMouseUp={handlePTTUp}
                  onTouchStart={handlePTTDown}
                  onTouchEnd={handlePTTUp}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
                    isHoldingPTT
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-300/40 animate-pulse'
                      : 'bg-white/15 hover:bg-white/20 text-slate-200 border border-white/10'
                  }`}
                >
                  <Icon name={isHoldingPTT ? 'ri-mic-fill' : 'ri-mic-off-line'} className="text-lg" />
                  <span>{isHoldingPTT ? 'Siz gapiryapsiz... (qo‘yib yuboring)' : 'Bosib turing va gapiring'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 select-none ${
                    activeMuted
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : isSpeaking
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-300/40 animate-pulse'
                      : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40'
                  }`}
                >
                  <Icon name={activeMuted ? 'ri-mic-off-fill' : isSpeaking ? 'ri-voiceprint-fill' : 'ri-mic-fill'} className="text-lg" />
                  <span>
                    {activeMuted
                      ? 'Mikrofon o‘chiq (Muted) · Yoqish'
                      : isSpeaking
                      ? 'Siz gapiryapsiz... · O‘chirish'
                      : 'Mikrofon ochiq · O‘chirish'}
                  </span>
                </button>
              )}

              {/* Mode Toggle: Push to talk vs Continuous */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-slate-300 text-[11px] font-medium flex items-center gap-1.5">
                  <Icon name={pushToTalk ? 'ri-pushpin-fill' : 'ri-broadcast-line'} className="text-emerald-400" />
                  {pushToTalk ? 'Bosib turib gapirish (PTT)' : 'Doimiy mikrofon'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPushToTalk(!pushToTalk);
                    if (localStreamRef.current) {
                      localStreamRef.current.getAudioTracks().forEach((track) => {
                        track.enabled = pushToTalk ? !isMuted : false;
                      });
                    }
                  }}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[10px] transition-colors"
                >
                  O‘zgartirish
                </button>
              </div>

              {/* Participants in Voice Call */}
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 px-0.5">
                  Qatnashchilar ({peers.length + 1})
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {/* Me */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`relative h-6 w-6 rounded-full overflow-hidden bg-primary/40 flex items-center justify-center text-[10px] font-bold ring-2 ${
                          isSpeaking ? 'ring-emerald-400' : activeMuted ? 'ring-rose-500/60' : 'ring-white/20'
                        }`}
                      >
                        {me?.avatar ? (
                          <img src={me.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (me?.name || 'Siz').slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <span className="truncate text-slate-200 font-medium">{me?.name || 'Siz'} (Siz)</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {activeMuted ? (
                        <span className="text-rose-400 flex items-center gap-1">
                          <Icon name="ri-mic-off-fill" /> Muted
                        </span>
                      ) : isSpeaking ? (
                        <span className="text-emerald-400 flex items-center gap-1 animate-pulse">
                          <Icon name="ri-voiceprint-fill" /> Gapiryapti
                        </span>
                      ) : (
                        <span className="text-emerald-400/80">Ochiq</span>
                      )}
                    </span>
                  </div>

                  {/* Remote Peers */}
                  {peers.map((peer) => (
                    <div
                      key={peer.peerId}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`relative h-6 w-6 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-[10px] font-bold ring-2 ${
                            peer.isSpeaking ? 'ring-emerald-400' : peer.isMuted ? 'ring-rose-500/60' : 'ring-white/20'
                          }`}
                        >
                          {peer.userAvatar ? (
                            <img src={peer.userAvatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (peer.userName || 'T').slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <span className="truncate text-slate-200 font-medium">{peer.userName || 'Talaba'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {peer.isMuted ? (
                          <span className="text-rose-400 flex items-center gap-1">
                            <Icon name="ri-mic-off-fill" /> Muted
                          </span>
                        ) : peer.isSpeaking ? (
                          <span className="text-emerald-400 flex items-center gap-1 animate-pulse">
                            <Icon name="ri-voiceprint-fill" /> Gapiryapti
                          </span>
                        ) : (
                          <span className="text-emerald-400/80">Eshitmoqda</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* End Call Button */}
              <button
                type="button"
                onClick={() => {
                  disconnectAll();
                  handleClose();
                }}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Icon name="ri-phone-fill" className="rotate-[135deg] text-sm text-rose-400" />
                <span>Ovozli aloqani tugatish</span>
              </button>
            </div>
          )}

          {micError && (
            <p className="mt-2 text-[10px] text-amber-400 font-medium">{micError}</p>
          )}
    </div>
  );

  return (
    <>
      {/* Centered / bottom modal overlay when opened */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          {modalContent}
        </div>
      )}

      {/* Legacy floating button only if hideFloatingButton is false */}
      {!hideFloatingButton && (
        <div className="fixed left-1/2 z-40 flex -translate-x-1/2 flex-col items-center bottom-[calc(4.9rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:bottom-24 sm:translate-x-0 sm:items-end">
          <button
            type="button"
            onClick={() => {
              if (!joined) {
                handleJoin();
                setExpanded(true);
              } else {
                setExpanded(!expanded);
              }
            }}
            className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-200 active:scale-95 border-2 sm:h-12 sm:w-12 sm:rounded-[10px] sm:border ${
              expanded
                ? 'bg-slate-900 text-white border-white/20 rotate-0 shadow-slate-900/50'
                : joined
                ? activeMuted
                  ? 'bg-gradient-to-tr from-slate-900 via-rose-950 to-slate-800 text-rose-400 border-rose-500/40 shadow-rose-900/40 ring-2 ring-rose-500/20'
                  : isSpeaking
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white border-white/30 shadow-emerald-500/40 ring-4 ring-emerald-300/40 animate-pulse'
                  : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white border-white/30 shadow-emerald-600/40 ring-2 ring-emerald-400/30'
                : 'bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-600 text-white border-white/30 hover:scale-110 shadow-teal-500/30 ring-2 ring-white/20'
            }`}
            title={joined ? 'Ovozli aloqa menyusi (Mute / Gapirish)' : 'Ovozli aloqaga ulanish'}
            aria-label="Ovozli aloqa"
          >
            {expanded ? (
              <Icon name="ri-close-line" className="text-2xl drop-shadow" />
            ) : joined ? (
              activeMuted ? (
                <Icon name="ri-mic-off-fill" className="text-2xl drop-shadow text-rose-400" />
              ) : isSpeaking ? (
                <Icon name="ri-voiceprint-fill" className="text-2xl drop-shadow animate-pulse" />
              ) : (
                <Icon name="ri-phone-fill" className="text-2xl drop-shadow" />
              )
            ) : (
              <Icon name="ri-headphone-fill" className="text-2xl drop-shadow" />
            )}

            {joined && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white dark:ring-slate-900">
                {peers.length + 1}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
}
