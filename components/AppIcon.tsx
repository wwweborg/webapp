"use client";
import React, { useState } from 'react';
import { Icon as IconifyIcon, addCollection } from '@iconify/react';
import meteorIconsData from '@iconify-json/meteor-icons/icons.json';
import lucideIconsData from '@iconify-json/lucide/icons.json';
import materialIconsData from '@iconify-json/material-symbols/icons.json';
import heroiconsData from '@iconify-json/heroicons/icons.json';
import { IconPackType, EmojiPackType } from '@/lib/settings';

// Register icon collections synchronously so icons render instantly without network latency
try {
  addCollection(meteorIconsData as any);
  addCollection(lucideIconsData as any);
  addCollection(materialIconsData as any);
  addCollection(heroiconsData as any);
} catch {
  // Collections initialized
}

export interface AppIconProps {
  name?: string;
  pack?: IconPackType;
  emojiPack?: EmojiPackType;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}

// Convert kebab-case or PascalCase or snake_case into standard kebab
export function normalizeIconName(name: string): string {
  return name
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Checks if a string is a raw emoji character
 */
export function isEmoji(str?: string): boolean {
  if (!str) return false;
  const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;
  return emojiRegex.test(str) && !str.includes(':') && !str.includes('-');
}

/**
 * Default generic document icon used whenever an icon is missing or not found
 */
export const DefaultDocumentIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg 
    className={className} 
    style={style}
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

/**
 * Common cross-pack semantic aliases mapping friendly/generic names to specific pack identifiers
 */
const PACK_ALIASES: Record<string, Record<string, string>> = {
  lucide: {
    'file-md': 'file-text',
    'sidebar-open': 'panel-left-open',
    'sidebar-close': 'panel-left-close',
    gear: 'settings',
    cog: 'settings',
    'pin-note': 'pin',
    'rename-note': 'pencil',
    'customize-icon': 'sparkles',
    'export-md': 'download',
    'delete-note': 'trash-2',
    'trash-can': 'trash-2',
    'focus-mode': 'focus',
    focus: 'focus',
    command: 'command',
    'note-info': 'info',
    'circle-info': 'info',
    'information-circle': 'info',
  },
  material: {
    bug: 'bug-report-rounded',
    'bug-report': 'bug-report-rounded',
    'bug-ant': 'bug-report-rounded',
    file: 'description-rounded',
    'file-text': 'description-rounded',
    'file-md': 'description-rounded',
    note: 'edit-note-rounded',
    document: 'description-rounded',
    trash: 'delete',
    'trash-2': 'delete',
    'trash-can': 'delete',
    delete: 'delete',
    'delete-note': 'delete',
    edit: 'edit',
    'edit-3': 'edit',
    pencil: 'edit',
    pen: 'edit',
    'rename-note': 'edit',
    search: 'search',
    'magnifying-glass': 'search',
    settings: 'settings',
    gear: 'settings',
    cog: 'settings',
    palette: 'palette',
    type: 'title',
    typography: 'title',
    font: 'title',
    title: 'title',
    sparkles: 'auto-awesome-rounded',
    meteor: 'auto-awesome-rounded',
    stars: 'auto-awesome-rounded',
    ai: 'auto-awesome-rounded',
    apps: 'apps',
    'customize-icon': 'apps',
    download: 'download',
    'export-md': 'download',
    'focus-mode': 'center-focus-strong',
    focus: 'center-focus-strong',
    'center-focus-strong': 'center-focus-strong',
    command: 'command',
    info: 'info',
    'note-info': 'info',
    'circle-info': 'info',
    'information-circle': 'info',
    folder: 'folder-rounded',
    'folder-open': 'folder-open-rounded',
    terminal: 'terminal-rounded',
    console: 'terminal-rounded',
    code: 'code-rounded',
    database: 'database-rounded',
    user: 'person-rounded',
    users: 'group-rounded',
    team: 'group-rounded',
    bell: 'notifications-rounded',
    calendar: 'calendar-today-rounded',
    'calendar-days': 'calendar-today-rounded',
    clock: 'schedule-rounded',
    'alarm-clock': 'alarm-rounded',
    time: 'schedule-rounded',
    image: 'image-rounded',
    photo: 'image-rounded',
    camera: 'photo-camera-rounded',
    music: 'music-note-rounded',
    video: 'videocam-rounded',
    shield: 'shield-rounded',
    'shield-check': 'shield-rounded',
    lock: 'lock-rounded',
    key: 'key-rounded',
    rocket: 'rocket-launch-rounded',
    zap: 'bolt-rounded',
    lightning: 'bolt-rounded',
    bolt: 'bolt-rounded',
    heart: 'favorite-rounded',
    star: 'star-rounded',
    pin: 'keep',
    'pin-note': 'keep',
    keep: 'keep',
    check: 'check-circle-rounded',
    'check-circle': 'check-circle-rounded',
    'check-square': 'check-box-rounded',
    'list-todo': 'checklist-rounded',
    close: 'close-rounded',
    x: 'close-rounded',
    plus: 'add-rounded',
    minus: 'remove-rounded',
    'layout-grid': 'grid-view-rounded',
    grid: 'grid-view-rounded',
    'sidebar-open': 'left-panel-open',
    'panel-left-open': 'left-panel-open',
    'left-panel-open': 'left-panel-open',
    'sidebar-close': 'left-panel-close',
    'panel-left-close': 'left-panel-close',
    'left-panel-close': 'left-panel-close',
    tag: 'label-rounded',
    tags: 'label-rounded',
    label: 'label-rounded',
    book: 'book-rounded',
    'book-open': 'menu-book-rounded',
    scroll: 'history-edu-rounded',
    briefcase: 'work-rounded',
    work: 'work-rounded',
    compass: 'explore-rounded',
    brain: 'psychology-rounded',
    lightbulb: 'lightbulb-rounded',
    kanban: 'view-kanban-rounded',
    'dollar-sign': 'attach-money-rounded',
    wallet: 'account-balance-wallet-rounded',
    receipt: 'receipt-rounded',
    smile: 'sentiment-satisfied-rounded',
    utensils: 'restaurant-rounded',
    coffee: 'local-cafe-rounded',
    plane: 'flight-rounded',
    map: 'map-rounded',
    clapperboard: 'movie-rounded',
    mic: 'mic-rounded',
    target: 'track-changes-rounded',
    'trending-up': 'trending-up-rounded',
    presentation: 'co-present-rounded'
  },
  heroicons: {
    bug: 'bug-ant',
    'bug-report': 'bug-ant',
    'bug-ant': 'bug-ant',
    file: 'document-text',
    'file-text': 'document-text',
    'file-md': 'document-text',
    note: 'document-text',
    document: 'document-text',
    type: 'document-text',
    typography: 'document-text',
    font: 'document-text',
    palette: 'swatch',
    swatch: 'swatch',
    trash: 'trash',
    'trash-2': 'trash',
    'trash-can': 'trash',
    delete: 'trash',
    'delete-note': 'trash',
    edit: 'pencil',
    'edit-3': 'pencil',
    pencil: 'pencil',
    pen: 'pencil',
    'rename-note': 'pencil',
    'customize-icon': 'adjustments-horizontal',
    'adjustments-horizontal': 'adjustments-horizontal',
    download: 'arrow-down-tray',
    'arrow-down-tray': 'arrow-down-tray',
    'export-md': 'arrow-down-tray',
    search: 'magnifying-glass',
    'magnifying-glass': 'magnifying-glass',
    'focus-mode': 'viewfinder-circle',
    focus: 'viewfinder-circle',
    'viewfinder-circle': 'viewfinder-circle',
    command: 'command',
    info: 'information-circle',
    'note-info': 'information-circle',
    'circle-info': 'information-circle',
    'information-circle': 'information-circle',
    settings: 'cog',
    gear: 'cog',
    cog: 'cog',
    sparkles: 'sparkles',
    meteor: 'sparkles',
    stars: 'sparkles',
    ai: 'sparkles',
    folder: 'folder',
    'folder-open': 'folder-open',
    terminal: 'command-line',
    console: 'command-line',
    code: 'code-bracket',
    database: 'circle-stack',
    user: 'user',
    users: 'users',
    team: 'users',
    bell: 'bell',
    calendar: 'calendar',
    'calendar-days': 'calendar-days',
    clock: 'clock',
    'alarm-clock': 'clock',
    time: 'clock',
    image: 'photo',
    photo: 'photo',
    camera: 'camera',
    music: 'musical-note',
    video: 'video-camera',
    shield: 'shield-check',
    'shield-check': 'shield-check',
    lock: 'lock-closed',
    key: 'key',
    rocket: 'rocket-launch',
    zap: 'bolt',
    lightning: 'bolt',
    bolt: 'bolt',
    heart: 'heart',
    star: 'star',
    pin: 'paper-clip',
    'pin-note': 'paper-clip',
    'paper-clip': 'paper-clip',
    check: 'check-circle',
    'check-circle': 'check-circle',
    'check-square': 'check-badge',
    'list-todo': 'clipboard-document-list',
    close: 'x-mark',
    x: 'x-mark',
    plus: 'plus',
    minus: 'minus',
    'layout-grid': 'squares-2x2',
    grid: 'squares-2x2',
    'sidebar-open': 'chevron-right',
    'panel-left-open': 'chevron-right',
    'sidebar-close': 'chevron-left',
    'panel-left-close': 'chevron-left',
    tag: 'tag',
    tags: 'tag',
    label: 'tag',
    book: 'book-open',
    'book-open': 'book-open',
    scroll: 'document-text',
    briefcase: 'briefcase',
    work: 'briefcase',
    compass: 'globe-alt',
    brain: 'academic-cap',
    lightbulb: 'light-bulb',
    kanban: 'view-columns',
    'dollar-sign': 'currency-dollar',
    wallet: 'wallet',
    receipt: 'receipt-percent',
    smile: 'face-smile',
    utensils: 'cake',
    coffee: 'cup-straw',
    plane: 'paper-airplane',
    map: 'map',
    clapperboard: 'film',
    mic: 'microphone',
    target: 'viewfinder-circle',
    'trending-up': 'arrow-trending-up',
    presentation: 'presentation-chart-bar'
  },
  meteor: {
    'bug-report': 'bug',
    'bug-ant': 'bug',
    'file-md': 'file-text',
    'file-text': 'file-text',
    document: 'file-text',
    trash: 'trash-can',
    'trash-2': 'trash-can',
    'trash-can': 'trash-can',
    delete: 'trash-can',
    'delete-note': 'trash-can',
    'edit-3': 'pencil',
    edit: 'pencil',
    pencil: 'pencil',
    'rename-note': 'pencil',
    pin: 'pin',
    'pin-note': 'pin',
    meteor: 'meteor',
    'customize-icon': 'meteor',
    download: 'download',
    'export-md': 'download',
    'focus-mode': 'eye',
    focus: 'eye',
    eye: 'eye',
    command: 'command',
    search: 'search',
    info: 'circle-info',
    'note-info': 'circle-info',
    'circle-info': 'circle-info',
    'information-circle': 'circle-info',
    settings: 'gear',
    gear: 'gear',
    cog: 'gear',
    type: 'text',
    typography: 'text',
    font: 'text',
    'layout-grid': 'grid',
    dashboard: 'grid',
    panel: 'grid',
    'sidebar-open': 'layout-panel-right',
    'panel-left-open': 'layout-panel-right',
    'sidebar-close': 'layout-panel-left',
    'panel-left-close': 'layout-panel-left',
    'calendar-days': 'calendar',
    'list-todo': 'list',
    tasks: 'list',
    task: 'check',
    sparkles: 'sparkles',
    bot: 'robot',
    ai: 'google-gemini',
    gemini: 'google-gemini',
    'magnifying-glass': 'search',
    'rotate-ccw': 'rotate',
    'refresh-cw': 'refresh',
    close: 'xmark',
    lock: 'lock',
    shield: 'lock',
    'shield-check': 'lock',
    'book-open': 'book',
    smile: 'face-smile',
  }
};

function hasIconInCollection(collection: any, key: string): boolean {
  if (!collection || !key) return false;
  return Boolean(collection.icons?.[key] || collection.aliases?.[key]);
}

function resolveCollectionIcon(collection: any, candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (hasIconInCollection(collection, candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Safe Iconify wrapper with automatic fallback on missing icon or loading error
 */
function SafeIconify({
  icon,
  className,
  style,
  fallback
}: {
  icon: string;
  className?: string;
  style?: React.CSSProperties;
  fallback: React.ReactNode;
}) {
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({});

  if (failedIcons[icon]) {
    return <>{fallback}</>;
  }

  return (
    <IconifyIcon 
      key={icon}
      icon={icon} 
      className={className} 
      style={style} 
      onError={() => {
        setFailedIcons(prev => ({ ...prev, [icon]: true }));
      }}
    />
  );
}

/**
 * Universal Icon Component supporting:
 * - Meteor Icons (zkreations - Predeterminado)
 * - Lucide Icons
 * - Material Symbols (Google)
 * - Heroicons (Tailwind Labs)
 * - Prefixes: 'meteor:name', 'lucide:name', 'material:name', 'heroicons:name'
 * - Emojis: '🚀', '💡', etc.
 */
export function AppIcon({
  name,
  pack = 'meteor',
  emojiPack,
  className = "w-5 h-5",
  style,
  fallback = null
}: AppIconProps) {
  // Guaranteed non-empty fallback (generic document icon by default)
  const effectiveFallback = fallback !== null && fallback !== undefined 
    ? fallback 
    : <DefaultDocumentIcon className={className} style={style} />;

  if (!name || !name.trim()) {
    return <>{effectiveFallback}</>;
  }

  const trimmed = name.trim();

  // If it's a raw emoji
  if (isEmoji(trimmed)) {
    const fontClass = emojiPack === 'tossface' 
      ? 'font-emoji-tossface' 
      : emojiPack === 'system' 
        ? 'font-emoji-system' 
        : 'font-emoji';
    const computedStyle: React.CSSProperties = {
      fontFamily: emojiPack === 'tossface' 
        ? '"Tossface", "Apple Color Emoji", sans-serif' 
        : emojiPack === 'system' 
          ? 'system-ui, -apple-system, "Apple Color Emoji", sans-serif' 
          : undefined,
      ...style
    };
    return (
      <span 
        data-emoji="true"
        className={`inline-block leading-none ${fontClass} ${className}`} 
        style={computedStyle}
      >
        {trimmed}
      </span>
    );
  }

  // Parse prefix if any, e.g. "meteor:home" or "lucide:sparkles"
  let targetPack: IconPackType = pack;
  let iconKey = trimmed;

  if (trimmed.includes(':')) {
    const [prefix, ...rest] = trimmed.split(':');
    const rawKey = rest.join(':');
    const lowerPrefix = prefix.toLowerCase();

    if (lowerPrefix === 'meteor' || lowerPrefix === 'meteor-icons' || lowerPrefix === 'wwwos') {
      targetPack = 'meteor';
      iconKey = rawKey;
    } else if (lowerPrefix === 'material' || lowerPrefix === 'material-symbols') {
      targetPack = 'material';
      iconKey = rawKey;
    } else if (lowerPrefix === 'heroicons' || lowerPrefix === 'hero') {
      targetPack = 'heroicons';
      iconKey = rawKey;
    } else if (lowerPrefix === 'lucide') {
      targetPack = 'lucide';
      iconKey = rawKey;
    }
  }

  const normalized = normalizeIconName(iconKey);

  // 1. Pack: Lucide Icons
  if (targetPack === 'lucide') {
    const alias = PACK_ALIASES.lucide?.[normalized] || normalized;
    const resolved = resolveCollectionIcon(lucideIconsData, [alias, normalized]) || alias;
    return (
      <SafeIconify 
        icon={`lucide:${resolved}`} 
        className={className} 
        style={style} 
        fallback={effectiveFallback}
      />
    );
  }

  // 2. Pack: Meteor Icons (Default)
  if (targetPack === 'meteor') {
    const alias = PACK_ALIASES.meteor?.[normalized] || normalized;
    const resolved = resolveCollectionIcon(meteorIconsData, [alias, normalized]) || alias;
    return (
      <SafeIconify 
        icon={`meteor-icons:${resolved}`} 
        className={className} 
        style={style} 
        fallback={effectiveFallback}
      />
    );
  }

  // 3. Pack: Material Symbols
  if (targetPack === 'material') {
    const alias = PACK_ALIASES.material?.[normalized] || normalized;
    const stripped = alias.replace(/-(rounded|outline|sharp)$/, '');
    const resolved =
      resolveCollectionIcon(materialIconsData, [
        alias,
        stripped,
        `${stripped}-rounded`,
        `${stripped}-outline`,
        `${normalized}-rounded`,
        normalized,
        `${normalized}-outline`,
        stripped === 'keep' ? 'push-pin' : '',
        stripped === 'keep' ? 'push-pin-rounded' : '',
        stripped === 'keep' ? 'push-pin-outline' : '',
        stripped === 'command' ? 'keyboard-command-key' : '',
        stripped === 'command' ? 'keyboard-command-key-rounded' : '',
        stripped === 'command' ? 'keyboard-command-key-outline' : '',
      ]) || (alias.endsWith('-rounded') ? alias : `${alias}-rounded`);
    return (
      <SafeIconify 
        icon={`material-symbols:${resolved}`} 
        className={className} 
        style={style} 
        fallback={effectiveFallback}
      />
    );
  }

  // 4. Pack: Heroicons
  if (targetPack === 'heroicons') {
    const alias = PACK_ALIASES.heroicons?.[normalized] || normalized;
    const resolved = resolveCollectionIcon(heroiconsData, [
      alias,
      normalized,
      alias === 'cog' ? 'cog-6-tooth' : '',
      `${alias}-20-solid`,
      `${alias}-solid`,
      `${normalized}-20-solid`,
    ]);
    if (!resolved && (alias === 'command' || normalized === 'command')) {
      return (
        <SafeIconify 
          icon="meteor-icons:command" 
          className={className} 
          style={style} 
          fallback={effectiveFallback}
        />
      );
    }
    return (
      <SafeIconify 
        icon={`heroicons:${resolved || alias}`} 
        className={className} 
        style={style} 
        fallback={effectiveFallback}
      />
    );
  }

  return <>{effectiveFallback}</>;
}
