"use client";
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  SquareCode, 
  Quote, 
  Smile, 
  Sparkles,
  Highlighter,
  Table2,
  FilePlus2,
  AtSign
} from 'lucide-react';
import { AppLanguage, getUiTranslations } from '@/lib/i18n';

export interface SlashCommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  onSelect: (commandId: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
  filterText?: string;
  language?: AppLanguage;
}

export function SlashCommandMenu({
  position,
  onSelect,
  onClose,
  isDarkMode,
  filterText = '',
  language = 'es'
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [adjustedPos, setAdjustedPos] = useState(position);
  const menuRef = useRef<HTMLDivElement>(null);
  const slashT = getUiTranslations(language).menus.slash;

  const commands: SlashCommandItem[] = [
    {
      id: 'calendario',
      label: slashT.calendario,
      icon: CalendarIcon,
      action: () => onSelect('calendario')
    },
    {
      id: 'task',
      label: slashT.task,
      icon: CheckSquare,
      action: () => onSelect('task')
    },
    {
      id: 'emoji',
      label: slashT.emoji,
      icon: Smile,
      action: () => onSelect('emoji')
    },
    {
      id: 'icon',
      label: slashT.icon,
      icon: Sparkles,
      action: () => onSelect('icon')
    },
    {
      id: 'h1',
      label: slashT.h1,
      icon: Heading1,
      action: () => onSelect('h1')
    },
    {
      id: 'h2',
      label: slashT.h2,
      icon: Heading2,
      action: () => onSelect('h2')
    },
    {
      id: 'h3',
      label: slashT.h3,
      icon: Heading3,
      action: () => onSelect('h3')
    },
    {
      id: 'bullet',
      label: slashT.bullet,
      icon: List,
      action: () => onSelect('bullet')
    },
    {
      id: 'code',
      label: slashT.code,
      icon: SquareCode,
      action: () => onSelect('code')
    },
    {
      id: 'quote',
      label: slashT.quote,
      icon: Quote,
      action: () => onSelect('quote')
    },
    {
      id: 'highlight',
      label: slashT.highlight,
      icon: Highlighter,
      action: () => onSelect('highlight')
    },
    {
      id: 'table',
      label: slashT.table,
      icon: Table2,
      action: () => onSelect('table')
    },
    {
      id: 'wikilink',
      label: slashT.wikilink,
      icon: FilePlus2,
      action: () => onSelect('wikilink')
    },
    {
      id: 'github-mention',
      label: slashT.githubMention,
      icon: AtSign,
      action: () => onSelect('github-mention')
    }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(filterText.toLowerCase()) ||
    cmd.id.toLowerCase().includes(filterText.toLowerCase())
  );

  const [prevFilter, setPrevFilter] = useState(filterText);
  if (filterText !== prevFilter) {
    setPrevFilter(filterText);
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
  }, [position, filteredCommands.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filteredCommands.length || 1)) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCommands, onClose]);

  if (filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedPos.top}px`, left: `${adjustedPos.left}px` }}
      className={`fixed z-50 w-56 max-h-72 overflow-y-auto p-1.5 rounded-2xl border shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
        isDarkMode 
          ? 'bg-[#181818]/95 border-zinc-800 text-zinc-100' 
          : 'bg-white/95 border-slate-200 text-zinc-900'
      }`}
    >
      <div className="space-y-0.5">
        {filteredCommands.map((cmd, idx) => {
          const Icon = cmd.icon;
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={cmd.id}
              type="button"
              onClick={cmd.action}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                isSelected
                  ? isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  : isDarkMode ? 'hover:bg-[#242424] text-zinc-300' : 'hover:bg-slate-100 text-zinc-800'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${
                isSelected 
                  ? 'bg-blue-600 text-white' 
                  : isDarkMode ? 'bg-[#242424] text-zinc-400' : 'bg-slate-100 text-zinc-500'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              <span className="text-xs font-bold truncate flex-1">
                {cmd.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
