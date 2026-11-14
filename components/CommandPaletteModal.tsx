"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  FileText,
  FilePlus2,
  FolderPlus,
  Calendar,
  CheckSquare,
  Settings,
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  List,
  PanelLeft,
  Save,
  Sparkles,
  Pin,
  Info,
  Heading1,
  Heading2,
  Heading3,
  ListTodo,
  List as ListIcon,
  Table2,
  Code,
  Quote,
  Highlighter,
  Bold,
  Italic,
  Minus,
  ArrowUpDown,
  CornerDownLeft,
  X,
  Command,
  Focus,
  AtSign,
  Download,
  FileArchive,
  ShieldCheck,
} from 'lucide-react';
import { NoteIconDisplay } from '@/lib/noteIcons';
import { AppLanguage, getUiTranslations } from '@/lib/i18n';
import { getSecurityStrings } from '@/lib/crypto';
import { IconPackType } from '@/lib/settings';

export interface CommandPaletteNoteItem {
  path: string;
  name: string;
  title: string;
  folder?: string;
  emoji?: string;
  snippet?: string;
  pinned?: boolean;
  parentPath?: string;
}

export type CommandCategory = 'all' | 'notes' | 'actions' | 'format' | 'theme';

interface CommandActionItem {
  id: string;
  category: Exclude<CommandCategory, 'all'>;
  sectionLabel: string;
  title: string;
  subtitle?: string;
  keywords: string;
  shortcut?: string;
  badge?: string;
  isActive?: boolean;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  primaryColor: string;
  iconPack?: IconPackType;
  language?: AppLanguage;
  notes: CommandPaletteNoteItem[];
  currentPath: string;
  currentView: 'dashboard' | 'folder' | 'edit' | 'settings' | 'tasks' | 'calendar';
  hasUnsavedChanges: boolean;
  themeMode: 'light' | 'dark' | 'system';
  listLayout: 'grid' | 'compact';
  sortBy: 'modified' | 'created' | 'name';
  isSidebarCollapsed: boolean;
  isNoteInfoOpen: boolean;
  focusMode: boolean;
  onOpenNote: (path: string) => void;
  onCreateNewNote: (initialTitle?: string) => void;
  onCreateSubNote: (initialTitle?: string) => void;
  onCreateNewSection: () => void;
  onCreateDailyNote: () => void;
  onSaveCurrentNote: () => void;
  onOpenDocSearch: (withReplace?: boolean) => void;
  onCustomizeCurrentNoteIcon: () => void;
  onTogglePinCurrentNote: () => void;
  onToggleNoteInfo: () => void;
  onNavigateView: (view: 'dashboard' | 'tasks' | 'calendar' | 'settings') => void;
  onSetThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  onSetListLayout: (layout: 'grid' | 'compact') => void;
  onSetSortBy: (sort: 'modified' | 'created' | 'name') => void;
  onToggleSidebar: () => void;
  onToggleFocusMode: () => void;
  onExecuteEditorFormat: (cmdId: string) => void;
  onExportCurrentNote?: () => void;
  onExportAllVaultZip?: () => void;
  onOpenSecuritySettings?: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  isDarkMode,
  primaryColor,
  iconPack = 'meteor',
  language = 'es',
  notes,
  currentPath,
  currentView,
  hasUnsavedChanges,
  themeMode,
  listLayout,
  sortBy,
  isSidebarCollapsed,
  isNoteInfoOpen,
  focusMode,
  onOpenNote,
  onCreateNewNote,
  onCreateSubNote,
  onCreateNewSection,
  onCreateDailyNote,
  onSaveCurrentNote,
  onOpenDocSearch,
  onCustomizeCurrentNoteIcon,
  onTogglePinCurrentNote,
  onToggleNoteInfo,
  onNavigateView,
  onSetThemeMode,
  onSetListLayout,
  onSetSortBy,
  onToggleSidebar,
  onToggleFocusMode,
  onExecuteEditorFormat,
  onExportCurrentNote,
  onExportAllVaultZip,
  onOpenSecuritySettings,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CommandCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const cp = useMemo(() => getUiTranslations(language).commandPalette, [language]);
  const secT = useMemo(() => getSecurityStrings(language), [language]);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setQuery('');
        setActiveCategory('all');
        setSelectedIndex(0);
      });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
    }
  }, [isOpen]);

  const cleanQuery = query.trim().toLowerCase();

  // Build universal command items
  const allItems = useMemo<CommandActionItem[]>(() => {
    const items: CommandActionItem[] = [];

    // 1. Dynamic "Create Note / Sub-Note with typed query" when user types a title
    if (query.trim().length > 0) {
      const exactNoteExists = notes.some(
        (n) => n.title.toLowerCase() === cleanQuery || n.name.toLowerCase() === cleanQuery
      );
      if (!exactNoteExists) {
        if (currentView === 'edit' && currentPath) {
          items.push({
            id: `create-subnote-query-${cleanQuery}`,
            category: 'actions',
            sectionLabel: cp.secQuickCreate,
            title: `${cp.createSubnoteDynamicTitle}: «${query.trim()}»`,
            subtitle: cp.createSubnoteDynamicSub,
            keywords: `crear subnota nota pagina create subnote ${cleanQuery}`,
            badge: cp.badgeNew,
            icon: <FilePlus2 className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />,
            onSelect: () => {
              onClose();
              onCreateSubNote(query.trim());
            },
          });
        }
        items.push({
          id: `create-note-query-${cleanQuery}`,
          category: 'actions',
          sectionLabel: cp.secQuickCreate,
          title: `${cp.createNoteDynamicTitle}: «${query.trim()}»`,
          subtitle: cp.createNoteDynamicSub,
          keywords: `crear nueva nota archivo create note ${cleanQuery}`,
          badge: cp.badgeCreateMd,
          icon: <FilePlus2 className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />,
          onSelect: () => {
            onClose();
            onCreateNewNote(query.trim());
          },
        });
      }
    }

    // 2. Notes list (Searchable by title, folder, and snippet content)
    notes.forEach((note) => {
      const isCurrent = note.path === currentPath && currentView === 'edit';
      const renderNoteIcon = () => {
        if (note.emoji) {
          return (
            <NoteIconDisplay
              iconOrEmoji={note.emoji}
              pack={iconPack}
              className="w-4 h-4 shrink-0"
              emojiClassName="text-base leading-none shrink-0"
              fallback={<FileText className="w-4 h-4 shrink-0 opacity-75" />}
            />
          );
        }
        return <FileText className="w-4 h-4 shrink-0 opacity-75" />;
      };

      items.push({
        id: `note-${note.path}`,
        category: 'notes',
        sectionLabel: cp.secSyncedNotes,
        title: note.title,
        subtitle: note.snippet
          ? `${note.folder ? `${note.folder} · ` : ''}${note.snippet}`
          : note.folder || cp.rootFolder,
        keywords: `${note.title} ${note.name} ${note.folder || ''} ${note.snippet || ''} abrir nota open note`,
        badge: isCurrent ? cp.badgeOpen : note.pinned ? cp.badgePinned : note.parentPath ? cp.badgeSubnote : undefined,
        isActive: isCurrent,
        icon: renderNoteIcon(),
        onSelect: () => {
          onClose();
          onOpenNote(note.path);
        },
      });
    });

    // 3. Quick Actions & Navigation
    if (currentView === 'edit' && currentPath) {
      if (hasUnsavedChanges) {
        items.push({
          id: 'action-save-note',
          category: 'actions',
          sectionLabel: cp.secCurrentNote,
          title: cp.actSaveTitle,
          subtitle: cp.actSaveSub,
          keywords: 'guardar save sincronizar commit cambios',
          shortcut: 'Ctrl + S',
          badge: cp.badgeUnsaved,
          icon: <Save className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />,
          onSelect: () => {
            onClose();
            onSaveCurrentNote();
          },
        });
      }

      items.push(
        {
          id: 'action-create-subnote',
          category: 'actions',
          sectionLabel: cp.secCurrentNote,
          title: cp.actSubnoteTitle,
          subtitle: cp.actSubnoteSub,
          keywords: 'subnota crear nota dentro anidada wikilink [[ subnote',
          shortcut: '[[',
          icon: <FilePlus2 className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            onCreateSubNote();
          },
        },
        {
          id: 'action-doc-find',
          category: 'actions',
          sectionLabel: cp.secCurrentNote,
          title: cp.actFindTitle,
          subtitle: cp.actFindSub,
          keywords: 'buscar en documento encontrar find search texto',
          shortcut: 'Ctrl + F',
          icon: <Search className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onOpenDocSearch(false), 30);
          },
        },
        {
          id: 'action-doc-replace',
          category: 'actions',
          sectionLabel: cp.secCurrentNote,
          title: cp.actReplaceTitle,
          subtitle: cp.actReplaceSub,
          keywords: 'buscar y reemplazar replace sustituir find',
          shortcut: 'Ctrl + H',
          icon: <Search className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onOpenDocSearch(true), 30);
          },
        },
        {
          id: 'action-note-icon',
          category: 'actions',
          sectionLabel: cp.secCurrentNote,
          title: cp.actIconTitle,
          subtitle: cp.actIconSub,
          keywords: 'icono emoji personalizar cambiar nota icon',
          icon: <Sparkles className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            onCustomizeCurrentNoteIcon();
          },
        },
        {
          id: 'action-note-pin',
          category: 'actions',
          sectionLabel: cp.secCurrentNote,
          title: cp.actPinTitle,
          subtitle: cp.actPinSub,
          keywords: 'fijar desfijar pin destacar inicio',
          icon: <Pin className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            onTogglePinCurrentNote();
          },
        },
        {
          id: 'action-note-info',
          category: 'actions',
          sectionLabel: cp.secCurrentNote,
          title: isNoteInfoOpen ? cp.actInfoHideTitle : cp.actInfoShowTitle,
          subtitle: cp.actInfoSub,
          keywords: 'informacion indice tabla de contenidos toc estadisticas palabras info',
          icon: <Info className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            onToggleNoteInfo();
          },
        },
        {
          id: 'action-export-current-md',
          category: 'actions',
          sectionLabel: cp.secCurrentNote,
          title: secT.exportNoteMenuLabel,
          subtitle: secT.exportSectionDesc,
          keywords: 'exportar descargar markdown md obsidian archivo export download',
          icon: <Download className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            onExportCurrentNote?.();
          },
        }
      );
    }

    items.push(
      {
        id: 'action-new-note',
        category: 'actions',
        sectionLabel: cp.secActionsNav,
        title: cp.actNewNoteTitle,
        subtitle: cp.actNewNoteSub,
        keywords: 'crear nueva nota archivo documento nuevo new note',
        shortcut: 'Alt + N',
        icon: <FilePlus2 className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onCreateNewNote();
        },
      },
      {
        id: 'action-daily-note',
        category: 'actions',
        sectionLabel: cp.secActionsNav,
        title: cp.actDailyTitle,
        subtitle: cp.actDailySub,
        keywords: 'nota diaria hoy bitacora journal diario daily',
        icon: <Calendar className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onCreateDailyNote();
        },
      },
      {
        id: 'action-new-section',
        category: 'actions',
        sectionLabel: cp.secActionsNav,
        title: cp.actNewSectionTitle,
        subtitle: cp.actNewSectionSub,
        keywords: 'crear nueva seccion carpeta folder categoria section',
        shortcut: 'Alt + Shift + N',
        icon: <FolderPlus className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onCreateNewSection();
        },
      },
      {
        id: 'nav-dashboard',
        category: 'actions',
        sectionLabel: cp.secActionsNav,
        title: cp.navDashboardTitle,
        subtitle: cp.navDashboardSub,
        keywords: 'ir panel principal inicio home dashboard notas',
        shortcut: 'Alt + 1',
        isActive: currentView === 'dashboard',
        icon: <LayoutGrid className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onNavigateView('dashboard');
        },
      },
      {
        id: 'nav-tasks',
        category: 'actions',
        sectionLabel: cp.secActionsNav,
        title: cp.navTasksTitle,
        subtitle: cp.navTasksSub,
        keywords: 'ir tareas pendientes to-do checklist tasks',
        shortcut: 'Alt + 2',
        isActive: currentView === 'tasks',
        icon: <CheckSquare className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onNavigateView('tasks');
        },
      },
      {
        id: 'nav-calendar',
        category: 'actions',
        sectionLabel: cp.secActionsNav,
        title: cp.navCalendarTitle,
        subtitle: cp.navCalendarSub,
        keywords: 'ir calendario fechas agenda calendar',
        shortcut: 'Alt + 3',
        isActive: currentView === 'calendar',
        icon: <Calendar className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onNavigateView('calendar');
        },
      },
      {
        id: 'nav-settings',
        category: 'actions',
        sectionLabel: cp.secActionsNav,
        title: cp.navSettingsTitle,
        subtitle: cp.navSettingsSub,
        keywords: 'abrir configuracion ajustes preferencias settings',
        shortcut: 'Ctrl + ,',
        isActive: currentView === 'settings',
        icon: <Settings className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onNavigateView('settings');
        },
      },
      {
        id: 'nav-security-e2ee',
        category: 'actions',
        sectionLabel: cp.secActionsNav,
        title: secT.navSecurity,
        subtitle: secT.e2eeSubtitle,
        keywords: 'cifrado e2ee seguridad contraseña privacidad encriptar desencriptar encryption security',
        icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          if (onOpenSecuritySettings) {
            onOpenSecuritySettings();
          } else {
            onNavigateView('settings');
          }
        },
      },
      {
        id: 'action-export-vault-zip',
        category: 'actions',
        sectionLabel: cp.secActionsNav,
        title: secT.exportAllZipTitle,
        subtitle: secT.exportAllZipDesc,
        keywords: 'exportar todo zip boveda obsidian backup copia seguridad descargar notas export',
        icon: <FileArchive className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onExportAllVaultZip?.();
        },
      }
    );

    // 4. Insert Formats (Available when editing a note)
    if (currentView === 'edit') {
      items.push(
        {
          id: 'fmt-subnote',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtSubnoteTitle,
          subtitle: cp.fmtSubnoteSub,
          keywords: 'formato insertar subnota pagina anidada [[ wikilink subnote',
          shortcut: '[[',
          icon: <FilePlus2 className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('wikilink'), 30);
          },
        },
        {
          id: 'fmt-h1',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtH1Title,
          subtitle: cp.fmtH1Sub,
          keywords: 'formato encabezado 1 h1 titulo grande heading',
          shortcut: '# ',
          icon: <Heading1 className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('h1'), 30);
          },
        },
        {
          id: 'fmt-h2',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtH2Title,
          subtitle: cp.fmtH2Sub,
          keywords: 'formato encabezado 2 h2 subtitulo heading',
          shortcut: '## ',
          icon: <Heading2 className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('h2'), 30);
          },
        },
        {
          id: 'fmt-h3',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtH3Title,
          subtitle: cp.fmtH3Sub,
          keywords: 'formato encabezado 3 h3 seccion heading',
          shortcut: '### ',
          icon: <Heading3 className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('h3'), 30);
          },
        },
        {
          id: 'fmt-task',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtTaskTitle,
          subtitle: cp.fmtTaskSub,
          keywords: 'formato lista tareas checkbox to-do casilla task',
          shortcut: '- [ ]',
          icon: <ListTodo className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('task'), 30);
          },
        },
        {
          id: 'fmt-bullet',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtBulletTitle,
          subtitle: cp.fmtBulletSub,
          keywords: 'formato lista vinetas puntos bullet list',
          shortcut: '- ',
          icon: <ListIcon className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('bullet'), 30);
          },
        },
        {
          id: 'fmt-table',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtTableTitle,
          subtitle: cp.fmtTableSub,
          keywords: 'formato tabla celdas columnas filas table',
          shortcut: '/table',
          icon: <Table2 className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('table'), 30);
          },
        },
        {
          id: 'fmt-code',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtCodeTitle,
          subtitle: cp.fmtCodeSub,
          keywords: 'formato bloque codigo snippet programacion code',
          shortcut: '```',
          icon: <Code className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('code'), 30);
          },
        },
        {
          id: 'fmt-quote',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtQuoteTitle,
          subtitle: cp.fmtQuoteSub,
          keywords: 'formato cita blockquote frase quote',
          shortcut: '> ',
          icon: <Quote className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('quote'), 30);
          },
        },
        {
          id: 'fmt-highlight',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtHighlightTitle,
          subtitle: cp.fmtHighlightSub,
          keywords: 'formato resaltar marcador amarillo highlight',
          shortcut: '== ==',
          icon: <Highlighter className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('highlight'), 30);
          },
        },
        {
          id: 'fmt-github-mention',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtGithubTitle,
          subtitle: cp.fmtGithubSub,
          keywords: 'formato mencionar github usuario persona arroba @ mention',
          shortcut: '@',
          icon: <AtSign className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('github-mention'), 30);
          },
        },
        {
          id: 'fmt-bold',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtBoldTitle,
          subtitle: cp.fmtBoldSub,
          keywords: 'formato negrita bold fuerte',
          shortcut: 'Ctrl + B',
          icon: <Bold className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('bold'), 30);
          },
        },
        {
          id: 'fmt-italic',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtItalicTitle,
          subtitle: cp.fmtItalicSub,
          keywords: 'formato cursiva italic inclinada',
          shortcut: 'Ctrl + I',
          icon: <Italic className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('italic'), 30);
          },
        },
        {
          id: 'fmt-calendar',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtCalendarTitle,
          subtitle: cp.fmtCalendarSub,
          keywords: 'formato calendario widget fecha mes calendar',
          shortcut: '/calendario',
          icon: <Calendar className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('calendario'), 30);
          },
        },
        {
          id: 'fmt-hr',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtHrTitle,
          subtitle: cp.fmtHrSub,
          keywords: 'formato separador linea divisoria hr divider',
          shortcut: '---',
          icon: <Minus className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('hr'), 30);
          },
        },
        {
          id: 'fmt-move-up',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtMoveUpTitle,
          subtitle: cp.fmtMoveUpSub,
          keywords: 'mover bloque parrafo lista arriba reorganizar reordenar move up',
          shortcut: 'Alt + ↑',
          icon: <ArrowUpDown className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('move-block-up'), 30);
          },
        },
        {
          id: 'fmt-move-down',
          category: 'format',
          sectionLabel: cp.secInsertFormat,
          title: cp.fmtMoveDownTitle,
          subtitle: cp.fmtMoveDownSub,
          keywords: 'mover bloque parrafo lista abajo reorganizar reordenar move down',
          shortcut: 'Alt + ↓',
          icon: <ArrowUpDown className="w-4 h-4 shrink-0" />,
          onSelect: () => {
            onClose();
            setTimeout(() => onExecuteEditorFormat('move-block-down'), 30);
          },
        }
      );
    }

    // 5. Theme, Layout & Appearance
    items.push(
      {
        id: 'focus-mode-toggle',
        category: 'theme',
        sectionLabel: cp.secThemesAppearance,
        title: focusMode ? cp.thmFocusDisableTitle : cp.thmFocusEnableTitle,
        subtitle: cp.thmFocusSub,
        keywords: 'modo enfoque focus mode maquina de escribir typewriter centrar parrafo atenuar',
        shortcut: 'Alt + Z',
        badge: focusMode ? cp.badgeActive : undefined,
        isActive: focusMode,
        icon: <Focus className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onToggleFocusMode();
        },
      },
      {
        id: 'theme-light',
        category: 'theme',
        sectionLabel: cp.secThemesAppearance,
        title: cp.thmLightTitle,
        subtitle: cp.thmLightSub,
        keywords: 'tema modo claro light blanco dia',
        badge: themeMode === 'light' ? cp.badgeActive : undefined,
        isActive: themeMode === 'light',
        icon: <Sun className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onSetThemeMode('light');
        },
      },
      {
        id: 'theme-dark',
        category: 'theme',
        sectionLabel: cp.secThemesAppearance,
        title: cp.thmDarkTitle,
        subtitle: cp.thmDarkSub,
        keywords: 'tema modo oscuro dark noche negro',
        badge: themeMode === 'dark' ? cp.badgeActive : undefined,
        isActive: themeMode === 'dark',
        icon: <Moon className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onSetThemeMode('dark');
        },
      },
      {
        id: 'theme-system',
        category: 'theme',
        sectionLabel: cp.secThemesAppearance,
        title: cp.thmSystemTitle,
        subtitle: cp.thmSystemSub,
        keywords: 'tema modo automatico sistema os system',
        shortcut: 'Alt + L',
        badge: themeMode === 'system' ? cp.badgeActive : undefined,
        isActive: themeMode === 'system',
        icon: <Monitor className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onSetThemeMode('system');
        },
      },
      {
        id: 'layout-toggle',
        category: 'theme',
        sectionLabel: cp.secThemesAppearance,
        title: listLayout === 'grid' ? cp.thmLayoutCompactTitle : cp.thmLayoutGridTitle,
        subtitle: cp.thmLayoutSub,
        keywords: 'vista diseno cuadricula tarjetas lista compacta layout grid compact',
        shortcut: 'Alt + V',
        icon:
          listLayout === 'grid' ? (
            <List className="w-4 h-4 shrink-0" />
          ) : (
            <LayoutGrid className="w-4 h-4 shrink-0" />
          ),
        onSelect: () => {
          onClose();
          onSetListLayout(listLayout === 'grid' ? 'compact' : 'grid');
        },
      },
      {
        id: 'sidebar-toggle',
        category: 'theme',
        sectionLabel: cp.secThemesAppearance,
        title: isSidebarCollapsed ? cp.thmSidebarShowTitle : cp.thmSidebarHideTitle,
        subtitle: cp.thmSidebarSub,
        keywords: 'barra lateral sidebar ocultar mostrar colapsar',
        shortcut: 'Ctrl + B',
        icon: <PanelLeft className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onToggleSidebar();
        },
      },
      {
        id: 'sort-modified',
        category: 'theme',
        sectionLabel: cp.secThemesAppearance,
        title: cp.thmSortModTitle,
        subtitle: cp.thmSortModSub,
        keywords: 'ordenar notas ultima edicion modificacion recientes sort modified',
        shortcut: 'Alt + M',
        badge: sortBy === 'modified' ? cp.badgeActive : undefined,
        isActive: sortBy === 'modified',
        icon: <ArrowUpDown className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onSetSortBy('modified');
        },
      },
      {
        id: 'sort-created',
        category: 'theme',
        sectionLabel: cp.secThemesAppearance,
        title: cp.thmSortCreTitle,
        subtitle: cp.thmSortCreSub,
        keywords: 'ordenar notas fecha creacion nuevas sort created',
        shortcut: 'Alt + R',
        badge: sortBy === 'created' ? cp.badgeActive : undefined,
        isActive: sortBy === 'created',
        icon: <ArrowUpDown className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onSetSortBy('created');
        },
      },
      {
        id: 'sort-name',
        category: 'theme',
        sectionLabel: cp.secThemesAppearance,
        title: cp.thmSortNameTitle,
        subtitle: cp.thmSortNameSub,
        keywords: 'ordenar notas titulo alfabetico a-z nombre sort name',
        shortcut: 'Alt + A',
        badge: sortBy === 'name' ? cp.badgeActive : undefined,
        isActive: sortBy === 'name',
        icon: <ArrowUpDown className="w-4 h-4 shrink-0" />,
        onSelect: () => {
          onClose();
          onSetSortBy('name');
        },
      }
    );

    return items;
  }, [
    notes,
    query,
    cleanQuery,
    currentPath,
    currentView,
    hasUnsavedChanges,
    themeMode,
    listLayout,
    sortBy,
    isSidebarCollapsed,
    isNoteInfoOpen,
    focusMode,
    primaryColor,
    iconPack,
    cp,
    onClose,
    onOpenNote,
    onCreateNewNote,
    onCreateSubNote,
    onCreateNewSection,
    onCreateDailyNote,
    onSaveCurrentNote,
    onOpenDocSearch,
    onCustomizeCurrentNoteIcon,
    onTogglePinCurrentNote,
    onToggleNoteInfo,
    onNavigateView,
    onSetThemeMode,
    onSetListLayout,
    onSetSortBy,
    onToggleSidebar,
    onToggleFocusMode,
    onExecuteEditorFormat,
  ]);

  const filteredItems = useMemo(() => {
    const byCategory =
      activeCategory === 'all'
        ? allItems
        : allItems.filter((item) => item.category === activeCategory);

    if (!cleanQuery) {
      return byCategory;
    }

    const terms = cleanQuery.split(/\s+/).filter(Boolean);
    return byCategory
      .map((item) => {
        const hayTitle = item.title.toLowerCase();
        const haySub = (item.subtitle || '').toLowerCase();
        const hayKey = item.keywords.toLowerCase();
        const fullHaystack = `${hayTitle} ${haySub} ${hayKey}`;

        const matchesAll = terms.every((t) => fullHaystack.includes(t));
        if (!matchesAll) return null;

        let score = 0;
        if (item.id.startsWith('create-')) score += 45;
        if (hayTitle.startsWith(cleanQuery)) score += 100;
        else if (hayTitle.includes(cleanQuery)) score += 60;
        if (haySub.includes(cleanQuery)) score += 25;
        if (item.isActive) score += 10;

        return { item, score };
      })
      .filter((entry): entry is { item: CommandActionItem; score: number } => entry !== null)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [allItems, activeCategory, cleanQuery]);

  const clampedSelectedIndex =
    filteredItems.length > 0 ? Math.min(selectedIndex, filteredItems.length - 1) : 0;

  // Keep active item visible when navigating with keyboard arrows
  useEffect(() => {
    if (!listContainerRef.current) return;
    const activeEl = listContainerRef.current.querySelector(
      `[data-cmd-index="${clampedSelectedIndex}"]`
    ) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [clampedSelectedIndex]);

  if (!isOpen) return null;

  const categories: { id: CommandCategory; label: string }[] = [
    { id: 'all', label: cp.catAll },
    { id: 'notes', label: `${cp.catNotes} (${notes.length})` },
    { id: 'actions', label: cp.catActions },
    ...(currentView === 'edit' ? [{ id: 'format' as CommandCategory, label: cp.catFormat }] : []),
    { id: 'theme', label: cp.catTheme },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const idx = categories.findIndex((c) => c.id === activeCategory);
      const nextIdx = e.shiftKey
        ? (idx - 1 + categories.length) % categories.length
        : (idx + 1) % categories.length;
      setActiveCategory(categories[nextIdx].id);
      setSelectedIndex(0);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filteredItems[clampedSelectedIndex];
      if (chosen) {
        chosen.onSelect();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/50 backdrop-blur-xs pt-[10vh] px-3 sm:px-4 animate-in fade-in duration-150 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className={`w-full max-w-2xl rounded-[30px] [corner-shape:squircle] border-0 shadow-none overflow-hidden flex flex-col max-h-[78vh] transition-colors ${
          isDarkMode ? 'bg-[#181818] text-zinc-100' : 'bg-white text-[#1E293B]'
        }`}
      >
        {/* Top Search Input Bar */}
        <div
          className={`px-5 pt-4 pb-3 flex items-center gap-3 ${
            isDarkMode ? 'bg-[#1D1D1D]' : 'bg-[#F4F6FA]'
          }`}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${primaryColor}18`,
              color: primaryColor,
            }}
          >
            <Command className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={cp.searchPlaceholder}
            className={`flex-1 bg-transparent text-sm sm:text-base font-medium outline-none border-0 shadow-none ${
              isDarkMode
                ? 'text-zinc-100 placeholder:text-zinc-500'
                : 'text-zinc-900 placeholder:text-zinc-400'
            }`}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isDarkMode
                  ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70'
              }`}
              title={cp.clearSearch}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#262626] text-zinc-400 hover:text-zinc-200'
                : 'bg-[#E2E8F0] text-zinc-600 hover:text-zinc-900'
            }`}
          >
            ESC
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div
          className={`px-5 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
            isDarkMode ? 'bg-[#1D1D1D]' : 'bg-[#F4F6FA]'
          }`}
        >
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 border-0 shadow-none ${
                  active
                    ? 'text-white'
                    : isDarkMode
                    ? 'bg-[#262626] text-zinc-400 hover:text-zinc-200'
                    : 'bg-[#E6EAF2] text-zinc-600 hover:text-zinc-900'
                }`}
                style={{
                  backgroundColor: active ? primaryColor : undefined,
                }}
              >
                {cat.label}
              </button>
            );
          })}
          <span
            className={`ml-auto text-[11px] font-medium hidden sm:inline-block shrink-0 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            {cp.tabToFilter}
          </span>
        </div>

        {/* Results List */}
        <div ref={listContainerRef} className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {cp.noResultsFor} «{query}»
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateNewNote(query.trim());
                }}
                className="mt-3 px-4 py-2 rounded-2xl text-xs font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                {cp.createNewNoteBtn} «{query.trim()}»
              </button>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === clampedSelectedIndex;
              const prevSection = idx > 0 ? filteredItems[idx - 1].sectionLabel : null;
              const showSectionHeader = prevSection !== item.sectionLabel;

              return (
                <React.Fragment key={item.id}>
                  {showSectionHeader && (
                    <div
                      className={`px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider ${
                        isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                      }`}
                    >
                      {item.sectionLabel}
                    </div>
                  )}

                  <button
                    type="button"
                    data-cmd-index={idx}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={item.onSelect}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl [corner-shape:squircle] text-left transition-colors cursor-pointer border-0 shadow-none ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-[#262626] text-zinc-100'
                          : 'bg-[#EEF2F8] text-[#0F172A]'
                        : isDarkMode
                        ? 'text-zinc-300 hover:bg-[#222222]'
                        : 'text-zinc-700 hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'text-white'
                            : isDarkMode
                            ? 'bg-[#222222] text-zinc-300'
                            : 'bg-[#F1F5F9] text-zinc-600'
                        }`}
                        style={{
                          backgroundColor: isSelected ? primaryColor : undefined,
                        }}
                      >
                        {item.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                                isSelected
                                  ? isDarkMode
                                    ? 'bg-zinc-700 text-zinc-100'
                                    : 'bg-white text-zinc-800'
                                  : isDarkMode
                                  ? 'bg-[#262626] text-zinc-400'
                                  : 'bg-[#E2E8F0] text-zinc-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <p
                            className={`text-xs truncate mt-0.5 ${
                              isSelected
                                ? isDarkMode
                                  ? 'text-zinc-300'
                                  : 'text-zinc-600'
                                : isDarkMode
                                ? 'text-zinc-500'
                                : 'text-zinc-400'
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.shortcut && (
                        <kbd
                          className={`px-2 py-1 rounded-lg text-[11px] font-mono font-semibold ${
                            isSelected
                              ? isDarkMode
                                ? 'bg-[#1A1A1A] text-zinc-200'
                                : 'bg-white text-zinc-700'
                              : isDarkMode
                              ? 'bg-[#222222] text-zinc-400'
                              : 'bg-[#F1F5F9] text-zinc-500'
                          }`}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                      {isSelected && (
                        <CornerDownLeft
                          className="w-3.5 h-3.5 opacity-70"
                          style={{ color: primaryColor }}
                        />
                      )}
                    </div>
                  </button>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Bottom Keyboard Hints Footer */}
        <div
          className={`px-5 py-2.5 flex items-center justify-between text-[11px] font-medium ${
            isDarkMode ? 'bg-[#1D1D1D] text-zinc-400' : 'bg-[#F4F6FA] text-zinc-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>
              <strong className="font-semibold">↑↓</strong> {cp.footerNavigate}
            </span>
            <span>
              <strong className="font-semibold">↵</strong> {cp.footerExecute}
            </span>
            <span>
              <strong className="font-semibold">Tab</strong> {cp.footerCategory}
            </span>
          </div>
          <span>{cp.footerTitle}</span>
        </div>
      </div>
    </div>
  );
}
