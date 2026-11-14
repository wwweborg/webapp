import React from 'react';
import { AppIcon, isEmoji, DefaultDocumentIcon } from '@/components/AppIcon';
import { IconPackType, EmojiPackType } from '@/lib/settings';

export const PRESET_EMOJIS = [
  '📝', '💡', '🚀', '📚', '🍕', '🏀', '🥑', '🥳', 
  '🎯', '📌', '⚙️', '💻', '🎨', '🔍', '💬', '📅', 
  '🏷️', '🧪', '🛠️', '☕', '🌟', '📖', '✈️', '🎵', 
  '💼', '🧘', '📊', '✨', '⚡', '🔥', '❤️', '🔭', '💥',
  '🍿', '🎮', '🏆', '🍔', '🌮', '🥗', '🌲'
];

/**
 * Reusable Note Icon / Emoji Renderer
 */
export function NoteIconDisplay({
  iconOrEmoji,
  pack,
  emojiPack,
  className = "w-4.5 h-4.5",
  emojiClassName = "text-base leading-none",
  fallback
}: {
  iconOrEmoji?: string;
  pack?: IconPackType;
  emojiPack?: EmojiPackType;
  className?: string;
  emojiClassName?: string;
  fallback?: React.ReactNode;
}) {
  const effectiveFallback = fallback !== undefined && fallback !== null
    ? fallback
    : <DefaultDocumentIcon className={className} />;

  if (!iconOrEmoji) {
    return <>{effectiveFallback}</>;
  }

  if (isEmoji(iconOrEmoji)) {
    const fontClass = emojiPack === 'tossface' 
      ? 'font-emoji-tossface' 
      : emojiPack === 'system' 
        ? 'font-emoji-system' 
        : 'font-emoji';
    return (
      <span 
        data-emoji="true" 
        className={`${fontClass} ${emojiClassName}`}
        style={{
          fontFamily: emojiPack === 'tossface' 
            ? '"Tossface", "Apple Color Emoji", sans-serif' 
            : emojiPack === 'system' 
              ? 'system-ui, -apple-system, "Apple Color Emoji", sans-serif' 
              : undefined
        }}
      >
        {iconOrEmoji}
      </span>
    );
  }

  return (
    <AppIcon 
      name={iconOrEmoji} 
      pack={pack} 
      emojiPack={emojiPack}
      className={className} 
      fallback={effectiveFallback} 
    />
  );
}

