'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Copy, 
  Check, 
  FilePlus, 
  X, 
  FileText, 
  RefreshCw, 
  User, 
  Plus, 
  Paperclip, 
  Image as ImageIcon, 
  Wand2,
  MessageSquare,
  Trash2,
  Clock,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Layers,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Server
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Tooltip } from '@/components/Tooltip';
import { highlightCode } from '@/lib/syntaxHighlight';
import { AI_PROVIDERS, AiProvider } from '@/lib/aiService';
import { AppLanguage, getUiTranslations } from '@/lib/i18n';

export const PetardoLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M32.8623 25.2754H68.1377C81.7163 25.2754 92.7246 36.2837 92.7246 49.8623C92.7245 63.4408 81.7162 74.4482 68.1377 74.4482H32.8623C19.2838 74.4482 8.27552 63.4408 8.27539 49.8623C8.27539 36.2837 19.2837 25.2754 32.8623 25.2754Z" 
      fill="black" 
      stroke="url(#paint0_linear_30_3)" 
      strokeWidth="8.55172"
    />
    <path 
      d="M43.0173 45.0517L39.2759 55.2069" 
      stroke="white" 
      strokeWidth="10.6897" 
      strokeLinecap="round"
    />
    <path 
      d="M62.2586 44.5172L58.5172 54.6724" 
      stroke="white" 
      strokeWidth="10.6897" 
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="paint0_linear_30_3" x1="50.5" y1="21" x2="50.5" y2="78.7241" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7EB6FF"/>
        <stop offset="1" stopColor="#006FFF"/>
      </linearGradient>
    </defs>
  </svg>
);

const CustomSendUpArrowIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M11 21C11 21.5523 11.4477 22 12 22C12.5523 22 13 21.5523 13 21H12H11ZM12.7071 2.29289C12.3166 1.90237 11.6834 1.90237 11.2929 2.29289L4.92893 8.65685C4.53841 9.04738 4.53841 9.68054 4.92893 10.0711C5.31946 10.4616 5.95262 10.4616 6.34315 10.0711L12 4.41421L17.6569 10.0711C18.0474 10.4616 18.6805 10.4616 19.0711 10.0711C19.4616 9.68054 19.4616 9.04738 19.0711 8.65685L12.7071 2.29289ZM12 21H13V3H12H11V21H12Z" 
      fill="currentColor"
    />
  </svg>
);

const GlowingSparkle = ({ className = "w-9 h-9" }: { className?: string }) => (
  <div className="relative inline-flex items-center justify-center">
    <div className="absolute inset-0 bg-sky-400/30 dark:bg-sky-500/20 rounded-full blur-md" />
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path 
        d="M18 2C18 10.8366 10.8366 18 2 18C10.8366 18 18 25.1634 18 34C18 25.1634 25.1634 18 34 18C25.1634 18 18 10.8366 18 2Z" 
        fill="url(#sparkle_gradient)" 
      />
      <circle cx="28" cy="8" r="2.5" fill="#7EB6FF" />
      <circle cx="8" cy="27" r="1.5" fill="#93C5FD" />
      <defs>
        <linearGradient id="sparkle_gradient" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="0.55" stopColor="#006FFF" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

interface PetardoAgentProps {
  isDarkMode: boolean;
  currentPath: string;
  currentContent: string;
  userProfile?: { login?: string; name?: string; avatar_url?: string } | null;
  onInsertContent: (content: string, mode?: 'append' | 'replace') => void;
  onCreateFile: (path: string, content: string) => Promise<void> | void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onClose?: () => void;
  primaryColor?: string;
  language?: AppLanguage;
}

export interface Message {
  id: string;
  sender: 'user' | 'petardo';
  text: string;
  suggestedFileName?: string;
  actionType?: string;
  timestamp: number;
  thoughtDurationSeconds?: number;
  sourcesCount?: number;
  feedback?: 'like' | 'dislike' | null;
  contextPath?: string;
  modelName?: string;
  providerName?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

const STORAGE_CHATS_KEY = 'petardo_chats_history_v1';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const createNewSession = (titleText = 'Nuevo chat', welcomeText = ''): ChatSession => ({
  id: `session-${Date.now()}`,
  title: titleText,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [
    {
      id: 'welcome',
      sender: 'petardo',
      text: welcomeText || '¡Hola! Soy **Petardo AI**, tu asistente inteligente. Puedo redactar notas completas, crear archivos `.md`, estructurar ideas, resumir y mejorar tus textos en tiempo real.',
      timestamp: Date.now()
    }
  ]
});

// Helper to load and auto-prune chats older than 7 days
const loadAndPruneSessions = (): ChatSession[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CHATS_KEY);
    if (!raw) return [];
    const parsed: ChatSession[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    const validSessions = parsed.filter(s => {
      const time = s.updatedAt || s.createdAt || 0;
      return (now - time) <= SEVEN_DAYS_MS;
    });

    if (validSessions.length !== parsed.length) {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(validSessions));
    }
    return validSessions;
  } catch {
    return [];
  }
};

