"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  ArrowLeft,
  LayoutGrid, 
  List, 
  Check,
  RotateCcw,
  Github,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Zap,
  Globe,
  Info,
  ShieldCheck,
  BookOpen,
  Lock,
  Unlock,
  KeyRound,
  Download,
  FileArchive,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  Palette,
  Type
} from 'lucide-react';
import { getSecurityStrings } from '@/lib/crypto';
import { 
  AI_PROVIDERS, 
  AiProvider
} from '@/lib/aiService';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  UserProfile,
  ALL_SUGGESTED_FONTS,
  POPULAR_CODE_FONTS,
  ICON_PACKS,
  EMOJI_PACKS
} from '@/lib/settings';
import { AppIcon } from '@/components/AppIcon';
import { APP_VERSION } from '@/lib/version';
import {
  AppLanguage,
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  getDictionary,
  getLanguageOption,
  getLocalizedAiProviderMeta,
} from '@/lib/i18n';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetSettings: () => void;
  onBack: () => void;
  isDarkMode: boolean;
  userProfile?: UserProfile | null;
  totalNotesCount?: number;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  e2eeUnlocked?: boolean;
  encryptedNotesCount?: number;
  batchProgress?: { active: boolean; label: string; current: number; total: number } | null;
  onEnableEncryption?: (password: string, rememberDevice: boolean) => Promise<boolean>;
  onDisableEncryption?: (password?: string) => Promise<boolean>;
  onEncryptAllRepoNotes?: (password?: string) => Promise<void>;
  onUnlockVault?: (password: string, rememberDevice: boolean) => Promise<boolean>;
  onLockSession?: () => void;
  onExportAllVaultZip?: () => Promise<void>;
  initialSection?: 'appearance' | 'typography' | 'ai' | 'editor' | 'security' | 'account' | 'docs';
  configuredAiProviders?: Record<string, boolean>;
}

