import { AppLanguage } from '@/lib/i18n';

export type IconPackType = 'meteor' | 'lucide' | 'material' | 'heroicons';
export type EmojiPackType = 'tossface' | 'system';

export interface IconPackInfo {
  id: IconPackType;
  name: string;
  badge?: string;
  description: string;
}

export interface EmojiPackInfo {
  id: EmojiPackType;
  name: string;
  badge?: string;
  description: string;
  previewEmojis: string[];
}

export interface AppSettings {
  siteFont: string;
  codeFont: string;
  iconPack: IconPackType;
  emojiPack: EmojiPackType;
  themeMode: 'dark' | 'light' | 'system';
  primaryColor: string;
  sortBy: 'modified' | 'created' | 'name';
  sortOrder: 'asc' | 'desc';
  listLayout: 'compact' | 'grid';
  spellcheck: boolean;
  focusMode?: boolean;
  language?: AppLanguage;
  encryptionEnabled?: boolean;
  e2eeVerifier?: string;
  aiEnabled?: boolean;
  noteFontSize?: string;
  noteParagraphColorLight?: string;
  noteParagraphColorDark?: string;
  noteHeadingColorLight?: string;
  noteHeadingColorDark?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  siteFont: 'Vend Sans',
  codeFont: 'Google Sans Code',
  iconPack: 'meteor',
  emojiPack: 'system',
  themeMode: 'system',
  primaryColor: '#006FFF',
  sortBy: 'modified',
  sortOrder: 'desc',
  listLayout: 'grid',
  spellcheck: true,
  focusMode: false,
  language: 'es',
  encryptionEnabled: false,
  e2eeVerifier: '',
  aiEnabled: true,
  noteFontSize: '17px',
  noteParagraphColorLight: '#0F172A',
  noteParagraphColorDark: '#F4F4F5',
  noteHeadingColorLight: '#09090B',
  noteHeadingColorDark: '#FAFAFA',
};

export const EMOJI_PACKS: EmojiPackInfo[] = [
  {
    id: 'system',
    name: 'Emojis del Sistema',
    badge: 'PREDETERMINADO',
    description: 'Emojis nativos predeterminados según tu sistema operativo (Apple, Windows, Android, Linux).',
    previewEmojis: ['🚀', '✨', '💡', '🥳', '📝']
  },
  {
    id: 'tossface',
    name: 'Toss Face',
    description: 'Pack de emojis expresivos y modernos con el diseño visual estilizado de Toss.',
    previewEmojis: ['🚀', '✨', '💡', '🥳', '📝']
  }
];

export const ICON_PACKS: IconPackInfo[] = [
  {
    id: 'meteor',
    name: 'Meteor Icons',
    badge: 'PREDETERMINADO',
    description: 'Colección de más de 400 iconos modernos en cuadrícula estándar de 24px.'
  },
  {
    id: 'lucide',
    name: 'Lucide',
    description: 'Iconos limpios, consistentes y de alta legibilidad técnica.'
  },
  {
    id: 'material',
    name: 'Material Symbols',
    description: 'Símbolos oficiales de Google con diseño redondeado y estandarizado.'
  },
  {
    id: 'heroicons',
    name: 'Heroicons',
    description: 'Iconos vectoriales creados por los diseñadores de Tailwind Labs.'
  }
];

export interface UserProfile {
  login: string;
  avatar_url: string;
  name?: string;
  bio?: string;
  public_repos?: number;
}

export const POPULAR_CODE_FONTS = [
  'Google Sans Code',
  'Roboto Mono',
  'Space Mono',
  'JetBrains Mono',
  'IBM Plex Mono',
  'Geist Mono',
  'Source Code Pro',
  'Courier Prime',
];

export const GOOGLE_FONTS_CATALOG = {
  sansSerif: [
    'Vend Sans', 'Inter', 'Poppins', 'Roboto', 'Golos Text', 'Google Sans Text',
    'Plus Jakarta Sans', 'Outfit', 'Montserrat', 
    'DM Sans', 'Open Sans', 'Lato', 'Nunito', 'Raleway', 'Rubik', 'Work Sans', 'Manrope', 
    'Public Sans', 'Urbanist', 'Quicksand', 'Cabin', 'Karla', 'Ubuntu', 'Mulish', 'Barlow', 'Figtree'
  ],
  serif: [
    'Playfair Display', 'Lora', 'Merriweather', 'Cinzel', 'EB Garamond', 'Baskervville', 
    'Cormorant Garamond', 'PT Serif', 'Libre Baskerville', 'Bodoni Moda', 'Spectral', 'Bitter', 'Prata'
  ],
  display: [
    'Clash Display', 'Space Grotesk', 'Syne', 'Cabinet Grotesk', 'Bebas Neue', 'Righteous', 
    'Abril Fatface', 'Comfortaa', 'Cinzel Decorative', 'Bungee', 'Fredoka', 'Lobster', 'Audiowide', 'Unbounded'
  ],
  handwriting: [
    'Caveat', 'Dancing Script', 'Pacifico', 'Shadows Into Light', 'Satisfy', 'Sacramento', 
    'Great Vibes', 'Kalam', 'Architects Daughter', 'Homemade Apple', 'Marck Script'
  ],
  monospace: POPULAR_CODE_FONTS
};

export const ALL_SUGGESTED_FONTS = Array.from(new Set([
  ...GOOGLE_FONTS_CATALOG.sansSerif,
  ...GOOGLE_FONTS_CATALOG.serif,
  ...GOOGLE_FONTS_CATALOG.display,
  ...GOOGLE_FONTS_CATALOG.handwriting
]));
