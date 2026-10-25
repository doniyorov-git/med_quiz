import { useState, useEffect } from 'react';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineChatAlt2,
  HiOutlineShare,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineTag,
  HiOutlineEye,
  HiOutlineUserAdd,
  HiOutlineChat,
  HiOutlineGlobe,
  HiOutlineUserGroup,
} from 'react-icons/hi';
import { useStore } from '@/lib/store';
import { getMedicalTitle } from '@/lib/model';
import { fileToImage } from '@/lib/images';
import type { BlogPost, BlogComment, StoryItem } from '@/lib/types';

export type StoryViewer = {
  id: string;
  name: string;
  avatar: string | null;
  time: string;
};

export type StoryWithViewers = StoryItem & {
  viewers?: StoryViewer[];
};

const BLOG_STORAGE_KEY = 'medquiz-v2-blog-posts';
const STORIES_STORAGE_KEY = 'medquiz-v2-stories';
const FOLLOWS_STORAGE_KEY = 'medquiz-v2-blog-follows';
const CHATS_STORAGE_KEY = 'medquiz-v2-direct-chats';

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export interface AuthorProfile {
  id: string;
  name: string;
  avatar: string | null;
  title: string;
  university: string;
  followersCount: number;
}

const PEER_AUTHORS: Record<string, AuthorProfile> = {
  'user-seed-4': {
    id: 'user-seed-4',
    name: 'Dr. Jasur Mansurov',
    avatar: null,
    title: 'Katta ilmiy xodim · Kardiologiya',
    university: 'Respublika Kardiologiya Markazi',
    followersCount: 542,
  },
  'user-seed-1': {
    id: 'user-seed-1',
    name: 'Madina Rahimova',
    avatar: null,
    title: 'Magistratura · Farmakologiya',
    university: 'Toshkent Tibbiyot Akademiyasi (TTA)',
    followersCount: 389,
  },
  'user-seed-2': {
    id: 'user-seed-2',
    name: 'Shaxzod Aliyev',
    avatar: null,
    title: 'Doktorant · Neyrojarrohlik',
    university: 'Samarqand Davlat Tibbiyot Universiteti',
    followersCount: 615,
  },
  'user-seed-3': {
    id: 'user-seed-3',
    name: 'Laylo Karimova',
    avatar: null,
    title: '3-kurs talabasi · Pediatriya',
    university: 'Toshkent Pediatriya Tibbiyot Instituti',
    followersCount: 274,
  },
  'user-seed-5': {
    id: 'user-seed-5',
    name: 'Anvar Boboyev',
    avatar: null,
    title: '4-kurs talabasi · Xirurgiya',
    university: 'Andijon Davlat Tibbiyot Instituti',
    followersCount: 198,
  },
};

const INITIAL_STORIES: StoryWithViewers[] = [
  {
    id: 'story-1',
    authorId: 'user-seed-4',
    authorName: 'Dr. Jasur Mansurov',
    authorAvatar: null,
    title: 'EKG siri',
    text: 'Bugungi qabuldan: 45 yoshli bemorda V1-V3 da ST ko‘tarilishi va T tishi inversiyasi. O‘tkir old devor infarkti o‘z vaqtida aniqlandi!',
    gradient: 'from-rose-600 via-pink-600 to-amber-600',
    viewsCount: 142,
    viewedBy: [],
    createdAt: Date.now() - 1000 * 60 * 45,
    viewers: [
      { id: 'user-seed-1', name: 'Madina Rahimova', avatar: null, time: '5 daq. oldin' },
      { id: 'user-seed-2', name: 'Shaxzod Aliyev', avatar: null, time: '12 daq. oldin' },
      { id: 'user-seed-5', name: 'Anvar Boboyev', avatar: null, time: '20 daq. oldin' },
      { id: 'user-seed-3', name: 'Laylo Karimova', avatar: null, time: '35 daq. oldin' },
    ],
  },
  {
    id: 'story-2',
    authorId: 'user-seed-1',
    authorName: 'Madina Rahimova',
    authorAvatar: null,
    title: 'Farmakologiya',
    text: 'Retseptorlar mnemoniqasi: alfa-1 (tomir torayishi), beta-1 (yurak tezlashishi), beta-2 (bronxlar kengayishi). Imtihonda asqotadi!',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    viewsCount: 98,
    viewedBy: [],
    createdAt: Date.now() - 1000 * 60 * 90,
    viewers: [
      { id: 'user-seed-4', name: 'Dr. Jasur Mansurov', avatar: null, time: '15 daq. oldin' },
      { id: 'user-seed-3', name: 'Laylo Karimova', avatar: null, time: '40 daq. oldin' },
    ],
  },
  {
    id: 'story-3',
    authorId: 'user-seed-2',
    authorName: 'Shaxzod Aliyev',
    authorAvatar: null,
    title: 'Neyrojarrohlik',
    text: 'Bugungi 4 soatlik operatsiya: epidural gematoma evakuatsiyasi muvaffaqiyatli o‘tdi. Miya pardalari anatomiyasini mukammal bilish shart!',
    gradient: 'from-violet-600 via-purple-600 to-indigo-600',
    viewsCount: 215,
    viewedBy: [],
    createdAt: Date.now() - 1000 * 60 * 180,
    viewers: [
      { id: 'user-seed-5', name: 'Anvar Boboyev', avatar: null, time: '10 daq. oldin' },
      { id: 'user-seed-1', name: 'Madina Rahimova', avatar: null, time: '2 soat oldin' },
    ],
  },
  {
    id: 'story-4',
    authorId: 'user-seed-3',
    authorName: 'Laylo Karimova',
    authorAvatar: null,
    title: 'Pediatriya',
    text: 'Apgar shkalasi: Rang, Yurak urishi, Refleks, Tonus, Nafas olish. Har bir parametr 0 dan 2 ballgacha baholanadi!',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    viewsCount: 176,
    viewedBy: [],
    createdAt: Date.now() - 1000 * 60 * 300,
    viewers: [
      { id: 'user-seed-4', name: 'Dr. Jasur Mansurov', avatar: null, time: '1 soat oldin' },
    ],
  },
];

