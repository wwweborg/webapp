"use client";
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { searchEmojis } from '@/lib/emojiList';
import { AppLanguage, getUiTranslations } from '@/lib/i18n';

interface EmojiAutocompleteMenuProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
  language?: AppLanguage;
}

export function EmojiAutocompleteMenu({
  query,
  position,
  onSelect,
  onClose,
  isDarkMode,
  language = 'es'
}: EmojiAutocompleteMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [adjustedPos, setAdjustedPos] = useState(position);
  const menuRef = useRef<HTMLDivElement>(null);
  const results = searchEmojis(query);
  const emojiT = getUiTranslations(language).menus.emoji;

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  // Viewport bounds protection
  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newLeft = position.left;
      let newTop = position.top;

      // Check right border
      if (newLeft + rect.width > viewportWidth - 16) {
        newLeft = Math.max(16, viewportWidth - rect.width - 16);
      }
      // Check left border
      if (newLeft < 16) newLeft = 16;

      // Check bottom border
      if (newTop + rect.height > viewportHeight - 16) {
        newTop = Math.max(16, position.top - rect.height - 32);
      }
      // Check top border
      if (newTop < 16) newTop = 16;

      setAdjustedPos({ top: newTop, left: newLeft });
    }
  }, [position, results.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (results.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex].emoji);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, results, onSelect, onClose]);

  if (results.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedPos.top}px`, left: `${adjustedPos.left}px` }}
      className={`fixed z-50 w-60 max-h-64 overflow-y-auto p-1.5 rounded-2xl border shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
        isDarkMode 
          ? 'bg-[#181818]/95 border-zinc-800 text-zinc-100' 
          : 'bg-white/95 border-slate-200 text-zinc-900'
      }`}
    >
      <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
        isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
      }`}>
        {emojiT.header} :{query}
      </div>

      <div className="space-y-0.5">
        {results.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => onSelect(item.emoji)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                isSelected
                  ? isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  : isDarkMode ? 'hover:bg-[#242424] text-zinc-300' : 'hover:bg-slate-100 text-zinc-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg leading-none">{item.emoji}</span>
                <span className="text-xs font-semibold font-mono">:{item.code}:</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
