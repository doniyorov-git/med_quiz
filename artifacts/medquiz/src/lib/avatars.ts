export interface PresetAvatar {
  id: string;
  name: string;
  category: '3d-med' | 'meme' | 'specialist';
  url: string;
}

// Function to generate high quality SVG avatars as Data URLs
function makeSvgAvatar(emoji: string, bgFrom: string, bgTo: string, border: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgFrom}"/>
        <stop offset="100%" stop-color="${bgTo}"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(0,0,0,0.25)"/>
      </filter>
    </defs>
    <rect width="200" height="200" rx="30" fill="url(#g)"/>
    <rect width="192" height="192" x="4" y="4" rx="26" fill="none" stroke="${border}" stroke-width="3" opacity="0.4"/>
    <circle cx="100" cy="100" r="64" fill="rgba(255,255,255,0.15)"/>
    <text x="100" y="125" font-size="82" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif" filter="url(#shadow)">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  // 3D Med & Specialists
  { id: 'doc-m', name: '3D Shifokor', category: '3d-med', url: makeSvgAvatar('👨‍⚕️', '#10b981', '#047857', '#a7f3d0') },
  { id: 'doc-f', name: '3D Doktor qiz', category: '3d-med', url: makeSvgAvatar('👩‍⚕️', '#06b6d4', '#0e7490', '#cffafe') },
  { id: 'surgeon', name: 'Bosh Jarroh', category: '3d-med', url: makeSvgAvatar('🥼', '#3b82f6', '#1d4ed8', '#bfdbfe') },
  { id: 'cardio', name: 'Kardiolog', category: '3d-med', url: makeSvgAvatar('🩺', '#ef4444', '#b91c1c', '#fecaca') },
  { id: 'neuro', name: 'Nevrolog / Aql', category: '3d-med', url: makeSvgAvatar('🧠', '#8b5cf6', '#6d28d9', '#ddd6fe') },
  { id: 'genetic', name: 'Genetik DNA', category: '3d-med', url: makeSvgAvatar('🧬', '#ec4899', '#be185d', '#fbcfe8') },
  { id: 'scientist', name: 'Olim / Tadqiqotchi', category: '3d-med', url: makeSvgAvatar('🔬', '#14b8a6', '#0f766e', '#ccfbf1') },
  { id: 'pharma', name: 'Farmatsevt', category: '3d-med', url: makeSvgAvatar('💊', '#f59e0b', '#b45309', '#fde68a') },

  // Meme & Fun
  { id: 'gigachad-doc', name: 'Gigachad Medic', category: 'meme', url: makeSvgAvatar('🗿', '#64748b', '#334155', '#cbd5e1') },
  { id: 'cat-doc', name: 'Mushuk Doktor', category: 'meme', url: makeSvgAvatar('🐱', '#f97316', '#c2410c', '#fed7aa') },
  { id: 'ai-robot-doc', name: 'Robot Shifokor', category: 'meme', url: makeSvgAvatar('🤖', '#6366f1', '#4338ca', '#e0e7ff') },
  { id: 'coffee-intern', name: 'Tungi Navbatchi', category: 'meme', url: makeSvgAvatar('☕️', '#78350f', '#451a03', '#d97706') },
  { id: 'dentist', name: 'Stomatolog', category: 'specialist', url: makeSvgAvatar('🦷', '#0284c7', '#0369a1', '#bae6fd') },
  { id: 'toxic-virus', name: 'Virus Ovchisi', category: 'specialist', url: makeSvgAvatar('🦠', '#84cc16', '#4d7c0f', '#d9f99d') },
  { id: 'super-pulse', name: 'Hayot Impulsi', category: 'specialist', url: makeSvgAvatar('❤️‍🔥', '#dc2626', '#991b1b', '#fca5a5') },
  { id: 'gold-crown', name: 'Tibbiyot Akademigi', category: 'specialist', url: makeSvgAvatar('👑', '#eab308', '#a16207', '#fef08a') },
];