const INITIAL_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    authorId: 'user-seed-4',
    authorName: 'Dr. Jasur Mansurov',
    authorAvatar: null,
    authorTitle: 'Katta ilmiy xodim · Kardiologiya',
    authorUniversity: 'Respublika Kardiologiya Markazi',
    title: 'EKG da ST elevatsiyasi: Miokard infarkti diagnostikasida 3 ta oltin qoida',
    content: `Hurmatli bo‘lajak shifokorlar va kursdoshlar! EKG tahlilida shoshilinch yordam ko‘rsatish uchun eng muhim belgilarni ajrata bilish kerak:

1. Elevatsiya mezonlari: V2-V3 tarmoqlarda erkaklarda ≥2mm (ayollarda ≥1.5mm), boshqa standart tarmoqlarda ≥1mm ko‘tarilish bo‘lsa, o‘tkir holat hisoblanadi.
2. Resiprok o‘zgarishlar: Masalan, II, III, aVF da elevatsiya bo‘lsa, I va aVL da ST depressiyasi kuzatiladi. Bu infarktning aniq dalilidir.
3. Vaqt omili: "Time is muscle" — har bir daqiqa miokard hujayralari hayotini saqlab qoladi.

Savollaringiz bo‘lsa izohlarda qoldiring, birga tahlil qilamiz!`,
    tags: ['Kardiologiya', 'EKG', 'ShoshilinchYordam'],
    image: null,
    likes: 38,
    likedBy: [],
    savedBy: [],
    shares: 12,
    createdAt: Date.now() - 1000 * 60 * 35,
    comments: [
      {
        id: 'c-1',
        postId: 'post-1',
        authorId: 'user-seed-5',
        authorName: 'Anvar Boboyev',
        authorAvatar: null,
        authorTitle: '4-kurs talabasi',
        text: 'Ustoz, agar LBBB (Gis tutamining chap oyog‘i blokadasi) bo‘lsa, Sgarbossa mezonlari qanday ishlatiladi?',
        likes: 4,
        likedBy: [],
        createdAt: Date.now() - 1000 * 60 * 20,
      },
      {
        id: 'c-2',
        postId: 'post-1',
        authorId: 'user-seed-4',
        authorName: 'Dr. Jasur Mansurov',
        authorAvatar: null,
        authorTitle: 'Katta ilmiy xodim',
        text: 'Ajoyib savol! Sgarbossa mezonlarida konkordant ST elevatsiyasi ≥1mm eng ishonchli (5 ball) belgi hisoblanadi.',
        likes: 7,
        likedBy: [],
        createdAt: Date.now() - 1000 * 60 * 10,
      },
    ],
  },
  {
    id: 'post-2',
    authorId: 'user-seed-1',
    authorName: 'Madina Rahimova',
    authorAvatar: null,
    authorTitle: 'Magistratura · Klinik farmatsevtika',
    authorUniversity: 'Toshkent Tibbiyot Akademiyasi (TTA)',
    title: 'Kranial nervlar (Bosh miya 12 juft nervi)ni eslab qolish mnemonikasi',
    content: `Anatomiya imtihoniga tayyorlanayotgan 1-2 kurslar uchun qulay usul:

I - N. olfactorius (Hid bilish)
II - N. opticus (Ko‘rish)
III - N. oculomotorius (Ko‘zni harakatlantiruvchi)
IV - N. trochlearis (G‘altaksimon)
V - N. trigeminus (Uch shoxli)
VI - N. abducens (Uzoqlashtiruvchi)
VII - N. facialis (Yuz)
VIII - N. vestibulocochlearis (Daxliz-chig‘anoq)
IX - N. glossopharyngeus (Til-yutqin)
X - N. vagus (Sayyor nerv)
XI - N. accessorius (Qo‘shimcha)
XII - N. hypoglossus (Tilosti)

💡 Sensor nervlar: 1, 2, 8. Motor nervlar: 3, 4, 6, 11, 12. Aralash nervlar: 5, 7, 9, 10. Saqlab oling va kursdoshlarga ulashing!`,
    tags: ['Anatomiya', 'Neyrofan', 'Mnemonika'],
    image: null,
    likes: 54,
    likedBy: [],
    savedBy: [],
    shares: 26,
    createdAt: Date.now() - 1000 * 60 * 120,
    comments: [],
  },
  {
    id: 'post-3',
    authorId: 'user-seed-3',
    authorName: 'Laylo Karimova',
    authorAvatar: null,
    authorTitle: '3-kurs talabasi · Pediatriya',
    authorUniversity: 'Toshkent Pediatriya Tibbiyot Instituti',
    title: 'Pediatriyada suvsizlanish (Degidratatsiya) darajalari',
    content: `Bolalarda o‘tkir gastroenterit vaqtida suvsizlanishni 3 ta asosiy alomat bilan tezkor baholash:
- Ko‘z olmasining cho‘kishi
- Teri burmasining yozilishi (2 soniyadan ortiq davom etsa — og‘ir daraja)
- Suyuqlik ichishga munosabati (tashnalik yoki hushsizlik)

Regidratatsiya terapiyasida Rehidron yoki standart JSST ORO eritmasi 1-bosqichda beriladi. Dozani hisoblashda tana vazniga qat’iy e’tibor bering!`,
    tags: ['Pediatriya', 'KlinikTavsiya'],
    image: null,
    likes: 29,
    likedBy: [],
    savedBy: [],
    shares: 8,
    createdAt: Date.now() - 1000 * 60 * 240,
    comments: [],
  },
];