const saveSessionsToStorage = (sessions: ChatSession[]) => {
  if (typeof window === 'undefined') return;
  try {
    const now = Date.now();
    const validSessions = sessions.filter(s => (now - (s.updatedAt || s.createdAt || 0)) <= SEVEN_DAYS_MS);
    localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(validSessions));
  } catch {}
};

export function PetardoAgent({
  isDarkMode,
  currentPath,
  currentContent,
  userProfile,
  onInsertContent,
  onCreateFile,
  onShowToast,
  onClose,
  primaryColor = '#0075FF',
  language = 'es'
}: PetardoAgentProps) {
  const aiT = getUiTranslations(language).ai;
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [contextOverride, setContextOverride] = useState<string | null | false>(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  
  // Dynamic attached context: defaults to current note unless dismissed
  const attachedContext = contextOverride === false ? null : (contextOverride || currentPath || null);
  
  // Sessions & active chat state
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: 'session-default',
      title: aiT.newChatTitle,
      createdAt: 0,
      updatedAt: 0,
      messages: [
        {
          id: 'welcome',
          sender: 'petardo',
          text: aiT.welcomeMessage,
          timestamp: 0
        }
      ]
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-default');
  const [aiConfig, setAiConfig] = useState<{
    provider: AiProvider;
    model: string;
    baseUrl?: string;
  }>({
    provider: 'gemini',
    model: 'gemini-2.5-flash'
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creatingFileId, setCreatingFileId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active session helper
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || createNewSession(aiT.newChatTitle, aiT.welcomeMessage);
  const messages = currentSession.messages;

  const refreshAiConfig = () => {
    try {
      const raw = localStorage.getItem('petardo_ai_config');
      if (raw) {
        const parsed = JSON.parse(raw);
        const active: AiProvider = (parsed.activeProvider && parsed.activeProvider in AI_PROVIDERS)
          ? parsed.activeProvider
          : 'gemini';
        const pData = parsed.providers?.[active] || {};
        const model = pData.model || AI_PROVIDERS[active]?.defaultModel || 'gemini-2.5-flash';
        setAiConfig({
          provider: active,
          model,
          baseUrl: pData.baseUrl,
        });
      }
    } catch {}
  };

  // Load chats and AI config on mount & listen to changes
  useEffect(() => {
    queueMicrotask(() => {
      const loaded = loadAndPruneSessions();
      if (loaded.length > 0) {
        setSessions(loaded);
        setActiveSessionId(loaded[0].id);
      } else {
        const fresh = createNewSession(aiT.newChatTitle, aiT.welcomeMessage);
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
      }
      refreshAiConfig();
    });

    const handleStorage = () => {
      refreshAiConfig();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(scrollHeight, 140);
      textareaRef.current.style.height = `${Math.max(newHeight, 26)}px`;
    }
  }, [inputPrompt]);

  const handleImagePrompt = () => {
    setInputPrompt(prev => {
      const prefix = aiT.diagramPromptPrefix;
      return prev ? `${prev}` : prefix;
    });
    setIsPlusMenuOpen(false);
  };

  const handleAttachCurrentNote = () => {
    if (currentPath) {
      setContextOverride(currentPath);
      onShowToast(`${aiT.notePinnedContextToast}: "${currentPath}"`, 'info');
    } else {
      onShowToast(aiT.noOpenNoteToAttachToast, 'info');
    }
    setIsPlusMenuOpen(false);
  };

  // Helper to format relative time nicely
  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp) return aiT.recentLabel;
    const date = new Date(timestamp);
    return date.toLocaleDateString(language, { month: 'short', day: 'numeric' });
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!showHistoryDrawer) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showHistoryDrawer, isLoading]);

  const updateCurrentSessionMessages = (newMessages: Message[], newTitle?: string) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            title: newTitle || s.title,
            updatedAt: Date.now(),
            messages: newMessages
          };
        }
        return s;
      });
      saveSessionsToStorage(updated);
      return updated;
    });
  };

  const handleStartNewChat = () => {
    const newChat = createNewSession(aiT.newChatTitle, aiT.welcomeMessage);
    setSessions(prev => {
      const next = [newChat, ...prev.filter(s => s.id !== newChat.id)];
      saveSessionsToStorage(next);
      return next;
    });
    setActiveSessionId(newChat.id);
    setShowHistoryDrawer(false);
    onShowToast(aiT.newChatStartedToast, 'info');
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistoryDrawer(false);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      const nextSessions = filtered.length > 0 ? filtered : [createNewSession(aiT.newChatTitle, aiT.welcomeMessage)];
      if (activeSessionId === sessionId) {
        setActiveSessionId(nextSessions[0].id);
      }
      saveSessionsToStorage(nextSessions);
      return nextSessions;
    });
    onShowToast(aiT.chatDeletedToast, 'info');
  };

  const handleSendMessage = async (customPrompt?: string, action: string = 'chat') => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend && action === 'chat') return;

    const userMessageText = action === 'improve' 
      ? aiT.improveActionText 
      : action === 'summarize'
      ? aiT.summarizeActionText
      : promptToSend;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMessageText,
      timestamp: Date.now(),
      contextPath: attachedContext || undefined
    };

    // Calculate title if this is the first real user query
    let newTitle: string | undefined = undefined;
    const isFirstUserMessage = messages.filter(m => m.sender === 'user').length === 0;
    if (isFirstUserMessage) {
      newTitle = userMessageText.slice(0, 30).trim() || aiT.newChatTitle;
    }

    const nextMessages = [...messages, userMsg];
    updateCurrentSessionMessages(nextMessages, newTitle);

    if (!customPrompt) setInputPrompt('');
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/gemini/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          action,
          currentNoteContent: currentContent || '',
          currentNotePath: attachedContext || currentPath || '',
          provider: aiConfig.provider,
          model: aiConfig.model,
          baseUrl: aiConfig.baseUrl
        })
      });

      const data = await response.json();
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      if (!response.ok) {
        throw new Error(data.error || 'Error');
      }

      const botMsg: Message = {
        id: `petardo-${Date.now()}`,
        sender: 'petardo',
        text: data.text || '',
        suggestedFileName: data.suggestedFileName,
        actionType: action,
        timestamp: Date.now(),
        thoughtDurationSeconds: elapsedSeconds,
        sourcesCount: attachedContext ? 1 : 0,
        modelName: data.model || aiConfig.model,
        providerName: AI_PROVIDERS[aiConfig.provider]?.badge || aiConfig.provider
      };

      updateCurrentSessionMessages([...nextMessages, botMsg], newTitle);
    } catch (error: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'petardo',
        text: `⚠️ ${error.message || 'Error'}`,
        timestamp: Date.now()
      };
      updateCurrentSessionMessages([...nextMessages, errorMsg], newTitle);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast(aiT.copiedClipboardToast, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateNewFileFromResponse = async (msg: Message) => {
    let filePath = msg.suggestedFileName || 'nota-petardo.md';
    if (!filePath.endsWith('.md')) filePath += '.md';
    
    let cleanText = msg.text;
    const match = cleanText.match(/^```(?:markdown)?\n([\s\S]*?)\n```$/i);
    if (match && match[1]) {
      cleanText = match[1];
    }

    setCreatingFileId(msg.id);
    try {
      await onCreateFile(filePath, cleanText);
    } catch (e: any) {
      onShowToast(e.message || 'Error', 'error');
    } finally {
      setCreatingFileId(null);
    }
  };

  const handleInsertIntoEditor = (text: string) => {
    let cleanText = text;
    const match = cleanText.match(/^```(?:markdown)?\n([\s\S]*?)\n```$/i);
    if (match && match[1]) {
      cleanText = match[1];
    }
    onInsertContent(cleanText, 'append');
    onShowToast(aiT.insertedIntoNoteToast, 'success');
  };

  const handleFeedback = (msgId: string, feedback: 'like' | 'dislike') => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            messages: s.messages.map(m => {
              if (m.id === msgId) {
                return { ...m, feedback: m.feedback === feedback ? null : feedback };
              }
              return m;
            })
          };
        }
        return s;
      });
      saveSessionsToStorage(updated);
      return updated;
    });
    onShowToast(feedback === 'like' ? aiT.helpfulTooltip : aiT.notHelpfulTooltip, 'info');
  };

  const displaySessionTitle =
    currentSession.title === 'Nuevo chat' ? aiT.newChatTitle : (currentSession.title || 'Petardo AI');

  return (
    <div className={`h-full w-full flex flex-col transition-colors duration-200 select-text ${
      isDarkMode ? 'bg-[#141414] text-zinc-100' : 'bg-white text-[#1E293B]'
    }`}>
      {/* Companion Sidebar Header */}
      <div className={`px-5 py-3.5 flex items-center justify-between shrink-0 border-b ${
        isDarkMode ? 'border-white/[0.06] bg-[#141414]' : 'border-black/[0.05] bg-white'
      }`}>
        {/* Left: Menu toggle & Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <Tooltip content={showHistoryDrawer ? aiT.backToChat : aiT.chatHistory} position="bottom">
            <button 
              type="button"
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className={`p-1.5 rounded-xl flex flex-col justify-center items-center gap-1 cursor-pointer transition-colors ${
                showHistoryDrawer
                  ? 'bg-[#0075FF]/15 text-[#0075FF]'
                  : isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.04]'
              }`}
              aria-label={aiT.chatHistory}
            >
              <div className="w-4 h-[2px] bg-current rounded-full" />
              <div className="w-4 h-[2px] bg-current rounded-full" />
              <div className="w-4 h-[2px] bg-current rounded-full" />
            </button>
          </Tooltip>
          
          <div className="flex items-center gap-2 min-w-0">
            <PetardoLogo className="w-5.5 h-5.5 shrink-0" />
            <div className="min-w-0 flex items-center gap-1.5">
              <h3 className="font-bold text-[15px] tracking-tight truncate">
                {showHistoryDrawer ? aiT.chatHistory : displaySessionTitle}
              </h3>
              {!showHistoryDrawer && (
                <Tooltip content={`${aiT.activeProviderTooltip}: ${AI_PROVIDERS[aiConfig.provider]?.name || aiConfig.provider} (${aiConfig.model})`} position="bottom">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 cursor-default ${
                    isDarkMode ? 'bg-white/10 text-zinc-300' : 'bg-black/5 text-zinc-700'
                  }`}>
                    {AI_PROVIDERS[aiConfig.provider]?.badge || 'AI'}
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <Tooltip content={aiT.newChatTitle} position="bottom">
            <button
              onClick={handleStartNewChat}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-taskflow-pill ${
                isDarkMode 
                  ? 'bg-[#181818] hover:bg-[#242424] border-white/[0.08] text-zinc-200' 
                  : 'bg-[#F8FAFC] hover:bg-zinc-100 border-black/[0.04] text-zinc-700'
              }`}
              aria-label={aiT.newChatTitle}
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
            </button>
          </Tooltip>

          {onClose && (
            <Tooltip content={aiT.closeAiBar} position="bottom">
              <button
                onClick={onClose}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isDarkMode ? 'hover:bg-white/[0.08] text-zinc-400 hover:text-white' : 'hover:bg-black/[0.05] text-zinc-500 hover:text-zinc-900'
                }`}
                aria-label={aiT.closeAiBar}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* BODY CONTENT: HISTORY VIEW OR ACTIVE CHAT */}
      {showHistoryDrawer ? (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-200">
          <div className="px-5 py-3 flex items-center justify-between shrink-0 border-b border-black/[0.04] dark:border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-xs opacity-75">
              <Clock className="w-3.5 h-3.5" />
              <span>{aiT.savedFor7Days}</span>
            </div>
            <button
              type="button"
              onClick={handleStartNewChat}
              className="px-3 py-1 text-xs font-semibold text-white rounded-full transition-colors cursor-pointer flex items-center gap-1 shadow-taskflow-pill"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>{aiT.newChatTitle}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-16 text-sm opacity-60">
                {aiT.noRecentChats}
              </div>
            ) : (
              sessions.map((session) => {
                const isSelected = session.id === currentSession.id;
                const messageCount = session.messages.filter(m => m.id !== 'welcome').length;
                const timeLabel = formatTimeAgo(session.updatedAt || session.createdAt);
                const sTitle = session.title === 'Nuevo chat' ? aiT.newChatTitle : (session.title || aiT.conversationFallback);

                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group relative p-3 rounded-[20px] [corner-shape:squircle] border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-blue-600/15 border-blue-500/40 text-blue-200'
                          : 'bg-blue-50 border-blue-200 text-blue-900'
                        : isDarkMode
                          ? 'bg-[#181818] hover:bg-[#202020] border-white/[0.06] text-zinc-200'
                          : 'bg-[#F8FAFC] hover:bg-zinc-100 border-black/[0.04] text-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-[#0075FF] text-white' 
                          : isDarkMode ? 'bg-[#242424] text-zinc-300' : 'bg-white text-zinc-600 shadow-taskflow-pill'
                      }`}>
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold truncate leading-snug">
                          {sTitle}
                        </h4>
                        <p className="text-[11px] opacity-60 flex items-center gap-2 mt-0.5">
                          <span>{timeLabel}</span>
                          <span>•</span>
                          <span>{messageCount} {messageCount === 1 ? aiT.msgSingular : aiT.msgPlural}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                        title={aiT.deleteBtn}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-80 transition-opacity" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 text-sm">
            {/* Context Badge in Stream (Matching reference image) */}
            {attachedContext && (
              <div className="flex justify-start">
                <div className={`p-2.5 px-3.5 rounded-[20px] [corner-shape:squircle] border max-w-[90%] flex items-center gap-3 shadow-taskflow-pill ${
                  isDarkMode ? 'bg-[#181818] border-white/[0.08] text-zinc-200' : 'bg-[#F8FAFC] border-black/[0.06] text-[#1E293B]'
                }`}>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-xs font-bold truncate leading-tight">{attachedContext}</div>
                    <div className="text-[11px] opacity-60 truncate">{aiT.activeSyncedNote}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome Greeting & Action Cards if no messages */}
            {messages.length <= 1 && (
              <div className="pt-2 pb-2 space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <PetardoLogo className="w-10 h-10" />
                  </div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-zinc-50' : 'text-[#0F172A]'}`}>
                    {aiT.greetingPrefix}, {userProfile?.name?.split(' ')[0] || userProfile?.login || aiT.partnerFallback} 👋
                  </h2>
                  <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                    {aiT.greetingSub}
                  </p>
                </div>

                {/* 3 Visual Prompt Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Card 1 */}
                  <button
                    onClick={() => handleSendMessage(aiT.cardCreatePrompt)}
                    disabled={isLoading}
                    className={`group relative h-24 rounded-2xl p-2.5 flex flex-col justify-between text-left overflow-hidden border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-taskflow-pill ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-blue-950/60 border-indigo-800/40 text-indigo-200'
                        : 'bg-gradient-to-br from-[#EEF2FF] via-[#E0E7FF]/70 to-[#C7D2FE]/50 border-indigo-200/80 text-indigo-950'
                    }`}
                  >
                    <span className="font-bold text-xs leading-tight">{aiT.cardCreateTitle1}<br />{aiT.cardCreateTitle2}</span>
                    <div className="flex justify-end">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <FilePlus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>

                  {/* Card 2 */}
                  <button
                    onClick={() => {
                      if (currentContent) {
                        handleSendMessage(undefined, 'summarize');
                      } else {
                        handleSendMessage(aiT.cardSummarizePrompt);
                      }
                    }}
                    disabled={isLoading}
                    className={`group relative h-24 rounded-2xl p-2.5 flex flex-col justify-between text-left overflow-hidden border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-taskflow-pill ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-teal-950/60 via-cyan-950/40 to-emerald-950/60 border-teal-800/40 text-teal-200'
                        : 'bg-gradient-to-br from-[#ECFDF5] via-[#D1FAE5]/70 to-[#A7F3D0]/50 border-teal-200/80 text-teal-950'
                    }`}
                  >
                    <span className="font-bold text-xs leading-tight">{aiT.cardSummarizeTitle1}<br />{aiT.cardSummarizeTitle2}</span>
                    <div className="flex justify-end">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>

                  {/* Card 3 */}
                  <button
                    onClick={() => {
                      if (currentContent) {
                        handleSendMessage(undefined, 'improve');
                      } else {
                        handleSendMessage(aiT.cardImprovePrompt);
                      }
                    }}
                    disabled={isLoading}
                    className={`group relative h-24 rounded-2xl p-2.5 flex flex-col justify-between text-left overflow-hidden border transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-taskflow-pill ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-pink-950/60 via-rose-950/40 to-amber-950/60 border-pink-800/40 text-pink-200'
                        : 'bg-gradient-to-br from-[#FFF1F2] via-[#FFE4E6]/70 to-[#FECDD3]/50 border-rose-200/80 text-rose-950'
                    }`}
                  >
                    <span className="font-bold text-xs leading-tight">{aiT.cardImproveTitle1}<br />{aiT.cardImproveTitle2}</span>
                    <div className="flex justify-end">
                      <div className="w-6 h-6 rounded-lg bg-pink-600 text-white flex items-center justify-center shadow-xs">
                        <Wand2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.filter(m => !(m.id === 'welcome' && messages.length > 1)).map((msg) => {
              const isPetardo = msg.sender === 'petardo';
              const renderedText = msg.id === 'welcome' ? aiT.welcomeMessage : msg.text;

              if (!isPetardo) {
                // User Message: Aligned left, with user avatar and name, no background
                const userName = userProfile?.name || userProfile?.login || aiT.youLabel;
                const timeString = msg.timestamp 
                  ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div key={msg.id} className="space-y-1 text-left animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5">
                      {/* User Avatar */}
                      <div className={`w-5.5 h-5.5 rounded-full overflow-hidden shrink-0 mt-0.5 border flex items-center justify-center ${
                        isDarkMode ? 'border-white/10 bg-[#242424]' : 'border-black/10 bg-zinc-100'
                      }`}>
                        {userProfile?.avatar_url ? (
                          <img 
                            src={userProfile.avatar_url} 
                            alt={userName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className={`w-3.5 h-3.5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`} />
                        )}
                      </div>

                      {/* User Name & Message Content (No Background) */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-bold tracking-tight ${
                            isDarkMode ? 'text-zinc-200' : 'text-zinc-900'
                          }`}>
                            {userName}
                          </span>
                          {timeString && (
                            <span className="text-[10px] opacity-40 font-medium">
                              {timeString}
                            </span>
                          )}
                        </div>

                        <div className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                          isDarkMode ? 'text-zinc-100' : 'text-[#1E293B]'
                        }`}>
                          {renderedText}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Assistant / Petardo Response
              return (
                <div key={msg.id} className="space-y-2 text-left animate-in fade-in duration-200">
                  {/* Top Status & Reasoning Pill */}
                  {msg.id !== 'welcome' && (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
                        isDarkMode ? 'bg-[#181818] border-white/[0.06] text-zinc-400' : 'bg-[#F8FAFC] border-black/[0.04] text-zinc-600'
                      }`}>
                        <Lightbulb className="w-3 h-3 text-amber-500" />
                        <span>{aiT.thoughtForSeconds.replace('{s}', String(msg.thoughtDurationSeconds || 2))}</span>
                      </div>

                      {msg.modelName && (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono ${
                          isDarkMode ? 'bg-[#181818] border-white/[0.06] text-zinc-400' : 'bg-[#F8FAFC] border-black/[0.04] text-zinc-600'
                        }`}>
                          <Cpu className="w-3 h-3 text-blue-500" />
                          <span>{msg.providerName ? `${msg.providerName}: ` : ''}{msg.modelName}</span>
                        </div>
                      )}

                      {msg.sourcesCount ? (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          <span>{aiT.oneContextSource}</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Petardo Logo & Markdown Body */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <PetardoLogo className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className={`prose prose-sm max-w-none space-y-2 overflow-x-auto leading-relaxed text-sm ${
                        isDarkMode ? 'prose-invert text-zinc-200' : 'text-[#1E293B]'
                      }`}>
                        <ReactMarkdown
                          components={{
                            code({ className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              const isInline = !match && !String(children).includes('\n');

                              if (isInline) {
                                return (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              }

                              const lang = match ? match[1] : undefined;
                              const html = highlightCode(codeString, lang);

                              return (
                                <code
                                  className={`hljs ${className || ''}`}
                                  dangerouslySetInnerHTML={{ __html: html }}
                                  {...props}
                                />
                              );
                            },
                          }}
                        >
                          {renderedText}
                        </ReactMarkdown>
                      </div>

                      {/* Action Toolbar Below Message (Matching Reference Image) */}
                      {msg.id !== 'welcome' && !msg.text.startsWith('⚠️') && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-1">
                          {/* Copy */}
                          <Tooltip content={copiedId === msg.id ? aiT.copiedTooltip : aiT.copyTooltip} position="top">
                            <button
                              onClick={() => handleCopy(msg.text, msg.id)}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                isDarkMode 
                                  ? 'border-white/[0.06] bg-[#181818] hover:bg-[#242424] text-zinc-400 hover:text-zinc-200' 
                                  : 'border-black/[0.04] bg-[#F8FAFC] hover:bg-zinc-200 text-zinc-600 shadow-taskflow-pill'
                              }`}
                              aria-label={aiT.copyTooltip}
                            >
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </Tooltip>

                          {/* Insert into active note */}
                          <Tooltip content={aiT.insertTooltip} position="top">
                            <button
                              onClick={() => handleInsertIntoEditor(msg.text)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                                isDarkMode 
                                  ? 'border-white/[0.06] bg-[#181818] hover:bg-[#242424] text-zinc-300' 
                                  : 'border-black/[0.04] bg-[#F8FAFC] hover:bg-zinc-100 text-zinc-700 shadow-taskflow-pill'
                              }`}
                            >
                              <FileText className="w-3 h-3 text-[#0075FF]" />
                              <span>{aiT.insertBtn}</span>
                            </button>
                          </Tooltip>

                          {/* Create new .md */}
                          <Tooltip content={aiT.createMdTooltip} position="top">
                            <button
                              onClick={() => handleCreateNewFileFromResponse(msg)}
                              disabled={creatingFileId === msg.id}
                              className="px-2.5 py-1 rounded-full text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-taskflow-pill disabled:opacity-50"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {creatingFileId === msg.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <FilePlus className="w-3.5 h-3.5" />
                              )}
                              <span>{aiT.createMdBtn}</span>
                            </button>
                          </Tooltip>

                          {/* Feedback Thumbs */}
                          <div className="flex items-center gap-0.5 ml-auto">
                            <button
                              onClick={() => handleFeedback(msg.id, 'like')}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                msg.feedback === 'like' 
                                  ? 'text-blue-500 bg-blue-500/10' 
                                  : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
                              }`}
                              title={aiT.helpfulTooltip}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'dislike')}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                msg.feedback === 'dislike' 
                                  ? 'text-red-500 bg-red-500/10' 
                                  : isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
                              }`}
                              title={aiT.notHelpfulTooltip}
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5 animate-pulse">
                <div className="w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <PetardoLogo className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Petardo AI
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-[#0075FF]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{aiT.thinkingAndWriting}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* DOCKED INPUT BOX (Matching exact card design in Reference Image) */}
          <div className="p-4 pt-1 shrink-0">
            <div className={`p-3.5 rounded-[24px] [corner-shape:squircle] border shadow-taskflow-card transition-all ${
              isDarkMode 
                ? 'bg-[#181818] border-white/[0.08]' 
                : 'bg-white border-black/[0.06]'
            }`}>
              {/* Attached Context Pill inside the input box */}
              {attachedContext && (
                <div className="mb-2 flex items-center justify-between">
                  <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-medium border truncate max-w-[90%] ${
                    isDarkMode ? 'bg-[#141414] border-white/[0.06] text-zinc-300' : 'bg-[#F8FAFC] border-black/[0.04] text-zinc-700'
                  }`}>
                    <div className="w-4 h-4 rounded-md bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
                      <FileText className="w-2.5 h-2.5" />
                    </div>
                    <span className="truncate font-semibold text-[11px]">{attachedContext}</span>
                    <button
                      type="button"
                      onClick={() => setContextOverride(false)}
                      className="opacity-50 hover:opacity-100 hover:text-red-500 ml-1 cursor-pointer"
                      title={aiT.removeContext}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={attachedContext ? aiT.askAboutContextPlaceholder.replace('{note}', attachedContext) : aiT.askAnythingPlaceholder}
                disabled={isLoading}
                style={{ maxHeight: '140px', minHeight: '26px' }}
                className={`w-full bg-transparent text-sm outline-none leading-relaxed resize-none overflow-y-auto ${
                  isDarkMode ? 'text-zinc-100 placeholder-zinc-500' : 'text-zinc-900 placeholder-zinc-400'
                }`}
              />

              {/* Bottom Control Bar */}
              <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.04] dark:border-white/[0.04] mt-2">
                <div className="flex items-center space-x-2">
                  {/* Model Chip */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    isDarkMode ? 'bg-[#141414] border-white/[0.06] text-zinc-300' : 'bg-[#F8FAFC] border-black/[0.04] text-zinc-700'
                  }`}>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Gemini 2.5 Flash</span>
                  </div>

                  {/* Plus / Tools Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                        isDarkMode ? 'border-white/[0.06] hover:bg-white/[0.08] text-zinc-400' : 'border-black/[0.04] hover:bg-zinc-100 text-zinc-600'
                      }`}
                      title={aiT.toolsAndContext}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {isPlusMenuOpen && (
                      <div 
                        className={`absolute bottom-full left-0 mb-2 w-56 rounded-2xl border shadow-taskflow-floating p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                          isDarkMode ? 'bg-[#1C1C1C] border-white/[0.1] text-zinc-200' : 'bg-white border-black/[0.08] text-zinc-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={handleAttachCurrentNote}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                            isDarkMode ? 'hover:bg-white/[0.06]' : 'hover:bg-zinc-100'
                          }`}
                        >
                          <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                          <span>{aiT.pinCurrentNote}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleImagePrompt}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                            isDarkMode ? 'hover:bg-white/[0.06]' : 'hover:bg-zinc-100'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                          <span>{aiT.requestVisualDiagram}</span>
                        </button>

                        {currentContent && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setIsPlusMenuOpen(false);
                                handleSendMessage(undefined, 'summarize');
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                                isDarkMode ? 'hover:bg-white/[0.06]' : 'hover:bg-zinc-100'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{aiT.summarizeNote}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsPlusMenuOpen(false);
                                handleSendMessage(undefined, 'improve');
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                                isDarkMode ? 'hover:bg-white/[0.06]' : 'hover:bg-zinc-100'
                              }`}
                            >
                              <Wand2 className="w-3.5 h-3.5 text-pink-500" />
                              <span>{aiT.improveWriting}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !inputPrompt.trim()}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shadow-taskflow-pill disabled:opacity-40"
                  style={{ backgroundColor: primaryColor }}
                  aria-label={aiT.sendMessageAria}
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
