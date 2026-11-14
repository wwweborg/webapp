"use client";
import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Smile, 
  FileText, 
  Check, 
  RotateCcw,
  Layers
} from 'lucide-react';
import { AppIcon, isEmoji } from '@/components/AppIcon';
import { PRESET_EMOJIS } from '@/lib/noteIcons';
import { IconPackType, EmojiPackType } from '@/lib/settings';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  currentValue?: string; // can be 'home', 'meteor:rocket', 'lucide:briefcase', '🚀', etc.
  iconPack?: IconPackType;
  emojiPack?: EmojiPackType;
  onSelect: (value?: string) => void;
  isDarkMode: boolean;
  primaryColor?: string;
}

export function IconPickerModal({
  isOpen,
  onClose,
  noteTitle,
  currentValue,
  iconPack = 'meteor',
  emojiPack = 'system',
  onSelect,
  isDarkMode,
  primaryColor = "#0075FF"
}: IconPickerModalProps) {
  const [activeTab, setActiveTab] = useState<'icon' | 'emojis'>(
    isEmoji(currentValue) ? 'emojis' : 'icon'
  );
  
  // The user input for icon name
  const [iconInput, setIconInput] = useState(
    currentValue && !isEmoji(currentValue) ? currentValue : ''
  );
  const [customEmoji, setCustomEmoji] = useState('');

  if (!isOpen) return null;

  const handleApplyIcon = () => {
    const trimmed = iconInput.trim();
    if (!trimmed) {
      onSelect(undefined);
    } else {
      onSelect(trimmed);
    }
    onClose();
  };

  const handleApplyEmoji = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  const handleReset = () => {
    onSelect(undefined);
    setIconInput('');
    onClose();
  };

  const sampleIconNames = [
    'home', 'sparkles', 'folder', 'rocket', 'file-text', 
    'star', 'book', 'briefcase', 'heart', 'code', 
    'settings', 'terminal', 'layout', 'search', 'zap'
  ];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 sm:py-8 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`max-w-md w-full my-auto p-5 sm:p-7 rounded-[30px] sm:rounded-[32px] [corner-shape:squircle] flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] h-auto shadow-taskflow-modal transition-all duration-200 ${
          isDarkMode ? 'bg-[#181818] text-zinc-100' : 'bg-white text-[#1E293B]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-2xl [corner-shape:squircle] flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold truncate">Personalizar Icono de la Nota</h3>
              <p className={`text-xs truncate max-w-[220px] sm:max-w-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {noteTitle.replace(/\.md$/, '')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer shrink-0 ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
            }`}
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`flex items-center p-1 rounded-2xl [corner-shape:squircle] my-2.5 sm:my-3.5 shrink-0 ${
          isDarkMode ? 'bg-[#121212]' : 'bg-[#F1F5F9]'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('icon')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'icon'
                ? (isDarkMode ? 'bg-[#242424] text-white' : 'bg-white text-[#0F172A]')
                : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900')
            }`}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: activeTab === 'icon' ? primaryColor : undefined }} />
            <span>Nombre de Icono</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emojis')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'emojis'
                ? (isDarkMode ? 'bg-[#242424] text-white' : 'bg-white text-[#0F172A]')
                : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900')
            }`}
          >
            <Smile className="w-3.5 h-3.5" style={{ color: activeTab === 'emojis' ? primaryColor : undefined }} />
            <span>Emojis</span>
          </button>
        </div>

        {/* Action Bar: Reset Default & Preview */}
        <div className="flex items-center justify-between gap-2 mb-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              !currentValue
                ? (isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800')
                : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500')
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer icono predeterminado</span>
          </button>

          {/* Current preview badge */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Actual:</span>
            <div className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 ${
              isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
            }`}>
              <AppIcon 
                name={currentValue} 
                pack={iconPack} 
                emojiPack={emojiPack}
                className="w-3.5 h-3.5" 
                fallback={<FileText className="w-3.5 h-3.5 text-zinc-400" />} 
              />
              <span className="font-semibold truncate max-w-[120px]">
                {currentValue || 'Estándar'}
              </span>
            </div>
          </div>
        </div>

        {/* TAB 1: DIRECT ICON NAME WITH REAL-TIME PREVIEW */}
        {activeTab === 'icon' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Live Preview Box */}
            <div className={`p-6 rounded-2xl [corner-shape:squircle] flex flex-col items-center justify-center gap-2.5 transition-all ${
              isDarkMode ? 'bg-[#121212]' : 'bg-zinc-50'
            }`}>
              <div 
                className="w-14 h-14 rounded-2xl [corner-shape:squircle] flex items-center justify-center text-white transition-transform duration-200 shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <AppIcon 
                  name={iconInput.trim() || 'file-text'} 
                  pack={iconPack} 
                  emojiPack={emojiPack}
                  className="w-7 h-7 stroke-[2]"
                  fallback={<FileText className="w-7 h-7 opacity-70" />}
                />
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold block font-mono">
                  {iconInput.trim() || 'file-text'}
                </span>
                <span className={`text-[11px] block mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {iconInput.includes(':') ? 'Pack explícito' : `Pack activo: ${iconPack}`}
                </span>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Nombre del icono
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: Home, Sparkles, Folder, rocket, star..."
                  value={iconInput}
                  onChange={(e) => setIconInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleApplyIcon();
                  }}
                  className={`w-full px-4 py-2.5 rounded-2xl outline-none text-sm transition-colors ${
                    isDarkMode ? 'bg-[#121212] text-zinc-100 placeholder-zinc-500' : 'bg-zinc-100 text-zinc-800 placeholder-zinc-400'
                  }`}
                  autoFocus
                />
                {iconInput && (
                  <button
                    type="button"
                    onClick={() => setIconInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Escribe el nombre del icono directamente. También puedes usar prefijos como <code className="px-1 py-0.5 rounded bg-black/20 font-mono">meteor:star</code> o <code className="px-1 py-0.5 rounded bg-black/20 font-mono">lucide:home</code>.
              </p>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="space-y-1.5">
              <span className={`text-[11px] font-medium block ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Sugerencias rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sampleIconNames.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setIconInput(name)}
                    className={`text-xs px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      iconInput.toLowerCase() === name
                        ? 'bg-blue-600 text-white font-semibold'
                        : isDarkMode ? 'bg-[#202020] hover:bg-[#282828] text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    <AppIcon name={name} pack={iconPack} emojiPack={emojiPack} className="w-3.5 h-3.5" />
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm button */}
            <button
              type="button"
              onClick={handleApplyIcon}
              className="w-full py-2.5 rounded-2xl text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar icono</span>
            </button>
          </div>
        )}

        {/* TAB 2: TRADITIONAL EMOJIS */}
        {activeTab === 'emojis' && (
          <div className="flex flex-col flex-1 min-h-0 space-y-3">
            <div className={`p-3.5 rounded-2xl [corner-shape:squircle] grid grid-cols-6 sm:grid-cols-8 gap-2 flex-1 min-h-[160px] sm:min-h-[200px] overflow-y-auto overscroll-contain ${
              isDarkMode ? 'bg-[#121212]' : 'bg-zinc-50'
            }`}>
              {PRESET_EMOJIS.map(emoji => {
                const isSelected = currentValue === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleApplyEmoji(emoji)}
                    className={`h-10 w-full text-xl flex items-center justify-center rounded-xl transition-transform hover:scale-115 cursor-pointer active:scale-95 ${
                      isSelected 
                        ? (isDarkMode ? 'bg-blue-600/40 ring-1 ring-blue-500' : 'bg-blue-100 ring-1 ring-blue-400')
                        : (isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200')
                    }`}
                    style={{
                      fontFamily: emojiPack === 'tossface' 
                        ? '"Tossface", "Apple Color Emoji", sans-serif' 
                        : 'system-ui, -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
                    }}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>

            {/* Custom Emoji Input */}
            <div className="shrink-0 pt-1">
              <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                O introduce cualquier emoji personalizado
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Escribe o pega un emoji..."
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customEmoji.trim()) {
                      handleApplyEmoji(customEmoji.trim());
                    }
                  }}
                  style={{
                    fontFamily: emojiPack === 'tossface' 
                      ? '"Tossface", "Apple Color Emoji", sans-serif' 
                      : 'system-ui, -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-2xl outline-none text-sm text-center ${
                    isDarkMode ? 'bg-[#121212] text-zinc-100 placeholder-zinc-500' : 'bg-zinc-100 text-zinc-800 placeholder-zinc-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customEmoji.trim()) {
                      handleApplyEmoji(customEmoji.trim());
                    }
                  }}
                  disabled={!customEmoji.trim()}
                  className="px-4 py-2.5 text-xs font-semibold text-white rounded-2xl transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
