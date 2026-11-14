"use client";
import { useState, useEffect, useMemo, useCallback, useRef, useSyncExternalStore } from 'react';
import Image from "next/image";
import { AnimatePresence, motion } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Save, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  HelpCircle, 
  ChevronRight, 
  ChevronDown, 
  ArrowLeft, 
  Sliders, 
  Settings, 
  Palette, 
  Search, 
  ArrowUpDown, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Clock,
  Sparkles,
  Pin,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Folder,
  PanelLeftOpen,
  PanelLeftClose,
  LayoutGrid,
  Info,
  ListTree,
  Command,
  Focus,
  Lock,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Type,
  Minus
} from 'lucide-react';
import {
  isEncryptedContent,
  encryptNoteContent,
  decryptNoteContent,
  createVaultVerifier,
  verifyVaultPassword,
  getStoredMasterPassword,
  setStoredMasterPassword,
  clearStoredMasterPassword,
  exportSingleNoteAsMarkdown,
  exportVaultAsZip,
  getSecurityStrings,
} from '@/lib/crypto';
import { PetardoAgent, PetardoLogo } from '@/components/PetardoAgent';
import { Tooltip } from '@/components/Tooltip';
import { BearMarkdownEditor, sortMarkdownTaskLists } from '@/components/BearMarkdownEditor';
import { SettingsView } from '@/components/SettingsView';
import { TasksView } from '@/components/TasksView';
import { CalendarView } from '@/components/CalendarView';
import { CommandPaletteModal } from '@/components/CommandPaletteModal';
import { AppSettings, DEFAULT_SETTINGS, IconPackType, EmojiPackType } from '@/lib/settings';
import { AppLanguage, detectBrowserLanguage, getDictionary, getUiTranslations, I18nDictionary, UiTranslations } from '@/lib/i18n';
import { NOTE_COLORS, getNoteColor, NoteColorOption } from '@/lib/noteColors';
import { IconPickerModal } from '@/components/IconPickerModal';
import { NoteIconDisplay } from '@/lib/noteIcons';
import { AppIcon } from '@/components/AppIcon';

const CustomFileIcon = ({ className, pack }: { className?: string; pack?: IconPackType }) => (
  <AppIcon name="file-md" pack={pack} className={className} fallback={<FileText className={className} />} />
);

const CustomFolderIcon = ({ className, pack }: { className?: string; pack?: IconPackType }) => (
  <AppIcon name="folder" pack={pack} className={className} fallback={<Folder className={className} />} />
);

const SidebarOpenIcon = ({ className = "w-5 h-5", pack }: { className?: string; pack?: IconPackType }) => (
  <AppIcon name="sidebar-open" pack={pack} className={className} fallback={<PanelLeftOpen className={className} />} />
);

const SidebarCloseIcon = ({ className = "w-5 h-5", pack }: { className?: string; pack?: IconPackType }) => (
  <AppIcon name="sidebar-close" pack={pack} className={className} fallback={<PanelLeftClose className={className} />} />
);

const CustomGridIcon = ({ className = "w-5 h-5", pack }: { className?: string; pack?: IconPackType }) => (
  <AppIcon name="layout-grid" pack={pack} className={className} fallback={<LayoutGrid className={className} />} />
);

type GitItem = {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir';
};

type TreeNode = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  sha: string;
  children: Record<string, TreeNode>;
};

type UserProfile = {
  login: string;
  name: string;
  avatar_url: string;
};

type NoteMeta = {
  color?: string;
  updatedAt?: number;
  createdAt?: number;
  snippet?: string;
  tasks?: { text: string; completed: boolean }[];
  emoji?: string;
  pinned?: boolean;
  parentPath?: string;
};

function extractSnippetAndTasks(content: string): { snippet: string; tasks: { text: string; completed: boolean }[] } {
  if (!content) return { snippet: '', tasks: [] };

  // Detect task lists (- [ ] or - [x]), keeping incomplete tasks at the top and completed at the bottom
  const taskLines = content.match(/^[-*]\s*\[([ xX])\]\s*(.+)$/gm);
  let tasks: { text: string; completed: boolean }[] = [];
  if (taskLines && taskLines.length >= 2) {
    tasks = taskLines
      .map(line => {
        const isDone = /\[[xX]\]/.test(line);
        const text = line
          .replace(/^[-*]\s*\[([ xX])\]\s*/, '')
          .replace(/==([^=\n]+)==/g, '$1')
          .trim();
        return { text, completed: isDone };
      })
      .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
      .slice(0, 3);
  }

  // Clean snippet text
  const cleanSnippet = content
    .replace(/^---[\s\S]*?---/g, '') // remove frontmatter
    .replace(/```[\s\S]*?```/g, '') // remove codeblocks
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[\[([^\]|\n]+?)\|([^\]\n]+?)\]\]/g, '$2') // unwrap aliased wikilinks
    .replace(/\[\[([^\]\n]+?)\]\]/g, '$1') // unwrap wikilinks
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // unwrap links
    .replace(/==([^=\n]+)==/g, '$1') // unwrap highlights
    .replace(/^\s*\|[\s:|-]+\|\s*$/gm, '') // remove markdown table delimiter rows
    .replace(/\|/g, ' ') // unwrap markdown table pipes
    .replace(/^#+\s+/gm, '') // remove headers
    .replace(/^[-*+]\s+\[[ xX]\]\s+/gm, '') // remove checkbox prefixes
    .replace(/^[-*+]\s+/gm, '') // remove list markers
    .replace(/[`*_~>]/g, '') // remove markdown symbols
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join(' ')
    .slice(0, 450);

  return { snippet: cleanSnippet, tasks };
}

function encodeNotePathParam(path: string): string {
  try {
    return `p=${encodeURIComponent(btoa(encodeURIComponent(path)))}`;
  } catch {
    return `path=${encodeURIComponent(path)}`;
  }
}

function calculateNoteStats(content: string, minReadSuffix = 'min de lectura'): {
  words: number;
  chars: number;
  charsNoSpaces: number;
  readingTimeMinutes: number;
  readingTimeLabel: string;
} {
  if (!content) {
    return {
      words: 0,
      chars: 0,
      charsNoSpaces: 0,
      readingTimeMinutes: 0,
      readingTimeLabel: `0 ${minReadSuffix}`,
    };
  }

  const cleaned = content
    .replace(/^---\n[\s\S]*?\n---\n?/g, '') // remove frontmatter
    .replace(/```calendario[\s\S]*?```/g, '') // remove embedded calendar codeblock
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove image syntax
    .replace(/\[\[([^\]|\n]+?)\|([^\]\n]+?)\]\]/g, '$2') // unwrap aliased wikilinks
    .replace(/\[\[([^\]\n]+?)\]\]/g, '$1') // unwrap wikilinks
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // unwrap links
    .replace(/<span[^>]*data-inline-icon[^>]*>.*?<\/span>/g, '') // remove inline icon HTML
    .replace(/(?<![a-zA-Z0-9_])\.([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)\.?(?![a-zA-Z0-9_])/g, '') // remove inline icon syntax
    .replace(/==([^=\n]+)==/g, '$1') // unwrap highlights
    .replace(/^\s*\|[\s:|-]+\|\s*$/gm, '') // remove markdown table delimiter rows
    .replace(/\|/g, ' ') // unwrap markdown table pipes
    .replace(/^#+\s+/gm, '') // remove heading hashes
    .replace(/^[-*+]\s+\[[ xX]\]\s+/gm, '') // remove task prefixes
    .replace(/^[-*+]\s+/gm, '') // remove bullet prefixes
    .replace(/[`*_~>]/g, ''); // remove inline markdown formatting

  const trimmed = cleaned.trim();
  const chars = trimmed.length;
  const charsNoSpaces = trimmed.replace(/\s+/g, '').length;
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const readingTimeMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));
  const readingTimeLabel = `${readingTimeMinutes} ${minReadSuffix}`;

  return {
    words,
    chars,
    charsNoSpaces,
    readingTimeMinutes,
    readingTimeLabel,
  };
}

type TocHeadingItem = {
  index: number;
  level: 1 | 2 | 3;
  text: string;
};

