import { useState, useEffect } from 'react';

export type Language = 'uz' | 'ru' | 'en';

const LANG_KEY = 'medquiz-lang';

export const LANGUAGES: { id: Language; label: string; flag: string; code: string }[] = [
  { id: 'uz', label: 'O‘zbekcha', flag: '🇺🇿', code: 'UZ' },
  { id: 'ru', label: 'Русский', flag: '🇷🇺', code: 'RU' },
  { id: 'en', label: 'English', flag: '🇬🇧', code: 'EN' },
];

export function toReformedUzbek(text: string): string {
  return text;
}

export const translations = {
  uz: {
    // Nav
    nav_dashboard: 'Boshqaruv',
    nav_banks: 'To‘plamlar',
    nav_battle: 'Battle',
    nav_leaderboard: 'Reyting',
    nav_friends: 'Do‘stlar',
    nav_profile: 'Profil',
    nav_mistakes: 'Xatolarim',
    nav_achievements: 'Yutuqlar',
    nav_settings: 'Sozlamalar',
    nav_logout: 'Chiqish',
    nav_home: 'Asosiy',

    // Header & Brand
    app_name: 'MedQuiz',
    app_subtitle: 'Tibbiy ta’lim platformasi',
    select_language: 'Tilni tanlang',

    // Dashboard
    stats_streak: 'Streak',
    stats_quizzes: 'Yechilgan testlar',
    stats_accuracy: 'O‘rtacha aniqlik',
    stats_mistakes: 'Xatolarim',
    stats_saved: 'Saqlanganlar',
    dash_practice_title: 'Mashq bo‘limi',
    dash_practice_sub: 'Bilimlaringizni sinash va mustahkamlash uchun tezkor mashqlar',
    practice_daily: 'Kunlik mashq',
    practice_daily_desc: 'Kunlik bilimni oshirish uchun 10 ta saralangan savol',
    practice_mistakes: 'Xatolar ustida ishlash',
    practice_mistakes_desc: 'Avval xato qilgan savollaringizni qayta yechib mustahkamlang',
    practice_quick: 'Tezkor test',
    practice_quick_desc: 'Tasodifiy savollar bilan tezkor sinovdan o‘ting',
    practice_start: 'Boshlash',

    // Banks
    banks_title: 'Mening to‘plamlarim',
    banks_sub: 'Imtihon savollarini yuklang, tahrirlang yoki yangi test to‘plamini yarating.',
    banks_add_questions: 'Savollar qo‘shish',
    banks_empty_title: 'Hali test to‘plami yaratilmagan',
    banks_empty_desc: '«Savollar qo‘shish» tugmasini bosib birinchi to‘plamni kiriting.',
    banks_ready_count: 'tayyor',
    banks_total_questions: 'Jami {count} ta savol',
    banks_calendar_btn: 'Imtihon taqvimi',
    banks_play_btn: 'Boshlash',
    banks_edit_btn: 'Tahrirlash',
    banks_delete_btn: 'O‘chirish',
    banks_days_left: '{days} kun qoldi',

    // Friends
    friends_title: 'Kursdoshlar va Do‘stlar',
    friends_sub: 'Do‘stlaringizni test musobaqasiga taklif qiling. Oflayn do‘stlaringiz ham ro‘yxatda aks etadi.',
    friends_count: 'Do‘stlaringiz',
    friends_unit: 'ta',
    friends_search_placeholder: '@username yoki ism bo‘yicha qidiring...',

    // Leaderboard
    leaderboard_title: 'Reyting',
    leaderboard_sub: 'Tibbiyot yetakchilari',
    leaderboard_week: 'Hafta',
    leaderboard_month: 'Oy',
    leaderboard_all: 'Butun davr',
    leaderboard_your_rank: 'Sizning o‘rningiz: #{rank}',

    // Auth
    auth_login_tab: 'Kirish',
    auth_register_tab: 'Ro‘yxatdan o‘tish',
    auth_phone_or_username: 'Telefon raqam yoki username',
    auth_phone_placeholder: '90 123 45 67 yoki @username',
    auth_password: 'Parol',
    auth_password_placeholder: 'Kamida 6 ta belgi',
    auth_login_btn: 'Tizimga kirish',
    auth_register_btn: 'Hisob yaratish',
    auth_full_name: 'Ism va familiya',
    auth_full_name_placeholder: 'Masalan: Madina Rahimova',
    auth_username: 'Foydalanuvchi nomi (@username)',
    auth_username_placeholder: 'masalan: madina_doc',
    auth_phone: 'Telefon raqamingiz',
    auth_google_continue: 'Google orqali davom etish',
    auth_or_divider: 'Yoki Google orqali',
    auth_have_account: 'Profilingiz bormi? Kirish',
    auth_no_account: 'Hali hisobingiz yo‘qmi? Ro‘yxatdan o‘tish',
    auth_username_required: 'Iltimos, foydalanuvchi nomini (@username) kiriting',
    auth_name_required: 'Iltimos, ismingizni kiriting',
    auth_phone_required: 'Iltimos, telefon raqamingizni kiriting',
    auth_password_required: 'Iltimos, parolni kiriting (kamida 6 ta belgi)',
    auth_invalid_credentials: 'Login yoki parol noto‘g‘ri',
  },

  ru: {
    // Nav
    nav_dashboard: 'Панель',
    nav_banks: 'Коллекции',
    nav_battle: 'Баттл',
    nav_leaderboard: 'Рейтинг',
    nav_friends: 'Друзья',
    nav_profile: 'Профиль',
    nav_mistakes: 'Мои ошибки',
    nav_achievements: 'Достижения',
    nav_settings: 'Настройки',
    nav_logout: 'Выйти',
    nav_home: 'Главная',

    // Header & Brand
    app_name: 'MedQuiz',
    app_subtitle: 'Медицинская образовательная платформа',
    select_language: 'Выберите язык',

    // Dashboard
    stats_streak: 'Ударный режим',
    stats_quizzes: 'Пройдено тестов',
    stats_accuracy: 'Средняя точность',
    stats_mistakes: 'Мои ошибки',
    stats_saved: 'Сохранённые',
    dash_practice_title: 'Раздел тренировок',
    dash_practice_sub: 'Быстрые упражнения для проверки и закрепления медицинских знаний',
    practice_daily: 'Ежедневная тренировка',
    practice_daily_desc: '10 избранных вопросов для ежедневного укрепления знаний',
    practice_mistakes: 'Работа над ошибками',
    practice_mistakes_desc: 'Повторите вопросы, в которых ранее допускали ошибки',
    practice_quick: 'Быстрый тест',
    practice_quick_desc: 'Быстрый случайный тест по всем доступным темам',
    practice_start: 'Начать',

    // Banks
    banks_title: 'Мои коллекции',
    banks_sub: 'Загружайте экзаменационные вопросы, редактируйте или создавайте новые тесты.',
    banks_add_questions: 'Добавить вопросы',
    banks_empty_title: 'Коллекций пока нет',
    banks_empty_desc: 'Нажмите «Добавить вопросы», чтобы создать свою первую коллекцию.',
    banks_ready_count: 'готово',
    banks_total_questions: 'Всего {count} вопросов',
    banks_calendar_btn: 'Календарь экзамена',
    banks_play_btn: 'Начать',
    banks_edit_btn: 'Редактировать',
    banks_delete_btn: 'Удалить',
    banks_days_left: 'Осталось {days} дн.',

    // Friends
    friends_title: 'Однокурсники и Друзья',
    friends_sub: 'Общайтесь со студентами-медиками и врачами, находите друзей и соревнуйтесь вместе.',
    friends_count: 'Ваши друзья',
    friends_unit: 'чел.',
    friends_search_placeholder: 'Поиск по @username или имени...',

    // Leaderboard
    leaderboard_title: 'Рейтинг',
    leaderboard_sub: 'Лидеры медицины',
    leaderboard_week: 'Неделя',
    leaderboard_month: 'Месяц',
    leaderboard_all: 'Все время',
    leaderboard_your_rank: 'Ваше место: #{rank}',

    // Auth
    auth_login_tab: 'Вход',
    auth_register_tab: 'Регистрация',
    auth_phone_or_username: 'Номер телефона или username',
    auth_phone_placeholder: '90 123 45 67 или @username',
    auth_password: 'Пароль',
    auth_password_placeholder: 'Минимум 6 символов',
    auth_login_btn: 'Войти в систему',
    auth_register_btn: 'Создать аккаунт',
    auth_full_name: 'Имя и фамилия',
    auth_full_name_placeholder: 'Например: Мадина Рахимова',
    auth_username: 'Имя пользователя (@username)',
    auth_username_placeholder: 'например: madina_doc',
    auth_phone: 'Номер телефона',
    auth_google_continue: 'Продолжить через Google',
    auth_or_divider: 'Или через Google',
    auth_have_account: 'Уже есть аккаунт? Войти',
    auth_no_account: 'Нет аккаунта? Зарегистрироваться',
    auth_username_required: 'Пожалуйста, введите имя пользователя (@username)',
    auth_name_required: 'Пожалуйста, введите ваше имя',
    auth_phone_required: 'Пожалуйста, введите номер телефона',
    auth_password_required: 'Пожалуйста, введите пароль (не менее 6 символов)',
    auth_invalid_credentials: 'Неверный логин или пароль',
  },

  en: {
    // Nav
    nav_dashboard: 'Dashboard',
    nav_banks: 'Question Banks',
    nav_battle: 'Battle',
    nav_leaderboard: 'Leaderboard',
    nav_friends: 'Friends',
    nav_profile: 'Profile',
    nav_mistakes: 'My Mistakes',
    nav_achievements: 'Achievements',
    nav_settings: 'Settings',
    nav_logout: 'Sign Out',
    nav_home: 'Home',

    // Header & Brand
    app_name: 'MedQuiz',
    app_subtitle: 'Medical Learning Platform',
    select_language: 'Select language',

    // Dashboard
    stats_streak: 'Streak',
    stats_quizzes: 'Quizzes Taken',
    stats_accuracy: 'Average Accuracy',
    stats_mistakes: 'My Mistakes',
    stats_saved: 'Saved Items',
    dash_practice_title: 'Practice Hub',
    dash_practice_sub: 'Targeted drills to test and reinforce your medical knowledge',
    practice_daily: 'Daily Workout',
    practice_daily_desc: '10 curated high-yield questions for daily knowledge retention',
    practice_mistakes: 'Mistakes Review',
    practice_mistakes_desc: 'Re-attempt questions you previously answered incorrectly',
    practice_quick: 'Quick Drill',
    practice_quick_desc: 'Rapid test session with random medical questions',
    practice_start: 'Start',

    // Banks
    banks_title: 'My Question Banks',
    banks_sub: 'Upload exam questions, edit, or create new medical test collections.',
    banks_add_questions: 'Add Questions',
    banks_empty_title: 'No question banks yet',
    banks_empty_desc: 'Click «Add Questions» to create your first bank.',
    banks_ready_count: 'ready',
    banks_total_questions: 'Total {count} questions',
    banks_calendar_btn: 'Exam Calendar',
    banks_play_btn: 'Start',
    banks_edit_btn: 'Edit',
    banks_delete_btn: 'Delete',
    banks_days_left: '{days} days left',

    // Friends
    friends_title: 'Classmates & Friends',
    friends_sub: 'Connect with medical students and doctors, find peers and compete together.',
    friends_count: 'Your Friends',
    friends_unit: '',
    friends_search_placeholder: 'Search by @username or name...',

    // Leaderboard
    leaderboard_title: 'Leaderboard',
    leaderboard_sub: 'Medical Leaders',
    leaderboard_week: 'Week',
    leaderboard_month: 'Month',
    leaderboard_all: 'All Time',
    leaderboard_your_rank: 'Your rank: #{rank}',

    // Auth
    auth_login_tab: 'Sign In',
    auth_register_tab: 'Sign Up',
    auth_phone_or_username: 'Phone number or username',
    auth_phone_placeholder: '90 123 45 67 or @username',
    auth_password: 'Password',
    auth_password_placeholder: 'At least 6 characters',
    auth_login_btn: 'Sign In',
    auth_register_btn: 'Create Account',
    auth_full_name: 'Full Name',
    auth_full_name_placeholder: 'e.g. Madina Rahimova',
    auth_username: 'Username (@username)',
    auth_username_placeholder: 'e.g. madina_doc',
    auth_phone: 'Phone Number',
    auth_google_continue: 'Continue with Google',
    auth_or_divider: 'Or continue with Google',
    auth_have_account: 'Already have an account? Sign In',
    auth_no_account: 'Don’t have an account? Sign Up',
    auth_username_required: 'Please enter a username (@username)',
    auth_name_required: 'Please enter your name',
    auth_phone_required: 'Please enter your phone number',
    auth_password_required: 'Please enter a password (at least 6 characters)',
    auth_invalid_credentials: 'Invalid username or password',
  },
};