export function SettingsView({
  settings,
  onUpdateSettings,
  onResetSettings,
  onBack,
  isDarkMode,
  userProfile,
  totalNotesCount = 0,
  onShowToast,
  e2eeUnlocked = false,
  encryptedNotesCount = 0,
  batchProgress = null,
  onEnableEncryption,
  onDisableEncryption,
  onEncryptAllRepoNotes,
  onUnlockVault,
  onLockSession,
  onExportAllVaultZip,
  initialSection,
  configuredAiProviders = {},
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<'appearance' | 'typography' | 'ai' | 'editor' | 'security' | 'account' | 'docs'>(initialSection || 'appearance');
  const [customSiteFontInput, setCustomSiteFontInput] = useState(settings.siteFont);
  const [customCodeFontInput, setCustomCodeFontInput] = useState(settings.codeFont);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // E2EE Security Form State
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [rememberDeviceKey, setRememberDeviceKey] = useState(true);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [isProcessingSecurity, setIsProcessingSecurity] = useState(false);

  // Multi-AI Provider State in Settings
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('gemini');
  const [providerConfigs, setProviderConfigs] = useState<Record<AiProvider, { model: string; baseUrl: string }>>({
    gemini: { model: 'gemini-2.5-flash', baseUrl: '' },
    openai: { model: 'gpt-4o', baseUrl: 'https://api.openai.com/v1' },
    anthropic: { model: 'claude-3-7-sonnet-20250219', baseUrl: 'https://api.anthropic.com/v1' },
    groq: { model: 'llama-3.3-70b-versatile', baseUrl: 'https://api.groq.com/openai/v1' },
    deepseek: { model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com' },
    meta: { model: 'llama-3.3-70b-versatile', baseUrl: 'https://api.groq.com/openai/v1' },
    custom: { model: 'llama3', baseUrl: 'http://localhost:11434/v1' }
  });
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatusMessage, setKeyStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info'; latencyMs?: number } | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem('petardo_ai_config');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.activeProvider && parsed.activeProvider in AI_PROVIDERS) {
            setSelectedProvider(parsed.activeProvider);
          }
          if (parsed.providers) {
            setProviderConfigs(prev => {
              const next = { ...prev };
              for (const key of Object.keys(AI_PROVIDERS) as AiProvider[]) {
                if (parsed.providers[key]) {
                  next[key] = {
                    ...prev[key],
                    ...parsed.providers[key]
                  };
                }
              }
              return next;
            });
          }
        }
      } catch (e) {}
    });

    const handleStorage = () => {
      try {
        const raw = localStorage.getItem('petardo_ai_config');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.activeProvider && parsed.activeProvider in AI_PROVIDERS) {
            setSelectedProvider(parsed.activeProvider);
          }
          if (parsed.providers) {
            setProviderConfigs(prev => ({
              ...prev,
              ...parsed.providers
            }));
          }
        }
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleUpdateProviderField = (field: 'model' | 'baseUrl', value: string) => {
    setProviderConfigs(prev => ({
      ...prev,
      [selectedProvider]: {
        ...prev[selectedProvider],
        [field]: value
      }
    }));
    setKeyStatusMessage(null);
  };

  const handleTestConnection = async () => {
    const current = providerConfigs[selectedProvider];
    const preset = AI_PROVIDERS[selectedProvider];

    setIsTestingKey(true);
    setKeyStatusMessage(null);
    const startTime = Date.now();

    try {
      const res = await fetch('/api/gemini/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Responde únicamente con la palabra OK.',
          action: 'chat',
          provider: selectedProvider,
          model: current.model,
          baseUrl: current.baseUrl
        })
      });

      const data = await res.json();
      const latency = Date.now() - startTime;

      if (res.ok && data.text) {
        // Save provider choice on successful test
        try {
          const updated = {
            activeProvider: selectedProvider,
            providers: providerConfigs
          };
          localStorage.setItem('petardo_ai_config', JSON.stringify(updated));
          window.dispatchEvent(new Event('storage'));
        } catch (e) {}

        setKeyStatusMessage({ 
          text: `¡Conexión exitosa con ${preset.name}! Modelo: "${data.model || current.model}". Respuesta en ${latency}ms.`, 
          type: 'success',
          latencyMs: latency
        });
        onShowToast?.(`¡Conexión con ${preset.name} verificada (${latency}ms)!`, 'success');
      } else {
        const err = data.error || `El proveedor no respondió correctamente (${res.status}).`;
        setKeyStatusMessage({ text: `Error: ${err}`, type: 'error' });
        onShowToast?.(`Error al verificar conexión con ${preset.name}`, 'error');
      }
    } catch (err: any) {
      setKeyStatusMessage({ 
        text: `Error de red al conectar con ${preset.name}: ${err?.message || 'Endpoint inalcanzable'}.`, 
        type: 'error' 
      });
      onShowToast?.(`Error de red al conectar con ${preset.name}`, 'error');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleApplySiteFont = (fontName: string) => {
    const trimmed = fontName.trim();
    if (!trimmed) return;
    setCustomSiteFontInput(trimmed);
    onUpdateSettings({ siteFont: trimmed });
    onShowToast?.(`Fuente de interfaz cambiada a "${trimmed}"`, 'success');
  };

  const handleApplyCodeFont = (fontName: string) => {
    const trimmed = fontName.trim();
    if (!trimmed) return;
    setCustomCodeFontInput(trimmed);
    onUpdateSettings({ codeFont: trimmed });
    onShowToast?.(`Fuente de código cambiada a "${trimmed}"`, 'success');
  };

  const handleReset = () => {
    onResetSettings();
    setCustomSiteFontInput(DEFAULT_SETTINGS.siteFont);
    setCustomCodeFontInput(DEFAULT_SETTINGS.codeFont);
    setResetConfirmOpen(false);
    onShowToast?.('Se han restablecido los ajustes a los valores iniciales', 'info');
  };

  const currentLanguage: AppLanguage = settings.language || 'es';
  const dict = getDictionary(currentLanguage);
  const aiMeta = getLocalizedAiProviderMeta(currentLanguage);
  const secT = getSecurityStrings(currentLanguage);

  const navItems = [
    { id: 'appearance', label: dict.settings.navAppearance, iconName: 'palette' },
    { id: 'typography', label: dict.settings.navTypography, iconName: 'type' },
    { id: 'ai', label: dict.settings.navAi, iconName: 'sparkles' },
    { id: 'editor', label: dict.settings.navEditor, iconName: 'layout-grid' },
    { id: 'security', label: secT.navSecurity, iconName: 'lock' },
    { id: 'account', label: dict.settings.navAccount, iconName: 'user' },
    { id: 'docs', label: dict.settings.navDocs, iconName: 'file-text' },
  ] as const;

  const handleSelectLanguage = (langCode: AppLanguage) => {
    onUpdateSettings({ language: langCode });
    const targetDict = getDictionary(langCode);
    const langInfo = getLanguageOption(langCode);
    onShowToast?.(`${targetDict.settings.languageChangedToast} ${langInfo.nativeName}`, 'info');
  };

  const handleDetectBrowserLanguage = () => {
    const detected = detectBrowserLanguage();
    onUpdateSettings({ language: detected });
    const targetDict = getDictionary(detected);
    const langInfo = getLanguageOption(detected);
    onShowToast?.(`${targetDict.settings.browserDetectedToast}: ${langInfo.nativeName} (${detected.toUpperCase()})`, 'info');
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-300 ${
      isDarkMode ? 'bg-[#0F0F0F] text-zinc-100' : 'bg-white text-[#1E293B]'
    }`}>
      {/* Enterprise Top Header Bar */}
      <header className={`px-6 sm:px-10 py-5 shrink-0 flex items-center justify-between transition-colors ${
        isDarkMode ? 'bg-[#141414]' : 'bg-white'
      }`}>
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full shadow-taskflow-pill transition-all duration-150 cursor-pointer active:scale-[0.96] ${
              isDarkMode 
                ? 'bg-[#181818] hover:bg-[#242424] text-zinc-200' 
                : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-zinc-800'
            }`}
            title="Volver al panel"
            aria-label="Volver"
          >
            <ArrowLeft className="w-4.5 h-4.5 stroke-[2]" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className={isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}>webapp</span>
              <span className={isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}>/</span>
              <span style={{ color: settings.primaryColor }} className="font-semibold">{dict.settings.breadcrumbPreferences}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {dict.settings.title}
            </h1>
          </div>
        </div>

        {/* Right Header Status / Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors cursor-pointer shadow-taskflow-pill ${
              isDarkMode 
                ? 'bg-[#181818] hover:bg-[#242424] text-zinc-300' 
                : 'bg-[#F8FAFC] hover:bg-[#F1F5F9] text-zinc-700'
            }`}
            title={dict.settings.resetValues}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">{dict.settings.resetValues}</span>
          </button>
        </div>
      </header>

      {/* Main Settings Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col lg:flex-row lg:items-start gap-8">
          
          {/* Left Category Navigation Rail */}
          <aside className="lg:w-68 shrink-0 pt-6 lg:py-8 lg:sticky lg:top-0 lg:self-start">
            <div className="space-y-1.5">
              <p className={`text-xs font-bold uppercase tracking-wider px-3 mb-2.5 ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                {dict.settings.categories}
              </p>
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    style={{ borderRadius: '5rem' }}
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-[5rem] text-sm font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? isDarkMode 
                          ? 'bg-[#181818] text-white shadow-taskflow-card' 
                          : 'bg-[#F8FAFC] text-zinc-900 shadow-taskflow-card'
                        : isDarkMode
                          ? 'text-zinc-400 hover:bg-[#181818] hover:text-zinc-200'
                          : 'text-zinc-600 hover:bg-[#F8FAFC] hover:text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <AppIcon 
                        name={item.iconName} 
                        pack={settings.iconPack || 'meteor'} 
                        className="w-4.5 h-4.5 shrink-0" 
                        style={{ color: isActive ? settings.primaryColor : undefined }}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && (
                      <div 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: settings.primaryColor }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Main Settings Body List */}
          <main className="flex-1 min-w-0 py-6 lg:py-8 space-y-10">

            {/* SECTION 1: APARIENCIA E IDIOMA */}
            {activeSection === 'appearance' && (
              <section className="space-y-3.5">
                <div className="px-1">
                  <h2 className="text-lg font-bold tracking-tight">{dict.settings.appearanceTitle}</h2>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                    {dict.settings.appearanceDesc}
                  </p>
                </div>

                {/* Grouped List Container */}
                <div className={`rounded-[28px] [corner-shape:squircle] shadow-taskflow-card divide-y overflow-hidden ${
                  isDarkMode 
                    ? 'bg-[#181818] divide-white/[0.04]' 
                    : 'bg-[#F8FAFC] divide-zinc-200/50'
                }`}>

                  {/* Row: Idioma de la Aplicación (i18n) */}
                  <div className="p-6 sm:p-7 flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4.5 h-4.5" style={{ color: settings.primaryColor }} />
                          <span className="text-base font-semibold">{dict.settings.languageTitle}</span>
                        </div>
                        <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {dict.settings.languageDesc}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleDetectBrowserLanguage}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 self-start sm:self-center ${
                          isDarkMode
                            ? 'bg-[#242424] hover:bg-[#2E2E2E] text-zinc-200'
                            : 'bg-white hover:bg-slate-100 text-slate-800 shadow-taskflow-pill'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" style={{ color: settings.primaryColor }} />
                        <span>{dict.settings.detectBrowserLanguage}</span>
                      </button>
                    </div>

                    {/* Grid of 10 Supported Languages */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = currentLanguage === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleSelectLanguage(lang.code)}
                            className={`flex flex-col items-start justify-between p-3.5 rounded-[20px] [corner-shape:squircle] text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'text-white scale-[1.01]'
                                : isDarkMode
                                  ? 'bg-[#1F1F22] hover:bg-[#28282C] text-zinc-200'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 shadow-taskflow-pill'
                            }`}
                            style={{
                              backgroundColor: isSelected ? settings.primaryColor : undefined,
                            }}
                          >
                            <div className="w-full flex items-center justify-between gap-2 mb-2">
                              <span className="text-xl leading-none">{lang.flag}</span>
                              <span
                                className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : isDarkMode
                                      ? 'bg-zinc-800 text-zinc-400'
                                      : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {lang.code}
                              </span>
                            </div>
                            <div className="min-w-0 w-full">
                              <div className="text-xs sm:text-sm font-bold truncate">
                                {lang.nativeName}
                              </div>
                              <div
                                className={`text-[10px] truncate mt-0.5 ${
                                  isSelected
                                    ? 'text-white/80'
                                    : isDarkMode
                                      ? 'text-zinc-500'
                                      : 'text-slate-400'
                                }`}
                              >
                                {lang.spanishName}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row: Modo de Tema */}
                  <div className="p-6 sm:p-7 flex flex-col gap-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">{dict.settings.themeTitle}</span>
                      </div>
                    </div>

                    {/* Visual Theme Preview Cards */}
                    <div className="grid grid-cols-3 gap-3.5 sm:gap-5 max-w-xl">
                      {/* Modo Claro */}
                      <button
                        id="theme-option-light"
                        type="button"
                        onClick={() => onUpdateSettings({ themeMode: 'light' })}
                        className="group flex flex-col items-start text-left cursor-pointer focus:outline-none"
                      >
                        <div
                          className={`relative w-full aspect-[660/450] rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 ${
                            settings.themeMode === 'light'
                              ? 'scale-[1.02] shadow-sm'
                              : isDarkMode
                                ? 'border border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100'
                                : 'border border-zinc-200 hover:border-zinc-300 opacity-80 hover:opacity-100'
                          }`}
                          style={
                            settings.themeMode === 'light'
                              ? {
                                  border: `2px solid ${settings.primaryColor}`,
                                  boxShadow: `0 0 0 2px ${settings.primaryColor}33`,
                                }
                              : undefined
                          }
                        >
                          <svg width="100%" height="100%" viewBox="0 0 660 450" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
                            <rect width="660" height="450" fill="#F0F0F0"/>
                            <path d="M87 127C87 94.9675 112.967 69 145 69H660V450H145C112.967 450 87 424.033 87 392V127Z" fill="#F8FAFC"/>
                            <rect x="87" y="69" width="158" height="381" rx="58" fill="white"/>
                          </svg>
                        </div>
                        <span
                          className={`text-xs sm:text-sm mt-2 pl-0.5 transition-colors ${
                            settings.themeMode === 'light'
                              ? isDarkMode ? 'text-white font-semibold' : 'text-zinc-900 font-semibold'
                              : isDarkMode ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-800'
                          }`}
                        >
                          {dict.settings.themeLight}
                        </span>
                      </button>

                      {/* Modo Oscuro */}
                      <button
                        id="theme-option-dark"
                        type="button"
                        onClick={() => onUpdateSettings({ themeMode: 'dark' })}
                        className="group flex flex-col items-start text-left cursor-pointer focus:outline-none"
                      >
                        <div
                          className={`relative w-full aspect-[660/450] rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 ${
                            settings.themeMode === 'dark'
                              ? 'scale-[1.02] shadow-sm'
                              : isDarkMode
                                ? 'border border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100'
                                : 'border border-zinc-200 hover:border-zinc-300 opacity-80 hover:opacity-100'
                          }`}
                          style={
                            settings.themeMode === 'dark'
                              ? {
                                  border: `2px solid ${settings.primaryColor}`,
                                  boxShadow: `0 0 0 2px ${settings.primaryColor}33`,
                                }
                              : undefined
                          }
                        >
                          <svg width="100%" height="100%" viewBox="0 0 660 450" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
                            <rect width="660" height="450" fill="#1A1A1A"/>
                            <path d="M87 127C87 94.9675 112.967 69 145 69H660V450H145C112.967 450 87 424.033 87 392V127Z" fill="#0F0F0F"/>
                            <rect x="87" y="69" width="158" height="381" rx="58" fill="#141414"/>
                          </svg>
                        </div>
                        <span
                          className={`text-xs sm:text-sm mt-2 pl-0.5 transition-colors ${
                            settings.themeMode === 'dark'
                              ? isDarkMode ? 'text-white font-semibold' : 'text-zinc-900 font-semibold'
                              : isDarkMode ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-800'
                          }`}
                        >
                          {dict.settings.themeDark}
                        </span>
                      </button>

                      {/* Modo Sistema */}
                      <button
                        id="theme-option-system"
                        type="button"
                        onClick={() => onUpdateSettings({ themeMode: 'system' })}
                        className="group flex flex-col items-start text-left cursor-pointer focus:outline-none"
                      >
                        <div
                          className={`relative w-full aspect-[660/450] rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-200 ${
                            settings.themeMode === 'system'
                              ? 'scale-[1.02] shadow-sm'
                              : isDarkMode
                                ? 'border border-zinc-800 hover:border-zinc-700 opacity-75 hover:opacity-100'
                                : 'border border-zinc-200 hover:border-zinc-300 opacity-80 hover:opacity-100'
                          }`}
                          style={
                            settings.themeMode === 'system'
                              ? {
                                  border: `2px solid ${settings.primaryColor}`,
                                  boxShadow: `0 0 0 2px ${settings.primaryColor}33`,
                                }
                              : undefined
                          }
                        >
                          <svg width="100%" height="100%" viewBox="0 0 660 450" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
                            <g clipPath="url(#clip0_theme_system)">
                              <rect width="660" height="450" fill="#1A1A1A"/>
                              <path d="M87 127C87 94.9675 112.967 69 145 69H660V450H145C112.967 450 87 424.033 87 392V127Z" fill="#0F0F0F"/>
                              <rect x="87" y="69" width="158" height="381" rx="58" fill="#141414"/>
                              <g clipPath="url(#clip1_theme_system)">
                                <rect width="336" height="450" fill="#F0F0F0"/>
                                <path d="M87 127C87 94.9675 112.967 69 145 69H660V450H145C112.967 450 87 424.033 87 392V127Z" fill="#F8FAFC"/>
                                <rect x="87" y="69" width="158" height="381" rx="58" fill="white"/>
                              </g>
                            </g>
                            <defs>
                              <clipPath id="clip0_theme_system">
                                <rect width="660" height="450" fill="white"/>
                              </clipPath>
                              <clipPath id="clip1_theme_system">
                                <rect width="336" height="450" fill="white"/>
                              </clipPath>
                            </defs>
                          </svg>
                        </div>
                        <span
                          className={`text-xs sm:text-sm mt-2 pl-0.5 transition-colors ${
                            settings.themeMode === 'system'
                              ? isDarkMode ? 'text-white font-semibold' : 'text-zinc-900 font-semibold'
                              : isDarkMode ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-800'
                          }`}
                        >
                          {dict.settings.themeSystem}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Row: Color Principal de Acento */}
                  <div className="p-5 sm:p-6 flex flex-col gap-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-base font-semibold">{dict.settings.accentColorTitle}</span>
                      </div>

                      {/* Hex input & native color picker */}
                      <div className="flex items-center gap-2.5 self-start sm:self-center">
                        <label 
                          className="w-9 h-9 rounded-full cursor-pointer relative overflow-hidden transition-transform hover:scale-105"
                          style={{ backgroundColor: settings.primaryColor }}
                          title="Selector de color personalizado"
                        >
                          <input
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => onUpdateSettings({ primaryColor: e.target.value })}
                            className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                            aria-label="Selector de color"
                          />
                        </label>
                        <input
                          type="text"
                          value={settings.primaryColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                              onUpdateSettings({ primaryColor: val });
                            }
                          }}
                          className={`w-28 px-3 py-1.5 text-sm font-mono rounded-lg focus:outline-none uppercase ${
                            isDarkMode ? 'bg-[#202020] text-zinc-100' : 'bg-white text-zinc-900 shadow-taskflow-pill'
                          }`}
                          placeholder="#006FFF"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row: Disposición de notas por defecto */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-base font-semibold">{dict.settings.notesLayoutTitle}</span>
                    </div>

                    <div className={`inline-flex p-1.5 rounded-full shadow-taskflow-pill shrink-0 ${
                      isDarkMode ? 'bg-[#141414]' : 'bg-white'
                    }`}>
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ listLayout: 'grid' })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          settings.listLayout === 'grid'
                            ? (isDarkMode ? 'bg-[#242424] text-white shadow-taskflow-pill' : 'bg-zinc-100 text-zinc-900 shadow-taskflow-pill')
                            : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span>{dict.settings.layoutGrid}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ listLayout: 'compact' })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          settings.listLayout === 'compact'
                            ? (isDarkMode ? 'bg-[#242424] text-white shadow-taskflow-pill' : 'bg-zinc-100 text-zinc-900 shadow-taskflow-pill')
                            : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        <List className="w-4 h-4" />
                        <span>{dict.settings.layoutCompact}</span>
                      </button>
                    </div>
                  </div>

                </div>
              </section>
            )}

            {/* SECTION 2: TIPOGRAFÍA */}
            {activeSection === 'typography' && (
              <section className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold tracking-tight">{dict.settings.typographyTitle}</h2>
                    <div className="relative group inline-flex items-center">
                      <button
                        type="button"
                        className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-help rounded-full focus:outline-none"
                        aria-label={dict.settings.typographyTitle}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block group-focus-within:block z-30 w-72 p-2.5 rounded-xl [corner-shape:squircle] text-xs font-normal text-white bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md shadow-taskflow-pill pointer-events-none transition-all">
                        {dict.settings.typographyTooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900/95 dark:border-t-zinc-800/95" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grouped List Container */}
                <div className={`rounded-[28px] [corner-shape:squircle] shadow-taskflow-card divide-y overflow-hidden ${
                  isDarkMode 
                    ? 'bg-[#181818] divide-white/[0.04]' 
                    : 'bg-[#F8FAFC] divide-zinc-200/50'
                }`}>

                  {/* Row: Fuente del Sitio */}
                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <span className="text-base font-semibold">{dict.settings.siteFontTitle}</span>
                      </div>

                      {/* Custom font input with Datalist */}
                      <div className="flex items-center gap-2 w-full lg:w-96 shrink-0">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            list="google-site-fonts-list"
                            value={customSiteFontInput}
                            onChange={(e) => setCustomSiteFontInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleApplySiteFont(customSiteFontInput);
                            }}
                            placeholder={dict.settings.siteFontPlaceholder}
                            className={`w-full px-6 py-3.5 text-sm rounded-full focus:outline-none transition-colors ${
                              isDarkMode ? 'bg-[#141414] text-zinc-100' : 'bg-white text-zinc-900 shadow-taskflow-pill'
                            }`}
                          />
                          <datalist id="google-site-fonts-list">
                            {ALL_SUGGESTED_FONTS.map(f => (
                              <option key={f} value={f} />
                            ))}
                          </datalist>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplySiteFont(customSiteFontInput)}
                          className="px-8 py-3.5 text-sm font-semibold text-white rounded-full transition-transform active:scale-95 hover:opacity-90 cursor-pointer shrink-0 shadow-taskflow-pill"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          {dict.settings.applyBtn}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row: Fuente de Código Monoespaciada */}
                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold">{dict.settings.codeFontTitle}</span>
                          <div className="relative group inline-flex items-center">
                            <button
                              type="button"
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-help rounded-full focus:outline-none"
                              aria-label={dict.settings.codeFontTitle}
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block group-focus-within:block z-30 w-72 p-2.5 rounded-xl [corner-shape:squircle] text-xs font-normal text-white bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md shadow-taskflow-pill pointer-events-none transition-all">
                              {dict.settings.codeFontTooltip}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900/95 dark:border-t-zinc-800/95" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Custom font input */}
                      <div className="flex items-center gap-2 w-full lg:w-96 shrink-0">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            list="google-code-fonts-list"
                            value={customCodeFontInput}
                            onChange={(e) => setCustomCodeFontInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleApplyCodeFont(customCodeFontInput);
                            }}
                            placeholder={dict.settings.codeFontPlaceholder}
                            className={`w-full px-6 py-3.5 text-sm font-mono rounded-full focus:outline-none transition-colors ${
                              isDarkMode ? 'bg-[#141414] text-zinc-100' : 'bg-white text-zinc-900 shadow-taskflow-pill'
                            }`}
                          />
                          <datalist id="google-code-fonts-list">
                            {POPULAR_CODE_FONTS.map(f => (
                              <option key={f} value={f} />
                            ))}
                          </datalist>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyCodeFont(customCodeFontInput)}
                          className="px-8 py-3.5 text-sm font-semibold text-white rounded-full transition-transform active:scale-95 hover:opacity-90 cursor-pointer shrink-0 shadow-taskflow-pill"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          {dict.settings.applyBtn}
                        </button>
                      </div>
                    </div>

                    {/* Live code snippet preview */}
                    <div 
                      className={`p-5 rounded-2xl text-sm transition-colors ${
                        isDarkMode ? 'bg-[#141414] text-blue-300' : 'bg-white text-blue-800 shadow-taskflow-pill'
                      }`}
                      style={{ fontFamily: `"${settings.codeFont}", monospace` }}
                    >
                      <code>const editor = new MarkdownEditor(&#123; font: &quot;{settings.codeFont}&quot;, googleFonts: true &#125;);</code>
                    </div>
                  </div>

                  {/* Row: Pack de Iconos del Sistema */}
                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold">{dict.settings.iconPackTitle}</span>
                          <div className="relative group inline-flex items-center">
                            <button
                              type="button"
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-help rounded-full focus:outline-none"
                              aria-label={dict.settings.iconPackTitle}
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block group-focus-within:block z-30 w-72 p-2.5 rounded-xl [corner-shape:squircle] text-xs font-normal text-white bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md shadow-taskflow-pill pointer-events-none transition-all">
                              {dict.settings.iconPackTooltip}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900/95 dark:border-t-zinc-800/95" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Custom Icon Pack input */}
                      <div className="flex items-center gap-2 w-full lg:w-96 shrink-0">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            list="icon-packs-list"
                            value={settings.iconPack || 'meteor'}
                            onChange={(e) => onUpdateSettings({ iconPack: e.target.value as any })}
                            placeholder={dict.settings.iconPackPlaceholder}
                            className={`w-full px-6 py-3.5 text-sm rounded-full focus:outline-none transition-colors ${
                              isDarkMode ? 'bg-[#141414] text-zinc-100' : 'bg-white text-zinc-900 shadow-taskflow-pill'
                            }`}
                          />
                          <datalist id="icon-packs-list">
                            {ICON_PACKS.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </datalist>
                        </div>
                        <button
                          type="button"
                          className="px-8 py-3.5 text-sm font-semibold text-white rounded-full transition-transform active:scale-95 hover:opacity-90 cursor-pointer shrink-0 shadow-taskflow-pill"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          {dict.settings.applyBtn}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row: Pack de Emojis */}
                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">{dict.settings.emojiPackTitle}</span>
                        <div className="relative group inline-flex items-center">
                          <button
                            type="button"
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-help rounded-full focus:outline-none"
                            aria-label={dict.settings.emojiPackTitle}
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block group-focus-within:block z-30 w-72 p-2.5 rounded-xl [corner-shape:squircle] text-xs font-normal text-white bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md shadow-taskflow-pill pointer-events-none transition-all">
                            {dict.settings.emojiPackTooltip}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900/95 dark:border-t-zinc-800/95" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emoji Pack Selection Grid (Toss Face vs Sistema) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl">
                      {EMOJI_PACKS.map(pack => {
                        const isSelected = (settings.emojiPack || 'system') === pack.id;
                        const packName = pack.id === 'system' ? dict.settings.systemEmojisName : dict.settings.tossfaceEmojisName;
                        const packBadge = pack.id === 'system' ? dict.settings.systemEmojisBadge : undefined;
                        const packDesc = pack.id === 'system' ? dict.settings.systemEmojisDesc : dict.settings.tossfaceEmojisDesc;
                        return (
                          <button
                            key={pack.id}
                            type="button"
                            onClick={() => {
                              onUpdateSettings({ emojiPack: pack.id });
                              onShowToast?.(`${dict.settings.emojiPackTitle}: "${packName}"`, 'success');
                            }}
                            className={`p-4.5 sm:p-5 rounded-2xl [corner-shape:squircle] text-left transition-all cursor-pointer flex flex-col justify-between gap-3 border ${
                              isSelected
                                ? (isDarkMode 
                                    ? 'bg-[#202020] border-blue-500 shadow-taskflow-pill' 
                                    : 'bg-white border-blue-500 shadow-taskflow-pill ring-2 ring-blue-500/20')
                                : (isDarkMode 
                                    ? 'bg-[#141414] border-transparent hover:bg-[#1e1e1e] text-zinc-300' 
                                    : 'bg-white/70 border-transparent hover:bg-white text-zinc-700 shadow-taskflow-pill')
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm sm:text-base font-bold tracking-tight">
                                  {packName}
                                </span>
                                {packBadge && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-500/15 text-blue-500">
                                    {packBadge}
                                  </span>
                                )}
                              </div>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white' : 'border border-zinc-400/40'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>

                            {/* Live sample emojis with respective font style */}
                            <div className="flex items-center gap-2 pt-1">
                              {pack.previewEmojis.map((em, idx) => (
                                <div 
                                  key={idx}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-lg sm:text-xl select-none ${
                                    isDarkMode ? 'bg-[#101010]' : 'bg-zinc-100'
                                  }`}
                                  style={{
                                    fontFamily: pack.id === 'tossface' 
                                      ? '"Tossface", "Apple Color Emoji", sans-serif' 
                                      : 'system-ui, -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
                                  }}
                                >
                                  {em}
                                </div>
                              ))}
                            </div>

                            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {packDesc}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row: Colores de Texto de las Notas (Títulos y Párrafos en Modo Claro / Oscuro) */}
                  <div className="p-6 sm:p-7 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Palette className="w-5 h-5" style={{ color: settings.primaryColor }} />
                          <span className="text-base font-bold">{dict.settings.noteColorsTitle || 'Colores del texto de las notas'}</span>
                        </div>
                        <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {dict.settings.noteColorsDesc || 'Personaliza exclusivamente el color de los títulos y párrafos dentro de tus notas, tanto para el modo claro como para el modo oscuro.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSettings({
                            noteParagraphColorLight: '#0F172A',
                            noteParagraphColorDark: '#F4F4F5',
                            noteHeadingColorLight: '#09090B',
                            noteHeadingColorDark: '#FAFAFA'
                          });
                          onShowToast?.(dict.settings.resetNoteColors || 'Colores de notas restablecidos', 'info');
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 self-start sm:self-center ${
                          isDarkMode
                            ? 'bg-[#242424] hover:bg-[#2E2E2E] text-zinc-300'
                            : 'bg-white hover:bg-slate-100 text-slate-700 shadow-taskflow-pill'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{dict.settings.resetNoteColors || 'Restablecer colores'}</span>
                      </button>
                    </div>

                    {/* Color Selectors Grid (Organized by Theme Mode: Modo Claro & Modo Oscuro) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Caja 1: Modo Claro (Títulos y Párrafos) */}
                      <div className={`p-5 rounded-2xl [corner-shape:squircle] border flex flex-col gap-4 ${
                        isDarkMode ? 'bg-[#141414] border-white/[0.06]' : 'bg-white border-zinc-200/80 shadow-taskflow-pill'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">☀️</span>
                            <span className="text-sm font-bold tracking-tight">
                              {dict.settings.lightModeColor || 'Modo claro'}
                            </span>
                          </div>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                            isDarkMode ? 'bg-zinc-800/80 text-zinc-300' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}>
                            Tema claro
                          </span>
                        </div>

                        {/* Títulos en Modo Claro */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold opacity-85">
                              {dict.settings.headingsColorTitle || 'Color de los títulos (H1, H2, H3)'}
                            </span>
                            <span className="font-mono text-[11px] uppercase font-bold opacity-70">
                              {settings.noteHeadingColorLight || '#09090B'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <label 
                              className="w-9 h-9 rounded-full cursor-pointer relative overflow-hidden transition-transform hover:scale-105 shrink-0 ring-1 ring-black/10 shadow-sm"
                              style={{ backgroundColor: settings.noteHeadingColorLight || '#09090B' }}
                              title="Selector de color para títulos en modo claro"
                            >
                              <input
                                type="color"
                                value={settings.noteHeadingColorLight || '#09090B'}
                                onChange={(e) => onUpdateSettings({ noteHeadingColorLight: e.target.value })}
                                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                              />
                            </label>
                            <input
                              type="text"
                              value={settings.noteHeadingColorLight || '#09090B'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                  onUpdateSettings({ noteHeadingColorLight: val });
                                }
                              }}
                              className={`w-36 px-3 py-1.5 text-xs font-mono rounded-lg focus:outline-none uppercase border ${
                                isDarkMode ? 'bg-[#202020] border-zinc-700 text-zinc-100' : 'bg-slate-100 border-zinc-200 text-zinc-900'
                              }`}
                              placeholder="#09090B"
                            />
                          </div>
                        </div>

                        {/* Párrafos en Modo Claro */}
                        <div className="space-y-2 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold opacity-85">
                              {dict.settings.paragraphsColorTitle || 'Color de los párrafos (Texto principal)'}
                            </span>
                            <span className="font-mono text-[11px] uppercase font-bold opacity-70">
                              {settings.noteParagraphColorLight || '#0F172A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <label 
                              className="w-9 h-9 rounded-full cursor-pointer relative overflow-hidden transition-transform hover:scale-105 shrink-0 ring-1 ring-black/10 shadow-sm"
                              style={{ backgroundColor: settings.noteParagraphColorLight || '#0F172A' }}
                              title="Selector de color para párrafos en modo claro"
                            >
                              <input
                                type="color"
                                value={settings.noteParagraphColorLight || '#0F172A'}
                                onChange={(e) => onUpdateSettings({ noteParagraphColorLight: e.target.value })}
                                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                              />
                            </label>
                            <input
                              type="text"
                              value={settings.noteParagraphColorLight || '#0F172A'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                  onUpdateSettings({ noteParagraphColorLight: val });
                                }
                              }}
                              className={`w-36 px-3 py-1.5 text-xs font-mono rounded-lg focus:outline-none uppercase border ${
                                isDarkMode ? 'bg-[#202020] border-zinc-700 text-zinc-100' : 'bg-slate-100 border-zinc-200 text-zinc-900'
                              }`}
                              placeholder="#0F172A"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Caja 2: Modo Oscuro (Títulos y Párrafos) */}
                      <div className={`p-5 rounded-2xl [corner-shape:squircle] border flex flex-col gap-4 ${
                        isDarkMode ? 'bg-[#141414] border-white/[0.06]' : 'bg-white border-zinc-200/80 shadow-taskflow-pill'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🌙</span>
                            <span className="text-sm font-bold tracking-tight">
                              {dict.settings.darkModeColor || 'Modo oscuro'}
                            </span>
                          </div>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                            isDarkMode ? 'bg-zinc-800/80 text-zinc-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                          }`}>
                            Tema oscuro
                          </span>
                        </div>

                        {/* Títulos en Modo Oscuro */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold opacity-85">
                              {dict.settings.headingsColorTitle || 'Color de los títulos (H1, H2, H3)'}
                            </span>
                            <span className="font-mono text-[11px] uppercase font-bold opacity-70">
                              {settings.noteHeadingColorDark || '#FAFAFA'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <label 
                              className="w-9 h-9 rounded-full cursor-pointer relative overflow-hidden transition-transform hover:scale-105 shrink-0 ring-1 ring-white/10 shadow-sm"
                              style={{ backgroundColor: settings.noteHeadingColorDark || '#FAFAFA' }}
                              title="Selector de color para títulos en modo oscuro"
                            >
                              <input
                                type="color"
                                value={settings.noteHeadingColorDark || '#FAFAFA'}
                                onChange={(e) => onUpdateSettings({ noteHeadingColorDark: e.target.value })}
                                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                              />
                            </label>
                            <input
                              type="text"
                              value={settings.noteHeadingColorDark || '#FAFAFA'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                  onUpdateSettings({ noteHeadingColorDark: val });
                                }
                              }}
                              className={`w-36 px-3 py-1.5 text-xs font-mono rounded-lg focus:outline-none uppercase border ${
                                isDarkMode ? 'bg-[#202020] border-zinc-700 text-zinc-100' : 'bg-slate-100 border-zinc-200 text-zinc-900'
                              }`}
                              placeholder="#FAFAFA"
                            />
                          </div>
                        </div>

                        {/* Párrafos en Modo Oscuro */}
                        <div className="space-y-2 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold opacity-85">
                              {dict.settings.paragraphsColorTitle || 'Color de los párrafos (Texto principal)'}
                            </span>
                            <span className="font-mono text-[11px] uppercase font-bold opacity-70">
                              {settings.noteParagraphColorDark || '#F4F4F5'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <label 
                              className="w-9 h-9 rounded-full cursor-pointer relative overflow-hidden transition-transform hover:scale-105 shrink-0 ring-1 ring-white/10 shadow-sm"
                              style={{ backgroundColor: settings.noteParagraphColorDark || '#F4F4F5' }}
                              title="Selector de color para párrafos en modo oscuro"
                            >
                              <input
                                type="color"
                                value={settings.noteParagraphColorDark || '#F4F4F5'}
                                onChange={(e) => onUpdateSettings({ noteParagraphColorDark: e.target.value })}
                                className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                              />
                            </label>
                            <input
                              type="text"
                              value={settings.noteParagraphColorDark || '#F4F4F5'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                  onUpdateSettings({ noteParagraphColorDark: val });
                                }
                              }}
                              className={`w-36 px-3 py-1.5 text-xs font-mono rounded-lg focus:outline-none uppercase border ${
                                isDarkMode ? 'bg-[#202020] border-zinc-700 text-zinc-100' : 'bg-slate-100 border-zinc-200 text-zinc-900'
                              }`}
                              placeholder="#F4F4F5"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dual Live Preview */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                        {dict.settings.previewTitle || 'Previsualización en vivo'}
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Light preview box */}
                        <div className="p-5 rounded-2xl bg-white text-zinc-900 border border-zinc-200/80 shadow-taskflow-pill space-y-2">
                          <div className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 inline-block mb-1">
                            ☀️ Modo Claro
                          </div>
                          <h4 
                            className="text-lg font-bold tracking-tight"
                            style={{ color: settings.noteHeadingColorLight || '#09090B' }}
                          >
                            Reunión de Estrategia 2026
                          </h4>
                          <p 
                            className="text-sm leading-relaxed"
                            style={{ color: settings.noteParagraphColorLight || '#0F172A' }}
                          >
                            Este es un párrafo de ejemplo en tu nota. Los colores seleccionados se aplicarán únicamente al texto dentro de tus notas en Webapp.
                          </p>
                        </div>

                        {/* Dark preview box */}
                        <div className="p-5 rounded-2xl bg-[#121212] text-zinc-100 border border-white/[0.08] shadow-sm space-y-2">
                          <div className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 inline-block mb-1">
                            🌙 Modo Oscuro
                          </div>
                          <h4 
                            className="text-lg font-bold tracking-tight"
                            style={{ color: settings.noteHeadingColorDark || '#FAFAFA' }}
                          >
                            Reunión de Estrategia 2026
                          </h4>
                          <p 
                            className="text-sm leading-relaxed"
                            style={{ color: settings.noteParagraphColorDark || '#F4F4F5' }}
                          >
                            Este es un párrafo de ejemplo en tu nota. Los colores seleccionados se aplicarán únicamente al texto dentro de tus notas en Webapp.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </section>
            )}

            {/* SECTION: INTELIGENCIA ARTIFICIAL MULTIMODELO */}
            {activeSection === 'ai' && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 flex-wrap">
                      <span>{dict.settings.aiTitle}</span>
                      <div className="relative group inline-flex items-center">
                        <button
                          type="button"
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-help rounded-full focus:outline-none"
                          aria-label={dict.settings.aiTitle}
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block group-focus-within:block z-30 w-72 p-2.5 rounded-xl [corner-shape:squircle] text-xs font-normal text-white bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md shadow-taskflow-pill pointer-events-none transition-all">
                          {dict.settings.aiTooltip}
                          <div className="absolute top-full left-4 border-4 border-transparent border-t-zinc-900/95 dark:border-t-zinc-800/95" />
                        </div>
                      </div>
                    </h2>
                  </div>
                </div>

                <div className={`rounded-[28px] [corner-shape:squircle] shadow-taskflow-card divide-y overflow-hidden ${
                  isDarkMode 
                    ? 'bg-[#181818] divide-white/[0.04]' 
                    : 'bg-[#F8FAFC] divide-zinc-200/50'
                }`}>
                  {/* Activar / Desactivar Asistente de IA (Únicamente si hay API Key configurada) */}
                  {configuredAiProviders[selectedProvider] && (
                    <div className="p-6 sm:p-7 flex items-center justify-between gap-4">
                      <div className="max-w-xl">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-semibold">{aiMeta.aiToggleTitle}</span>
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                              settings.aiEnabled !== false
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : isDarkMode
                                  ? 'bg-zinc-800 text-zinc-400'
                                  : 'bg-zinc-200/80 text-zinc-600'
                            }`}
                          >
                            {settings.aiEnabled !== false ? dict.settings.activeBadge : secT.e2eeStatusInactive}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {aiMeta.aiToggleDesc}
                        </p>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !(settings.aiEnabled !== false);
                          onUpdateSettings({ aiEnabled: nextVal });
                          onShowToast?.(nextVal ? aiMeta.aiEnabledToast : aiMeta.aiDisabledToast, 'info');
                        }}
                        className={`w-13 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                          settings.aiEnabled !== false ? '' : (isDarkMode ? 'bg-[#141414]' : 'bg-zinc-200')
                        }`}
                        style={{
                          backgroundColor: settings.aiEnabled !== false ? settings.primaryColor : undefined
                        }}
                        aria-label={aiMeta.aiToggleTitle}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow-taskflow-pill transition-transform duration-200 ${
                            settings.aiEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  )}

                  {/* Selector de Proveedores de IA */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <label className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                      {dict.settings.aiSelectProvider}
                    </label>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {(Object.keys(AI_PROVIDERS) as AiProvider[]).map((pKey) => {
                        const preset = AI_PROVIDERS[pKey];
                        const isSelected = selectedProvider === pKey;
                        const providerDisplayName = pKey === 'custom' ? aiMeta.customProviderName : preset.name;
                        
                        const iconMap: Record<AiProvider, string> = {
                          gemini: 'google-gemini',
                          openai: 'openai',
                          anthropic: 'claude',
                          groq: 'robot',
                          deepseek: 'robot',
                          meta: 'meta',
                          custom: 'robot'
                        };

                        return (
                          <button
                            key={pKey}
                            type="button"
                            onClick={() => {
                              setSelectedProvider(pKey);
                              setKeyStatusMessage(null);
                              try {
                                const updated = {
                                  activeProvider: pKey,
                                  providers: providerConfigs
                                };
                                localStorage.setItem('petardo_ai_config', JSON.stringify(updated));
                                window.dispatchEvent(new Event('storage'));
                              } catch {}
                            }}
                            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all cursor-pointer border ${
                              isSelected
                                ? isDarkMode
                                  ? 'bg-[#202020] border-blue-500/50 text-white shadow-md'
                                  : 'bg-white border-blue-500/50 text-zinc-900 shadow-taskflow-card'
                                : isDarkMode
                                  ? 'bg-[#141414] hover:bg-[#1C1C1C] border-white/[0.04] text-zinc-400'
                                  : 'bg-white hover:bg-zinc-50 border-black/[0.04] text-zinc-600 shadow-taskflow-pill'
                            }`}
                            style={{
                              borderColor: isSelected ? settings.primaryColor : undefined
                            }}
                          >
                            <AppIcon 
                              name={iconMap[pKey]} 
                              pack="meteor" 
                              className="w-4.5 h-4.5" 
                            />
                            <span className="text-sm font-bold truncate">
                              {providerDisplayName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Panel de Configuración del Proveedor Seleccionado */}
                  <div className="p-6 sm:p-7 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold flex items-center gap-2">
                          <span>{dict.settings.aiModelsTitle}</span>
                          <div className="relative group inline-flex items-center">
                            <button
                              type="button"
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-help rounded-full focus:outline-none"
                              aria-label={dict.settings.aiModelsTitle}
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block group-focus-within:block z-30 w-72 p-2.5 rounded-xl [corner-shape:squircle] text-xs font-normal text-white bg-zinc-900/95 dark:bg-zinc-800/95 backdrop-blur-md shadow-taskflow-pill pointer-events-none transition-all">
                              {aiMeta.providerDescriptions[selectedProvider] || AI_PROVIDERS[selectedProvider].description}
                              <div className="absolute top-full left-4 border-4 border-transparent border-t-zinc-900/95 dark:border-t-zinc-800/95" />
                            </div>
                          </div>
                        </h3>
                      </div>
                    </div>

                    {/* Selector y ajuste de Modelo */}
                    <div className="space-y-6">
                      {/* Base URL (Restored for Meta/Custom) */}
                      {(selectedProvider === 'custom' || selectedProvider === 'meta') && (
                        <div className="space-y-2">
                          <label className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                            {dict.settings.aiBaseUrlLabel}
                          </label>
                          <input
                            type="text"
                            value={providerConfigs[selectedProvider].baseUrl}
                            onChange={(e) => handleUpdateProviderField('baseUrl', e.target.value)}
                            placeholder="http://localhost:11434/v1"
                            className={`w-full px-5 py-3 text-sm font-mono rounded-full focus:outline-none transition-colors ${
                              isDarkMode 
                                ? 'bg-[#141414] text-zinc-100 placeholder-zinc-500' 
                                : 'bg-white text-zinc-900 placeholder-zinc-400 shadow-taskflow-pill'
                            }`}
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                            {dict.settings.aiSelectedModelLabel}
                          </label>
                        </div>

                        <input
                          type="text"
                          value={providerConfigs[selectedProvider].model}
                          onChange={(e) => handleUpdateProviderField('model', e.target.value)}
                          placeholder={dict.settings.aiModelPlaceholder}
                          className={`w-full px-5 py-3 text-sm font-mono rounded-full focus:outline-none transition-colors ${
                            isDarkMode 
                              ? 'bg-[#141414] text-zinc-100 placeholder-zinc-500' 
                              : 'bg-white text-zinc-900 placeholder-zinc-400 shadow-taskflow-pill'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Connection Test */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {dict.settings.aiConnectionStatus}
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleTestConnection}
                          disabled={isTestingKey}
                          className={`px-8 py-3 text-sm font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-taskflow-pill ${
                            isDarkMode 
                              ? 'bg-[#141414] hover:bg-[#202020] text-zinc-200' 
                              : 'bg-white hover:bg-zinc-100 text-zinc-800'
                          }`}
                          style={{ border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)' }}
                          title={dict.settings.aiTestConnectionBtn}
                        >
                          <Zap className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin text-amber-500' : 'text-amber-500'}`} />
                          <span>{isTestingKey ? dict.settings.aiTestingBtn : dict.settings.aiTestConnectionBtn}</span>
                        </button>

                        <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {dict.settings.aiEnvConfigNote}
                        </p>
                      </div>

                      {/* Status Feedback Message */}
                      {keyStatusMessage && (
                        <div className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in duration-200 ${
                          keyStatusMessage.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : keyStatusMessage.type === 'error'
                            ? 'bg-red-500/10 text-red-500'
                            : isDarkMode ? 'bg-[#141414] text-zinc-300' : 'bg-white text-zinc-700 shadow-taskflow-pill'
                        }`}>
                          {keyStatusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                          {keyStatusMessage.type === 'error' && <HelpCircle className="w-4 h-4 shrink-0" />}
                          <span>{keyStatusMessage.text}</span>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </section>
            )}

            {/* SECTION 3: EDITOR Y FLUJO DE NOTAS */}
            {activeSection === 'editor' && (
              <section className="space-y-3.5">
                <div className="px-1">
                  <h2 className="text-lg font-bold tracking-tight">{dict.settings.editorTitle}</h2>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                    {dict.settings.editorDesc}
                  </p>
                </div>

                <div className={`rounded-[28px] [corner-shape:squircle] shadow-taskflow-card divide-y overflow-hidden ${
                  isDarkMode 
                    ? 'bg-[#181818] divide-white/[0.04]' 
                    : 'bg-[#F8FAFC] divide-zinc-200/50'
                }`}>

                  {/* Row: Modo Enfoque (Focus Mode / Máquina de Escribir) */}
                  <div className="p-6 sm:p-7 flex items-center justify-between gap-4">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-semibold">{dict.settings.focusModeTitle}</span>
                        <span
                          className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-lg ${
                            isDarkMode ? 'bg-[#141414] text-zinc-400' : 'bg-white text-zinc-500'
                          }`}
                        >
                          Alt + Z
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                        {dict.settings.focusModeDesc}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ focusMode: !settings.focusMode })}
                      className={`w-13 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                        settings.focusMode ? '' : (isDarkMode ? 'bg-[#141414]' : 'bg-zinc-200')
                      }`}
                      style={{
                        backgroundColor: settings.focusMode ? settings.primaryColor : undefined
                      }}
                      aria-label={dict.settings.focusModeTitle}
                    >
                      <div 
                        className={`w-6 h-6 rounded-full bg-white shadow-taskflow-pill transition-transform duration-200 ${
                          settings.focusMode ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row: Corrector Ortográfico */}
                  <div className="p-6 sm:p-7 flex items-center justify-between gap-4">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">{dict.settings.spellcheckTitle}</span>
                      </div>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                        {dict.settings.spellcheckDesc}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ spellcheck: !settings.spellcheck })}
                      className={`w-13 h-7 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                        settings.spellcheck ? '' : (isDarkMode ? 'bg-[#141414]' : 'bg-zinc-200')
                      }`}
                      style={{
                        backgroundColor: settings.spellcheck ? settings.primaryColor : undefined
                      }}
                      aria-label={dict.settings.spellcheckTitle}
                    >
                      <div 
                        className={`w-6 h-6 rounded-full bg-white shadow-taskflow-pill transition-transform duration-200 ${
                          settings.spellcheck ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row: Criterio de Ordenación */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-base font-semibold">{dict.settings.defaultSortTitle}</span>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                        {dict.settings.defaultSortDesc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <select
                        value={settings.sortBy}
                        onChange={(e) => onUpdateSettings({ sortBy: e.target.value as any })}
                        className={`px-4 py-2 text-sm font-semibold rounded-2xl focus:outline-none cursor-pointer shadow-taskflow-pill ${
                          isDarkMode ? 'bg-[#141414] text-zinc-100' : 'bg-white text-zinc-800'
                        }`}
                      >
                        <option value="modified">{dict.settings.sortModified}</option>
                        <option value="created">{dict.settings.sortCreated}</option>
                        <option value="name">{dict.settings.sortAlpha}</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => onUpdateSettings({ sortOrder: settings.sortOrder === 'asc' ? 'desc' : 'asc' })}
                        className={`px-4 py-2 text-sm font-semibold rounded-2xl transition-colors cursor-pointer shadow-taskflow-pill ${
                          isDarkMode ? 'bg-[#141414] text-zinc-300 hover:bg-[#202020]' : 'bg-white text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {settings.sortOrder === 'asc' ? dict.settings.sortAsc : dict.settings.sortDesc}
                      </button>
                    </div>
                  </div>

                  {/* Row: Metadatos y Frontmatter */}
                  <div className="p-6 sm:p-7 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-base font-semibold">{dict.settings.frontmatterTitle}</span>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                        {dict.settings.frontmatterDesc}
                      </p>
                    </div>
                    <span className="px-3.5 py-1 text-sm font-semibold rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">
                      {dict.settings.activeBadge}
                    </span>
                  </div>

                </div>
              </section>
            )}

            {/* SECTION 3.5: SEGURIDAD E2EE Y EXPORTACIÓN DE NOTAS */}
            {activeSection === 'security' && (
              <section className="space-y-6 animate-in fade-in duration-200">
                <div className="px-1">
                  <h2 className="text-lg font-bold tracking-tight">{secT.sectionTitle}</h2>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                    {secT.sectionDesc}
                  </p>
                </div>

                {/* Live Batch Progress Bar if Encrypting / Decrypting / Exporting */}
                {batchProgress && batchProgress.active && (
                  <div className={`p-5 rounded-[24px] [corner-shape:squircle] space-y-3 ${
                    isDarkMode ? 'bg-[#181818]' : 'bg-[#F8FAFC] shadow-taskflow-card'
                  }`}>
                    <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                      <div className="flex items-center gap-2.5">
                        <RefreshCw className="w-4 h-4 animate-spin" style={{ color: settings.primaryColor }} />
                        <span>{batchProgress.label}...</span>
                      </div>
                      <span className="font-mono">
                        {batchProgress.current} / {batchProgress.total}
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${batchProgress.total > 0 ? Math.round((batchProgress.current / batchProgress.total) * 100) : 100}%`,
                          backgroundColor: settings.primaryColor,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* CARD 1: CIFRADO DE EXTREMO A EXTREMO (ZERO-KNOWLEDGE E2EE) */}
                <div className={`rounded-[28px] [corner-shape:squircle] shadow-taskflow-card divide-y overflow-hidden ${
                  isDarkMode 
                    ? 'bg-[#181818] divide-white/[0.04]' 
                    : 'bg-[#F8FAFC] divide-zinc-200/50'
                }`}>
                  {/* Header Row */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-taskflow-pill"
                        style={{
                          backgroundColor: settings.encryptionEnabled
                            ? 'rgba(16, 185, 129, 0.14)'
                            : `${settings.primaryColor}15`,
                          color: settings.encryptionEnabled ? '#10B981' : settings.primaryColor,
                        }}
                      >
                        <AppIcon
                          name="lock"
                          pack={settings.iconPack || 'meteor'}
                          className="w-6 h-6"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base font-bold">{secT.e2eeTitle}</span>
                          <span
                            className={`px-3 py-0.5 text-xs font-semibold rounded-full ${
                              settings.encryptionEnabled
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : isDarkMode
                                  ? 'bg-zinc-800 text-zinc-400'
                                  : 'bg-zinc-200/80 text-zinc-600'
                            }`}
                          >
                            {settings.encryptionEnabled ? secT.e2eeStatusActive : secT.e2eeStatusInactive}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {secT.e2eeSubtitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Body Row: Setup or Active Controls */}
                  <div className="p-6 sm:p-7 space-y-5">
                    {/* Zero-Knowledge Security Callout */}
                    <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs sm:text-sm ${
                      isDarkMode ? 'bg-[#141414] text-zinc-300' : 'bg-white text-zinc-700 shadow-taskflow-pill'
                    }`}>
                      <KeyRound className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-500" />
                      <div className="space-y-1">
                        <p className="font-medium leading-relaxed">{secT.e2eeZeroKnowledgeNote}</p>
                        {encryptedNotesCount > 0 && (
                          <p className={`text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} font-semibold`}>
                            🔒 {encryptedNotesCount} {encryptedNotesCount === 1 ? dict.settings.docSingular : dict.settings.docPlural} con cifrado AES-256-GCM detectados.
                          </p>
                        )}
                      </div>
                    </div>

                    {!settings.encryptionEnabled ? (
                      /* STATE A: E2EE IS CURRENTLY DISABLED -> SETUP FORM */
                      <div className="space-y-4 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={`text-xs font-semibold uppercase tracking-wider block ${
                              isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'
                            }`}>
                              {secT.masterPasswordLabel}
                            </label>
                            <div className="relative">
                              <input
                                type={showMasterPassword ? 'text' : 'password'}
                                value={masterPasswordInput}
                                onChange={(e) => {
                                  setMasterPasswordInput(e.target.value);
                                  setSecurityError(null);
                                }}
                                placeholder={secT.masterPasswordPlaceholder}
                                className={`w-full pl-5 pr-11 py-3 text-sm rounded-full focus:outline-none transition-colors ${
                                  isDarkMode
                                    ? 'bg-[#141414] text-zinc-100 placeholder-zinc-500'
                                    : 'bg-white text-zinc-900 placeholder-zinc-400 shadow-taskflow-pill'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowMasterPassword((v) => !v)}
                                className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full cursor-pointer ${
                                  isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
                                }`}
                              >
                                {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className={`text-xs font-semibold uppercase tracking-wider block ${
                              isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'
                            }`}>
                              {secT.confirmPasswordLabel}
                            </label>
                            <input
                              type={showMasterPassword ? 'text' : 'password'}
                              value={confirmPasswordInput}
                              onChange={(e) => {
                                setConfirmPasswordInput(e.target.value);
                                setSecurityError(null);
                              }}
                              placeholder={secT.confirmPasswordPlaceholder}
                              className={`w-full px-5 py-3 text-sm rounded-full focus:outline-none transition-colors ${
                                isDarkMode
                                  ? 'bg-[#141414] text-zinc-100 placeholder-zinc-500'
                                  : 'bg-white text-zinc-900 placeholder-zinc-400 shadow-taskflow-pill'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Remember key on this browser toggle */}
                        <div className="flex items-center justify-between gap-4 pt-1">
                          <div>
                            <span className="text-sm font-semibold block">{secT.rememberDeviceLabel}</span>
                            <span className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                              {secT.rememberDeviceDesc}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRememberDeviceKey((v) => !v)}
                            className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                              rememberDeviceKey ? '' : isDarkMode ? 'bg-[#141414]' : 'bg-zinc-200'
                            }`}
                            style={{
                              backgroundColor: rememberDeviceKey ? settings.primaryColor : undefined,
                            }}
                          >
                            <div
                              className={`w-5.5 h-5.5 rounded-full bg-white shadow-taskflow-pill transition-transform duration-200 ${
                                rememberDeviceKey ? 'translate-x-5.5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {securityError && (
                          <div className="p-3.5 rounded-2xl bg-red-500/10 text-red-500 text-xs sm:text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{securityError}</span>
                          </div>
                        )}

                        <div className="pt-2">
                          <button
                            type="button"
                            disabled={isProcessingSecurity || !!(batchProgress && batchProgress.active)}
                            onClick={async () => {
                              if (masterPasswordInput.trim().length < 6) {
                                setSecurityError(secT.passwordTooShortError);
                                return;
                              }
                              if (masterPasswordInput !== confirmPasswordInput) {
                                setSecurityError(secT.passwordMismatchError);
                                return;
                              }
                              setSecurityError(null);
                              setIsProcessingSecurity(true);
                              try {
                                const ok = await onEnableEncryption?.(masterPasswordInput, rememberDeviceKey);
                                if (ok) {
                                  setMasterPasswordInput('');
                                  setConfirmPasswordInput('');
                                } else {
                                  setSecurityError(secT.wrongPasswordError);
                                }
                              } finally {
                                setIsProcessingSecurity(false);
                              }
                            }}
                            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all cursor-pointer hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            {isProcessingSecurity ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                            <span>{secT.enableEncryptionBtn}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* STATE B: E2EE IS ACTIVE -> MANAGE / UNLOCK / BATCH ENCRYPT / DISABLE */
                      <div className="space-y-5 pt-1">
                        {!e2eeUnlocked && (
                          <div className={`p-5 rounded-2xl space-y-3 ${
                            isDarkMode ? 'bg-[#141414]' : 'bg-white shadow-taskflow-pill'
                          }`}>
                            <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
                              <Lock className="w-4 h-4" />
                              <span>{secT.unlockVaultTitle}</span>
                            </div>
                            <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {secT.unlockVaultDesc}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2.5">
                              <input
                                type={showMasterPassword ? 'text' : 'password'}
                                value={masterPasswordInput}
                                onChange={(e) => {
                                  setMasterPasswordInput(e.target.value);
                                  setSecurityError(null);
                                }}
                                placeholder={secT.masterPasswordPlaceholder}
                                className={`flex-1 px-4 py-2.5 text-sm rounded-full focus:outline-none ${
                                  isDarkMode ? 'bg-[#1F1F1F] text-zinc-100' : 'bg-[#F1F5F9] text-zinc-900'
                                }`}
                              />
                              <button
                                type="button"
                                disabled={isProcessingSecurity}
                                onClick={async () => {
                                  if (!masterPasswordInput) return;
                                  setIsProcessingSecurity(true);
                                  setSecurityError(null);
                                  try {
                                    const ok = await onUnlockVault?.(masterPasswordInput, rememberDeviceKey);
                                    if (ok) {
                                      setMasterPasswordInput('');
                                    } else {
                                      setSecurityError(secT.wrongPasswordError);
                                    }
                                  } finally {
                                    setIsProcessingSecurity(false);
                                  }
                                }}
                                className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white cursor-pointer"
                                style={{ backgroundColor: settings.primaryColor }}
                              >
                                {secT.unlockVaultBtn}
                              </button>
                            </div>
                          </div>
                        )}

                        {securityError && (
                          <div className="p-3.5 rounded-2xl bg-red-500/10 text-red-500 text-xs sm:text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{securityError}</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Re-verify / Encrypt all notes in GitHub */}
                          <button
                            type="button"
                            disabled={isProcessingSecurity || !!(batchProgress && batchProgress.active)}
                            onClick={async () => {
                              setIsProcessingSecurity(true);
                              setSecurityError(null);
                              try {
                                await onEncryptAllRepoNotes?.(masterPasswordInput || undefined);
                              } finally {
                                setIsProcessingSecurity(false);
                              }
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer hover:opacity-95 disabled:opacity-50"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            <Lock className="w-4 h-4" />
                            <span>{secT.encryptAllRepoBtn}</span>
                          </button>

                          {/* Lock local browser session */}
                          {e2eeUnlocked && (
                            <button
                              type="button"
                              onClick={() => onLockSession?.()}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                                isDarkMode
                                  ? 'bg-[#141414] hover:bg-[#222222] text-zinc-200'
                                  : 'bg-white hover:bg-zinc-100 text-zinc-800 shadow-taskflow-pill'
                              }`}
                            >
                              <KeyRound className="w-4 h-4 text-amber-500" />
                              <span>{secT.lockSessionBtn}</span>
                            </button>
                          )}

                          {/* Disable E2EE & Decrypt all notes on GitHub back to plaintext */}
                          <button
                            type="button"
                            disabled={isProcessingSecurity || !!(batchProgress && batchProgress.active)}
                            onClick={async () => {
                              setIsProcessingSecurity(true);
                              setSecurityError(null);
                              try {
                                const ok = await onDisableEncryption?.(masterPasswordInput || undefined);
                                if (!ok) {
                                  setSecurityError(secT.wrongPasswordError);
                                } else {
                                  setMasterPasswordInput('');
                                }
                              } finally {
                                setIsProcessingSecurity(false);
                              }
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Unlock className="w-4 h-4" />
                            <span>{secT.disableEncryptionBtn}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 2: EXPORTACIÓN Y PORTABILIDAD (OBSIDIAN / NOTION / MARKDOWN LIMPIO) */}
                <div className="px-1 pt-2">
                  <h3 className="text-base font-bold tracking-tight">{secT.exportSectionTitle}</h3>
                  <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                    {secT.exportSectionDesc}
                  </p>
                </div>

                <div className={`rounded-[28px] [corner-shape:squircle] shadow-taskflow-card divide-y overflow-hidden ${
                  isDarkMode 
                    ? 'bg-[#181818] divide-white/[0.04]' 
                    : 'bg-[#F8FAFC] divide-zinc-200/50'
                }`}>
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-taskflow-pill"
                        style={{ backgroundColor: `${settings.primaryColor}15`, color: settings.primaryColor }}
                      >
                        <FileArchive className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <span className="text-base font-bold block">{secT.exportAllZipTitle}</span>
                        <p className={`text-sm mt-1 max-w-xl ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {secT.exportAllZipDesc}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!!(batchProgress && batchProgress.active)}
                      onClick={() => onExportAllVaultZip?.()}
                      className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all cursor-pointer hover:opacity-95 active:scale-[0.98] shrink-0 self-start sm:self-center disabled:opacity-50"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      <Download className="w-4 h-4" />
                      <span>{secT.exportAllZipBtn}</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 4: CUENTA Y SINCRONIZACIÓN */}
            {activeSection === 'account' && (
              <section className="space-y-3.5">
                <div className="px-1">
                  <h2 className="text-lg font-bold tracking-tight">{dict.settings.accountTitle}</h2>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                    {dict.settings.accountDesc}
                  </p>
                </div>

                <div className={`rounded-[28px] [corner-shape:squircle] shadow-taskflow-card divide-y overflow-hidden ${
                  isDarkMode 
                    ? 'bg-[#181818] divide-white/[0.04]' 
                    : 'bg-[#F8FAFC] divide-zinc-200/50'
                }`}>

                  {/* Row: GitHub Account */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {userProfile ? (
                        <Image
                          src={userProfile.avatar_url}
                          alt="Avatar"
                          width={48}
                          height={48}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full shrink-0 shadow-taskflow-pill"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#EEF2F6] dark:bg-[#141414] flex items-center justify-center shrink-0">
                          <Github className="w-6.5 h-6.5 opacity-60" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold">
                            {userProfile ? (userProfile.name || userProfile.login) : dict.settings.githubAccountFallback}
                          </span>
                          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500">
                            {userProfile ? dict.settings.syncedBadge : dict.settings.localModeBadge}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {userProfile ? `@${userProfile.login}` : dict.settings.serverManagedDesc}
                        </p>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-2xl text-sm font-mono self-start sm:self-center shrink-0 shadow-taskflow-pill ${
                      isDarkMode ? 'bg-[#141414] text-zinc-400' : 'bg-white text-zinc-600'
                    }`}>
                      {totalNotesCount} {totalNotesCount === 1 ? dict.settings.docSingular : dict.settings.docPlural}
                    </div>
                  </div>

                </div>
              </section>
            )}

            {/* SECTION 5: DOCUMENTOS Y LICENCIAS */}
            {activeSection === 'docs' && (
              <section className="space-y-3.5 animate-in fade-in duration-200">
                <div className="px-1">
                  <h2 className="text-lg font-bold tracking-tight">{dict.settings.docsTitle}</h2>
                  <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                    {dict.settings.docsDesc}
                  </p>
                </div>

                <div className={`rounded-[28px] [corner-shape:squircle] shadow-taskflow-card divide-y overflow-hidden ${
                  isDarkMode 
                    ? 'bg-[#181818] divide-white/[0.04]' 
                    : 'bg-[#F8FAFC] divide-zinc-200/50'
                }`}>

                  {/* Row: Versión de la Aplicación */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-taskflow-pill"
                        style={{ backgroundColor: `${settings.primaryColor}15`, color: settings.primaryColor }}
                      >
                        <Info className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold">Webapp</span>
                          <span 
                            className="px-2.5 py-0.5 text-xs font-bold rounded-full"
                            style={{ backgroundColor: `${settings.primaryColor}20`, color: settings.primaryColor }}
                          >
                            {APP_VERSION}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {dict.settings.versionDesc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Row: Documentación general de Webapp */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 shadow-taskflow-pill">
                        <AppIcon name="book-open" pack={settings.iconPack || 'meteor'} className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-base font-bold block truncate">
                          Documentación general de Webapp
                        </span>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {dict.settings.tpiDocsDesc}
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://wadocs.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-taskflow-pill ${
                        isDarkMode
                          ? 'bg-[#222222] hover:bg-[#2A2A2A] text-zinc-100'
                          : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80'
                      }`}
                    >
                      <span>{dict.settings.goToDocsBtn}</span>
                      <ExternalLink className="w-4 h-4 opacity-70" />
                    </a>
                  </div>

                  {/* Row: Documentación de Markdown */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 shadow-taskflow-pill">
                        <AppIcon name="file-text" pack={settings.iconPack || 'meteor'} className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-base font-bold block truncate">
                          Documentación de Markdown
                        </span>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          Guía de referencia y sintaxis oficial de Markdown para dar formato a tus notas.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://www.markdownguide.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-taskflow-pill ${
                        isDarkMode
                          ? 'bg-[#222222] hover:bg-[#2A2A2A] text-zinc-100'
                          : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80'
                      }`}
                    >
                      <span>{dict.settings.goToDocsBtn}</span>
                      <ExternalLink className="w-4 h-4 opacity-70" />
                    </a>
                  </div>

                  {/* Row: Enlace a Google Fonts */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 shadow-taskflow-pill">
                        <AppIcon name="type" pack={settings.iconPack || 'meteor'} className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-base font-bold block truncate">
                          Google Fonts
                        </span>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          Catálogo oficial de tipografías web y Material Symbols de Google.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://fonts.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-taskflow-pill ${
                        isDarkMode
                          ? 'bg-[#222222] hover:bg-[#2A2A2A] text-zinc-100'
                          : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80'
                      }`}
                    >
                      <span>Abrir enlace</span>
                      <ExternalLink className="w-4 h-4 opacity-70" />
                    </a>
                  </div>

                  {/* Row: Enlace a Meteor Icons */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0 shadow-taskflow-pill">
                        <AppIcon name="meteor" pack={settings.iconPack || 'meteor'} className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-base font-bold block truncate">
                          Meteor Icons
                        </span>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          Paquete de iconos minimalistas de código abierto predeterminado en Webapp.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://meteoricons.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-taskflow-pill ${
                        isDarkMode
                          ? 'bg-[#222222] hover:bg-[#2A2A2A] text-zinc-100'
                          : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80'
                      }`}
                    >
                      <span>Abrir enlace</span>
                      <ExternalLink className="w-4 h-4 opacity-70" />
                    </a>
                  </div>

                  {/* Row: Enlace a Lucide */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 shadow-taskflow-pill">
                        <AppIcon name="sparkles" pack={settings.iconPack || 'meteor'} className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-base font-bold block truncate">
                          Lucide
                        </span>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          Biblioteca comunitaria de iconos vectoriales limpios y consistentes.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://lucide.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-taskflow-pill ${
                        isDarkMode
                          ? 'bg-[#222222] hover:bg-[#2A2A2A] text-zinc-100'
                          : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80'
                      }`}
                    >
                      <span>Abrir enlace</span>
                      <ExternalLink className="w-4 h-4 opacity-70" />
                    </a>
                  </div>

                  {/* Row: Enlace a Heroicons */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 shadow-taskflow-pill">
                        <AppIcon name="palette" pack={settings.iconPack || 'meteor'} className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-base font-bold block truncate">
                          Heroicons
                        </span>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          Iconos SVG artesanales creados por los diseñadores de Tailwind CSS.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://heroicons.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-taskflow-pill ${
                        isDarkMode
                          ? 'bg-[#222222] hover:bg-[#2A2A2A] text-zinc-100'
                          : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80'
                      }`}
                    >
                      <span>Abrir enlace</span>
                      <ExternalLink className="w-4 h-4 opacity-70" />
                    </a>
                  </div>

                  {/* Row: Enlace a Toss Face */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 shadow-taskflow-pill">
                        <AppIcon name="smile" pack={settings.iconPack || 'meteor'} className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-base font-bold block truncate">
                          Toss Face
                        </span>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          Colección de emojis expresivos diseñados por el equipo de Toss.
                        </p>
                      </div>
                    </div>

                    <a
                      href="https://emojipedia.org/en/toss-face"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shrink-0 cursor-pointer shadow-taskflow-pill ${
                        isDarkMode
                          ? 'bg-[#222222] hover:bg-[#2A2A2A] text-zinc-100'
                          : 'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/80'
                      }`}
                    >
                      <span>Abrir enlace</span>
                      <ExternalLink className="w-4 h-4 opacity-70" />
                    </a>
                  </div>

                  {/* Row: Licencia MIT */}
                  <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 shadow-taskflow-pill">
                        <ShieldCheck className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold">{dict.settings.openSourceLicenseTitle}</span>
                          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-500/10 text-purple-500">
                            MIT License
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          {dict.settings.openSourceLicenseDesc}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </section>
            )}

          </main>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-[32px] [corner-shape:squircle] shadow-taskflow-modal p-7 space-y-4 ${
            isDarkMode ? 'bg-[#181818] text-zinc-100' : 'bg-white text-[#1E293B]'
          }`}>
            <div className="flex items-center gap-3 text-red-500">
              <RotateCcw className="w-5.5 h-5.5" />
              <h3 className="text-lg font-bold">{dict.settings.resetConfirmTitle}</h3>
            </div>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
              {dict.settings.resetConfirmDesc}
            </p>
            <div className="flex justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className={`px-4.5 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer shadow-taskflow-pill ${
                  isDarkMode ? 'bg-[#141414] hover:bg-[#202020] text-zinc-300' : 'bg-[#EEF2F6] hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {dict.settings.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 rounded-2xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors shadow-taskflow-pill"
              >
                {dict.settings.confirmResetBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsView;