function extractTableOfContents(content: string): TocHeadingItem[] {
  if (!content) return [];
  const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const lines = withoutFrontmatter.split(/\r?\n/);
  const headings: TocHeadingItem[] = [];
  let inCodeBlock = false;
  let headingIdx = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = rawLine.match(/^\s{0,3}(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length as 1 | 2 | 3;
      const cleanText = match[2]
        .replace(/\s+#+\s*$/, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[\[([^\]|\n]+?)\|([^\]\n]+?)\]\]/g, '$2')
        .replace(/\[\[([^\]\n]+?)\]\]/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/<span[^>]*data-inline-icon[^>]*>.*?<\/span>/g, '')
        .replace(/(?<![a-zA-Z0-9_])\.([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)\.?(?![a-zA-Z0-9_])/g, '')
        .replace(/==([^=\n]+)==/g, '$1')
        .replace(/[`*_~]/g, '')
        .trim();

      if (cleanText) {
        headings.push({
          index: headingIdx,
          level,
          text: cleanText,
        });
      }
      headingIdx++;
    }
  }

  return headings;
}

type ExtractedWikiLink = {
  target: string;
  label: string;
  contextSnippet: string;
};

function extractWikiLinksFromMarkdown(content: string): ExtractedWikiLink[] {
  if (!content) return [];
  const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const lines = withoutFrontmatter.split(/\r?\n/);
  const found: ExtractedWikiLink[] = [];
  const seenTargets = new Set<string>();
  let inCodeBlock = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const regex = /\[\[([^\]|\n]+?)(?:\|([^\]\n]+?))?\]\]/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(rawLine)) !== null) {
      const target = (match[1] || '').trim();
      const label = (match[2] || target).trim();
      if (!target) continue;
      const key = target.toLowerCase();
      if (seenTargets.has(key)) continue;
      seenTargets.add(key);

      const cleanContext = rawLine
        .replace(/^\s*[-*+>]\s*(\[[ xX]\]\s*)?/, '')
        .replace(/^#+\s+/, '')
        .replace(/\[\[([^\]|\n]+?)\|([^\]\n]+?)\]\]/g, '$2')
        .replace(/\[\[([^\]\n]+?)\]\]/g, '$1')
        .replace(/[`*_~==]/g, '')
        .trim();

      found.push({
        target,
        label,
        contextSnippet: cleanContext.slice(0, 140),
      });
    }
  }

  return found;
}

function formatCardDate(timestamp?: number): string {
  if (!timestamp) return 'Reciente';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Reciente';
    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' });
    const day = d.getDate();
    const month = d.toLocaleDateString('es-ES', { month: 'short' });
    const year = String(d.getFullYear()).slice(-2);
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}, ${day} ${month} ${year}`;
  } catch (e) {
    return 'Reciente';
  }
}

function buildTree(items: GitItem[]): TreeNode {
  const root: TreeNode = { name: 'root', path: '', type: 'dir', sha: '', children: {} };
  
  for (const item of items) {
    const parts = item.path.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        const isFile = i === parts.length - 1 && item.type === 'file';
        current.children[part] = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'dir',
          sha: isFile ? item.sha : '',
          children: {}
        };
      }
      current = current.children[part];
    }
  }
  return root;
}

const SidebarSectionTree = ({
  rootNode,
  activePath,
  isDarkMode,
  primaryColor,
  iconPack,
  emojiPack,
  noteMetadata,
  onFileClick,
  onNewFile,
  onNewSection,
  onFolderClick,
  onFileContextMenu,
  onOpenEmojiPicker,
  dict,
  uiT,
}: {
  rootNode: TreeNode;
  activePath: string;
  isDarkMode: boolean;
  primaryColor?: string;
  iconPack?: IconPackType;
  emojiPack?: EmojiPackType;
  noteMetadata: Record<string, NoteMeta>;
  onFileClick: (path: string, sha: string) => void;
  onNewFile: (dirPath: string) => void;
  onNewSection: () => void;
  onFolderClick: (path: string) => void;
  onFileContextMenu?: (e: React.MouseEvent, node: TreeNode) => void;
  onOpenEmojiPicker?: (node: TreeNode) => void;
  dict?: I18nDictionary;
  uiT?: UiTranslations;
}) => {
  // Store collapsed states for sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionPath: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionPath]: !prev[sectionPath]
    }));
  };

  const topLevelChildren = Object.values(rootNode.children).sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  });

  const sectionFolders = topLevelChildren.filter(c => c.type === 'dir');
  const rootFiles = topLevelChildren.filter(c => c.type === 'file' && c.name !== '.gitkeep');

  // Render a single file note row
  const renderNoteItem = (fileNode: TreeNode) => {
    const isFileActive = activePath === fileNode.path;
    const meta = noteMetadata[fileNode.path];
    const emoji = meta?.emoji;

    return (
      <div
        key={fileNode.path}
        onClick={() => onFileClick(fileNode.path, fileNode.sha)}
        onContextMenu={(e) => onFileContextMenu && onFileContextMenu(e, fileNode)}
        className={`group flex items-center justify-between px-3.5 py-2.5 rounded-full cursor-pointer transition-all duration-150 select-none ${
          isFileActive
            ? (isDarkMode 
                ? 'bg-[#242424] text-white font-medium' 
                : 'bg-zinc-200/80 text-[#0F172A] font-semibold')
            : (isDarkMode 
                ? 'hover:bg-zinc-800/60 text-zinc-300' 
                : 'hover:bg-zinc-100/90 text-[#334155]')
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
          {emoji ? (
            <NoteIconDisplay 
              iconOrEmoji={emoji}
              pack={iconPack || 'meteor'}
              emojiPack={emojiPack || 'system'}
              className={`w-4 h-4 shrink-0 ${
                isFileActive 
                  ? (isDarkMode ? 'text-white' : 'text-zinc-900') 
                  : (isDarkMode ? 'text-zinc-300' : 'text-zinc-700')
              }`}
              emojiClassName="text-base shrink-0 leading-none"
            />
          ) : (
            <CustomFileIcon pack={iconPack || 'meteor'} className={`w-4 h-4 shrink-0 ${
              isFileActive 
                ? (isDarkMode ? 'text-white' : 'text-zinc-900') 
                : (isDarkMode ? 'text-zinc-400' : 'text-zinc-500')
            }`} />
          )}
          <span className="text-sm truncate">
            {fileNode.name.replace(/\.md$/, '')}
          </span>
        </div>

        {/* Quick Icon/Emoji changer button on hover */}
        <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onOpenEmojiPicker && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEmojiPicker(fileNode);
              }}
              className={`p-1.5 rounded-full text-xs transition-colors flex items-center justify-center ${
                isDarkMode ? 'hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800'
              }`}
              title={uiT?.tooltips.changeIconOrEmoji || "Cambiar icono o emoji"}
            >
              <NoteIconDisplay
                iconOrEmoji={emoji}
                pack={iconPack || 'meteor'}
                emojiPack={emojiPack || 'system'}
                className="w-3.5 h-3.5"
                emojiClassName="text-xs leading-none"
                fallback={<Sparkles className="w-3.5 h-3.5" />}
              />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Root Files (Section General if any) */}
      {rootFiles.length > 0 && (
        <div className={`p-2 rounded-[22px] [corner-shape:squircle] transition-colors ${
          isDarkMode ? 'bg-[#181818]/90' : 'bg-[#F8FAFC]'
        }`}>
          <div 
            onClick={() => toggleSection('__root__')}
            className="flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              {collapsedSections['__root__'] ? (
                <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
              ) : (
                <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
              )}
              <span className={`text-sm font-bold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-[#1E293B]'}`}>
                {dict?.sidebar.notes || 'Notas'}
              </span>
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200/70 text-zinc-600'
              }`}>
                {rootFiles.length}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNewFile('');
              }}
              className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all ${
                isDarkMode ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'
              }`}
              title={uiT?.tooltips.newFileInNotes || "Nuevo archivo en Notas"}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {!collapsedSections['__root__'] && (
            <div className="mt-1 space-y-0.5">
              {rootFiles.map(renderNoteItem)}
            </div>
          )}
        </div>
      )}

      {/* Structured Sections (Work, Personal, etc.) matching the reference design */}
      {sectionFolders.map(section => {
        const isCollapsed = !!collapsedSections[section.path];
        const sectionChildren = Object.values(section.children).filter(c => c.name !== '.gitkeep');
        const fileCount = sectionChildren.length;

        return (
          <div 
            key={section.path}
            className={`p-2 rounded-[22px] [corner-shape:squircle] transition-colors ${
              isDarkMode ? 'bg-[#181818]/90' : 'bg-[#F8FAFC]'
            }`}
            onContextMenu={(e) => onFileContextMenu && onFileContextMenu(e, section)}
          >
            {/* Section Header */}
            <div 
              onClick={() => toggleSection(section.path)}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                ) : (
                  <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                )}
                <span className={`text-sm font-bold tracking-tight ${isDarkMode ? 'text-zinc-200' : 'text-[#1E293B]'}`}>
                  {section.name}
                </span>
                {fileCount > 0 && (
                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${
                    isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200/70 text-zinc-600'
                  }`}>
                    {fileCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewFile(section.path);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all ${
                    isDarkMode ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-700'
                  }`}
                  title={`${uiT?.tooltips.newFileInSection || "Nuevo archivo en"} ${section.name}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notes inside this Section */}
            {!isCollapsed && (
              <div className="mt-1 space-y-0.5">
                {sectionChildren.length === 0 ? (
                  <div 
                    onClick={() => onNewFile(section.path)}
                    className={`px-3 py-2 text-xs italic rounded-lg cursor-pointer transition-colors ${
                      isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    {dict?.sidebar.addFirstNote || '+ Agregar primera nota'}
                  </div>
                ) : (
                  sectionChildren.map(renderNoteItem)
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Button to Create New Section */}
      <button
        type="button"
        onClick={onNewSection}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 mb-2 rounded-[20px] [corner-shape:squircle] text-xs font-semibold transition-all duration-150 cursor-pointer ${
          isDarkMode 
            ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 bg-[#181818]/50' 
            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70 bg-zinc-100/80'
        }`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{dict?.sidebar.newSection || 'Nueva sección'}</span>
      </button>
    </div>
  );
};

function subscribeToDarkMode(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getDarkModeSnapshot() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getDarkModeServerSnapshot() {
  return false;
}

export default function App() {
  const [notes, setNotes] = useState<GitItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const [currentPath, setCurrentPath] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [currentSha, setCurrentSha] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [frontMatter, setFrontMatter] = useState<Record<string, string> | null>(null);
  
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const [newFileDir, setNewFileDir] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFileEmoji, setNewFileEmoji] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'file' | 'dir'>('file');

  const [contextMenu, setContextMenu] = useState<{ node: TreeNode; x: number; y: number } | null>(null);
  const [renameNode, setRenameNode] = useState<TreeNode | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [emojiPickerNode, setEmojiPickerNode] = useState<TreeNode | null>(null);

  const [view, setView] = useState<'dashboard' | 'folder' | 'edit' | 'settings' | 'tasks' | 'calendar'>('dashboard');
  const [previousView, setPreviousView] = useState<'dashboard' | 'folder' | 'edit' | 'tasks' | 'calendar'>('dashboard');
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);

  // Note Contents Cache Map
  const [noteContents, setNoteContents] = useState<Record<string, string>>({});

  // Settings State & Hydration Safety
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [noteMetadata, setNoteMetadata] = useState<Record<string, NoteMeta>>({});
  
  // Dashboard Search & Palette Dropdowns
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeColorPickerNote, setActiveColorPickerNote] = useState<string | null>(null);
  const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);
  const [isEditorColorPickerOpen, setIsEditorColorPickerOpen] = useState(false);
  const [isNoteInfoOpen, setIsNoteInfoOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isFontSizeMenuOpen, setIsFontSizeMenuOpen] = useState(false);
  const fontSizeMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFontSizeMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(e.target as Node)) {
        setIsFontSizeMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isFontSizeMenuOpen]);

  // End-to-End Encryption (E2EE) & Export State
  const [e2eePassword, setE2eePassword] = useState<string>('');
  const e2eePasswordRef = useRef<string>('');
  const [encryptedNotePaths, setEncryptedNotePaths] = useState<Record<string, boolean>>({});
  const [lockedNotePaths, setLockedNotePaths] = useState<Record<string, boolean>>({});
  const noteRawFrontMattersRef = useRef<Record<string, string>>({});
  const [batchProgress, setBatchProgress] = useState<{
    active: boolean;
    label: string;
    current: number;
    total: number;
  } | null>(null);
  const [settingsInitialSection, setSettingsInitialSection] = useState<
    'appearance' | 'typography' | 'ai' | 'editor' | 'security' | 'account' | 'docs' | undefined
  >(undefined);
  const [unlockModalState, setUnlockModalState] = useState<{
    path?: string;
    sha?: string;
    rawEncrypted?: string;
    onAfterUnlock?: (pwd: string) => void;
  } | null>(null);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');
  const [unlockShowPassword, setUnlockShowPassword] = useState(false);
  const [unlockRememberDevice, setUnlockRememberDevice] = useState(true);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // AI API Key & Provider Availability State
  const [configuredAiProviders, setConfiguredAiProviders] = useState<Record<string, boolean>>({});
  const [activeAiProvider, setActiveAiProvider] = useState<string>('gemini');

  useEffect(() => {
    const syncAiProvider = () => {
      try {
        const raw = localStorage.getItem('petardo_ai_config');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.activeProvider && typeof parsed.activeProvider === 'string') {
            setActiveAiProvider(parsed.activeProvider);
          }
        }
      } catch {}
    };
    syncAiProvider();

    fetch('/api/gemini/agent')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.configuredProviders) {
          setConfiguredAiProviders(data.configuredProviders);
        }
      })
      .catch(() => {});

    window.addEventListener('storage', syncAiProvider);
    return () => window.removeEventListener('storage', syncAiProvider);
  }, []);

  const isAiKeyConfigured = Boolean(configuredAiProviders[activeAiProvider]);
  const isAiActive = isAiKeyConfigured && settings.aiEnabled !== false;

  // Track system dark mode preference with standard React hook
  const isSystemDark = useSyncExternalStore(subscribeToDarkMode, getDarkModeSnapshot, getDarkModeServerSnapshot);

  const currentThemeMode = settings?.themeMode ?? DEFAULT_SETTINGS.themeMode;
  const isDarkMode = mounted 
    ? (currentThemeMode === 'dark' || (currentThemeMode === 'system' && isSystemDark)) 
    : false;
  const activeLanguage: AppLanguage = settings?.language || 'es';
  const dict = useMemo(() => getDictionary(activeLanguage), [activeLanguage]);
  const uiT = useMemo(() => getUiTranslations(activeLanguage), [activeLanguage]);
  const secT = useMemo(() => getSecurityStrings(activeLanguage), [activeLanguage]);

  // Load saved settings & metadata safely on client mount, with 12.C navigator.language auto-detection
  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      const savedKey = getStoredMasterPassword();
      if (savedKey) {
        e2eePasswordRef.current = savedKey;
        setE2eePassword(savedKey);
      }
      try {
        const savedSettings = localStorage.getItem('webapp_settings');
        const migratedSystemEmoji = localStorage.getItem('webapp_emoji_default_system_v1');
        const browserDetectedLang = detectBrowserLanguage();
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (!migratedSystemEmoji) {
            parsed.emojiPack = 'system';
            localStorage.setItem('webapp_emoji_default_system_v1', '1');
          }
          if (!parsed.language) {
            parsed.language = browserDetectedLang;
          }
          localStorage.setItem('webapp_settings', JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
          setSettings(prev => ({ ...prev, ...parsed }));
        } else {
          const initialWithBrowserLocale: AppSettings = {
            ...DEFAULT_SETTINGS,
            language: browserDetectedLang,
          };
          localStorage.setItem('webapp_emoji_default_system_v1', '1');
          localStorage.setItem('webapp_settings', JSON.stringify(initialWithBrowserLocale));
          setSettings(initialWithBrowserLocale);
        }
      } catch (e) {}
      try {
        const savedMeta = localStorage.getItem('webapp_note_metadata');
        if (savedMeta) {
          setNoteMetadata(JSON.parse(savedMeta));
        }
      } catch (e) {}
    });
  }, []);

  // Sync settings with DOM CSS variables, Google Fonts and Dark class
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Dynamic Google Fonts loader - supports ANY font from the Google Fonts directory
    const loadGoogleFont = (fontName: string, elementId: string) => {
      if (!fontName) return;
      const cleanFont = fontName.trim();
      const lower = cleanFont.toLowerCase();
      if (lower === 'system-ui' || lower === 'sans-serif' || lower === 'monospace') return;

      const formattedName = cleanFont.replace(/\s+/g, '+');
      let linkEl = document.getElementById(elementId) as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = elementId;
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }

      // Try variable weights first, with fallback on error for single-weight/custom Google fonts
      linkEl.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@300;400;500;600;700;800&display=swap`;
      linkEl.onerror = () => {
        if (linkEl) {
          linkEl.href = `https://fonts.googleapis.com/css2?family=${formattedName}&display=swap`;
        }
      };
    };

    const siteFont = settings?.siteFont ?? DEFAULT_SETTINGS.siteFont;
    const codeFont = settings?.codeFont ?? DEFAULT_SETTINGS.codeFont;
    const primaryColor = settings?.primaryColor ?? DEFAULT_SETTINGS.primaryColor;

    loadGoogleFont(siteFont, 'dynamic-google-font-site');
    loadGoogleFont(codeFont, 'dynamic-google-font-code');

    // 2. CSS variables & global body font
    const emojiPack = settings?.emojiPack ?? DEFAULT_SETTINGS.emojiPack;
    document.documentElement.setAttribute('data-emoji-pack', emojiPack);
    const emojiFontStack = emojiPack === 'tossface' ? '"Tossface", "Toss Face", ' : '';
    document.documentElement.style.setProperty('--app-font-sans', `"${siteFont}", ${emojiFontStack}ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`);
    document.documentElement.style.setProperty('--app-font-mono', `"${codeFont}", ${emojiFontStack}ui-monospace, SFMono-Regular, monospace`);
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.body.style.fontFamily = `"${siteFont}", ${emojiFontStack}ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

    // Note typography CSS variables
    const noteFontSize = settings?.noteFontSize || DEFAULT_SETTINGS.noteFontSize || '17px';
    const noteParagraphColorLight = settings?.noteParagraphColorLight || DEFAULT_SETTINGS.noteParagraphColorLight || '#0F172A';
    const noteParagraphColorDark = settings?.noteParagraphColorDark || DEFAULT_SETTINGS.noteParagraphColorDark || '#F4F4F5';
    const noteHeadingColorLight = settings?.noteHeadingColorLight || DEFAULT_SETTINGS.noteHeadingColorLight || '#09090B';
    const noteHeadingColorDark = settings?.noteHeadingColorDark || DEFAULT_SETTINGS.noteHeadingColorDark || '#FAFAFA';

    document.documentElement.style.setProperty('--note-font-size', noteFontSize);
    document.documentElement.style.setProperty('--note-paragraph-color-light', noteParagraphColorLight);
    document.documentElement.style.setProperty('--note-paragraph-color-dark', noteParagraphColorDark);
    document.documentElement.style.setProperty('--note-heading-color-light', noteHeadingColorLight);
    document.documentElement.style.setProperty('--note-heading-color-dark', noteHeadingColorDark);

    // 3. Dark class & HTML lang attribute
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.lang = settings?.language || 'es';
  }, [
    settings?.siteFont, 
    settings?.codeFont, 
    settings?.primaryColor, 
    settings?.emojiPack, 
    settings?.language, 
    settings?.noteFontSize,
    settings?.noteParagraphColorLight,
    settings?.noteParagraphColorDark,
    settings?.noteHeadingColorLight,
    settings?.noteHeadingColorDark,
    isDarkMode
  ]);

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    const updated: AppSettings = { ...settings, ...partial };
    setSettings(updated);
    try {
      localStorage.setItem('webapp_settings', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('webapp_settings', JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {}
    showToast('Configuración restaurada', 'info');
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('webapp_settings', JSON.stringify(newSettings));
    } catch (e) {}
    showToast('Configuración guardada', 'success');
  };

  const updateNoteColor = (path: string, colorId: string) => {
    setNoteMetadata(prev => {
      const updated = {
        ...prev,
        [path]: {
          ...(prev[path] || {}),
          color: colorId,
          updatedAt: Date.now(),
        }
      };
      try {
        localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveColorPickerNote(null);
    setIsEditorColorPickerOpen(false);
    showToast('Color de la nota actualizado', 'info');
  };

  const updateNoteEmoji = (path: string, emoji?: string) => {
    setNoteMetadata(prev => {
      const updated = {
        ...prev,
        [path]: {
          ...(prev[path] || {}),
          emoji: emoji || undefined,
          updatedAt: Date.now(),
        }
      };
      try {
        localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setEmojiPickerNode(null);
    const msg = emoji
      ? (emoji.includes(':') ? `Icono asignado: ${emoji.replace(/^[^:]+:/, '')}` : `Emoji asignado: ${emoji}`)
      : 'Icono restablecido al predeterminado';
    showToast(msg, 'info');
  };

  const togglePinNote = (path: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setNoteMetadata(prev => {
      const isPinned = !prev[path]?.pinned;
      const updated = {
        ...prev,
        [path]: {
          ...(prev[path] || {}),
          pinned: isPinned,
          updatedAt: prev[path]?.updatedAt || Date.now(),
        }
      };
      try {
        localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
      } catch (err) {}
      showToast(isPinned ? 'Nota fijada al inicio' : 'Nota desfijada', 'info');
      return updated;
    });
  };

  const [recentReads, setRecentReads] = useState<string[]>([]);
  const [recentCreates, setRecentCreates] = useState<string[]>([]);

  useEffect(() => {
    try {
      const reads = JSON.parse(localStorage.getItem('webapp_reads') || '[]');
      if (Array.isArray(reads)) {
        queueMicrotask(() => setRecentReads(reads));
      }
    } catch (e) {}
    try {
      const creates = JSON.parse(localStorage.getItem('webapp_creates') || '[]');
      if (Array.isArray(creates)) {
        queueMicrotask(() => setRecentCreates(creates));
      }
    } catch (e) {}
  }, []);

  const addRecentRead = useCallback((path: string) => {
    setRecentReads(prev => {
      const updated = [path, ...prev.filter(p => p !== path)].slice(0, 6);
      localStorage.setItem('webapp_reads', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addRecentCreate = useCallback((path: string) => {
    setRecentCreates(prev => {
      const updated = [path, ...prev.filter(p => p !== path)].slice(0, 6);
      localStorage.setItem('webapp_creates', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [notesRes, userRes] = await Promise.all([
        fetch('/api/notes'),
        fetch('/api/user')
      ]);
      
      const notesData = await notesRes.json();
      if (!notesRes.ok) throw new Error(notesData.error || 'Error al obtener las notas');
      setNotes(notesData.notes || []);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserProfile(userData);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      await Promise.resolve();
      if (!mounted) return;
      setLoading(true);
      setError(null);
      await fetchData();
      if (mounted) setLoading(false);
    };
    init();
    return () => { mounted = false; };
  }, [fetchData]);

  const tree = useMemo(() => {
    const filtered = notes.filter(n => n.name !== '.gitkeep');
    return buildTree(filtered);
  }, [notes]);

  const hasUnsavedChanges = currentContent !== savedContent;

  const guardedNavigation = (action: () => void) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => action);
    } else {
      action();
    }
  };

  const openNoteWithDecryptedContent = useCallback((path: string, shaVal: string, decryptedRaw: string) => {
    setCurrentPath(path);
    setCurrentSha(shaVal);

    const match = decryptedRaw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    let cleanBody = decryptedRaw;
    if (match) {
      const rawFm = match[1];
      cleanBody = match[2];
      noteRawFrontMattersRef.current[path] = `---\n${rawFm}\n---\n`;
      const fmObj: Record<string, string> = {};
      rawFm.split(/\r?\n/).forEach((line: string) => {
        const idx = line.indexOf(':');
        if (idx !== -1) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          if (k) fmObj[k] = v;
        }
      });
      setFrontMatter(fmObj);
    } else {
      noteRawFrontMattersRef.current[path] = '';
      setFrontMatter(null);
    }

    setCurrentContent(cleanBody);
    setSavedContent(cleanBody);
    setNoteContents(prev => ({ ...prev, [path]: cleanBody }));

    const { snippet: snippetText, tasks: extractedTasks } = extractSnippetAndTasks(cleanBody);
    setNoteMetadata(prev => {
      const updated = {
        ...prev,
        [path]: {
          ...(prev[path] || {}),
          snippet: snippetText || prev[path]?.snippet,
          tasks: extractedTasks.length > 0 ? extractedTasks : prev[path]?.tasks,
          updatedAt: prev[path]?.updatedAt || Date.now(),
          createdAt: prev[path]?.createdAt || Date.now(),
        }
      };
      try {
        localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setView('edit');
    addRecentRead(path);
  }, [addRecentRead]);

  const prepareContentForGitHub = useCallback(async (
    plainFullMarkdown: string,
    targetPath?: string,
    forcePassword?: string
  ): Promise<string> => {
    const shouldEncrypt = !!(
      settings.encryptionEnabled ||
      (targetPath && encryptedNotePaths[targetPath])
    );
    if (!shouldEncrypt) {
      return plainFullMarkdown;
    }

    const pwd = forcePassword || e2eePasswordRef.current || getStoredMasterPassword();
    if (!pwd) {
      setUnlockError(null);
      setUnlockPasswordInput('');
      setUnlockModalState({});
      throw new Error(secT.unlockVaultDesc);
    }

    const encrypted = await encryptNoteContent(plainFullMarkdown, pwd);
    if (targetPath) {
      setEncryptedNotePaths(prev => ({ ...prev, [targetPath]: true }));
      setLockedNotePaths(prev => ({ ...prev, [targetPath]: false }));
    }
    return encrypted;
  }, [settings.encryptionEnabled, encryptedNotePaths, secT.unlockVaultDesc]);

  const handleFileClick = async (path: string, sha?: string) => {
    guardedNavigation(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/notes?${encodeNotePathParam(path)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al leer el archivo');

        const rawContent = data.content || '';
        const resolvedSha = data.sha || sha || '';

        if (isEncryptedContent(rawContent)) {
          setEncryptedNotePaths(prev => ({ ...prev, [path]: true }));
          const pwd = e2eePasswordRef.current || getStoredMasterPassword();
          if (pwd) {
            try {
              const decrypted = await decryptNoteContent(rawContent, pwd);
              setLockedNotePaths(prev => ({ ...prev, [path]: false }));
              if (!settings.encryptionEnabled) {
                handleUpdateSettings({ encryptionEnabled: true });
              }
              openNoteWithDecryptedContent(path, resolvedSha, decrypted);
              return;
            } catch {
              // Password missing or did not match -> fall through to unlock modal
            }
          }

          setLockedNotePaths(prev => ({ ...prev, [path]: true }));
          setUnlockError(null);
          setUnlockPasswordInput('');
          setUnlockModalState({
            path,
            sha: resolvedSha,
            rawEncrypted: rawContent,
          });
          return;
        }

        setEncryptedNotePaths(prev => ({ ...prev, [path]: false }));
        setLockedNotePaths(prev => ({ ...prev, [path]: false }));
        openNoteWithDecryptedContent(path, resolvedSha, rawContent);
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleFolderClick = (path: string) => {
    guardedNavigation(() => {
      setCurrentFolder(path);
      setView('folder');
    });
  };

  const handleGoToDashboard = () => {
    guardedNavigation(() => {
      setView('dashboard');
      setCurrentPath('');
      setCurrentFolder('');
    });
  };

  const handleGoToSettings = (section?: 'appearance' | 'typography' | 'ai' | 'editor' | 'security' | 'account' | 'docs') => {
    guardedNavigation(() => {
      if (view !== 'settings') {
        setPreviousView(view);
      }
      setSettingsInitialSection(section);
      setView('settings');
    });
  };

  const handleCreateNew = (dirPath: string = '', initialTitle: string = '') => {
    setNewFileDir(dirPath);
    setNewFileName(initialTitle);
    setNewFileEmoji('');
    setNewItemType('file');
  };

  const handleCreateNewSection = () => {
    setNewFileDir('');
    setNewFileName('');
    setNewFileEmoji('');
    setNewItemType('dir');
  };

  // Global Developer Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!e.key && !e.code) return;
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();
      const isMod = e.metaKey || e.ctrlKey;

      // 1. Paleta de Comandos Universal: Ctrl/Cmd + K or Alt + K
      if ((isMod && !e.shiftKey && !e.altKey && key === 'k') || (e.altKey && !isMod && !e.shiftKey && code === 'KeyK')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // 1b. Buscar notas en Panel Principal: Alt + F
      if (e.altKey && !isMod && !e.shiftKey && code === 'KeyF') {
        e.preventDefault();
        guardedNavigation(() => {
          if (view !== 'dashboard') {
            setView('dashboard');
            setCurrentPath('');
            setCurrentFolder('');
          }
          setTimeout(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
          }, 50);
        });
        return;
      }

      // 2. Ocultar / Mostrar Sidebar: Ctrl/Cmd + B or Alt + S
      if ((isMod && !e.shiftKey && !e.altKey && key === 'b') || (e.altKey && !isMod && !e.shiftKey && code === 'KeyS')) {
        e.preventDefault();
        setIsSidebarCollapsed(prev => {
          const next = !prev;
          showToast(next ? 'Barra lateral oculta' : 'Barra lateral visible', 'info');
          return next;
        });
        return;
      }

      // 3. Entrar / Salir de Ajustes: Ctrl/Cmd + , or Alt + P
      if ((isMod && !e.shiftKey && !e.altKey && (key === ',' || code === 'Comma')) || (e.altKey && !isMod && !e.shiftKey && code === 'KeyP')) {
        e.preventDefault();
        if (view === 'settings') {
          guardedNavigation(() => {
            setView(previousView || 'dashboard');
            showToast('Saliendo de Configuración', 'info');
          });
        } else {
          handleGoToSettings();
          showToast('Vista: Configuración', 'info');
        }
        return;
      }

      // 4. Ciclar Modo de Tema (Claro -> Oscuro -> Automático): Alt + L or Ctrl/Cmd + Shift + L
      if ((e.altKey && !isMod && !e.shiftKey && code === 'KeyL') || (isMod && e.shiftKey && !e.altKey && key === 'l')) {
        e.preventDefault();
        const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
        const currentIdx = order.indexOf(settings.themeMode);
        const nextMode = order[(currentIdx + 1) % order.length];
        const modeLabels: Record<'light' | 'dark' | 'system', string> = {
          light: 'Modo Claro ☀️',
          dark: 'Modo Oscuro 🌙',
          system: 'Modo Automático (Sistema) 💻',
        };
        const updated: AppSettings = { ...settings, themeMode: nextMode };
        setSettings(updated);
        try {
          localStorage.setItem('webapp_settings', JSON.stringify(updated));
        } catch (err) {}
        showToast(`Tema cambiado a: ${modeLabels[nextMode]}`, 'info');
        return;
      }

      // 5. Cambiar diseño de la vista principal (Cuadrícula <-> Lista): Alt + V or Ctrl/Cmd + Shift + V
      if ((e.altKey && !isMod && !e.shiftKey && code === 'KeyV') || (isMod && e.shiftKey && !e.altKey && key === 'v')) {
        e.preventDefault();
        const nextLayout = settings.listLayout === 'grid' ? 'compact' : 'grid';
        const updated: AppSettings = { ...settings, listLayout: nextLayout };
        setSettings(updated);
        try {
          localStorage.setItem('webapp_settings', JSON.stringify(updated));
        } catch (err) {}
        showToast(
          nextLayout === 'grid' ? 'Diseño de vista: Cuadrícula' : 'Diseño de vista: Lista',
          'info'
        );
        return;
      }

      // 5b. Activar / Desactivar Modo Enfoque (Máquina de Escribir): Alt + Z or Ctrl/Cmd + Shift + F
      if ((e.altKey && !isMod && !e.shiftKey && code === 'KeyZ') || (isMod && e.shiftKey && !e.altKey && key === 'f')) {
        e.preventDefault();
        const nextFocus = !settings.focusMode;
        const updated: AppSettings = { ...settings, focusMode: nextFocus };
        setSettings(updated);
        try {
          localStorage.setItem('webapp_settings', JSON.stringify(updated));
        } catch (err) {}
        showToast(
          nextFocus
            ? 'Modo Enfoque (Máquina de Escribir) activado'
            : 'Modo Enfoque desactivado',
          'info'
        );
        return;
      }

      // Alt-based Developer Navigation & Actions
      if (e.altKey && !isMod) {
        // 6. Crear nueva sección: Alt + Shift + N
        if (e.shiftKey && code === 'KeyN') {
          e.preventDefault();
          handleCreateNewSection();
          showToast('Crear nueva sección', 'info');
          return;
        }

        if (!e.shiftKey) {
          // 7. Crear nueva nota: Alt + N
          if (code === 'KeyN') {
            e.preventDefault();
            handleCreateNew(view === 'folder' ? currentFolder : '');
            showToast('Crear nueva nota', 'info');
            return;
          }

          // 8. Ir al Panel principal: Alt + D or Alt + 1
          if (code === 'KeyD' || code === 'Digit1') {
            e.preventDefault();
            handleGoToDashboard();
            showToast('Vista: Panel principal', 'info');
            return;
          }

          // 9. Ir a Todas las tareas: Alt + T or Alt + 2
          if (code === 'KeyT' || code === 'Digit2') {
            e.preventDefault();
            guardedNavigation(() => {
              setView('tasks');
              showToast('Vista: Todas las tareas', 'info');
            });
            return;
          }

          // 10. Ir a Calendario: Alt + C or Alt + 3
          if (code === 'KeyC' || code === 'Digit3') {
            e.preventDefault();
            guardedNavigation(() => {
              setView('calendar');
              showToast('Vista: Calendario', 'info');
            });
            return;
          }

          // 11. Ordenar por Última edición: Alt + M
          if (code === 'KeyM') {
            e.preventDefault();
            const updated: AppSettings = { ...settings, sortBy: 'modified' };
            setSettings(updated);
            try {
              localStorage.setItem('webapp_settings', JSON.stringify(updated));
            } catch (err) {}
            showToast('Ordenado por: Última edición', 'info');
            return;
          }

          // 12. Ordenar por Fecha de creación: Alt + R
          if (code === 'KeyR') {
            e.preventDefault();
            const updated: AppSettings = { ...settings, sortBy: 'created' };
            setSettings(updated);
            try {
              localStorage.setItem('webapp_settings', JSON.stringify(updated));
            } catch (err) {}
            showToast('Ordenado por: Fecha de creación', 'info');
            return;
          }

          // 13. Ordenar por Título (A-Z): Alt + A
          if (code === 'KeyA') {
            e.preventDefault();
            const updated: AppSettings = { ...settings, sortBy: 'name' };
            setSettings(updated);
            try {
              localStorage.setItem('webapp_settings', JSON.stringify(updated));
            } catch (err) {}
            showToast('Ordenado por: Título (A-Z)', 'info');
            return;
          }

          // 14. Ciclar modo de ordenamiento: Alt + O
          if (code === 'KeyO') {
            e.preventDefault();
            const sortCycle: Array<'modified' | 'created' | 'name'> = ['modified', 'created', 'name'];
            const nextSort = sortCycle[(sortCycle.indexOf(settings.sortBy) + 1) % sortCycle.length];
            const sortLabels: Record<'modified' | 'created' | 'name', string> = {
              modified: 'Última edición',
              created: 'Fecha de creación',
              name: 'Título (A-Z)',
            };
            const updated: AppSettings = { ...settings, sortBy: nextSort };
            setSettings(updated);
            try {
              localStorage.setItem('webapp_settings', JSON.stringify(updated));
            } catch (err) {}
            showToast(`Ordenado por: ${sortLabels[nextSort]}`, 'info');
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  const handleSave = async () => {
    if (!currentPath || isSaving || !hasUnsavedChanges) return;
    try {
      setIsSaving(true);
      
      let fullContent = currentContent;
      if (frontMatter && Object.keys(frontMatter).length > 0) {
        const fmLines = Object.entries(frontMatter).map(([k, v]) => `${k}: ${v}`).join('\n');
        fullContent = `---\n${fmLines}\n---\n${currentContent}`;
        noteRawFrontMattersRef.current[currentPath] = `---\n${fmLines}\n---\n`;
      } else {
        noteRawFrontMattersRef.current[currentPath] = '';
      }

      const contentForGitHub = await prepareContentForGitHub(fullContent, currentPath);

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentPath,
          content: contentForGitHub,
          sha: currentSha
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');
      
      setSavedContent(currentContent);
      if (data.content && data.content.sha) {
        setCurrentSha(data.content.sha);
      }
      
      // Update snippet, tasks & timestamp in metadata
      const { snippet: snippetText, tasks: extractedTasks } = extractSnippetAndTasks(currentContent);
      setNoteMetadata(prev => {
        const updated = {
          ...prev,
          [currentPath]: {
            ...(prev[currentPath] || {}),
            snippet: snippetText,
            tasks: extractedTasks,
            updatedAt: Date.now(),
          }
        };
        try {
          localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      showToast('Guardado exitosamente', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const availableSections = useMemo(() => {
    const sections = new Set<string>();
    notes.forEach(n => {
      if (n.type === 'dir' && n.name !== '.gitkeep') {
        sections.add(n.path);
      } else if (n.path.includes('/')) {
        const folder = n.path.substring(0, n.path.lastIndexOf('/'));
        if (folder) sections.add(folder);
      }
    });
    return Array.from(sections).sort();
  }, [notes]);

  const confirmCreateNew = async () => {
    if (!newFileName.trim()) return;
    const finalName = newItemType === 'file' 
      ? (newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`)
      : newFileName;
    const fullPath = newFileDir ? `${newFileDir}/${finalName}` : finalName;
    
    try {
      setIsSaving(true);
      const initialPlain = newItemType === 'dir' ? '' : `# ${newFileName.replace(/\.md$/, '')}\n\n`;
      const contentForGitHub = newItemType === 'dir'
        ? ''
        : await prepareContentForGitHub(initialPlain, fullPath);

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: newItemType === 'dir' ? `${fullPath}/.gitkeep` : fullPath,
          content: contentForGitHub,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear');
      
      const emojiToSave = newFileEmoji.trim();
      setNewFileDir(null);
      setNewFileName('');
      setNewFileEmoji('');
      await fetchData();

      if (newItemType === 'file') {
        setNoteMetadata(prev => {
          const updated = {
            ...prev,
            [fullPath]: {
              createdAt: Date.now(),
              updatedAt: Date.now(),
              color: 'default',
              emoji: emojiToSave || undefined,
            }
          };
          try {
            localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        addRecentCreate(fullPath);
        handleFileClick(fullPath, data.content?.sha || '');
      } else {
        handleFolderClick(fullPath);
      }
      showToast(`${newItemType === 'file' ? 'Archivo' : 'Sección'} creado`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    setContextMenu({ node, x: e.clientX, y: e.clientY });
  };

  const handleDeleteItem = async (node: TreeNode) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar ${node.name}?`)) return;
    try {
      setIsSaving(true);
      if (node.type === 'file') {
        const res = await fetch(`/api/notes?${encodeNotePathParam(node.path)}&sha=${node.sha}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al eliminar');
        }
      } else {
        // Delete directory items
        const toDelete = notes.filter(n => n.path.startsWith(`${node.path}/`));
        for (const item of toDelete) {
          await fetch(`/api/notes?${encodeNotePathParam(item.path)}&sha=${item.sha}`, {
            method: 'DELETE'
          });
        }
      }
      
      showToast('Eliminado con éxito', 'success');
      setContextMenu(null);
      if (currentPath === node.path || currentPath.startsWith(`${node.path}/`)) {
        setView('dashboard');
        setCurrentPath('');
      }
      await fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRename = async () => {
    if (!renameNode || !renameValue.trim() || renameValue === renameNode.name) {
      setRenameNode(null);
      return;
    }
    
    try {
      setIsSaving(true);
      const parts = renameNode.path.split('/');
      parts[parts.length - 1] = renameValue.trim();
      const newPath = parts.join('/');

      if (renameNode.type === 'file') {
        // Fetch content
        const resRead = await fetch(`/api/notes?${encodeNotePathParam(renameNode.path)}`);
        const dataRead = await resRead.json();
        if (!resRead.ok) throw new Error('No se pudo leer el archivo original');

        // Create new
        const resCreate = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: newPath,
            content: dataRead.content || '',
          })
        });
        if (!resCreate.ok) throw new Error('No se pudo crear con el nuevo nombre');

        // Delete old
        await fetch(`/api/notes?${encodeNotePathParam(renameNode.path)}&sha=${renameNode.sha}`, {
          method: 'DELETE'
        });

        // Migrate metadata & cached contents/encryption flags
        setNoteMetadata(prev => {
          const oldMeta = prev[renameNode.path] || {};
          const updated = { ...prev, [newPath]: oldMeta };
          delete updated[renameNode.path];
          try {
            localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        setNoteContents(prev => {
          if (!(renameNode.path in prev)) return prev;
          const next = { ...prev, [newPath]: prev[renameNode.path] };
          delete next[renameNode.path];
          return next;
        });
        setEncryptedNotePaths(prev => {
          if (!(renameNode.path in prev)) return prev;
          const next = { ...prev, [newPath]: prev[renameNode.path] };
          delete next[renameNode.path];
          return next;
        });
        if (noteRawFrontMattersRef.current[renameNode.path]) {
          noteRawFrontMattersRef.current[newPath] = noteRawFrontMattersRef.current[renameNode.path];
          delete noteRawFrontMattersRef.current[renameNode.path];
        }

        if (currentPath === renameNode.path) {
          setCurrentPath(newPath);
        }
      }

      showToast('Renombrado con éxito', 'success');
      setRenameNode(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (newVal: string) => {
    setCurrentContent(newVal);
    if (currentPath) {
      setNoteContents(prev => ({ ...prev, [currentPath]: newVal }));
    }
  };

  const handleToggleTaskInNote = async (notePath: string, lineIndex: number, currentCompleted: boolean) => {
    try {
      let content = noteContents[notePath];
      if (!content) {
        const res = await fetch(`/api/notes?${encodeNotePathParam(notePath)}`);
        if (res.ok) {
          const data = await res.json();
          let raw = data.content || '';
          if (isEncryptedContent(raw)) {
            setEncryptedNotePaths(prev => ({ ...prev, [notePath]: true }));
            const pwd = e2eePasswordRef.current || getStoredMasterPassword();
            if (!pwd) {
              setUnlockModalState({ path: notePath, rawEncrypted: raw });
              return;
            }
            raw = await decryptNoteContent(raw, pwd);
          }
          const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
          noteRawFrontMattersRef.current[notePath] = match ? `---\n${match[1]}\n---\n` : '';
          content = match ? match[2] : raw;
        }
      }
      if (!content) return;

      const lines = content.split('\n');
      if (lineIndex < 0 || lineIndex >= lines.length) return;

      const line = lines[lineIndex];
      if (currentCompleted) {
        lines[lineIndex] = line.replace(/\[[xX]\]/, '[ ]');
      } else {
        lines[lineIndex] = line.replace(/\[\s*\]/, '[x]');
      }

      const newContent = sortMarkdownTaskLists(lines.join('\n'));
      setNoteContents(prev => ({ ...prev, [notePath]: newContent }));
      if (notePath === currentPath) {
        setCurrentContent(newContent);
        setSavedContent(newContent);
      }

      const fmPrefix = noteRawFrontMattersRef.current[notePath] || '';
      const fullPlainToSave = `${fmPrefix}${newContent}`;
      const contentForGitHub = await prepareContentForGitHub(fullPlainToSave, notePath);

      // Save update to API
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: notePath,
          content: contentForGitHub
        })
      });

      const { snippet, tasks } = extractSnippetAndTasks(newContent);
      setNoteMetadata(prev => ({
        ...prev,
        [notePath]: {
          ...(prev[notePath] || {}),
          snippet,
          tasks,
          updatedAt: Date.now()
        }
      }));

      showToast(currentCompleted ? 'Tarea marcada como pendiente' : 'Tarea completada', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar tarea', 'error');
    }
  };

  const handleCreateDailyNote = async (dateStr: string) => {
    const notePath = `diario/${dateStr}.md`;

    const existing = notes.find(n => n.path === notePath || n.path === `${dateStr}.md`);
    if (existing) {
      handleFileClick(existing.path);
      return;
    }

    const [yyyy, mm, dd] = dateStr.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = monthNames[parseInt(mm, 10) - 1] || mm;

    const initialContent = `# 📝 Nota Diaria - ${dd} de ${monthName}, ${yyyy}\n\n## 📋 Tareas del Día\n- [ ] \n\n## 📌 Notas y Bitácora\n- \n`;

    try {
      setIsSaving(true);
      const contentForGitHub = await prepareContentForGitHub(initialContent, notePath);
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: notePath,
          content: contentForGitHub
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear la nota diaria');
      }

      setNoteMetadata(prev => ({
        ...prev,
        [notePath]: {
          ...(prev[notePath] || {}),
          emoji: '📅',
          title: `Nota Diaria - ${dd} de ${monthName}`,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      }));

      setCurrentPath(notePath);
      setCurrentContent(initialContent);
      setSavedContent(initialContent);
      setNoteContents(prev => ({ ...prev, [notePath]: initialContent }));
      setView('edit');
      showToast(`Nota diaria para ${dateStr} creada`, 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Total pending tasks count across all notes in repository
  const pendingTasksCount = useMemo(() => {
    let count = 0;

    notes.forEach(note => {
      if (note.type !== 'file' || !note.path.endsWith('.md')) return;

      const content = noteContents[note.path];
      if (content) {
        const lines = content.split('\n');
        lines.forEach(line => {
          const match = line.match(/^[-*+]\s*\[([ xX])\]\s*(.+)$/);
          if (match && match[1].toLowerCase() !== 'x') {
            count++;
          }
        });
      } else if (noteMetadata[note.path]?.tasks) {
        count += (noteMetadata[note.path]?.tasks || []).filter(t => !t.completed).length;
      }
    });

    return count;
  }, [notes, noteContents, noteMetadata]);

  const handleInsertContentFromAgent = (snippet: string) => {
    setCurrentContent(prev => {
      const updated = prev ? `${prev}\n\n${snippet}` : snippet;
      return updated;
    });
  };

  const handleCreateFileFromAgent = (fileName: string, content: string) => {
    setNewFileDir('');
    setNewFileName(fileName);
    confirmCreateNew();
  };

  // Filtered & Sorted Notes for Dashboard
  const filteredAndSortedNotes = useMemo(() => {
    const fileNotes = notes.filter(n => n.type === 'file' && n.name !== '.gitkeep');
    
    // 1. Search Filter
    const searched = searchQuery.trim()
      ? fileNotes.filter(n => 
          n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          n.path.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : fileNotes;

    // 2. Sort: Pinned notes always first, then respect sort preference
    return [...searched].sort((a, b) => {
      const aPinned = !!noteMetadata[a.path]?.pinned;
      const bPinned = !!noteMetadata[b.path]?.pinned;
      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1;
      }
      if (settings.sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        return settings.sortOrder === 'asc' ? cmp : -cmp;
      }
      if (settings.sortBy === 'created') {
        const aTime = noteMetadata[a.path]?.createdAt || 0;
        const bTime = noteMetadata[b.path]?.createdAt || 0;
        const cmp = aTime - bTime;
        return settings.sortOrder === 'asc' ? cmp : -cmp;
      }
      // Modified (default)
      const aTime = noteMetadata[a.path]?.updatedAt || (recentReads.includes(a.path) ? 1000000000 - recentReads.indexOf(a.path) : 0);
      const bTime = noteMetadata[b.path]?.updatedAt || (recentReads.includes(b.path) ? 1000000000 - recentReads.indexOf(b.path) : 0);
      const cmp = aTime - bTime;
      return settings.sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [notes, searchQuery, settings.sortBy, settings.sortOrder, noteMetadata, recentReads]);

  // Lazy background loader for notes without cached snippet or content (deduplicated via ref)
  const loadedNotePathsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!notes.length) return;
    const fileNotes = notes.filter(n => n.type === 'file' && n.name !== '.gitkeep');
    const missing = fileNotes.filter(n => !loadedNotePathsRef.current.has(n.path));
    if (!missing.length) return;

    let cancelled = false;
    const loadMissingSnippets = async () => {
      for (const item of missing.slice(0, 15)) {
        if (cancelled) break;
        loadedNotePathsRef.current.add(item.path);
        try {
          const res = await fetch(`/api/notes?${encodeNotePathParam(item.path)}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (typeof data.content === 'string' && !cancelled) {
            let raw = data.content || '';
            if (isEncryptedContent(raw)) {
              setEncryptedNotePaths(prev => ({ ...prev, [item.path]: true }));
              const pwd = e2eePasswordRef.current || getStoredMasterPassword();
              if (!pwd) {
                setLockedNotePaths(prev => ({ ...prev, [item.path]: true }));
                continue;
              }
              try {
                raw = await decryptNoteContent(raw, pwd);
                setLockedNotePaths(prev => ({ ...prev, [item.path]: false }));
              } catch {
                setLockedNotePaths(prev => ({ ...prev, [item.path]: true }));
                continue;
              }
            } else {
              setEncryptedNotePaths(prev => ({ ...prev, [item.path]: false }));
              setLockedNotePaths(prev => ({ ...prev, [item.path]: false }));
            }

            const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
            noteRawFrontMattersRef.current[item.path] = match ? `---\n${match[1]}\n---\n` : '';
            const body = match ? match[2] : raw;
            setNoteContents(prev => ({ ...prev, [item.path]: body }));
            const { snippet, tasks } = extractSnippetAndTasks(body);
            setNoteMetadata(prev => {
              const updated = {
                ...prev,
                [item.path]: {
                  ...(prev[item.path] || {}),
                  snippet,
                  tasks,
                  updatedAt: prev[item.path]?.updatedAt || Date.now(),
                }
              };
              try {
                localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
          }
        } catch (e) {}
      }
    };
    loadMissingSnippets();
    return () => { cancelled = true; };
  }, [notes, e2eePassword]);

  const getFolderNode = (folderPath: string, rootTree: TreeNode): TreeNode | null => {
    if (!folderPath) return rootTree;
    const parts = folderPath.split('/');
    let current: TreeNode | undefined = rootTree;
    for (const part of parts) {
      if (!current || !current.children[part]) return null;
      current = current.children[part];
    }
    return current || null;
  };

  const activeNoteColorObj = getNoteColor(noteMetadata[currentPath]?.color);
  const currentNoteStats = useMemo(() => calculateNoteStats(currentContent, uiT.noteInfo.minRead), [currentContent, uiT.noteInfo.minRead]);
  const currentNoteToc = useMemo(() => extractTableOfContents(currentContent), [currentContent]);
  const [activeTocIndex, setActiveTocIndex] = useState<number | null>(null);
  const [collapsedInfoSections, setCollapsedInfoSections] = useState<{ stats?: boolean; toc?: boolean }>({});
  const editorScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Build note options for [[Sub-nota]] autocomplete menu and embedded sub-note card previews
  const wikiLinkNoteOptions = useMemo(() => {
    return notes
      .filter((n) => n.type === 'file' && n.name !== '.gitkeep' && n.name.endsWith('.md'))
      .map((n) => {
        const cleanTitle = n.name.replace(/\.md$/i, '');
        const parts = n.path.split('/');
        const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
        const liveContent = n.path === currentPath ? currentContent : noteContents[n.path];
        const snippet =
          (liveContent ? extractSnippetAndTasks(liveContent).snippet : '') ||
          noteMetadata[n.path]?.snippet ||
          '';
        return {
          path: n.path,
          name: n.name,
          title: cleanTitle,
          folder,
          emoji: noteMetadata[n.path]?.emoji,
          snippet,
          pinned: !!noteMetadata[n.path]?.pinned,
          parentPath: noteMetadata[n.path]?.parentPath,
        };
      });
  }, [notes, noteMetadata, noteContents, currentPath, currentContent]);

  // Helper to resolve a Sub-Note target string to an existing GitItem note
  const resolveWikiLinkTargetNote = useCallback(
    (targetStr: string): GitItem | undefined => {
      const clean = targetStr.trim().replace(/\.md$/i, '').toLowerCase();
      if (!clean) return undefined;
      return notes.find((n) => {
        if (n.type !== 'file' || n.name === '.gitkeep') return false;
        const nameNoExt = n.name.replace(/\.md$/i, '').toLowerCase();
        const pathNoExt = n.path.replace(/\.md$/i, '').toLowerCase();
        return pathNoExt === clean || nameNoExt === clean;
      });
    },
    [notes]
  );

  // Create or open a Notion/Craft-style Sub-Note inside the current note
  const handleOpenWikiLink = useCallback(
    async (
      rawTarget: string,
      options?: { backgroundCreateOnly?: boolean; parentMarkdown?: string }
    ) => {
      const cleanTarget = rawTarget.trim().replace(/\.md$/i, '');
      if (!cleanTarget) return;

      const backgroundCreateOnly = !!options?.backgroundCreateOnly;
      const parentMdToSave = options?.parentMarkdown ?? currentContent;

      // Save the parent note first if it has the newly embedded [[Sub-nota]]
      if (currentPath && parentMdToSave && parentMdToSave !== savedContent) {
        try {
          const fmPrefix = noteRawFrontMattersRef.current[currentPath] || '';
          const fullParentPlain = `${fmPrefix}${parentMdToSave}`;
          const parentForGitHub = await prepareContentForGitHub(fullParentPlain, currentPath);
          await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: currentPath,
              content: parentForGitHub,
            }),
          });
          setSavedContent(parentMdToSave);
          setNoteContents((prev) => ({ ...prev, [currentPath]: parentMdToSave }));
        } catch {}
      }

      const existing = resolveWikiLinkTargetNote(cleanTarget);
      if (existing) {
        // Associate existing note with this parent note if not already set
        if (currentPath && existing.path !== currentPath) {
          setNoteMetadata((prev) => {
            const updated = {
              ...prev,
              [existing.path]: {
                ...(prev[existing.path] || {}),
                parentPath: prev[existing.path]?.parentPath || currentPath,
              },
            };
            try {
              localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
        if (!backgroundCreateOnly) {
          handleFileClick(existing.path);
        }
        return;
      }

      // Sub-note doesn't exist yet -> create it nested under the current note's folder
      const currentParts = currentPath ? currentPath.split('/') : [];
      const currentDir = currentParts.length > 1 ? currentParts.slice(0, -1).join('/') : '';
      const newNotePath = cleanTarget.includes('/')
        ? `${cleanTarget}.md`
        : currentDir
          ? `${currentDir}/${cleanTarget}.md`
          : `${cleanTarget}.md`;

      const noteHeading = cleanTarget.split('/').pop() || cleanTarget;
      const initialContent = `# ${noteHeading}\n\n${uiT.subnotes.initialBodyPrompt}\n`;

      try {
        setIsSaving(true);
        const contentForGitHub = await prepareContentForGitHub(initialContent, newNotePath);
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: newNotePath,
            content: contentForGitHub,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error al crear la sub-nota');
        }

        const { snippet, tasks } = extractSnippetAndTasks(initialContent);
        const parentNotePath = currentPath || undefined;
        setNoteMetadata((prev) => {
          const updated = {
            ...prev,
            [newNotePath]: {
              ...(prev[newNotePath] || {}),
              snippet,
              tasks,
              parentPath: parentNotePath,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          };
          try {
            localStorage.setItem('webapp_note_metadata', JSON.stringify(updated));
          } catch {}
          return updated;
        });

        setNoteContents((prev) => ({ ...prev, [newNotePath]: initialContent }));
        await fetchData();

        if (backgroundCreateOnly) {
          showToast(`«${noteHeading}» ${uiT.subnotes.createdInNoteToast}`, 'success');
        } else {
          setCurrentPath(newNotePath);
          setCurrentContent(initialContent);
          setSavedContent(initialContent);
          setView('edit');
          showToast(`«${noteHeading}» ${uiT.subnotes.openedToast}`, 'success');
        }
      } catch (err: any) {
        showToast(err.message || 'No se pudo crear la sub-nota', 'error');
      } finally {
        setIsSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPath, currentContent, savedContent, resolveWikiLinkTargetNote, prepareContentForGitHub]
  );

  // ============================================================================
  // E2EE VAULT MANAGEMENT & EXPORT (.MD / .ZIP) HANDLERS
  // ============================================================================
  const encryptedNotesCount = useMemo(() => {
    return Object.values(encryptedNotePaths).filter(Boolean).length;
  }, [encryptedNotePaths]);

  const handleUnlockVault = useCallback(async (candidatePassword: string, rememberDevice = true): Promise<boolean> => {
    const cleanPwd = candidatePassword;
    if (!cleanPwd) return false;

    // 1. If unlock modal has a specific encrypted note payload, verify against it
    if (unlockModalState?.rawEncrypted && isEncryptedContent(unlockModalState.rawEncrypted)) {
      try {
        const decrypted = await decryptNoteContent(unlockModalState.rawEncrypted, cleanPwd);
        e2eePasswordRef.current = cleanPwd;
        setE2eePassword(cleanPwd);
        setStoredMasterPassword(cleanPwd, rememberDevice);
        if (!settings.encryptionEnabled) {
          handleUpdateSettings({ encryptionEnabled: true });
        }

        // Re-trigger background decryption for any locked notes
        Object.keys(lockedNotePaths).forEach(p => {
          if (lockedNotePaths[p]) loadedNotePathsRef.current.delete(p);
        });
        setLockedNotePaths({});

        const targetPath = unlockModalState.path;
        const targetSha = unlockModalState.sha || '';
        const afterCb = unlockModalState.onAfterUnlock;
        setUnlockModalState(null);
        setUnlockPasswordInput('');
        setUnlockError(null);

        if (targetPath && !afterCb) {
          openNoteWithDecryptedContent(targetPath, targetSha, decrypted);
        }
        if (afterCb) {
          afterCb(cleanPwd);
        }
        showToast(secT.toastVaultUnlocked, 'success');
        return true;
      } catch {
        return false;
      }
    }

    // 2. If settings has a verifier, verify against it
    if (settings.e2eeVerifier) {
      const valid = await verifyVaultPassword(settings.e2eeVerifier, cleanPwd);
      if (!valid) return false;
    } else {
      // 3. Otherwise, check against any encrypted note on GitHub if one exists
      const mdFiles = notes.filter(n => n.type === 'file' && n.name !== '.gitkeep' && n.path.endsWith('.md'));
      for (const file of mdFiles) {
        try {
          const res = await fetch(`/api/notes?${encodeNotePathParam(file.path)}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (isEncryptedContent(data.content)) {
            await decryptNoteContent(data.content, cleanPwd);
            break;
          }
        } catch {
          return false;
        }
      }
    }

    e2eePasswordRef.current = cleanPwd;
    setE2eePassword(cleanPwd);
    setStoredMasterPassword(cleanPwd, rememberDevice);
    Object.keys(lockedNotePaths).forEach(p => {
      if (lockedNotePaths[p]) loadedNotePathsRef.current.delete(p);
    });
    setLockedNotePaths({});

    const afterCb = unlockModalState?.onAfterUnlock;
    setUnlockModalState(null);
    setUnlockPasswordInput('');
    setUnlockError(null);
    if (afterCb) {
      afterCb(cleanPwd);
    }
    showToast(secT.toastVaultUnlocked, 'success');
    return true;
  }, [unlockModalState, settings.encryptionEnabled, settings.e2eeVerifier, lockedNotePaths, notes, openNoteWithDecryptedContent, secT.toastVaultUnlocked]);

  const handleEncryptAllRepoNotesRef = useRef<(overridePassword?: string) => Promise<void>>(null as any);

  const handleEncryptAllRepoNotes = useCallback(async (overridePassword?: string) => {
    const pwd = overridePassword || e2eePasswordRef.current || getStoredMasterPassword();
    if (!pwd) {
      setUnlockError(null);
      setUnlockPasswordInput('');
      setUnlockModalState({
        onAfterUnlock: (unlockedPwd) => {
          handleEncryptAllRepoNotesRef.current?.(unlockedPwd);
        },
      });
      return;
    }

    const mdFiles = notes.filter(n => n.type === 'file' && n.name !== '.gitkeep' && n.path.endsWith('.md'));
    if (!mdFiles.length) {
      showToast(secT.toastEncryptionEnabled, 'success');
      return;
    }

    setBatchProgress({
      active: true,
      label: secT.batchProgressEncrypting,
      current: 0,
      total: mdFiles.length,
    });

    try {
      for (let i = 0; i < mdFiles.length; i++) {
        const file = mdFiles[i];
        setBatchProgress({
          active: true,
          label: secT.batchProgressEncrypting,
          current: i + 1,
          total: mdFiles.length,
        });

        const res = await fetch(`/api/notes?${encodeNotePathParam(file.path)}`);
        if (!res.ok) continue;
        const data = await res.json();
        const raw = data.content || '';

        if (!isEncryptedContent(raw)) {
          const encrypted = await encryptNoteContent(raw, pwd);
          await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: file.path,
              content: encrypted,
              sha: data.sha || file.sha,
              message: `Encrypt ${file.path} (AES-256-GCM E2EE)`,
            }),
          });
        }

        setEncryptedNotePaths(prev => ({ ...prev, [file.path]: true }));
        setLockedNotePaths(prev => ({ ...prev, [file.path]: false }));
      }
      await fetchData();
      showToast(secT.toastEncryptionEnabled, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al cifrar notas', 'error');
    } finally {
      setBatchProgress(null);
    }
  }, [notes, fetchData, secT.batchProgressEncrypting, secT.toastEncryptionEnabled]);

  useEffect(() => {
    handleEncryptAllRepoNotesRef.current = handleEncryptAllRepoNotes;
  }, [handleEncryptAllRepoNotes]);

  const handleEnableEncryption = useCallback(async (password: string, rememberDevice: boolean): Promise<boolean> => {
    try {
      const verifier = await createVaultVerifier(password);
      e2eePasswordRef.current = password;
      setE2eePassword(password);
      setStoredMasterPassword(password, rememberDevice);
      handleUpdateSettings({
        encryptionEnabled: true,
        e2eeVerifier: verifier,
      });
      await handleEncryptAllRepoNotes(password);
      return true;
    } catch {
      return false;
    }
  }, [handleEncryptAllRepoNotes]);

  const handleDisableEncryptionRef = useRef<(overridePassword?: string) => Promise<boolean>>(null as any);

  const handleDisableEncryption = useCallback(async (overridePassword?: string): Promise<boolean> => {
    const pwd = overridePassword || e2eePasswordRef.current || getStoredMasterPassword();
    const mdFiles = notes.filter(n => n.type === 'file' && n.name !== '.gitkeep' && n.path.endsWith('.md'));

    if (settings.e2eeVerifier && pwd) {
      const valid = await verifyVaultPassword(settings.e2eeVerifier, pwd);
      if (!valid) return false;
    }

    setBatchProgress({
      active: true,
      label: secT.batchProgressDecrypting,
      current: 0,
      total: mdFiles.length,
    });

    try {
      for (let i = 0; i < mdFiles.length; i++) {
        const file = mdFiles[i];
        setBatchProgress({
          active: true,
          label: secT.batchProgressDecrypting,
          current: i + 1,
          total: mdFiles.length,
        });

        const res = await fetch(`/api/notes?${encodeNotePathParam(file.path)}`);
        if (!res.ok) continue;
        const data = await res.json();
        const raw = data.content || '';

        if (isEncryptedContent(raw)) {
          if (!pwd) {
            setBatchProgress(null);
            setUnlockModalState({
              path: file.path,
              rawEncrypted: raw,
              onAfterUnlock: (unlockedPwd) => {
                handleDisableEncryptionRef.current?.(unlockedPwd);
              },
            });
            return false;
          }
          const decryptedPlain = await decryptNoteContent(raw, pwd);
          await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: file.path,
              content: decryptedPlain,
              sha: data.sha || file.sha,
              message: `Decrypt ${file.path} to plaintext`,
            }),
          });
        }
        setEncryptedNotePaths(prev => ({ ...prev, [file.path]: false }));
        setLockedNotePaths(prev => ({ ...prev, [file.path]: false }));
      }

      clearStoredMasterPassword();
      e2eePasswordRef.current = '';
      setE2eePassword('');
      handleUpdateSettings({
        encryptionEnabled: false,
        e2eeVerifier: '',
      });
      await fetchData();
      showToast(secT.toastEncryptionDisabled, 'info');
      return true;
    } catch {
      return false;
    } finally {
      setBatchProgress(null);
    }
  }, [notes, settings.e2eeVerifier, fetchData, secT.batchProgressDecrypting, secT.toastEncryptionDisabled, handleUpdateSettings]);

  useEffect(() => {
    handleDisableEncryptionRef.current = handleDisableEncryption;
  }, [handleDisableEncryption]);

  const handleLockSession = useCallback(() => {
    clearStoredMasterPassword();
    e2eePasswordRef.current = '';
    setE2eePassword('');
    showToast(secT.toastVaultLocked, 'info');
  }, [secT.toastVaultLocked]);

  const handleExportSingleNote = useCallback(async (targetPath?: string) => {
    const pathToExport = targetPath || currentPath;
    if (!pathToExport) return;

    // Case 1: Exporting currently active note in editor (already decrypted in state)
    if (pathToExport === currentPath && view === 'edit') {
      let fullPlain = currentContent;
      if (frontMatter && Object.keys(frontMatter).length > 0) {
        const fmLines = Object.entries(frontMatter).map(([k, v]) => `${k}: ${v}`).join('\n');
        fullPlain = `---\n${fmLines}\n---\n${currentContent}`;
      }
      exportSingleNoteAsMarkdown(pathToExport, fullPlain);
      showToast(secT.toastNoteExported, 'success');
      return;
    }

    // Case 2: Already decrypted in noteContents cache
    if (noteContents[pathToExport] !== undefined && !lockedNotePaths[pathToExport]) {
      const fmPrefix = noteRawFrontMattersRef.current[pathToExport] || '';
      exportSingleNoteAsMarkdown(pathToExport, `${fmPrefix}${noteContents[pathToExport]}`);
      showToast(secT.toastNoteExported, 'success');
      return;
    }

    // Case 3: Fetch from GitHub and decrypt if needed
    try {
      const res = await fetch(`/api/notes?${encodeNotePathParam(pathToExport)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al exportar');

      let raw = data.content || '';
      if (isEncryptedContent(raw)) {
        const pwd = e2eePasswordRef.current || getStoredMasterPassword();
        if (!pwd) {
          setUnlockError(null);
          setUnlockPasswordInput('');
          setUnlockModalState({
            path: pathToExport,
            rawEncrypted: raw,
            onAfterUnlock: async (unlockedPwd) => {
              const dec = await decryptNoteContent(raw, unlockedPwd);
              exportSingleNoteAsMarkdown(pathToExport, dec);
              showToast(secT.toastNoteExported, 'success');
            },
          });
          return;
        }
        raw = await decryptNoteContent(raw, pwd);
      }

      exportSingleNoteAsMarkdown(pathToExport, raw);
      showToast(secT.toastNoteExported, 'success');
    } catch (err: any) {
      showToast(err.message || 'No se pudo exportar la nota', 'error');
    }
  }, [currentPath, view, currentContent, frontMatter, noteContents, lockedNotePaths, secT.toastNoteExported]);

  const handleExportAllVaultZipRef = useRef<(overridePassword?: string) => Promise<void>>(null as any);

  const handleExportAllVaultZip = useCallback(async (overridePassword?: string) => {
    const mdFiles = notes.filter(n => n.type === 'file' && n.name !== '.gitkeep' && n.path.endsWith('.md'));
    if (!mdFiles.length) {
      showToast(dict.dashboard.noFilesYet, 'info');
      return;
    }

    const pwd = overridePassword || e2eePasswordRef.current || getStoredMasterPassword();
    const exportedFiles: Array<{ path: string; content: string }> = [];

    setBatchProgress({
      active: true,
      label: secT.batchProgressExporting,
      current: 0,
      total: mdFiles.length,
    });

    try {
      for (let i = 0; i < mdFiles.length; i++) {
        const file = mdFiles[i];
        setBatchProgress({
          active: true,
          label: secT.batchProgressExporting,
          current: i + 1,
          total: mdFiles.length,
        });

        if (file.path === currentPath && view === 'edit') {
          let fullPlain = currentContent;
          if (frontMatter && Object.keys(frontMatter).length > 0) {
            const fmLines = Object.entries(frontMatter).map(([k, v]) => `${k}: ${v}`).join('\n');
            fullPlain = `---\n${fmLines}\n---\n${currentContent}`;
          }
          exportedFiles.push({ path: file.path, content: fullPlain });
          continue;
        }

        if (noteContents[file.path] !== undefined && !lockedNotePaths[file.path]) {
          const fmPrefix = noteRawFrontMattersRef.current[file.path] || '';
          exportedFiles.push({ path: file.path, content: `${fmPrefix}${noteContents[file.path]}` });
          continue;
        }

        const res = await fetch(`/api/notes?${encodeNotePathParam(file.path)}`);
        if (!res.ok) continue;
        const data = await res.json();
        let raw = data.content || '';

        if (isEncryptedContent(raw)) {
          if (!pwd) {
            setBatchProgress(null);
            setUnlockError(null);
            setUnlockPasswordInput('');
            setUnlockModalState({
              path: file.path,
              rawEncrypted: raw,
              onAfterUnlock: (unlockedPwd) => {
                handleExportAllVaultZipRef.current?.(unlockedPwd);
              },
            });
            return;
          }
          raw = await decryptNoteContent(raw, pwd);
        }

        exportedFiles.push({ path: file.path, content: raw });
      }

      exportVaultAsZip(exportedFiles);
      showToast(secT.toastVaultExported, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al exportar bóveda', 'error');
    } finally {
      setBatchProgress(null);
    }
  }, [notes, currentPath, view, currentContent, frontMatter, noteContents, lockedNotePaths, dict.dashboard.noFilesYet, secT.batchProgressExporting, secT.toastVaultExported]);

  useEffect(() => {
    handleExportAllVaultZipRef.current = handleExportAllVaultZip;
  }, [handleExportAllVaultZip]);

  // Compute Notion/Craft Parent Breadcrumb Chain for the active note (when inside a sub-note)
  const parentNoteChain = useMemo(() => {
    if (!currentPath) return [];
    const chain: { path: string; title: string; emoji?: string }[] = [];
    const visited = new Set<string>([currentPath]);

    const findParentPath = (childPath: string): string | null => {
      // 1. Check explicit parentPath in metadata
      const explicitParent = noteMetadata[childPath]?.parentPath;
      if (explicitParent && notes.some((n) => n.path === explicitParent)) {
        return explicitParent;
      }
      // 2. Fallback: check if any note embeds [[childTitle]]
      const childTitle = childPath.split('/').pop()?.replace(/\.md$/i, '').toLowerCase() || '';
      const childPathNoExt = childPath.replace(/\.md$/i, '').toLowerCase();
      for (const n of notes) {
        if (n.type !== 'file' || n.name === '.gitkeep' || n.path === childPath) continue;
        const body = noteContents[n.path];
        if (!body) continue;
        const embedded = extractWikiLinksFromMarkdown(body);
        if (
          embedded.some((l) => {
            const t = l.target.trim().replace(/\.md$/i, '').toLowerCase();
            return t === childTitle || t === childPathNoExt;
          })
        ) {
          return n.path;
        }
      }
      return null;
    };

    let curr = currentPath;
    while (chain.length < 6) {
      const parentPath = findParentPath(curr);
      if (!parentPath || visited.has(parentPath)) break;
      visited.add(parentPath);
      chain.unshift({
        path: parentPath,
        title: parentPath.split('/').pop()?.replace(/\.md$/i, '') || parentPath,
        emoji: noteMetadata[parentPath]?.emoji,
      });
      curr = parentPath;
    }

    return chain;
  }, [currentPath, noteMetadata, notes, noteContents]);

  const handleScrollToHeading = useCallback((headingIndex: number) => {
    setActiveTocIndex(headingIndex);
    const headingElements = document.querySelectorAll(
      '.bear-editor-content h1, .bear-editor-content h2, .bear-editor-content h3'
    );
    const targetEl = headingElements[headingIndex] as HTMLElement | undefined;
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleEditorScroll = useCallback(() => {
    const container = editorScrollContainerRef.current;
    if (!container) return;
    const headingElements = document.querySelectorAll(
      '.bear-editor-content h1, .bear-editor-content h2, .bear-editor-content h3'
    );
    if (!headingElements.length) return;

    const containerRect = container.getBoundingClientRect();
    let currentIdx = 0;
    headingElements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      if (rect.top - containerRect.top <= 140) {
        currentIdx = idx;
      }
    });
    setActiveTocIndex(currentIdx);
  }, []);

  return (
    <div 
      className={`flex h-screen w-screen overflow-hidden antialiased font-sans select-none ${isDarkMode ? 'dark bg-[#0F0F0F] text-zinc-100' : 'bg-[#F8FAFC] text-[#1E293B]'}`}
      onClick={() => {
        if (contextMenu) setContextMenu(null);
        if (activeColorPickerNote) setActiveColorPickerNote(null);
        if (activeCardMenu) setActiveCardMenu(null);
        if (isEditorColorPickerOpen) setIsEditorColorPickerOpen(false);
      }}
    >
      <div className="flex h-full w-full overflow-hidden">
        {/* Toast Notification (Bottom-Centered, Full-Rounded, Borderless/Shadowless Section Surface, Animated Enter/Exit) */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex justify-center px-4 w-full max-w-md">
          <AnimatePresence mode="wait">
            {toast && (
              <motion.div
                key={toast.message}
                initial={{ opacity: 0, y: 28, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.8 }}
                className={`pointer-events-auto px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2.5 border-0 shadow-none transition-colors ${
                  isDarkMode
                    ? 'bg-[#262626] text-zinc-100'
                    : 'bg-[#E2E8F0] text-[#0F172A]'
                }`}
              >
                {toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                ) : toast.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: settings.primaryColor || '#006FFF' }}
                  />
                )}
                <span className="truncate">{toast.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Unsaved Changes Modal */}
        {pendingAction && (
          <div 
            onClick={() => setPendingAction(null)}
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`max-w-md w-full my-auto p-6 sm:p-7 rounded-[30px] sm:rounded-[32px] [corner-shape:squircle] max-h-[calc(100dvh-2rem)] overflow-y-auto ${isDarkMode ? 'bg-[#181818] text-zinc-100' : 'bg-white text-[#1E293B]'}`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                <h3 className="text-lg font-bold">{uiT.menus.context.unsavedTitle}</h3>
              </div>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {uiT.menus.context.unsavedDesc}
              </p>
              <div className="flex items-center justify-end space-x-3">
                <button 
                  onClick={() => setPendingAction(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${isDarkMode ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  {dict.modals.cancel}
                </button>
                <button 
                  onClick={() => {
                    const act = pendingAction;
                    setPendingAction(null);
                    setCurrentContent(savedContent);
                    act();
                  }}
                  className="px-4 py-2 text-sm font-medium rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  {uiT.menus.context.discardChanges}
                </button>
                <button 
                  onClick={async () => {
                    await handleSave();
                    const act = pendingAction;
                    setPendingAction(null);
                    act();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold rounded-2xl [corner-shape:squircle] text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {uiT.menus.context.saveAndExit}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unlock Encrypted Note / Vault Modal (Zero-Knowledge E2EE) */}
        {unlockModalState && (
          <div
            onClick={() => {
              if (!isUnlocking) {
                setUnlockModalState(null);
                setUnlockError(null);
              }
            }}
            className="fixed inset-0 z-[120] overflow-y-auto flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`max-w-md w-full my-auto p-6 sm:p-7 rounded-[30px] sm:rounded-[32px] [corner-shape:squircle] shadow-taskflow-modal ${
                isDarkMode ? 'bg-[#181818] text-zinc-100' : 'bg-white text-[#1E293B]'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${settings.primaryColor}18`, color: settings.primaryColor }}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold truncate">{secT.unlockVaultTitle}</h3>
                  {unlockModalState.path && (
                    <p className={`text-xs truncate ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {unlockModalState.path}
                    </p>
                  )}
                </div>
              </div>

              <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {secT.unlockVaultDesc}
              </p>

              <div className="relative mb-3">
                <input
                  type={unlockShowPassword ? 'text' : 'password'}
                  value={unlockPasswordInput}
                  onChange={(e) => {
                    setUnlockPasswordInput(e.target.value);
                    setUnlockError(null);
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && unlockPasswordInput) {
                      setIsUnlocking(true);
                      const ok = await handleUnlockVault(unlockPasswordInput, unlockRememberDevice);
                      setIsUnlocking(false);
                      if (!ok) setUnlockError(secT.wrongPasswordError);
                    }
                  }}
                  placeholder={secT.masterPasswordPlaceholder}
                  className={`w-full pl-4 pr-11 py-3 rounded-2xl outline-none text-sm ${
                    isDarkMode ? 'bg-[#141414] text-zinc-100 placeholder-zinc-500' : 'bg-zinc-100 text-[#1E293B] placeholder-zinc-400'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setUnlockShowPassword((v) => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full cursor-pointer ${
                    isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {unlockShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4 px-1">
                <span className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {secT.rememberDeviceLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setUnlockRememberDevice((v) => !v)}
                  className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                    unlockRememberDevice ? '' : isDarkMode ? 'bg-[#141414]' : 'bg-zinc-200'
                  }`}
                  style={{
                    backgroundColor: unlockRememberDevice ? settings.primaryColor : undefined,
                  }}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 ${
                      unlockRememberDevice ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {unlockError && (
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 text-xs font-medium mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setUnlockModalState(null);
                    setUnlockError(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                    isDarkMode ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {dict.modals.cancel}
                </button>
                <button
                  type="button"
                  disabled={isUnlocking || !unlockPasswordInput}
                  onClick={async () => {
                    setIsUnlocking(true);
                    const ok = await handleUnlockVault(unlockPasswordInput, unlockRememberDevice);
                    setIsUnlocking(false);
                    if (!ok) setUnlockError(secT.wrongPasswordError);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-2xl [corner-shape:squircle] transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {isUnlocking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>{secT.unlockVaultBtn}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rename Modal */}
        {renameNode && (
          <div 
            onClick={() => setRenameNode(null)}
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`max-w-md w-full my-auto p-6 sm:p-7 rounded-[30px] sm:rounded-[32px] [corner-shape:squircle] max-h-[calc(100dvh-2rem)] overflow-y-auto ${isDarkMode ? 'bg-[#181818] text-zinc-100' : 'bg-white text-[#1E293B]'}`}
            >
              <h3 className="text-lg font-bold mb-4">{renameNode.type === 'file' ? uiT.menus.context.renameFileTitle : uiT.menus.context.renameFolderTitle}</h3>
              <input 
                type="text" 
                value={renameValue} 
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
                className={`w-full px-4 py-2.5 rounded-2xl outline-none text-sm mb-6 ${isDarkMode ? 'bg-[#141414] text-zinc-100' : 'bg-zinc-100 text-[#1E293B]'}`}
                autoFocus
              />
              <div className="flex items-center justify-end space-x-3">
                <button 
                  onClick={() => setRenameNode(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${isDarkMode ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  {dict.modals.cancel}
                </button>
                <button 
                  onClick={handleConfirmRename}
                  disabled={isSaving}
                  className="px-5 py-2.5 text-sm font-semibold text-white rounded-2xl [corner-shape:squircle] transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : uiT.menus.context.rename}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div 
            className={`fixed z-50 w-48 rounded-[22px] [corner-shape:squircle] py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 ${isDarkMode ? 'bg-[#1C1C1C]/95 text-zinc-200' : 'bg-white/95 text-zinc-800'}`}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.node.type === 'file' && (
              <>
                <button 
                  onClick={() => {
                    setEmojiPickerNode(contextMenu.node);
                    setContextMenu(null);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'}`}
                >
                  <AppIcon name="customize-icon" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{uiT.menus.context.changeIcon}</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveColorPickerNote(contextMenu.node.path);
                    setContextMenu(null);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'}`}
                >
                  <Palette className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{uiT.menus.context.changeColor}</span>
                </button>
                <button 
                  onClick={() => {
                    const targetPath = contextMenu.node.path;
                    setContextMenu(null);
                    handleExportSingleNote(targetPath);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'}`}
                >
                  <AppIcon name="export-md" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{secT.exportNoteMenuLabel}</span>
                </button>
              </>
            )}

            {contextMenu.node.type === 'dir' && (
              <button 
                onClick={() => {
                  handleCreateNew(contextMenu.node.path);
                  setContextMenu(null);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'}`}
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>{uiT.menus.context.newFileHere}</span>
              </button>
            )}

            <button 
              onClick={() => {
                setRenameNode(contextMenu.node);
                setRenameValue(contextMenu.node.name);
                setContextMenu(null);
              }}
              className={`w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'}`}
            >
              <AppIcon name="rename-note" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{uiT.menus.context.rename}</span>
            </button>
            <button 
              onClick={() => handleDeleteItem(contextMenu.node)}
              className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <AppIcon name="delete-note" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{uiT.menus.context.delete}</span>
            </button>
          </div>
        )}

        {/* Universal Floating Command Palette (Ctrl+K / Cmd+K) */}
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          isDarkMode={isDarkMode}
          primaryColor={settings.primaryColor || '#006FFF'}
          iconPack={settings.iconPack || 'meteor'}
          language={activeLanguage}
          notes={wikiLinkNoteOptions}
          currentPath={currentPath}
          currentView={view}
          hasUnsavedChanges={hasUnsavedChanges}
          themeMode={settings.themeMode}
          listLayout={settings.listLayout}
          sortBy={settings.sortBy}
          isSidebarCollapsed={isSidebarCollapsed}
          isNoteInfoOpen={isNoteInfoOpen}
          focusMode={!!settings.focusMode}
          onOpenNote={(path) => handleFileClick(path)}
          onCreateNewNote={(initialTitle) =>
            handleCreateNew(view === 'folder' ? currentFolder : '', initialTitle || '')
          }
          onCreateSubNote={(initialTitle) => {
            if (view === 'edit') {
              if (initialTitle && initialTitle.trim()) {
                window.dispatchEvent(
                  new CustomEvent('bear-editor-command', {
                    detail: { command: 'insert-subnote', title: initialTitle.trim() },
                  })
                );
              } else {
                window.dispatchEvent(
                  new CustomEvent('bear-editor-command', { detail: { command: 'wikilink' } })
                );
              }
            } else {
              handleCreateNew('', initialTitle || '');
            }
          }}
          onCreateNewSection={() => handleCreateNewSection()}
          onCreateDailyNote={() => {
            const todayStr = new Date().toISOString().split('T')[0];
            handleCreateDailyNote(todayStr);
          }}
          onSaveCurrentNote={() => handleSave()}
          onOpenDocSearch={(withReplace) => {
            window.dispatchEvent(
              new CustomEvent('toggle-note-search', {
                detail: { forceOpen: true, replace: !!withReplace },
              })
            );
          }}
          onCustomizeCurrentNoteIcon={() => {
            if (currentPath) {
              setEmojiPickerNode({
                name: currentPath.split('/').pop() || '',
                path: currentPath,
                type: 'file',
                sha: currentSha,
                children: {},
              });
            }
          }}
          onTogglePinCurrentNote={() => {
            if (currentPath) {
              togglePinNote(currentPath);
            }
          }}
          onToggleNoteInfo={() => setIsNoteInfoOpen((prev) => !prev)}
          onNavigateView={(targetView) => {
            if (targetView === 'dashboard') {
              handleGoToDashboard();
            } else if (targetView === 'settings') {
              handleGoToSettings();
            } else {
              guardedNavigation(() => setView(targetView));
            }
          }}
          onSetThemeMode={(mode) => {
            const modeLabels: Record<'light' | 'dark' | 'system', string> = {
              light: 'Modo Claro ☀️',
              dark: 'Modo Oscuro 🌙',
              system: 'Modo Automático (Sistema) 💻',
            };
            handleUpdateSettings({ themeMode: mode });
            showToast(`Tema cambiado a: ${modeLabels[mode]}`, 'info');
          }}
          onSetListLayout={(layout) => {
            handleUpdateSettings({ listLayout: layout });
            showToast(
              layout === 'grid' ? 'Diseño de vista: Cuadrícula' : 'Diseño de vista: Lista',
              'info'
            );
          }}
          onSetSortBy={(sort) => {
            const sortLabels: Record<'modified' | 'created' | 'name', string> = {
              modified: 'Última edición',
              created: 'Fecha de creación',
              name: 'Título (A-Z)',
            };
            handleUpdateSettings({ sortBy: sort });
            showToast(`Ordenado por: ${sortLabels[sort]}`, 'info');
          }}
          onToggleSidebar={() => {
            setIsSidebarCollapsed((prev) => {
              const next = !prev;
              showToast(next ? 'Barra lateral oculta' : 'Barra lateral visible', 'info');
              return next;
            });
          }}
          onToggleFocusMode={() => {
            const nextFocus = !settings.focusMode;
            handleUpdateSettings({ focusMode: nextFocus });
            showToast(
              nextFocus
                ? 'Modo Enfoque (Máquina de Escribir) activado'
                : 'Modo Enfoque desactivado',
              'info'
            );
          }}
          onExecuteEditorFormat={(cmdId) => {
            window.dispatchEvent(
              new CustomEvent('bear-editor-command', { detail: { command: cmdId } })
            );
          }}
          onExportCurrentNote={() => handleExportSingleNote(currentPath)}
          onExportAllVaultZip={() => handleExportAllVaultZip()}
          onOpenSecuritySettings={() => handleGoToSettings('security')}
        />

        {/* Note Icon & Emoji Picker Modal */}
        {emojiPickerNode && (
          <IconPickerModal
            isOpen={!!emojiPickerNode}
            onClose={() => setEmojiPickerNode(null)}
            noteTitle={emojiPickerNode.name}
            currentValue={noteMetadata[emojiPickerNode.path]?.emoji}
            iconPack={settings.iconPack || 'meteor'}
            emojiPack={settings.emojiPack || 'system'}
            onSelect={(val) => updateNoteEmoji(emojiPickerNode.path, val)}
            isDarkMode={isDarkMode}
            primaryColor={settings.primaryColor}
          />
        )}

        {/* New Item Modal (Note or Section) */}
        {newFileDir !== null && (
          <div 
            onClick={() => { setNewFileDir(null); setNewItemType('file'); setNewFileEmoji(''); }}
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-5 sm:py-8 animate-in fade-in duration-200"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`max-w-md w-full my-auto p-6 sm:p-7 rounded-[30px] sm:rounded-[32px] [corner-shape:squircle] max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] overflow-y-auto shadow-taskflow-modal transition-all duration-200 ${isDarkMode ? 'bg-[#181818] text-zinc-100' : 'bg-white text-[#1E293B]'}`}
            >
              <h3 className="text-lg font-bold mb-2">
                {newItemType === 'file' ? dict.modals.createNewFile : dict.modals.createNewSection}
              </h3>
              
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setNewItemType('file')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-2xl [corner-shape:squircle] transition-all ${
                    newItemType === 'file'
                      ? 'text-white'
                      : isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-200 bg-zinc-100'
                  }`}
                  style={{ backgroundColor: newItemType === 'file' ? settings.primaryColor : undefined }}
                >
                  {dict.modals.markdownFile}
                </button>
                <button
                  type="button"
                  onClick={() => setNewItemType('dir')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-2xl [corner-shape:squircle] transition-all ${
                    newItemType === 'dir'
                      ? 'text-white'
                      : isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 bg-zinc-900' : 'text-zinc-600 hover:bg-zinc-200 bg-zinc-100'
                  }`}
                  style={{ backgroundColor: newItemType === 'dir' ? settings.primaryColor : undefined }}
                >
                  {dict.modals.sectionFolder}
                </button>
              </div>

              {/* Destination Section Picker for Files */}
              {newItemType === 'file' && (
                <div className="mb-4">
                  <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {dict.modals.destinationFolder}
                  </label>
                  <select
                    value={newFileDir || ''}
                    onChange={(e) => setNewFileDir(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-2xl outline-none text-sm font-medium ${
                      isDarkMode ? 'bg-zinc-900 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
                    }`}
                  >
                    <option value="">{dict.modals.rootSection}</option>
                    {availableSections.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name Input */}
              <div className="mb-4">
                <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {newItemType === 'file' ? dict.modals.fileNameLabel : dict.modals.sectionNameLabel}
                </label>
                <input 
                  type="text" 
                  placeholder={newItemType === 'file' ? "Meeting Notes" : "Work"}
                  value={newFileName} 
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmCreateNew()}
                  className={`w-full px-4 py-2.5 rounded-2xl outline-none text-sm ${isDarkMode ? 'bg-zinc-900 text-zinc-100 placeholder-zinc-500' : 'bg-zinc-100 text-[#1E293B] placeholder-zinc-400'}`}
                  autoFocus
                />
              </div>

              {/* Icon / Emoji Selector for Files */}
              {newItemType === 'file' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      Icono o Emoji para la nota
                    </label>
                    {newFileEmoji && (
                      <button
                        type="button"
                        onClick={() => setNewFileEmoji('')}
                        className="text-[11px] text-blue-500 hover:underline cursor-pointer"
                      >
                        Restablecer estándar
                      </button>
                    )}
                  </div>

                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder={`Escribe nombre del icono o emoji (ej. Home, rocket, star)`}
                      value={newFileEmoji}
                      onChange={(e) => setNewFileEmoji(e.target.value)}
                      className={`w-full pl-3 pr-10 py-2 rounded-2xl text-xs outline-none transition-all ${
                        isDarkMode ? 'bg-zinc-900 text-zinc-200 placeholder-zinc-500 focus:ring-1 focus:ring-blue-500' : 'bg-zinc-100 text-zinc-800 placeholder-zinc-400 focus:ring-1 focus:ring-blue-500'
                      }`}
                    />
                    {newFileEmoji && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <AppIcon name={newFileEmoji} pack={settings.iconPack || 'meteor'} className="w-4 h-4 text-blue-500" />
                      </div>
                    )}
                  </div>

                  {/* Preset Emojis quick chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {['📝', '💡', '🚀', '⭐', '🔥', '📌', '🎯', '✨', '💻', '🎨'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewFileEmoji(newFileEmoji === emoji ? '' : emoji)}
                        className={`h-7 w-7 shrink-0 text-sm flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                          newFileEmoji === emoji 
                            ? (isDarkMode ? 'bg-blue-600/40 ring-1 ring-blue-500' : 'bg-blue-100 ring-1 ring-blue-400')
                            : (isDarkMode ? 'hover:bg-zinc-800 bg-zinc-900' : 'hover:bg-zinc-200 bg-zinc-100')
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Pill */}
              {newItemType === 'file' && (
                <div className={`p-3 rounded-2xl [corner-shape:squircle] mb-4 flex items-center gap-2.5 ${
                  isDarkMode ? 'bg-[#121520]' : 'bg-zinc-100'
                }`}>
                  <span className="text-xs font-semibold opacity-60">Vista previa:</span>
                  <div className="flex items-center gap-2 font-medium text-sm">
                    {newFileEmoji ? (
                      <NoteIconDisplay 
                        iconOrEmoji={newFileEmoji}
                        pack={settings.iconPack || 'meteor'}
                        className="w-4.5 h-4.5 text-blue-500 shrink-0"
                        emojiClassName="text-base leading-none shrink-0"
                        fallback={<CustomFileIcon pack={settings.iconPack || 'meteor'} className="w-4 h-4 text-zinc-400" />}
                      />
                    ) : (
                      <CustomFileIcon pack={settings.iconPack || 'meteor'} className="w-4 h-4 text-zinc-400" />
                    )}
                    <span>{newFileName.trim() || 'Nuevo archivo'}.md</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 mt-4">
                <button 
                  onClick={() => { setNewFileDir(null); setNewItemType('file'); setNewFileEmoji(''); }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${isDarkMode ? 'text-zinc-400 hover:text-zinc-100' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  {dict.modals.cancel}
                </button>
                <button 
                  onClick={confirmCreateNew}
                  disabled={isSaving}
                  className="flex items-center px-6 py-2.5 text-sm font-semibold text-white rounded-2xl [corner-shape:squircle] transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : dict.modals.create}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        {view !== 'settings' && (
        <aside className={`flex flex-col shrink-0 rounded-tr-[28px] rounded-br-[28px] [corner-shape:squircle] transition-all duration-300 relative z-30 overflow-hidden ${
          isDarkMode 
            ? 'bg-[#141414] text-zinc-100' 
            : 'bg-white text-[#1E293B]'
        } ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
          <div className={`p-3 shrink-0 relative z-10 ${isDarkMode ? 'bg-[#141414]' : 'bg-white'}`}>
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => handleGoToSettings('account')}
                  className={`flex-1 min-w-0 p-2 rounded-2xl flex items-center space-x-3 text-left transition-colors cursor-pointer group ${
                    isDarkMode 
                      ? 'hover:bg-[#1E1E1E] text-zinc-100' 
                      : 'hover:bg-[#F1F5F9] text-[#1E293B]'
                  }`}
                  title={userProfile ? (userProfile.name || userProfile.login) : ((dict.sidebar as any).account || 'Cuenta')}
                  aria-label={(dict.sidebar as any).account || 'Cuenta'}
                >
                  {userProfile ? (
                    <>
                      <Image 
                        src={userProfile.avatar_url} 
                        alt="Avatar" 
                        width={36} 
                        height={36} 
                        referrerPolicy="no-referrer" 
                        className="w-9 h-9 rounded-full ring-1 ring-black/5 dark:ring-white/10 shrink-0 object-cover" 
                      />
                      <div className="overflow-hidden min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate leading-tight ${isDarkMode ? 'text-zinc-100' : 'text-[#0F172A]'}`}>
                          {userProfile.name || userProfile.login}
                        </p>
                        <p className={`text-xs truncate leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                          @{userProfile.login}
                        </p>
                      </div>
                    </>
                  ) : loading ? (
                    <div className={`flex items-center space-x-2.5 text-sm py-1 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      <RefreshCw className="w-5 h-5 animate-spin shrink-0" />
                      <span className="truncate text-xs font-medium">{dict.sidebar.loadingUser}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        <AppIcon name="user" pack={settings.iconPack || 'meteor'} className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate leading-tight ${isDarkMode ? 'text-zinc-200' : 'text-[#1E293B]'}`}>
                          {(dict.sidebar as any).account || 'Cuenta'}
                        </p>
                        <p className={`text-xs truncate leading-tight mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {dict.sidebar.githubNotLinked}
                        </p>
                      </div>
                    </div>
                  )}
                </button>
                <Tooltip content={dict.sidebar.hideSidebar || 'Ocultar barra lateral'} position="bottom">
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(true)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                      isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-[#EEF1F6] text-zinc-500 hover:text-[#1E293B]'
                    }`}
                    aria-label={dict.sidebar.hideSidebar || 'Ocultar barra lateral'}
                  >
                    <SidebarCloseIcon pack={settings.iconPack || 'meteor'} className="w-4.5 h-4.5" />
                  </button>
                </Tooltip>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center py-1 space-y-2">
                <Tooltip content={userProfile ? (userProfile.name || userProfile.login) : ((dict.sidebar as any).account || 'Cuenta')} position="right">
                  <button 
                    type="button"
                    onClick={() => handleGoToSettings('account')}
                    className="p-1 rounded-full transition-transform hover:scale-105 cursor-pointer"
                    aria-label={(dict.sidebar as any).account || 'Cuenta'}
                  >
                    {userProfile ? (
                      <Image 
                        src={userProfile.avatar_url} 
                        alt="Avatar" 
                        width={32} 
                        height={32} 
                        referrerPolicy="no-referrer" 
                        className="w-8 h-8 rounded-full ring-1 ring-black/5 dark:ring-white/10 shrink-0 object-cover" 
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        <AppIcon name="user" pack={settings.iconPack || 'meteor'} className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                </Tooltip>
                <Tooltip content={dict.sidebar.showSidebar || 'Mostrar barra lateral'} position="right">
                  <button 
                    type="button"
                    onClick={() => setIsSidebarCollapsed(false)} 
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-[#EEF1F6] text-zinc-600 hover:text-[#1E293B]'
                    }`}
                    aria-label={dict.sidebar.showSidebar || 'Mostrar barra lateral'}
                  >
                    <SidebarOpenIcon pack={settings.iconPack || 'meteor'} className="w-4.5 h-4.5" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
          
          {!isSidebarCollapsed ? (
            <>
              {/* Top Navigation Shortcuts */}
              <div className={`px-3 pt-3 pb-1 space-y-1 relative z-10 shrink-0 ${isDarkMode ? 'bg-[#141414]' : 'bg-white'}`}>

                <button
                  type="button"
                  onClick={handleGoToDashboard}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    view === 'dashboard' || view === 'folder'
                      ? (isDarkMode ? 'bg-[#242424] text-white' : 'bg-[#F8FAFC] text-[#0F172A]')
                      : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#F8FAFC] text-[#334155]')
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CustomGridIcon pack={settings.iconPack || 'meteor'} className="w-4 h-4 shrink-0" />
                    <span>{dict.sidebar.dashboard}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    guardedNavigation(() => setView('tasks'));
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    view === 'tasks'
                      ? (isDarkMode ? 'bg-[#242424] text-white' : 'bg-[#F8FAFC] text-[#0F172A]')
                      : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#F8FAFC] text-[#334155]')
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AppIcon name="list-todo" pack={settings.iconPack || 'meteor'} className="w-4 h-4 shrink-0" />
                    <span>{dict.sidebar.allTasks}</span>
                  </div>
                  {pendingTasksCount > 0 && (
                    <span 
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full text-white"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      {pendingTasksCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    guardedNavigation(() => setView('calendar'));
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    view === 'calendar'
                      ? (isDarkMode ? 'bg-[#242424] text-white' : 'bg-[#F8FAFC] text-[#0F172A]')
                      : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#F8FAFC] text-[#334155]')
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AppIcon name="calendar" pack={settings.iconPack || 'meteor'} className="w-4 h-4 shrink-0" />
                    <span>{dict.sidebar.calendar}</span>
                  </div>
                </button>

                {/* Fade-out shadow overlay at the bottom */}
                <div 
                  className={`pointer-events-none absolute left-0 right-0 top-full h-7 bg-gradient-to-b ${
                    isDarkMode ? 'from-[#141414] to-transparent' : 'from-white to-transparent'
                  }`} 
                />
              </div>

              {/* Sections & Notes Tree */}
              <div className="flex-1 overflow-y-auto px-3 pt-6 pb-12">
                {loading && !notes.length ? (
                  <div className="flex justify-center p-4">
                    <RefreshCw className={`w-5 h-5 animate-spin ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  </div>
                ) : (
                  <SidebarSectionTree 
                    rootNode={tree}
                    activePath={currentPath}
                    isDarkMode={isDarkMode}
                    primaryColor={settings.primaryColor}
                    iconPack={settings.iconPack || 'meteor'}
                    emojiPack={settings.emojiPack || 'system'}
                    noteMetadata={noteMetadata}
                    onFileClick={handleFileClick}
                    onNewFile={handleCreateNew}
                    onNewSection={handleCreateNewSection}
                    onFolderClick={handleFolderClick}
                    onFileContextMenu={handleFileContextMenu}
                    onOpenEmojiPicker={(node) => setEmojiPickerNode(node)}
                    dict={dict}
                    uiT={uiT}
                  />
                )}
              </div>

              
              {/* Bottom Settings Button */}
              <div className={`p-3 shrink-0 relative z-10 rounded-br-[28px] ${isDarkMode ? 'bg-[#141414]' : 'bg-white'}`}>
                {/* Fade-out shadow overlay at the top */}
                <div 
                  className={`pointer-events-none absolute left-0 right-0 bottom-full h-7 bg-gradient-to-t ${
                    isDarkMode ? 'from-[#141414] to-transparent' : 'from-white to-transparent'
                  }`} 
                />
                <button
                  type="button"
                  onClick={() => handleGoToSettings()}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#F8FAFC] text-[#334155]'
                  }`}
                  aria-label={dict.sidebar.settings}
                >
                  <AppIcon name="settings" pack={settings.iconPack || 'meteor'} className="w-4 h-4 shrink-0" />
                  <span className="truncate">{dict.sidebar.settings}</span>
                </button>
              </div>
            </>
          ) : (
            /* Collapsed state */
            <div className="flex-1 flex flex-col items-center py-4 space-y-3">
              <Tooltip content={dict.sidebar.dashboard} position="right">
                <button 
                  onClick={handleGoToDashboard}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                    view === 'dashboard' || view === 'folder'
                      ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-[#EEF1F6] text-zinc-900')
                      : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#EEF1F6] text-[#1E293B]')
                  }`}
                  aria-label={dict.sidebar.dashboard}
                >
                  <CustomGridIcon pack={settings.iconPack || 'meteor'} className="w-5 h-5" />
                </button>
              </Tooltip>

              <Tooltip content={dict.sidebar.allTasks} position="right">
                <button 
                  onClick={() => guardedNavigation(() => setView('tasks'))}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer relative ${
                    view === 'tasks' 
                      ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-[#EEF1F6] text-zinc-900') 
                      : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#EEF1F6] text-[#1E293B]')
                  }`}
                  aria-label={dict.sidebar.allTasks}
                >
                  <AppIcon name="list-todo" pack={settings.iconPack || 'meteor'} className="w-5 h-5" />
                  {pendingTasksCount > 0 && (
                    <span 
                      className="absolute top-1 right-1 w-2 h-2 rounded-full"
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                  )}
                </button>
              </Tooltip>

              <Tooltip content={dict.sidebar.calendar} position="right">
                <button 
                  onClick={() => guardedNavigation(() => setView('calendar'))}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                    view === 'calendar' 
                      ? (isDarkMode ? 'bg-zinc-800 text-white' : 'bg-[#EEF1F6] text-zinc-900') 
                      : (isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#EEF1F6] text-[#1E293B]')
                  }`}
                  aria-label={dict.sidebar.calendar}
                >
                  <AppIcon name="calendar" pack={settings.iconPack || 'meteor'} className="w-5 h-5" />
                </button>
              </Tooltip>

              <div className="flex-1" />

              <Tooltip content={dict.sidebar.settings} position="right">
                <button 
                  onClick={() => handleGoToSettings()}
                  className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                    isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-[#EEF1F6] text-[#1E293B]'
                  }`}
                  aria-label={dict.sidebar.settings}
                >
                  <AppIcon name="settings" pack={settings.iconPack || 'meteor'} className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>
          )}
        </aside>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 flex flex-col min-w-0 relative transition-colors duration-300 ${isDarkMode ? 'bg-[#0F0F0F] text-zinc-100' : 'bg-[#F8FAFC] text-[#1E293B]'}`}>
          {error && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 p-4.5 rounded-[22px] [corner-shape:squircle] flex items-start space-x-3 max-w-md w-full ${isDarkMode ? 'bg-[#181818] text-zinc-200' : 'bg-white text-[#1E293B]'}`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: settings.primaryColor }} />
              <div className="text-sm font-medium leading-relaxed flex-1">
                {error.includes("missing in environment") ? (
                  <>
                    <p className="mb-2"><strong>Falta el token de GitHub.</strong></p>
                    <p className={isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}>Por favor, agrega tus credenciales de GitHub en el menú de Configuración de AI Studio para sincronizar tus notas.</p>
                  </>
                ) : (
                  error
                )}
              </div>
              <button onClick={() => setError(null)} className={isDarkMode ? 'text-zinc-500 hover:text-zinc-200' : 'text-zinc-400 hover:text-zinc-800'}>✕</button>
            </div>
          )}

          {/* VIEW: DASHBOARD */}
          {view === 'dashboard' && (
            <div className={`flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto animate-in fade-in duration-500 ${isDarkMode ? 'bg-[#0F0F0F] text-zinc-100' : 'bg-[#F8FAFC] text-[#1E293B]'}`}>
              {/* Header & Controls Toolbar */}
              <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-[#0F172A]'}`}>{dict.dashboard.title}</h1>
                  <p className={`mt-1 text-base ${isDarkMode ? 'text-zinc-400' : 'text-[#64748B]'}`}>
                    {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? dict.dashboard.syncedNoteSingular : dict.dashboard.syncedNotePlural}
                  </p>
                </div>

                {/* Toolbar */}
                <div className="flex items-center flex-wrap gap-3">
                  {/* Search Bar */}
                  <div className={`relative flex items-center h-10.5 rounded-full px-4 text-sm sm:text-base ${
                    isDarkMode ? 'bg-[#181818] text-zinc-200' : 'bg-white text-zinc-800'
                  }`}>
                    <Search className="w-4 h-4 mr-2.5 opacity-50 shrink-0" />
                    <input 
                      ref={searchInputRef}
                      type="text"
                      placeholder={dict.dashboard.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent outline-none w-32 sm:w-48 text-sm placeholder:text-zinc-400 h-full"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="ml-1.5 opacity-60 hover:opacity-100">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sorting dropdown */}
                  <div className={`flex items-center h-10.5 rounded-full px-4 text-sm ${
                    isDarkMode ? 'bg-[#181818] text-zinc-300' : 'bg-white text-zinc-700'
                  }`}>
                    <ArrowUpDown className="w-3.5 h-3.5 mr-2 opacity-50 shrink-0" />
                    <select
                      value={settings.sortBy}
                      onChange={(e) => handleSaveSettings({ ...settings, sortBy: e.target.value as any })}
                      className="bg-transparent outline-none cursor-pointer text-sm font-medium h-full pr-1"
                    >
                      <option value="modified" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>{dict.dashboard.sortModified}</option>
                      <option value="created" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>{dict.dashboard.sortCreated}</option>
                      <option value="name" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>{dict.dashboard.sortName}</option>
                    </select>
                    <button
                      onClick={() => handleSaveSettings({ ...settings, sortOrder: settings.sortOrder === 'asc' ? 'desc' : 'asc' })}
                      className="ml-1.5 p-1 hover:text-blue-500 font-bold shrink-0 cursor-pointer"
                      title={settings.sortOrder === 'asc' ? uiT.tooltips.ascending : uiT.tooltips.descending}
                    >
                      {settings.sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>

                  {/* Squircle Pill "Nuevo archivo" */}
                  <button
                    onClick={() => handleCreateNew('')}
                    className="flex items-center justify-center gap-2 h-10.5 px-5 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer hover:opacity-95 active:scale-[0.97] shrink-0"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
                    <span>{dict.dashboard.newFile}</span>
                  </button>
                </div>
              </header>

              {/* Main Notes List / Grid Body */}
              {filteredAndSortedNotes.length === 0 ? (
                <div className={`p-14 rounded-[32px] [corner-shape:squircle] text-center flex flex-col items-center justify-center my-6 ${isDarkMode ? 'bg-[#181818]' : 'bg-white'}`}>
                  <CustomFileIcon pack={settings.iconPack || 'meteor'} className={`w-14 h-14 mb-4 ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`} />
                  <p className={`text-base font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {searchQuery ? dict.dashboard.noSearchResults : dict.dashboard.noFilesYet}
                  </p>
                  <button 
                    onClick={() => { setSearchQuery(''); handleCreateNew(''); }} 
                    className="mt-4 text-base font-semibold hover:underline cursor-pointer"
                    style={{ color: settings.primaryColor }}
                  >
                    {dict.dashboard.createFirstFile}
                  </button>
                </div>
              ) : settings.listLayout === 'grid' ? (
                /* GRID VIEW: Elongated Squircle Cards without Borders */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAndSortedNotes.map(item => {
                    const meta = noteMetadata[item.path];
                    const colorId = meta?.color;
                    const colorOpt = getNoteColor(colorId);
                    const snippet = meta?.snippet;
                    const tasks = meta?.tasks;
                    const isPinned = !!meta?.pinned;
                    const hasCustomColor = colorOpt.id !== 'default';
                    const cardStats = calculateNoteStats(noteContents[item.path] ?? snippet ?? '', uiT.noteInfo.minRead);

                    return (
                      <div
                        key={item.path}
                        onClick={() => handleFileClick(item.path, item.sha)}
                        className={`group relative flex flex-col justify-between p-6 sm:p-7 min-h-[230px] rounded-[30px] [corner-shape:squircle] transition-all duration-200 cursor-pointer select-none ${
                          activeCardMenu === item.path ? 'z-50 -translate-y-1' : 'z-0 hover:-translate-y-1'
                        } ${
                          hasCustomColor
                            ? ''
                            : isDarkMode ? 'bg-[#181818]' : 'bg-white shadow-taskflow-card'
                        }`}
                        style={{
                          backgroundColor: hasCustomColor 
                            ? (isDarkMode ? colorOpt.darkBg : colorOpt.lightBg)
                            : undefined
                        }}
                      >
                        {/* Top: Title on left & More options (•••) on right */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h3 className={`text-lg font-bold tracking-tight line-clamp-2 leading-snug flex-1 ${
                              isDarkMode ? 'text-zinc-100' : 'text-[#0F172A]'
                            }`}>
                              {item.name.replace(/\.md$/, '')}
                            </h3>

                            {/* Options Menu Button (•••) */}
                            <div className="relative shrink-0 z-30">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCardMenu(activeCardMenu === item.path ? null : item.path);
                                }}
                                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                                  activeCardMenu === item.path
                                    ? (isDarkMode ? 'bg-white/15 text-zinc-100' : 'bg-black/10 text-zinc-900')
                                    : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-700 hover:bg-black/5')
                                }`}
                                title={uiT.tooltips.noteOptions}
                              >
                                <MoreHorizontal className="w-4.5 h-4.5 stroke-[2.2]" />
                              </button>

                              {/* Card Options Popover */}
                              {activeCardMenu === item.path && (
                                <div 
                                  className={`absolute right-0 top-full mt-2 p-2 rounded-[22px] [corner-shape:squircle] z-[100] w-60 backdrop-blur-xl shadow-taskflow-modal animate-in fade-in zoom-in-95 duration-150 ${
                                    isDarkMode ? 'bg-[#1C1C1C]/95 text-zinc-200' : 'bg-white/95 text-zinc-800'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Real-Time Word, Character & Reading Time Info */}
                                  <div className={`px-3 py-2.5 mb-1.5 rounded-2xl flex items-start gap-2.5 ${
                                    isDarkMode ? 'bg-[#262626] text-zinc-200' : 'bg-[#EEF1F6] text-[#0F172A]'
                                  }`}>
                                    <AppIcon name="note-info" pack={settings.iconPack || 'meteor'} className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
                                    <div className="min-w-0 flex-1 text-[11px] leading-snug">
                                      <p className="font-bold truncate">
                                        {cardStats.words} {cardStats.words === 1 ? dict.dashboard.wordSingular : dict.dashboard.wordPlural} • {cardStats.readingTimeLabel}
                                      </p>
                                      <p className={`mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                        {cardStats.chars} {cardStats.chars === 1 ? dict.dashboard.charSingular : dict.dashboard.charPlural} ({cardStats.charsNoSpaces} {dict.dashboard.withoutSpaces})
                                      </p>
                                    </div>
                                  </div>

                                  {/* Pin/Unpin */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      togglePinNote(item.path, e);
                                      setActiveCardMenu(null);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                                      isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                                    }`}
                                  >
                                    <AppIcon name="pin-note" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span>{isPinned ? dict.dashboard.unpinNote : dict.dashboard.pinNote}</span>
                                  </button>

                                  {/* Rename */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRenameNode({ name: item.name, path: item.path, type: 'file', sha: item.sha, children: {} });
                                      setRenameValue(item.name.replace(/\.md$/, ''));
                                      setActiveCardMenu(null);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                                      isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                                    }`}
                                  >
                                    <AppIcon name="rename-note" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span>{dict.dashboard.rename}</span>
                                  </button>

                                  {/* Icon or Emoji Customization */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEmojiPickerNode({ name: item.name, path: item.path, type: 'file', sha: item.sha, children: {} });
                                      setActiveCardMenu(null);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                                      isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                                    }`}
                                  >
                                    <AppIcon name="customize-icon" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span>{dict.dashboard.customizeIcon}</span>
                                  </button>

                                  {/* Export Decrypted Note (.md) */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenu(null);
                                      handleExportSingleNote(item.path);
                                    }}
                                    className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                                      isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                                    }`}
                                  >
                                    <AppIcon name="export-md" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span>{secT.exportNoteMenuLabel}</span>
                                  </button>

                                  {/* Color picker */}
                                  <div className="pt-2 pb-1 px-3">
                                    <span className={`text-[11px] font-semibold block uppercase tracking-wider ${
                                      isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                                    }`}>
                                      {dict.dashboard.color}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                      {NOTE_COLORS.map(c => (
                                        <button
                                          key={c.id}
                                          type="button"
                                          onClick={() => {
                                            updateNoteColor(item.path, c.id);
                                            setActiveCardMenu(null);
                                          }}
                                          className={`w-6 h-6 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                                            colorOpt.id === c.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                          }`}
                                          style={{ 
                                            backgroundColor: isDarkMode ? (c.id === 'default' ? '#272727' : c.darkBg) : (c.id === 'default' ? '#F4F4F5' : c.lightBg)
                                          }}
                                          title={c.name}
                                        >
                                          {colorOpt.id === c.id && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Delete */}
                                  <div className="pt-1 mt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveCardMenu(null);
                                        handleDeleteItem({ name: item.name, path: item.path, type: 'file', sha: item.sha, children: {} });
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-red-500 hover:bg-red-500/10"
                                    >
                                      <AppIcon name="delete-note" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                      <span>{dict.dashboard.deleteNote}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Middle Body: Rich Description */}
                          <p className={`text-sm leading-relaxed line-clamp-5 sm:line-clamp-6 mt-2.5 ${
                            isDarkMode ? 'text-zinc-400' : 'text-[#475569]'
                          }`}>
                            {lockedNotePaths[item.path]
                              ? secT.lockedNoteSnippet
                              : (snippet || dict.dashboard.noAdditionalContent)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* COMPACT LIST VIEW: Individual Rounded Note Cards without Left Border */
                <div className="space-y-3">
                  {filteredAndSortedNotes.map(item => {
                    const meta = noteMetadata[item.path];
                    const colorId = meta?.color;
                    const colorOpt = getNoteColor(colorId);
                    const isPinned = !!meta?.pinned;
                    const hasCustomColor = colorOpt.id !== 'default';
                    const cardStats = calculateNoteStats(noteContents[item.path] ?? meta?.snippet ?? '', uiT.noteInfo.minRead);

                    return (
                      <div
                        key={item.path}
                        onClick={() => handleFileClick(item.path, item.sha)}
                        className={`group relative flex items-center justify-between px-6 py-4 rounded-[24px] [corner-shape:squircle] cursor-pointer transition-all duration-150 select-none ${
                          activeCardMenu === item.path ? 'z-50' : 'z-0'
                        } ${
                          hasCustomColor
                            ? ''
                            : isDarkMode ? 'bg-[#181818]' : 'bg-white shadow-taskflow-card'
                        }`}
                        style={{
                          backgroundColor: hasCustomColor 
                            ? (isDarkMode ? colorOpt.darkBg : colorOpt.lightBg)
                            : undefined
                        }}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                          {/* Color indicator dot */}
                          <div 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: colorOpt.dotColor }}
                            title={colorOpt.name}
                          />
                          
                          <span className="text-base font-semibold truncate">
                            {item.name.replace(/\.md$/, '')}
                          </span>
                        </div>

                        {/* Options Menu Button (•••) in List View */}
                        <div className="relative shrink-0 z-30">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCardMenu(activeCardMenu === item.path ? null : item.path);
                            }}
                            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                              activeCardMenu === item.path
                                ? (isDarkMode ? 'bg-white/15 text-zinc-100' : 'bg-black/10 text-zinc-900')
                                : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-700 hover:bg-black/5')
                            }`}
                            title={uiT.tooltips.noteOptions}
                          >
                            <MoreHorizontal className="w-4.5 h-4.5 stroke-[2.2]" />
                          </button>

                          {activeCardMenu === item.path && (
                            <div 
                              className={`absolute right-0 top-full mt-2 p-2 rounded-[22px] [corner-shape:squircle] z-[100] w-60 backdrop-blur-xl shadow-taskflow-modal animate-in fade-in zoom-in-95 duration-150 ${
                                isDarkMode ? 'bg-[#1C1C1C]/95 text-zinc-200' : 'bg-white/95 text-zinc-800'
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Real-Time Word, Character & Reading Time Info */}
                              <div className={`px-3 py-2.5 mb-1.5 rounded-2xl flex items-start gap-2.5 ${
                                isDarkMode ? 'bg-[#262626] text-zinc-200' : 'bg-[#EEF1F6] text-[#0F172A]'
                              }`}>
                                <AppIcon name="note-info" pack={settings.iconPack || 'meteor'} className="w-4 h-4 shrink-0 mt-0.5 text-zinc-400" />
                                <div className="min-w-0 flex-1 text-[11px] leading-snug">
                                  <p className="font-bold truncate">
                                    {cardStats.words} {cardStats.words === 1 ? dict.dashboard.wordSingular : dict.dashboard.wordPlural} • {cardStats.readingTimeLabel}
                                  </p>
                                  <p className={`mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                    {cardStats.chars} {cardStats.chars === 1 ? dict.dashboard.charSingular : dict.dashboard.charPlural} ({cardStats.charsNoSpaces} {dict.dashboard.withoutSpaces})
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  togglePinNote(item.path, e);
                                  setActiveCardMenu(null);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                                  isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                                }`}
                              >
                                <AppIcon name="pin-note" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span>{isPinned ? dict.dashboard.unpinNote : dict.dashboard.pinNote}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRenameNode({ name: item.name, path: item.path, type: 'file', sha: item.sha, children: {} });
                                  setRenameValue(item.name.replace(/\.md$/, ''));
                                  setActiveCardMenu(null);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                                  isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                                }`}
                              >
                                <AppIcon name="rename-note" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span>{dict.dashboard.rename}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEmojiPickerNode({ name: item.name, path: item.path, type: 'file', sha: item.sha, children: {} });
                                  setActiveCardMenu(null);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                                  isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                                }`}
                              >
                                <AppIcon name="customize-icon" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span>{dict.dashboard.customizeIcon}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCardMenu(null);
                                  handleExportSingleNote(item.path);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                                  isDarkMode ? 'hover:bg-zinc-800 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                                }`}
                              >
                                <AppIcon name="export-md" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span>{secT.exportNoteMenuLabel}</span>
                              </button>

                              <div className="pt-1 mt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCardMenu(null);
                                    handleDeleteItem({ name: item.name, path: item.path, type: 'file', sha: item.sha, children: {} });
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-red-500 hover:bg-red-500/10"
                                >
                                  <AppIcon name="delete-note" pack={settings.iconPack || 'meteor'} className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                  <span>{dict.dashboard.deleteNote}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: FOLDER */}
          {view === 'folder' && (
            <div className={`flex-1 flex flex-col p-8 overflow-y-auto animate-in fade-in duration-500 ${isDarkMode ? 'bg-[#0F0F0F] text-zinc-100' : 'bg-[#F8FAFC] text-[#1E293B]'}`}>
              <header className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => {
                    const parts = currentFolder.split('/');
                    parts.pop();
                    if (parts.length > 0) {
                      setCurrentFolder(parts.join('/'));
                    } else {
                      setView('dashboard');
                      setCurrentFolder('');
                    }
                  }}
                  className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    isDarkMode 
                      ? 'bg-[#181818] hover:bg-[#242424] text-zinc-200' 
                      : 'bg-white hover:bg-zinc-50 text-zinc-800'
                  }`}
                  aria-label="Volver"
                >
                  <ArrowLeft className="w-4.5 h-4.5 stroke-[2]" />
                </button>
                <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2.5 ${isDarkMode ? 'text-zinc-100' : 'text-[#0F172A]'}`}>
                  <CustomFolderIcon pack={settings.iconPack || 'meteor'} className="w-6 h-6" />
                  {currentFolder || 'raíz'}
                </h1>
              </header>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {(() => {
                  const node = getFolderNode(currentFolder, tree);
                  if (!node || Object.keys(node.children).length === 0) {
                    return (
                      <div className={`col-span-full p-14 rounded-[32px] [corner-shape:squircle] text-center flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#181818]' : 'bg-white'}`}>
                        <CustomFolderIcon pack={settings.iconPack || 'meteor'} className={`w-14 h-14 mb-4 ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`} />
                        <p className={`text-base font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{uiT.menus.context.emptyFolder}</p>
                        <button 
                          onClick={() => handleCreateNew(currentFolder)} 
                          className="mt-4 text-base font-semibold hover:underline cursor-pointer"
                          style={{ color: settings.primaryColor }}
                        >
                          {uiT.menus.context.createFileHere}
                        </button>
                      </div>
                    );
                  }
                  return Object.values(node.children)
                    .sort((a, b) => {
                      if (a.type === b.type) return a.name.localeCompare(b.name);
                      return a.type === 'dir' ? -1 : 1;
                    })
                    .map(child => {
                      const childEmoji = noteMetadata[child.path]?.emoji;
                      return (
                        <button 
                          key={child.path}
                          onClick={() => child.type === 'dir' ? handleFolderClick(child.path) : handleFileClick(child.path, child.sha)}
                          className={`flex flex-col items-center gap-3 p-6 rounded-[32px] [corner-shape:squircle] transition-all text-center group cursor-pointer hover:-translate-y-1 select-none ${isDarkMode ? 'bg-[#181818] text-zinc-200' : 'bg-white text-[#1E293B]'}`}
                        >
                          <div className={`w-14 h-14 rounded-2xl [corner-shape:squircle] flex items-center justify-center transition-colors shrink-0 ${isDarkMode ? 'bg-[#242424] group-hover:bg-[#2A2A2A]' : 'bg-[#EEF2F6] group-hover:bg-zinc-200'}`}>
                            {child.type === 'dir' ? (
                              <CustomFolderIcon pack={settings.iconPack || 'meteor'} className="w-7 h-7" />
                            ) : childEmoji ? (
                              <NoteIconDisplay
                                iconOrEmoji={childEmoji}
                                pack={settings.iconPack || 'meteor'}
                                className="w-7 h-7"
                                emojiClassName="text-2xl leading-none"
                              />
                            ) : (
                              <CustomFileIcon pack={settings.iconPack || 'meteor'} className="w-7 h-7" />
                            )}
                          </div>
                          <span className={`text-base font-semibold truncate w-full ${isDarkMode ? 'text-zinc-200' : 'text-[#0F172A]'}`}>{child.name}</span>
                        </button>
                      );
                    });
                })()}
              </div>
            </div>
          )}

          {/* VIEW: EDITOR */}
          {view === 'edit' && (
            <div 
              className={`relative z-10 flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500 transition-colors -ml-8 w-[calc(100%+2rem)] ${
                activeNoteColorObj.id !== 'default' 
                  ? '' 
                  : (isDarkMode ? 'bg-[#0F0F0F] text-zinc-100' : 'bg-[#F8FAFC] text-[#1E293B]')
              }`}
              style={{
                backgroundColor: activeNoteColorObj.id !== 'default'
                  ? (isDarkMode ? activeNoteColorObj.darkBg : activeNoteColorObj.lightBg)
                  : undefined
              }}
            >
              {/* Editor Header Bar */}
              <header className={`relative z-20 flex items-center justify-between pl-16 pr-8 py-3.5 shrink-0 transition-colors ${
                isDarkMode ? 'bg-[#141414]/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md'
              }`}>
                <div className="flex items-center gap-4 truncate">
                  <button 
                    onClick={() => {
                      guardedNavigation(() => {
                        if (parentNoteChain.length > 0) {
                          const immediateParent = parentNoteChain[parentNoteChain.length - 1];
                          handleFileClick(immediateParent.path);
                          return;
                        }
                        const parts = currentPath.split('/');
                        parts.pop();
                        if (parts.length > 0) {
                          setCurrentFolder(parts.join('/'));
                          setView('folder');
                        } else {
                          setView('dashboard');
                          setCurrentFolder('');
                        }
                      });
                    }}
                    className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                      isDarkMode 
                        ? 'bg-[#181818] hover:bg-[#242424] text-zinc-200' 
                        : 'bg-white hover:bg-zinc-50 text-zinc-800'
                    }`}
                    aria-label="Volver"
                  >
                    <ArrowLeft className="w-4 h-4 stroke-[2]" />
                  </button>

                  <div className="flex items-center space-x-1.5 truncate">
                    {/* Notion / Craft Parent Note Breadcrumbs when inside a Sub-Note */}
                    {parentNoteChain.map((ancestor) => (
                      <div key={ancestor.path} className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            guardedNavigation(() => {
                              handleFileClick(ancestor.path);
                            })
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            isDarkMode
                              ? 'bg-[#181818] hover:bg-[#242424] text-zinc-400 hover:text-zinc-100'
                              : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                          }`}
                          title={`${uiT.tooltips.backToParent}: ${ancestor.title}`}
                        >
                          {ancestor.emoji ? (
                            <span className="text-xs leading-none">{ancestor.emoji}</span>
                          ) : (
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="max-w-[120px] truncate">{ancestor.title}</span>
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setEmojiPickerNode({ name: currentPath.split('/').pop() || '', path: currentPath, type: 'file', sha: currentSha, children: {} })}
                      className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 hover:scale-110 transition-all cursor-pointer flex items-center justify-center"
                      title={uiT.tooltips.changeIconOrEmoji}
                    >
                      {noteMetadata[currentPath]?.emoji ? (
                        <NoteIconDisplay
                          iconOrEmoji={noteMetadata[currentPath]?.emoji}
                          pack={settings.iconPack || 'meteor'}
                          className="w-5 h-5 text-blue-500 shrink-0"
                          emojiClassName="text-lg leading-none shrink-0"
                        />
                      ) : (
                        <CustomFileIcon pack={settings.iconPack || 'meteor'} className={`w-4.5 h-4.5 shrink-0 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                      )}
                    </button>
                    <span className={`text-sm font-bold truncate ${isDarkMode ? 'text-zinc-200' : 'text-[#0F172A]'}`}>
                      {parentNoteChain.length > 0 ? currentPath.split('/').pop()?.replace(/\.md$/i, '') : currentPath}
                    </span>
                    {(settings.encryptionEnabled || encryptedNotePaths[currentPath]) && (
                      <Tooltip content={secT.e2eeStatusActive} position="bottom">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-500 shrink-0">
                          <Lock className="w-3 h-3" />
                          <span className="hidden md:inline">E2EE</span>
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Petardo AI Toggle in Editor */}
                  {isAiActive && (
                    <Tooltip content={isAiOpen ? uiT.tooltips.hideAiPanel : uiT.tooltips.openAiPanel} position="bottom">
                      <button
                        type="button"
                        onClick={() => setIsAiOpen(!isAiOpen)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          isAiOpen
                            ? 'bg-blue-600/15 text-blue-500'
                            : isDarkMode ? 'bg-[#181818] text-zinc-200 hover:bg-[#242424]' : 'bg-white text-zinc-800 hover:bg-zinc-50'
                        }`}
                      >
                        <PetardoLogo className="w-4 h-4" />
                        <span className="hidden sm:inline">Petardo AI</span>
                      </button>
                    </Tooltip>
                  )}

                  {/* Note Color Picker Dropdown in Editor */}
                  <div className="relative z-40">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditorColorPickerOpen(!isEditorColorPickerOpen);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        isDarkMode ? 'bg-[#181818] text-zinc-200 hover:bg-[#242424]' : 'bg-white text-zinc-800 hover:bg-zinc-50'
                      }`}
                      title={uiT.tooltips.chooseNoteColor}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full" 
                        style={{ backgroundColor: activeNoteColorObj.dotColor }}
                      />
                      <span className="hidden sm:inline">{dict.dashboard.color}</span>
                    </button>

                    {isEditorColorPickerOpen && (
                      <div 
                        className={`absolute right-0 top-full mt-2 p-3 rounded-[22px] [corner-shape:squircle] z-50 flex flex-wrap gap-2 w-52 backdrop-blur-xl ${
                          isDarkMode ? 'bg-[#1C1C1C]/95' : 'bg-white/95'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {NOTE_COLORS.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => updateNoteColor(currentPath, c.id)}
                            className={`w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center cursor-pointer ${
                              activeNoteColorObj.id === c.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                            }`}
                            style={{ 
                              backgroundColor: isDarkMode ? (c.id === 'default' ? '#272727' : c.darkBg) : (c.id === 'default' ? '#F4F4F5' : c.lightBg)
                            }}
                            title={c.name}
                          >
                            {activeNoteColorObj.id === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || isSaving}
                    title={
                      isSaving
                        ? uiT.tooltips.savingChanges
                        : hasUnsavedChanges
                          ? uiT.tooltips.saveChangesShortcut
                          : uiT.tooltips.noChangesToSave
                    }
                    className={`flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold px-5 py-2 rounded-full transition-all duration-200 min-w-[95px] shrink-0 select-none ${
                      hasUnsavedChanges
                        ? 'text-white cursor-pointer hover:opacity-95 active:scale-[0.97] shadow-sm'
                        : isDarkMode
                          ? 'bg-[#222222] text-zinc-500 cursor-not-allowed border border-white/[0.05]'
                          : 'bg-slate-200/90 text-slate-400 cursor-not-allowed'
                    }`}
                    style={{
                      backgroundColor: hasUnsavedChanges ? settings.primaryColor : undefined
                    }}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{dict.editor.saving}</span>
                      </>
                    ) : (
                      <span>{dict.editor.save}</span>
                    )}
                  </button>

                  {/* Focus Mode / Typewriter Mode Toggle Button in Editor Header (Alt+Z) */}
                  <Tooltip
                    content={
                      settings.focusMode
                        ? uiT.tooltips.focusModeDisable
                        : uiT.tooltips.focusModeEnable
                    }
                    position="bottom"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const nextFocus = !settings.focusMode;
                        handleUpdateSettings({ focusMode: nextFocus });
                        showToast(
                          nextFocus
                            ? uiT.tooltips.focusModeEnable
                            : uiT.tooltips.focusModeDisable,
                          'info'
                        );
                      }}
                      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                        settings.focusMode
                          ? 'text-white'
                          : isDarkMode
                            ? 'bg-[#181818] hover:bg-[#242424] text-zinc-200'
                            : 'bg-white hover:bg-zinc-100 text-zinc-700'
                      }`}
                      style={{
                        backgroundColor: settings.focusMode
                          ? settings.primaryColor || '#006FFF'
                          : undefined,
                      }}
                      aria-label={uiT.tooltips.focusModeEnable}
                    >
                      <AppIcon name="focus-mode" pack={settings.iconPack || 'meteor'} className="w-4 h-4" />
                    </button>
                  </Tooltip>

                  {/* Note Font Size Selector in Note Header (Replaced Command Palette button) */}
                  <div className="relative z-50" ref={fontSizeMenuRef}>
                    <Tooltip content={`${dict.sidebar.noteFontSize || 'Tamaño de texto'}: ${settings.noteFontSize || '17px'}`} position="bottom">
                      <button
                        type="button"
                        onClick={() => setIsFontSizeMenuOpen(prev => !prev)}
                        className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                          isFontSizeMenuOpen
                            ? (isDarkMode ? 'bg-[#282828] text-white ring-2 ring-blue-500/40' : 'bg-[#E2E8F0] text-[#0F172A] ring-2 ring-blue-500/40')
                            : (isDarkMode ? 'bg-[#181818] hover:bg-[#242424] text-zinc-200' : 'bg-white hover:bg-zinc-100 text-zinc-700')
                        }`}
                        aria-label={dict.sidebar.noteFontSize || 'Tamaño de texto'}
                      >
                        <Type className="w-4 h-4" />
                      </button>
                    </Tooltip>

                    {/* Font Size Floating Popover */}
                    {isFontSizeMenuOpen && (
                      <div 
                        className={`absolute right-0 top-full mt-2 z-50 w-64 p-3.5 rounded-2xl [corner-shape:squircle] shadow-2xl border transition-all ${
                          isDarkMode 
                            ? 'bg-[#1A1A1A] border-zinc-800 text-zinc-100 shadow-black/60' 
                            : 'bg-white border-zinc-200 text-[#1E293B] shadow-slate-300/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                            {dict.sidebar.noteFontSize || 'Tamaño de texto'}
                          </span>
                          <span 
                            className="text-xs font-mono font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: settings.primaryColor }}
                          >
                            {settings.noteFontSize || '17px'}
                          </span>
                        </div>

                        {/* Stepper +/- */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = parseInt(settings.noteFontSize || '17px', 10) || 17;
                              handleUpdateSettings({ noteFontSize: `${Math.max(12, cur - 1)}px` });
                            }}
                            className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 text-xs transition-colors cursor-pointer ${
                              isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            }`}
                            title="Reducir tamaño (-1px)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                            <span>-1px</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateSettings({ noteFontSize: '17px' })}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                              isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'
                            }`}
                            title="Restablecer tamaño normal (17px)"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = parseInt(settings.noteFontSize || '17px', 10) || 17;
                              handleUpdateSettings({ noteFontSize: `${Math.min(32, cur + 1)}px` });
                            }}
                            className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 text-xs transition-colors cursor-pointer ${
                              isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                            }`}
                            title="Aumentar tamaño (+1px)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+1px</span>
                          </button>
                        </div>

                        {/* Presets Grid */}
                        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                          {[
                            { label: 'Pequeño', px: 14 },
                            { label: 'Normal', px: 17 },
                            { label: 'Mediano', px: 20 },
                            { label: 'Grande', px: 24 },
                          ].map((item) => {
                            const cur = parseInt(settings.noteFontSize || '17px', 10) || 17;
                            const isSelected = cur === item.px;
                            return (
                              <button
                                key={item.px}
                                type="button"
                                onClick={() => handleUpdateSettings({ noteFontSize: `${item.px}px` })}
                                className={`px-2.5 py-2 rounded-xl text-xs flex items-center justify-between font-semibold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'text-white'
                                    : isDarkMode 
                                      ? 'bg-[#222222] hover:bg-[#2A2A2A] text-zinc-300' 
                                      : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-zinc-700'
                                }`}
                                style={{
                                  backgroundColor: isSelected ? settings.primaryColor : undefined,
                                }}
                              >
                                <span>{item.label}</span>
                                <span className="text-[10px] opacity-80 font-mono">{item.px}px</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Live preview */}
                        <div 
                          className={`p-2.5 rounded-xl overflow-hidden truncate transition-colors text-center ${
                            isDarkMode ? 'bg-[#121212]' : 'bg-[#F8FAFC]'
                          }`}
                          style={{ fontSize: settings.noteFontSize || '17px' }}
                        >
                          Texto de nota
                        </div>
                      </div>
                    )}
                  </div>

                  {/* In-Note Search & Replace Toggle Button (Ctrl+F / Ctrl+H) */}
                  <Tooltip content={uiT.tooltips.findReplaceInNote} position="bottom">
                    <button
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('toggle-note-search'))}
                      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                        isDarkMode
                          ? 'bg-[#181818] hover:bg-[#242424] text-zinc-200'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700'
                      }`}
                      aria-label={uiT.tooltips.findReplaceInNote}
                    >
                      <AppIcon name="search" pack={settings.iconPack || 'meteor'} className="w-4 h-4" />
                    </button>
                  </Tooltip>

                  {/* Export Current Note (.md) Button in Editor Header */}
                  <Tooltip content={secT.exportNoteMenuLabel} position="bottom">
                    <button
                      type="button"
                      onClick={() => handleExportSingleNote(currentPath)}
                      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                        isDarkMode
                          ? 'bg-[#181818] hover:bg-[#242424] text-zinc-200'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700'
                      }`}
                      aria-label={secT.exportNoteMenuLabel}
                    >
                      <AppIcon name="download" pack={settings.iconPack || 'meteor'} className="w-4 h-4" />
                    </button>
                  </Tooltip>

                  {/* Info & Table of Contents Right Sidebar Toggle Button in Top-Right Header */}
                  <Tooltip content={isNoteInfoOpen ? uiT.tooltips.hideNoteInfo : uiT.tooltips.showNoteInfo} position="bottom">
                    <button
                      type="button"
                      onClick={() => setIsNoteInfoOpen(prev => !prev)}
                      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                        isNoteInfoOpen
                          ? 'text-white'
                          : isDarkMode
                            ? 'bg-[#181818] hover:bg-[#242424] text-zinc-200'
                            : 'bg-white hover:bg-zinc-100 text-zinc-700'
                      }`}
                      style={{
                        backgroundColor: isNoteInfoOpen ? (settings.primaryColor || '#006FFF') : undefined,
                      }}
                      aria-label={uiT.tooltips.showNoteInfo}
                    >
                      <AppIcon name="note-info" pack={settings.iconPack || 'meteor'} className="w-4.5 h-4.5" />
                    </button>
                  </Tooltip>
                </div>
              </header>

              {/* Editor Workspace Card */}
              <div
                ref={editorScrollContainerRef}
                onScroll={handleEditorScroll}
                className="flex-1 overflow-y-auto pl-12 pr-4 sm:pl-16 sm:pr-8 py-6 max-w-4xl mx-auto w-full"
              >
                <div className={`relative p-8 sm:p-12 rounded-[32px] [corner-shape:squircle] transition-all ${
                  isDarkMode ? 'bg-[#181818]' : 'bg-white'
                }`}>
                  {/* Notion / Craft Back-to-Parent Banner when inside a Sub-Note */}
                  {parentNoteChain.length > 0 && (
                    <div className="mb-6 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const immediateParent = parentNoteChain[parentNoteChain.length - 1];
                          guardedNavigation(() => {
                            handleFileClick(immediateParent.path);
                          });
                        }}
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border-0 shadow-none active:scale-95 ${
                          isDarkMode
                            ? 'bg-[#222226] hover:bg-[#2C2C32] text-zinc-200'
                            : 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-slate-700'
                        }`}
                      >
                        <ArrowLeft
                          className="w-3.5 h-3.5"
                          style={{ color: settings.primaryColor || '#006FFF' }}
                        />
                        <span>
                          {uiT.subnotes.nestedIn}{' '}
                          <strong className="font-bold">
                            {parentNoteChain[parentNoteChain.length - 1].title}
                          </strong>
                        </span>
                      </button>
                    </div>
                  )}

                  {frontMatter && Object.keys(frontMatter).length > 0 && (
                    <div className="mb-8 flex flex-col gap-2 text-[13px] animate-in fade-in duration-500 pb-4">
                      {Object.entries(frontMatter).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-4 pb-1">
                          <span className={`w-24 font-semibold capitalize ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{key}</span>
                          <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}>{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="prose-editor relative h-full">
                    <BearMarkdownEditor
                      value={currentContent}
                      onChange={handleContentChange}
                      isDarkMode={isDarkMode}
                      placeholder={dict.editor.placeholder}
                      onSave={handleSave}
                      spellcheck={settings.spellcheck}
                      primaryColor={settings.primaryColor}
                      onOpenDailyNote={(dateStr) => handleCreateDailyNote(dateStr)}
                      onOpenWikiLink={handleOpenWikiLink}
                      wikiLinkNotes={wikiLinkNoteOptions}
                      currentNotePath={currentPath}
                      onShowToast={showToast}
                      focusMode={!!settings.focusMode}
                      language={activeLanguage}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS (Enterprise List Section) */}
          {view === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetSettings={handleResetSettings}
              onBack={() => {
                guardedNavigation(() => {
                  setSettingsInitialSection(undefined);
                  setView(previousView || 'dashboard');
                });
              }}
              isDarkMode={isDarkMode}
              userProfile={userProfile}
              totalNotesCount={notes.filter(n => n.type === 'file' && n.name !== '.gitkeep').length}
              onShowToast={showToast}
              e2eeUnlocked={!!(e2eePassword || getStoredMasterPassword())}
              encryptedNotesCount={encryptedNotesCount}
              batchProgress={batchProgress}
              onEnableEncryption={handleEnableEncryption}
              onDisableEncryption={handleDisableEncryption}
              onEncryptAllRepoNotes={handleEncryptAllRepoNotes}
              onUnlockVault={handleUnlockVault}
              onLockSession={handleLockSession}
              onExportAllVaultZip={() => handleExportAllVaultZip()}
              initialSection={settingsInitialSection}
              configuredAiProviders={configuredAiProviders}
            />
          )}

          {/* VIEW: TASKS (Global Tasks Scanner) */}
          {view === 'tasks' && (
            <TasksView
              notes={notes}
              noteContents={noteContents}
              isDarkMode={isDarkMode}
              primaryColor={settings.primaryColor}
              iconPack={settings.iconPack || 'meteor'}
              onToggleTask={handleToggleTaskInNote}
              onOpenNote={(path) => handleFileClick(path)}
              onShowToast={showToast}
            />
          )}

          {/* VIEW: CALENDAR (Monthly/Weekly & Daily Notes) */}
          {view === 'calendar' && (
            <CalendarView
              notes={notes}
              noteContents={noteContents}
              isDarkMode={isDarkMode}
              primaryColor={settings.primaryColor}
              onOpenNote={(path) => handleFileClick(path)}
              onCreateDailyNote={handleCreateDailyNote}
            />
          )}
        </main>

        {/* Right Note Info & Automatic Table of Contents (TOC) Sidebar (Only when inside a note) */}
        <AnimatePresence>
          {view === 'edit' && isNoteInfoOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={`shrink-0 h-full flex flex-col relative z-20 overflow-hidden rounded-tl-[28px] rounded-bl-[28px] [corner-shape:squircle] ${
                isDarkMode ? 'bg-[#141414] text-zinc-100' : 'bg-white text-[#1E293B]'
              }`}
            >
              <div className="w-[320px] h-full flex flex-col">
                {/* Sidebar Header */}
                <div className="p-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: isDarkMode ? '#242424' : '#EEF1F6',
                        color: settings.primaryColor || '#006FFF',
                      }}
                    >
                      <AppIcon name="note-info" pack={settings.iconPack || 'meteor'} className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold tracking-tight truncate">
                      {uiT.noteInfo.title}
                    </h2>
                  </div>
                  <Tooltip content={uiT.tooltips.closePanel} position="left">
                    <button
                      type="button"
                      onClick={() => setIsNoteInfoOpen(false)}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                        isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-[#EEF1F6] text-zinc-500 hover:text-zinc-800'
                      }`}
                      aria-label={uiT.tooltips.closePanel}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>

                {/* Sidebar Scrollable Body with the 2 Sections */}
                <div className="flex-1 overflow-y-auto px-3 pb-8 space-y-3">
                  {/* SECTION 1: Contador de Palabras, Caracteres y Tiempo de Lectura */}
                  <div
                    className={`p-2.5 rounded-[22px] [corner-shape:squircle] transition-colors ${
                      isDarkMode ? 'bg-[#181818]/90' : 'bg-[#F8FAFC]'
                    }`}
                  >
                    <div
                      onClick={() => setCollapsedInfoSections(prev => ({ ...prev, stats: !prev.stats }))}
                      className="flex items-center justify-between px-2 py-1.5 rounded-xl cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {collapsedInfoSections.stats ? (
                          <ChevronRight className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                        ) : (
                          <ChevronDown className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                        )}
                        <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: settings.primaryColor || '#006FFF' }} />
                        <span className={`text-xs font-bold tracking-tight truncate ${isDarkMode ? 'text-zinc-200' : 'text-[#1E293B]'}`}>
                          {uiT.noteInfo.statsAndReading}
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                        style={{ backgroundColor: settings.primaryColor || '#006FFF' }}
                      >
                        {currentNoteStats.readingTimeLabel}
                      </span>
                    </div>

                    {!collapsedInfoSections.stats && (
                      <div className="mt-2 px-1 pb-1">
                        {/* Summary Banner */}
                        <div
                          className={`px-3 py-2 rounded-2xl mb-2.5 text-xs font-semibold text-center ${
                            isDarkMode ? 'bg-[#242424] text-zinc-200' : 'bg-[#EEF1F6] text-[#0F172A]'
                          }`}
                        >
                          {currentNoteStats.words} {currentNoteStats.words === 1 ? dict.dashboard.wordSingular : dict.dashboard.wordPlural} • {currentNoteStats.readingTimeLabel}
                        </div>

                        {/* Metrics Breakdown Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div
                            className={`p-2.5 rounded-2xl flex flex-col ${
                              isDarkMode ? 'bg-[#222222]/80' : 'bg-white'
                            }`}
                          >
                            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {uiT.noteInfo.wordsLabel}
                            </span>
                            <span className="text-base font-bold mt-0.5">
                              {currentNoteStats.words}
                            </span>
                          </div>

                          <div
                            className={`p-2.5 rounded-2xl flex flex-col ${
                              isDarkMode ? 'bg-[#222222]/80' : 'bg-white'
                            }`}
                          >
                            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {uiT.noteInfo.charsLabel}
                            </span>
                            <span className="text-base font-bold mt-0.5">
                              {currentNoteStats.chars}
                            </span>
                          </div>

                          <div
                            className={`p-2.5 rounded-2xl flex flex-col ${
                              isDarkMode ? 'bg-[#222222]/80' : 'bg-white'
                            }`}
                          >
                            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {uiT.noteInfo.noSpacesLabel}
                            </span>
                            <span className="text-base font-bold mt-0.5">
                              {currentNoteStats.charsNoSpaces}
                            </span>
                          </div>

                          <div
                            className={`p-2.5 rounded-2xl flex flex-col ${
                              isDarkMode ? 'bg-[#222222]/80' : 'bg-white'
                            }`}
                          >
                            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              {uiT.noteInfo.readingTimeLabel}
                            </span>
                            <span
                              className="text-base font-bold mt-0.5"
                              style={{ color: settings.primaryColor || '#006FFF' }}
                            >
                              {currentNoteStats.readingTimeMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: Índice de Contenidos Automático (Table of Contents / TOC) */}
                  <div
                    className={`p-2.5 rounded-[22px] [corner-shape:squircle] border transition-colors ${
                      isDarkMode ? 'bg-[#181818]/90 border-zinc-800/80' : 'bg-[#F8FAFC] border-slate-200/80'
                    }`}
                  >
                    <div
                      onClick={() => setCollapsedInfoSections(prev => ({ ...prev, toc: !prev.toc }))}
                      className="flex items-center justify-between px-2 py-1.5 rounded-xl cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {collapsedInfoSections.toc ? (
                          <ChevronRight className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                        ) : (
                          <ChevronDown className={`w-4 h-4 shrink-0 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
                        )}
                        <ListTree className="w-3.5 h-3.5 shrink-0" style={{ color: settings.primaryColor || '#006FFF' }} />
                        <span className={`text-xs font-bold tracking-tight truncate ${isDarkMode ? 'text-zinc-200' : 'text-[#1E293B]'}`}>
                          {uiT.noteInfo.tocTitle}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200/80 text-zinc-600'
                        }`}
                      >
                        {currentNoteToc.length}
                      </span>
                    </div>

                    {!collapsedInfoSections.toc && (
                      <div className="mt-2 px-1 pb-1">
                        {currentNoteToc.length === 0 ? (
                          <div
                            className={`p-4 rounded-2xl text-center text-xs leading-relaxed ${
                              isDarkMode ? 'bg-[#222222]/60 text-zinc-400' : 'bg-white text-zinc-500'
                            }`}
                          >
                            {uiT.noteInfo.tocEmptyHint}
                          </div>
                        ) : (
                          <nav className="space-y-1" aria-label={uiT.noteInfo.tocTitle}>
                            {currentNoteToc.map((heading) => {
                              const isActive = activeTocIndex === heading.index;
                              const indentClass =
                                heading.level === 1
                                  ? 'pl-2.5'
                                  : heading.level === 2
                                    ? 'pl-6'
                                    : 'pl-9';

                              return (
                                <button
                                  key={`${heading.index}-${heading.text}`}
                                  type="button"
                                  onClick={() => handleScrollToHeading(heading.index)}
                                  className={`w-full flex items-center gap-2 pr-3 py-2 rounded-full text-left transition-all duration-150 cursor-pointer group ${indentClass} ${
                                    isActive
                                      ? isDarkMode
                                        ? 'bg-[#262626] text-white font-semibold'
                                        : 'bg-[#E2E8F0] text-[#0F172A] font-semibold'
                                      : isDarkMode
                                        ? 'hover:bg-zinc-800/70 text-zinc-300'
                                        : 'hover:bg-zinc-200/60 text-[#334155]'
                                  }`}
                                >
                                  <span
                                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                      isActive
                                        ? 'text-white'
                                        : isDarkMode
                                          ? 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                                          : 'bg-zinc-200/80 text-zinc-600 group-hover:text-zinc-900'
                                    }`}
                                    style={{
                                      backgroundColor: isActive ? (settings.primaryColor || '#006FFF') : undefined,
                                    }}
                                  >
                                    H{heading.level}
                                  </span>
                                  <span
                                    className={`truncate ${
                                      heading.level === 1
                                        ? 'text-xs font-bold'
                                        : heading.level === 2
                                          ? 'text-xs font-semibold'
                                          : 'text-[11px] font-medium opacity-90'
                                    }`}
                                  >
                                    {heading.text}
                                  </span>
                                </button>
                              );
                            })}
                          </nav>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Right AI Companion Sidebar (Petardo) */}
        {isAiActive && isAiOpen && view !== 'settings' && (
          <aside className={`w-[360px] sm:w-[400px] lg:w-[420px] xl:w-[450px] shrink-0 h-full flex flex-col relative z-20 transition-all duration-300 overflow-hidden ${
            isDarkMode 
              ? 'bg-[#141414] text-zinc-100' 
              : 'bg-white text-[#1E293B]'
          }`}>
            <PetardoAgent
              isDarkMode={isDarkMode}
              currentPath={currentPath}
              currentContent={currentContent}
              userProfile={userProfile}
              onInsertContent={handleInsertContentFromAgent}
              onCreateFile={handleCreateFileFromAgent}
              onShowToast={showToast}
              onClose={() => setIsAiOpen(false)}
              primaryColor={settings.primaryColor}
              language={activeLanguage}
            />
          </aside>
        )}
      </div>

      {/* Floating Quick Launcher Bubble (Everywhere in Webapp except Settings when AI is active and closed) */}
      {isAiActive && !isAiOpen && view !== 'settings' && (
        <div className={`fixed bottom-6 z-40 transition-all duration-300 ${view === 'edit' && isNoteInfoOpen ? 'right-[340px]' : 'right-6'}`}>
          <Tooltip content={uiT.tooltips.openPetardoAi} position="left">
            <button
              onClick={() => setIsAiOpen(true)}
              className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-taskflow-card ${
                isDarkMode 
                  ? 'bg-[#181818] hover:bg-[#242424] text-zinc-100' 
                  : 'bg-white hover:bg-zinc-50 text-zinc-800'
              }`}
              aria-label={uiT.tooltips.openPetardoAi}
            >
              <div className="relative flex items-center justify-center">
                <PetardoLogo className="w-5.5 h-5.5 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-semibold text-xs sm:text-sm tracking-wide">Petardo AI</span>
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