export type TranslationKey = keyof typeof translations.uz;

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'uz';
  try {
    const saved = localStorage.getItem(LANG_KEY) as Language;
    if (saved && (saved === 'uz' || saved === 'ru' || saved === 'en')) {
      return saved;
    }
  } catch {}
  return 'uz';
}

export function setStoredLanguage(lang: Language) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LANG_KEY, lang);
    window.dispatchEvent(new CustomEvent('medquiz-language-change', { detail: lang }));
  } catch {}
}

export function t(key: TranslationKey, params?: Record<string, string | number>, lang?: Language): string {
  const currentLang = lang || getStoredLanguage();
  const dict = translations[currentLang] || translations.uz;
  let text: string = (dict as any)[key] || (translations.uz as any)[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}

export function useI18n() {
  const [lang, setLangState] = useState<Language>(() => getStoredLanguage());

  useEffect(() => {
    const handler = (e: any) => {
      setLangState(e.detail || getStoredLanguage());
    };
    window.addEventListener('medquiz-language-change', handler);
    return () => window.removeEventListener('medquiz-language-change', handler);
  }, []);

  const changeLanguage = (newLang: Language) => {
    setStoredLanguage(newLang);
    setLangState(newLang);
  };

  return {
    lang,
    changeLanguage,
    t: (key: TranslationKey, params?: Record<string, string | number>) => t(key, params, lang),
    currentLanguage: LANGUAGES.find((l) => l.id === lang) || LANGUAGES[0],
    languages: LANGUAGES,
  };
}