export function BlogPage() {
  const { me } = useStore();
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      const saved = window.localStorage.getItem(BLOG_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_POSTS;
  });

  const [stories, setStories] = useState<StoryWithViewers[]>(() => {
    try {
      const saved = window.localStorage.getItem(STORIES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_STORIES;
  });

  const [follows, setFollows] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem(FOLLOWS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['user-seed-4', 'user-seed-1'];
  });

  const [directChats, setDirectChats] = useState<Record<string, DirectMessage[]>>(() => {
    try {
      const saved = window.localStorage.getItem(CHATS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'user-seed-4': [
        {
          id: 'dm-1',
          senderId: 'user-seed-4',
          senderName: 'Dr. Jasur Mansurov',
          text: 'Assalomu alaykum! EKG yoki kardiologiya bo‘yicha savollaringiz bo‘lsa bemalol yozing.',
          createdAt: Date.now() - 1000 * 60 * 60,
        },
      ],
    };
  });

  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'saved'>('all');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);

  // New post form fields
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTag, setPostTag] = useState('KlinikCase');
  const [postImage, setPostImage] = useState<string | null>(null);

  // New story form fields
  const [storyTitle, setStoryTitle] = useState('');
  const [storyText, setStoryText] = useState('');
  const [storyGradient, setStoryGradient] = useState('from-emerald-600 via-teal-600 to-cyan-600');

  // Story Viewer state
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [viewersModalOpen, setViewersModalOpen] = useState(false);

  // Comments Bottom Sheet Modal state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Direct Chat Modal state
  const [activeChatRecipient, setActiveChatRecipient] = useState<AuthorProfile | null>(null);
  const [chatMessageText, setChatMessageText] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  // Persist posts
  useEffect(() => {
    try {
      window.localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(posts));
    } catch {}
  }, [posts]);

  // Persist stories
  useEffect(() => {
    try {
      window.localStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(stories));
    } catch {}
  }, [stories]);

  // Persist follows
  useEffect(() => {
    try {
      window.localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(follows));
    } catch {}
  }, [follows]);

  // Persist direct chats
  useEffect(() => {
    try {
      window.localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(directChats));
    } catch {}
  }, [directChats]);

  // Story Progress Timer
  useEffect(() => {
    if (activeStoryIndex === null || viewersModalOpen) {
      return;
    }
    const interval = 50;
    const step = 100 / (5000 / interval); // 5 sec
    const timer = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex((curr) => (curr !== null ? curr + 1 : null));
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeStoryIndex, stories.length, viewersModalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Follow / Unfollow
  const handleToggleFollow = (authorId: string, authorName: string) => {
    const isFollowing = follows.includes(authorId);
    if (isFollowing) {
      setFollows(follows.filter((id) => id !== authorId));
      showToast(`${authorName} obunachilaridan chiqildi`);
    } else {
      setFollows([...follows, authorId]);
      showToast(`${authorName} ga obuna bo‘lindi!`);
    }
  };

  // Like / Unlike Post
  const handleLikePost = (postId: string) => {
    if (!me) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const alreadyLiked = p.likedBy?.includes(me.id);
        const newLikedBy = alreadyLiked
          ? p.likedBy.filter((id) => id !== me.id)
          : [...(p.likedBy || []), me.id];
        return {
          ...p,
          likedBy: newLikedBy,
          likes: alreadyLiked ? Math.max(0, (p.likes ?? 0) - 1) : (p.likes ?? 0) + 1,
        };
      })
    );
  };

  // Bookmark / Save Post
  const handleSavePost = (postId: string) => {
    if (!me) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const alreadySaved = p.savedBy?.includes(me.id);
        const newSavedBy = alreadySaved
          ? p.savedBy.filter((id) => id !== me.id)
          : [...(p.savedBy || []), me.id];
        showToast(alreadySaved ? 'Saqlanganlardan olib tashlandi' : 'Saqlanganlarga qo‘shildi');
        return {
          ...p,
          savedBy: newSavedBy,
        };
      })
    );
  };

  // Share Post
  const handleSharePost = (post: BlogPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/quiz/blog#${post.id}`);
      showToast('Havola nusxalandi!');
    } else {
      showToast('Ulashildi!');
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, shares: (p.shares || 0) + 1 } : p))
    );
  };

  // Add Comment to active post
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeCommentsPostId || !me) return;

    const newComment: BlogComment = {
      id: `c-${Date.now()}`,
      postId: activeCommentsPostId,
      authorId: me.id,
      authorName: me.name || 'Talaba',
      authorAvatar: me.avatar,
      authorTitle: `${me.course || 'Talaba'} · ${me.university || 'TTA'}`,
      text: commentText.trim(),
      likes: 0,
      likedBy: [],
      createdAt: Date.now(),
    };

    setPosts((prev) =>
      prev.map((p) => (p.id === activeCommentsPostId ? { ...p, comments: [...(p.comments || []), newComment] } : p))
    );

    setCommentText('');
    showToast('Izohingiz qo‘shildi!');
  };

  // Send Direct Message
  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageText.trim() || !activeChatRecipient || !me) return;

    const newMsg: DirectMessage = {
      id: `dm-${Date.now()}`,
      senderId: me.id,
      senderName: me.name || 'Men',
      text: chatMessageText.trim(),
      createdAt: Date.now(),
    };

    const recipientId = activeChatRecipient.id;
    setDirectChats((prev) => ({
      ...prev,
      [recipientId]: [...(prev[recipientId] || []), newMsg],
    }));

    setChatMessageText('');
  };

  // Publish New Post
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !me) return;

    const myTitle = getMedicalTitle(0);
    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      authorId: me.id,
      authorName: me.name || 'Talaba',
      authorAvatar: me.avatar,
      authorTitle: `${me.course || 'Talaba'} · ${myTitle.title}`,
      authorUniversity: me.university || 'Tibbiyot OTM',
      title: postTitle.trim() || undefined,
      content: postContent.trim(),
      tags: [postTag],
      image: postImage,
      likes: 0,
      likedBy: [],
      savedBy: [],
      shares: 0,
      comments: [],
      createdAt: Date.now(),
    };

    setPosts([newPost, ...posts]);
    setPostTitle('');
    setPostContent('');
    setPostImage(null);
    setCreatePostOpen(false);
    showToast('Maqolangiz muvaffaqiyatli chop etildi!');
  };

  // Publish New Story
  const handlePublishStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyText.trim() || !me) return;

    const newStory = {
      id: `story-${Date.now()}`,
      authorId: me.id,
      authorName: me.name || 'Talaba',
      authorAvatar: me.avatar,
      title: storyTitle.trim() || 'Hikoya',
      text: storyText.trim(),
      gradient: storyGradient,
      viewsCount: 1,
      viewedBy: [me.id],
      createdAt: Date.now(),
      viewers: [{ id: me.id, name: me.name || 'Siz', avatar: me.avatar, time: 'Hozirgina' }],
    };

    setStories([newStory, ...stories]);
    setStoryTitle('');
    setStoryText('');
    setCreateStoryOpen(false);
    showToast('Story muvaffaqiyatli joylandi!');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToImage(file);
      setPostImage(dataUrl);
    } catch {
      showToast('Rasm yuklashda xatolik yuz berdi');
    }
  };

  const activeCommentsPost = posts.find((p) => p.id === activeCommentsPostId);
  const currentStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'popular') return (p.likes ?? 0) >= 10;
    if (activeTab === 'saved') return me && p.savedBy?.includes(me.id);
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[150] rounded-2xl bg-slate-900/95 text-white px-4 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top duration-200 flex items-center gap-2 border border-white/10">
          <HiOutlineCheck className="text-emerald-400 text-base" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. STORIES CAROUSEL */}
      <div className="glass-card p-3.5 sm:p-4 rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {/* Create Story Button */}
          <button
            type="button"
            onClick={() => setCreateStoryOpen(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
          >
            <div className="relative h-15 w-15 sm:h-16 sm:w-16 rounded-2xl p-0.5 border-2 border-dashed border-slate-300 dark:border-white/20 group-hover:border-med-500 transition-colors flex items-center justify-center">
              <div className="h-full w-full rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-med-500 transition-colors">
                <HiOutlinePlus className="text-xl" />
              </div>
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-med-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                +
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[70px]">
              Story qo‘shish
            </span>
          </button>

          {/* Stories List */}
          {stories.map((story, idx) => (
            <button
              key={story.id}
              type="button"
              onClick={() => {
                setActiveStoryIndex(idx);
                setStoryProgress(0);
                setViewersModalOpen(false);
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            >
              <div className="h-15 w-15 sm:h-16 sm:w-16 rounded-2xl p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="h-full w-full rounded-xl bg-white dark:bg-[#111827] p-0.5 overflow-hidden flex items-center justify-center">
                  <div
                    className={`h-full w-full rounded-lg bg-gradient-to-br ${
                      story.gradient || 'from-teal-500 to-indigo-600'
                    } flex items-center justify-center text-white text-xs font-bold overflow-hidden`}
                  >
                    {story.authorAvatar ? (
                      <img src={story.authorAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (story.authorName || 'MQ').slice(0, 2).toUpperCase()
                    )}
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[75px]">
                {story.authorName.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. PREMIUM POST COMPOSER */}
      <div className="glass-card p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-med-500 to-med-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-med-500/20 overflow-hidden">
            {me?.avatar ? (
              <img src={me.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              (me?.name || 'M')[0].toUpperCase()
            )}
          </div>
          <button
            type="button"
            onClick={() => setCreatePostOpen(true)}
            className="flex-1 text-left py-3 px-4 rounded-xl bg-slate-100/90 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors border border-slate-200/60 dark:border-white/5 cursor-pointer font-medium"
          >
            Fikrlaringiz, yangi maqola yoki klinik holat yozing...
          </button>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreatePostOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
            >
              <HiOutlinePhotograph className="text-med-600 dark:text-med-400 text-base" />
              <span>Rasm</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPostTag('KlinikCase');
                setCreatePostOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold transition-colors cursor-pointer"
            >
              <HiOutlineSparkles className="text-amber-500 text-base" />
              <span>Klinik vaziyat</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCreatePostOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-med-600 to-med-500 hover:brightness-105 text-white font-bold text-xs shadow-md shadow-med-500/25 transition-all cursor-pointer active:scale-95"
          >
            Post yaratish
          </button>
        </div>
      </div>

      {/* 3. FEED FILTER TABS */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2 px-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-med-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            Lenta
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('popular')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'popular'
                ? 'bg-med-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            Mashhur
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-med-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            Saqlanganlar
          </button>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          {filteredPosts.length} ta post
        </span>
      </div>

      {/* 4. POSTS FEED */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const isLiked = me && post.likedBy?.includes(me.id);
          const isSaved = me && post.savedBy?.includes(me.id);
          const isFollowing = follows.includes(post.authorId);
          const peer = PEER_AUTHORS[post.authorId];
          const followersCount = (peer?.followersCount || 120) + (isFollowing ? 1 : 0);

          return (
            <article
              key={post.id}
              id={post.id}
              className="glass-card p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-white/10 space-y-4 transition-all"
            >
              {/* Author Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md overflow-hidden">
                      {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (post.authorName || 'MQ').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111827]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {post.authorName}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {followersCount} obunachi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {post.authorTitle} · {post.authorUniversity}
                    </p>
                  </div>
                </div>

                {/* Direct Message & Follow Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveChatRecipient(
                        peer || {
                          id: post.authorId,
                          name: post.authorName,
                          avatar: post.authorAvatar,
                          title: post.authorTitle,
                          university: post.authorUniversity || 'Tibbiyot OTM',
                          followersCount,
                        }
                      );
                    }}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-med-50 dark:hover:bg-med-950/30 text-slate-600 dark:text-slate-300 hover:text-med-600 dark:hover:text-med-400 transition-colors cursor-pointer"
                    title="Shaxsiy chat"
                  >
                    <HiOutlineChat className="text-base" />
                  </button>

                  {post.authorId !== me?.id && (
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(post.authorId, post.authorName)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        isFollowing
                          ? 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10'
                          : 'bg-med-600 hover:bg-med-500 text-white shadow-xs'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <HiOutlineCheck className="text-sm text-emerald-500" />
                          <span>Obunadasiz</span>
                        </>
                      ) : (
                        <>
                          <HiOutlineUserAdd className="text-sm" />
                          <span>Obuna</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="space-y-2.5">
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-lg bg-med-500/10 text-med-600 dark:text-med-400 text-[10px] font-bold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {post.title && (
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {post.title}
                  </h3>
                )}

                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                  {post.content}
                </p>

                {post.image && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 max-h-80 bg-slate-100 dark:bg-black/20">
                    <img src={post.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* VK Style Engagement Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      isLiked
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {isLiked ? (
                      <HiHeart className="text-base text-rose-500 animate-in zoom-in-50" />
                    ) : (
                      <HiOutlineHeart className="text-base" />
                    )}
                    <span>{post.likes || 0}</span>
                  </button>

                  {/* Comment Button (Opens Modal) */}
                  <button
                    type="button"
                    onClick={() => setActiveCommentsPostId(post.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <HiOutlineChatAlt2 className="text-base" />
                    <span>{post.comments?.length || 0}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => handleSharePost(post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <HiOutlineShare className="text-base" />
                    <span>{post.shares || 0}</span>
                  </button>
                </div>

                {/* Bookmark Button */}
                <button
                  type="button"
                  onClick={() => handleSavePost(post.id)}
                  className={`p-2 rounded-xl text-sm transition-all cursor-pointer active:scale-95 ${
                    isSaved
                      ? 'text-med-600 dark:text-med-400 bg-med-500/10'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                  title={isSaved ? 'Saqlangan' : 'Saqlash'}
                >
                  {isSaved ? <HiBookmark className="text-base" /> : <HiOutlineBookmark className="text-base" />}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* 5. ELEGANT COMMENTS MODAL (PASTDAN OCHILADIGAN MODAL) */}
      {activeCommentsPostId && activeCommentsPost && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-250">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <HiOutlineChatAlt2 className="text-med-600 dark:text-med-400 text-xl" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Izohlar ({activeCommentsPost.comments?.length || 0})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCommentsPostId(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <HiOutlineX className="text-lg" />
              </button>
            </div>

            {/* Post Preview snippet */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-xs text-slate-500 truncate shrink-0">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {activeCommentsPost.authorName}:
              </span>{' '}
              {activeCommentsPost.title || activeCommentsPost.content}
            </div>

            {/* Comments List Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {(!activeCommentsPost.comments || activeCommentsPost.comments.length === 0) ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p>Hozircha izohlar yo‘q.</p>
                  <p className="mt-1">Birinchi bo‘lib fikr bildiring!</p>
                </div>
              ) : (
                activeCommentsPost.comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-xl bg-gradient-to-br from-med-500 to-med-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                      {c.authorAvatar ? (
                        <img src={c.authorAvatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (c.authorName || 'M')[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {c.authorName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {Math.round((Date.now() - c.createdAt) / 60000)} daq. oldin
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input Footer */}
            <form
              onSubmit={handleAddComment}
              className="p-3.5 border-t border-slate-100 dark:border-white/10 flex items-center gap-2 bg-white dark:bg-[#111827] shrink-0"
            >
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Fikringizni qoldiring..."
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-med-500/20"
                autoFocus
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2.5 rounded-xl bg-med-600 hover:bg-med-500 text-white text-xs font-bold shadow-md shadow-med-500/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                Yuborish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. DIRECT CHAT MODAL (SHAXSIY CHAT) */}
      {activeChatRecipient && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg h-[80vh] rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-250">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs overflow-hidden">
                    {activeChatRecipient.avatar ? (
                      <img src={activeChatRecipient.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      activeChatRecipient.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#111827]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {activeChatRecipient.name}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Onlayn · {activeChatRecipient.university}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveChatRecipient(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <HiOutlineX className="text-lg" />
              </button>
            </div>

            {/* Chat Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-black/10">
              {(directChats[activeChatRecipient.id] || []).length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <HiOutlineChat className="mx-auto text-3xl mb-2 text-slate-300" />
                  <p>{activeChatRecipient.name} bilan shaxsiy muloqotni boshlang.</p>
                </div>
              ) : (
                (directChats[activeChatRecipient.id] || []).map((msg) => {
                  const isMine = msg.senderId === me?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-xs ${
                          isMine
                            ? 'bg-med-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-[#1a2234] text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-white/5'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span
                          className={`block text-[9px] mt-1 text-right ${
                            isMine ? 'text-white/70' : 'text-slate-400'
                          }`}
                        >
                          {Math.round((Date.now() - msg.createdAt) / 60000)} daq. oldin
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Footer */}
            <form
              onSubmit={handleSendDirectMessage}
              className="p-3 border-t border-slate-100 dark:border-white/10 flex items-center gap-2 bg-white dark:bg-[#111827] shrink-0"
            >
              <input
                type="text"
                value={chatMessageText}
                onChange={(e) => setChatMessageText(e.target.value)}
                placeholder="Xabar yozing..."
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-med-500/20"
                autoFocus
              />
              <button
                type="submit"
                disabled={!chatMessageText.trim()}
                className="p-2.5 rounded-xl bg-med-600 hover:bg-med-500 text-white text-xs font-bold shadow-md shadow-med-500/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                <HiOutlinePaperAirplane className="rotate-90 text-sm" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. FULLSCREEN STORY VIEWER (WITH VIEWERS EYE BUTTON) */}
      {currentStory && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm h-[580px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-5 text-white">
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${
                currentStory.gradient || 'from-teal-600 to-indigo-700'
              } -z-10`}
            />

            {/* Top progress bars */}
            <div className="flex items-center gap-1.5 w-full">
              {stories.map((st, i) => (
                <div key={st.id} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-75"
                    style={{
                      width:
                        i < (activeStoryIndex || 0)
                          ? '100%'
                          : i === activeStoryIndex
                          ? `${storyProgress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Author Header */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs overflow-hidden">
                  {currentStory.authorAvatar ? (
                    <img src={currentStory.authorAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    currentStory.authorName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">{currentStory.authorName}</p>
                  <p className="text-[10px] text-white/70">{currentStory.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Viewers Eye Button */}
                <button
                  type="button"
                  onClick={() => setViewersModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 hover:bg-black/50 text-[11px] font-bold text-white transition-colors cursor-pointer"
                  title="Ko‘rganlar"
                >
                  <HiOutlineEye className="text-sm" />
                  <span>{currentStory.viewsCount || 1}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStoryIndex(null)}
                  className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
                >
                  <HiOutlineX className="text-lg" />
                </button>
              </div>
            </div>

            {/* Story Text Content */}
            <div className="my-auto px-2 space-y-3">
              <h3 className="text-lg font-bold leading-snug">{currentStory.title}</h3>
              <p className="text-sm font-medium leading-relaxed bg-black/25 p-4 rounded-2xl backdrop-blur-xs border border-white/10 whitespace-pre-line">
                {currentStory.text}
              </p>
            </div>

            {/* Tap zones for prev / next */}
            <div
              className="absolute left-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer"
              onClick={() => {
                if ((activeStoryIndex || 0) > 0) {
                  setActiveStoryIndex((activeStoryIndex || 0) - 1);
                  setStoryProgress(0);
                }
              }}
            />
            <div
              className="absolute right-0 top-16 bottom-20 w-1/3 z-10 cursor-pointer"
              onClick={() => {
                if ((activeStoryIndex || 0) < stories.length - 1) {
                  setActiveStoryIndex((activeStoryIndex || 0) + 1);
                  setStoryProgress(0);
                } else {
                  setActiveStoryIndex(null);
                }
              }}
            />

            {/* Story Footer with quick react */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/20 z-20">
              <input
                type="text"
                placeholder="Fikr bildiring..."
                className="flex-1 py-2 px-3.5 rounded-full bg-white/20 placeholder:text-white/60 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/50 backdrop-blur-sm"
              />
              <button
                type="button"
                onClick={() => showToast('Reaksiya yuborildi!')}
                className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer active:scale-95"
              >
                <HiHeart className="text-rose-400 text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. STORY VIEWERS MODAL (KIM KO'RYAPTI STORYNI) */}
      {viewersModalOpen && currentStory && (
        <div className="fixed inset-0 z-[140] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-5 overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <HiOutlineEye className="text-med-600 text-lg" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Storyni ko‘rganlar ({currentStory.viewsCount || 1})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewersModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <HiOutlineX className="text-lg" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-white/5 max-h-64 overflow-y-auto">
              {(currentStory.viewers || [
                { id: 'u1', name: 'Madina Rahimova', avatar: null, time: 'Hozirgina' },
                { id: 'u2', name: 'Dr. Jasur Mansurov', avatar: null, time: '5 daq. oldin' },
                { id: 'u3', name: 'Shaxzod Aliyev', avatar: null, time: '14 daq. oldin' },
              ]).map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                      {v.avatar ? <img src={v.avatar} alt="" className="h-full w-full object-cover" /> : v.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{v.name}</p>
                      <p className="text-[10px] text-slate-400">{v.time}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Ko‘rdi
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. CREATE POST MODAL */}
      {createPostOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-med-500/10 text-med-600 dark:text-med-400">
                  <HiOutlinePhotograph className="text-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Yangi maqola / post</h3>
                  <p className="text-[11px] text-slate-400">Tibbiy hamjamiyat bilan bilimlarni ulashing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreatePostOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <HiOutlineX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handlePublishPost} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mavzu / Sarlavha
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Masalan: Miokard infarkti tahlili"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-med-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kategoriya / Yo‘nalish
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['KlinikCase', 'Kardiologiya', 'Anatomiya', 'Fiziologiya', 'Farmakologiya', 'Pediatriya', 'Xirurgiya'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPostTag(t)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        postTag === t
                          ? 'bg-med-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Matn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Klinik tavsiyalar, tahlillar yoki konspektlaringizni yozing..."
                  rows={5}
                  required
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-med-500/20"
                />
              </div>

              {/* Image attachment */}
              <div>
                {postImage ? (
                  <div className="relative rounded-2xl overflow-hidden h-36 border border-slate-200 dark:border-white/10">
                    <img src={postImage} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPostImage(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <HiOutlineX />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/20 text-xs font-semibold text-slate-500 hover:border-med-500 cursor-pointer transition-colors">
                    <HiOutlinePhotograph className="text-base text-med-600" />
                    <span>Rasm yoki EKG tasvirini yuklash</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setCreatePostOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={!postContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-med-600 to-med-500 hover:brightness-105 text-white text-xs font-bold shadow-md shadow-med-500/25 disabled:opacity-40 transition-all cursor-pointer"
                >
                  Chop etish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. CREATE STORY MODAL */}
      {createStoryOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Yangi Story</h3>
              <button
                type="button"
                onClick={() => setCreateStoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <HiOutlineX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handlePublishStory} className="mt-4 space-y-3.5">
              {/* Preview Box */}
              <div
                className={`h-44 rounded-2xl p-4 bg-gradient-to-br ${storyGradient} text-white flex flex-col justify-between shadow-inner`}
              >
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  {storyTitle || 'Sarlavha'}
                </span>
                <p className="text-xs font-medium leading-relaxed overflow-hidden">
                  {storyText || 'Story matni bu yerda ko‘rinadi...'}
                </p>
                <span className="text-[10px] opacity-70">
                  {me?.name || 'Talaba'}
                </span>
              </div>

              {/* Gradient selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rang uslubi
                </label>
                <div className="flex items-center gap-2">
                  {[
                    'from-emerald-600 via-teal-600 to-cyan-600',
                    'from-rose-600 via-pink-600 to-amber-600',
                    'from-violet-600 via-purple-600 to-indigo-600',
                    'from-amber-500 via-orange-500 to-rose-500',
                  ].map((grad) => (
                    <button
                      key={grad}
                      type="button"
                      onClick={() => setStoryGradient(grad)}
                      className={`h-7 w-7 rounded-full bg-gradient-to-br ${grad} ring-2 transition-all cursor-pointer ${
                        storyGradient === grad ? 'ring-med-500 scale-110' : 'ring-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Qisqa sarlavha
                </label>
                <input
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  placeholder="Masalan: Bugungi klinik holat"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Story matni
                </label>
                <textarea
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                  placeholder="Tezkor tibbiy eslatma yoki holat..."
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateStoryOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={!storyText.trim()}
                  className="px-4 py-2 rounded-xl bg-med-600 hover:bg-med-500 text-white text-xs font-semibold shadow-md shadow-med-500/20 disabled:opacity-40 transition-all cursor-pointer"
                >
                  Story joylash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
