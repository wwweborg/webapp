"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { FilePlus2, FileText, ChevronRight } from 'lucide-react';
import { AppLanguage, getUiTranslations } from '@/lib/i18n';

export interface WikiLinkNoteOption {
  path: string;
  name: string;
  title: string;
  folder: string;
  emoji?: string;
  snippet?: string;
}

interface WikiLinkAutocompleteMenuProps {
  query: string;
  position: { top: number; left: number };
  notes: WikiLinkNoteOption[];
  currentNotePath?: string;
  onSelect: (targetTitle: string, openImmediately?: boolean) => void;
  onClose: () => void;
  isDarkMode: boolean;
  primaryColor?: string;
  language?: AppLanguage;
}

export function WikiLinkAutocompleteMenu({
  query,
  position,
  notes,
  currentNotePath,
  onSelect,
  onClose,
  isDarkMode,
  primaryColor = '#006FFF',
  language = 'es',
}: WikiLinkAutocompleteMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [adjustedPos, setAdjustedPos] = useState(position);
  const menuRef = useRef<HTMLDivElement>(null);
  const subT = getUiTranslations(language).subnotes;

  const cleanQuery = query.trim();
  const newSubNoteTitle = cleanQuery || subT.newSubNoteDefault;

  const filteredNotes = useMemo(() => {
    const available = notes.filter((n) => n.path !== currentNotePath);
    if (!cleanQuery) return available.slice(0, 8);
    const q = cleanQuery.toLowerCase();
    return available
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.path.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [notes, currentNotePath, cleanQuery]);

  // Item 0 is always "Crear nueva sub-nota dentro de esta nota" (Notion/Craft style)
  const totalItems = 1 + filteredNotes.length;

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newLeft = position.left;
      let newTop = position.top;

      if (newLeft + rect.width > viewportWidth - 16) {
        newLeft = Math.max(16, viewportWidth - rect.width - 16);
      }
      if (newLeft < 16) newLeft = 16;

      if (newTop + rect.height > viewportHeight - 16) {
        newTop = Math.max(16, position.top - rect.height - 32);
      }
      if (newTop < 16) newTop = 16;

      setAdjustedPos({ top: newTop, left: newLeft });
    }
  }, [position, totalItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (selectedIndex === 0) {
          onSelect(newSubNoteTitle, true);
        } else {
          const picked = filteredNotes[selectedIndex - 1];
          if (picked) {
            onSelect(picked.title, false);
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, totalItems, filteredNotes, newSubNoteTitle, onSelect, onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedPos.top}px`, left: `${adjustedPos.left}px` }}
      className={`fixed z-50 w-80 max-h-80 overflow-y-auto p-2 rounded-[24px] [corner-shape:squircle] border-0 shadow-none backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 select-none ${
        isDarkMode
          ? 'bg-[#222226]/95 text-zinc-100'
          : 'bg-[#EEF1F6]/95 text-[#0F172A]'
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
          isDarkMode ? 'text-zinc-400' : 'text-slate-500'
        }`}
      >
        <span>{subT.menuHeader}</span>
      </div>

      <div className="space-y-1">
        {/* Primary Action: Create a brand new Sub-Note inside the current note */}
        <button
          type="button"
          onClick={() => onSelect(newSubNoteTitle, true)}
          onMouseEnter={() => setSelectedIndex(0)}
          className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-colors cursor-pointer border-0 shadow-none ${
            selectedIndex === 0
              ? 'text-white'
              : isDarkMode
                ? 'bg-[#18181B] hover:bg-[#2C2C32] text-zinc-100'
                : 'bg-white hover:bg-slate-100 text-slate-900'
          }`}
          style={{
            backgroundColor: selectedIndex === 0 ? primaryColor : undefined,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                selectedIndex === 0
                  ? 'bg-white/20 text-white'
                  : isDarkMode
                    ? 'bg-[#26262A] text-zinc-200'
                    : 'bg-[#EEF1F6] text-slate-700'
              }`}
            >
              <FilePlus2
                className="w-4 h-4"
                style={{
                  color: selectedIndex === 0 ? '#FFFFFF' : primaryColor,
                }}
              />
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-bold truncate">
                {subT.createSubNoteLabel} «{newSubNoteTitle}»
              </span>
              <span
                className={`text-[10px] truncate ${
                  selectedIndex === 0
                    ? 'text-white/80'
                    : isDarkMode
                      ? 'text-zinc-400'
                      : 'text-slate-500'
                }`}
              >
                {subT.createSubNoteSub}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 opacity-75" />
        </button>

        {filteredNotes.length > 0 && (
          <>
            <div
              className={`px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-zinc-500' : 'text-slate-400'
              }`}
            >
              {subT.orEmbedExisting}
            </div>
            {filteredNotes.map((note, idx) => {
              const itemIdx = idx + 1;
              const isSelected = itemIdx === selectedIndex;
              return (
                <button
                  key={note.path}
                  type="button"
                  onClick={() => onSelect(note.title, false)}
                  onMouseEnter={() => setSelectedIndex(itemIdx)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl text-left transition-colors cursor-pointer border-0 shadow-none ${
                    isSelected
                      ? 'text-white'
                      : isDarkMode
                        ? 'hover:bg-[#2C2C32] text-zinc-200'
                        : 'hover:bg-white text-slate-800'
                  }`}
                  style={{
                    backgroundColor: isSelected ? primaryColor : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {note.emoji ? (
                      <span className="text-sm leading-none shrink-0">{note.emoji}</span>
                    ) : (
                      <FileText
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-white' : isDarkMode ? 'text-zinc-400' : 'text-slate-500'
                        }`}
                      />
                    )}
                    <span className="text-xs font-bold truncate">{note.title}</span>
                  </div>
                  {note.folder && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full truncate max-w-[95px] shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isDarkMode
                            ? 'bg-[#18181B] text-zinc-400'
                            : 'bg-white/80 text-slate-500'
                      }`}
                    >
                      {note.folder}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
