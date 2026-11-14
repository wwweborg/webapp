"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react';
import { Node, Mark, Extension, mergeAttributes, InputRule, markInputRule, markPasteRule, callOrReturn, getExtensionField } from '@tiptap/core';
import {
  tableEditing,
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  addRowAfter,
  addRowBefore,
  deleteRow,
  deleteTable,
  goToNextCell,
  isInTable,
  selectedRect,
} from '@tiptap/pm/tables';
import { TextSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Markdown } from 'tiptap-markdown';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Columns3,
  Rows3,
  Search,
  Replace,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
  CaseSensitive,
  WholeWord,
  Copy,
  Check,
} from 'lucide-react';
import { lowlight } from '@/lib/syntaxHighlight';
import { EmbeddedCalendar } from '@/components/EmbeddedCalendar';
import { SlashCommandMenu } from '@/components/SlashCommandMenu';
import { EmojiAutocompleteMenu } from '@/components/EmojiAutocompleteMenu';
import { WikiLinkAutocompleteMenu, WikiLinkNoteOption } from '@/components/WikiLinkAutocompleteMenu';
import { GitHubMentionAutocompleteMenu } from '@/components/GitHubMentionAutocompleteMenu';
import { AppIcon } from '@/components/AppIcon';
import { Tooltip } from '@/components/Tooltip';
import { AppLanguage, getUiTranslations } from '@/lib/i18n';

let latestSubNotesStore: WikiLinkNoteOption[] = [];
let latestDarkModeStore = false;
let latestLanguageStore: AppLanguage = 'es';

interface BearMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
  placeholder?: string;
  onSave?: () => void;
  spellcheck?: boolean;
  primaryColor?: string;
  onOpenDailyNote?: (dateStr: string) => void;
  onOpenWikiLink?: (noteTarget: string, options?: { backgroundCreateOnly?: boolean; parentMarkdown?: string }) => void;
  wikiLinkNotes?: WikiLinkNoteOption[];
  currentNotePath?: string;
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  focusMode?: boolean;
  language?: AppLanguage;
}

type DocSearchMatch = {
  from: number;
  to: number;
  text: string;
};

let focusModeEnabledStore = false;
const focusModePluginKey = new PluginKey('bearFocusMode');

const FocusModeExtension = Extension.create({
  name: 'bearFocusMode',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: focusModePluginKey,
        props: {
          decorations(state) {
            if (!focusModeEnabledStore) return DecorationSet.empty;
            const { $from } = state.selection;
            if ($from.depth < 1) return DecorationSet.empty;
            try {
              const blockStart = $from.before(1);
              const blockEnd = $from.after(1);
              return DecorationSet.create(state.doc, [
                Decoration.node(blockStart, blockEnd, {
                  class: 'bear-focus-active-block',
                }),
              ]);
            } catch {
              return DecorationSet.empty;
            }
          },
        },
      }),
    ];
  },
});

const searchHighlightPluginKey = new PluginKey('bearSearchHighlight');

const SearchHighlightExtension = Extension.create({
  name: 'bearSearchHighlight',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchHighlightPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, prev) {
            const next = tr.getMeta(searchHighlightPluginKey);
            if (next instanceof DecorationSet) {
              return next;
            }
            return prev.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return searchHighlightPluginKey.getState(state) || DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

function findMatchesInDoc(
  doc: any,
  searchTerm: string,
  caseSensitive = false,
  wholeWord = false
): DocSearchMatch[] {
  if (!searchTerm || !doc) return [];
  const results: DocSearchMatch[] = [];
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = wholeWord ? `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])` : escaped;
  const flags = caseSensitive ? 'gu' : 'giu';
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch {
    return [];
  }

  doc.descendants((node: any, pos: number) => {
    if (node.type?.name === 'codeBlock' && node.attrs?.language === 'calendario') {
      return false;
    }
    if (!node.isTextblock) return true;

    let text = '';
    const charToPos: number[] = [];

    node.forEach((child: any, offset: number) => {
      const childStart = pos + 1 + offset;
      if (child.isText && child.text) {
        for (let i = 0; i < child.text.length; i++) {
          text += child.text[i];
          charToPos.push(childStart + i);
        }
      } else {
        text += '\uFFFC';
        charToPos.push(childStart);
      }
    });

    if (!text) return false;

    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      const startIdx = match.index;
      const endIdx = startIdx + match[0].length - 1;
      const from = charToPos[startIdx];
      const to = charToPos[endIdx] !== undefined ? charToPos[endIdx] + 1 : undefined;
      if (from !== undefined && to !== undefined) {
        results.push({ from, to, text: match[0] });
      }
    }

    return false;
  });

  return results;
}

// React NodeView for CodeBlock including embedded Calendario
const CodeBlockNodeView = (props: any) => {
  const { node, extension } = props;
  const language = node.attrs?.language;
  const [copied, setCopied] = useState(false);

  if (language === 'calendario') {
    const textContent = node.textContent?.trim() || '';
    return (
      <NodeViewWrapper className="calendar-node-view-wrapper my-4">
        <EmbeddedCalendar 
          initialDateStr={textContent} 
          isDarkMode={extension?.options?.isDarkMode}
          primaryColor={extension?.options?.primaryColor || '#006FFF'}
        />
        <div style={{ display: 'none' }}>
          <NodeViewContent />
        </div>
      </NodeViewWrapper>
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const codeText = node.textContent || '';
    if (navigator?.clipboard && codeText) {
      navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <NodeViewWrapper className="bear-code-block-wrapper relative group my-4">
      <div 
        contentEditable={false} 
        className="absolute top-2.5 right-3.5 z-10 select-none flex items-center gap-1.5"
      >
        {language && language !== 'null' && (
          <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-500 dark:text-zinc-400 font-semibold transition-opacity">
            {language}
          </span>
        )}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copiado" : "Copiar código"}
          title={copied ? "Copiado" : "Copiar código"}
          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 bg-white/90 dark:bg-zinc-800/90 text-slate-600 dark:text-zinc-300 shadow-sm transition-all duration-150 cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <pre className="bear-code-block font-mono text-sm p-4 sm:p-5 rounded-2xl bg-slate-100/90 dark:bg-white/[0.08] overflow-x-auto text-[#171717] dark:text-[#F3F4F6] transition-colors m-0">
        <NodeViewContent<'code'> as="code" className={language ? `language-${language}` : ''} />
      </pre>
    </NodeViewWrapper>
  );
};

// Custom Node for Inline Icons (.meteor:home, .wwwos:search, etc.)
const InlineIconExtension = Node.create({
  name: 'inlineIcon',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      pack: { default: 'meteor' },
      icon: { default: 'home' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-inline-icon]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return {
            pack: el.getAttribute('data-pack') || 'meteor',
            icon: el.getAttribute('data-icon') || 'home',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-inline-icon': 'true',
        'data-pack': HTMLAttributes.pack,
        'data-icon': HTMLAttributes.icon,
        class: 'inline-icon-badge inline-flex items-center align-middle mx-1',
      }),
      `.${HTMLAttributes.pack}:${HTMLAttributes.icon}.`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => {
      const { node } = props;
      const pack = node.attrs?.pack || 'meteor';
      const icon = node.attrs?.icon || 'home';

      return (
        <NodeViewWrapper as="span" className="inline-flex items-center align-middle mx-0.5 select-none">
          <AppIcon
            name={icon}
            pack={pack as any}
            className="w-4.5 h-4.5 inline-block text-blue-500 hover:scale-110 transition-transform"
          />
        </NodeViewWrapper>
      );
    });
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)\.([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)\.?\s$/,
        handler: ({ state, range, match }) => {
          const pack = match[1];
          const icon = match[2];
          const { tr } = state;

          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ pack, icon })
          );
        },
      }),
    ];
  },
});

// Custom Native ProseMirror NodeView for Notion / Craft Sub-Notes inside a note [[Nombre de la Sub-nota]]
// Uses a pure DOM NodeView instead of ReactNodeViewRenderer to completely avoid React flushSync during lifecycle commits
function createSubNoteCardNodeView(initialNode: any, primaryColorDefault: string) {
  let currentNode = initialNode;

  const wrapper = document.createElement('span');
  wrapper.className = 'block my-2.5 select-none';
  wrapper.contentEditable = 'false';

  const button = document.createElement('button');
  button.type = 'button';

  const renderCardDOM = () => {
    const target = (currentNode.attrs?.target || '').trim();
    const label = (currentNode.attrs?.label || target).trim();
    const primaryColor = primaryColorDefault || '#006FFF';
    const cleanKey = target.replace(/\.md$/i, '').toLowerCase();
    const matchedNote = latestSubNotesStore.find(
      (n) =>
        n.title.toLowerCase() === cleanKey ||
        n.path.replace(/\.md$/i, '').toLowerCase() === cleanKey
    );
    const isDark = latestDarkModeStore;
    const subT = getUiTranslations(latestLanguageStore).subnotes;
    const snippetText =
      matchedNote?.snippet && matchedNote.snippet.trim().length > 0
        ? matchedNote.snippet
        : subT.defaultSnippet;

    button.title = `${subT.enterSubNoteTitle} ${label}`;
    button.className = `group w-full flex items-center justify-between gap-3.5 px-4 py-3 rounded-[22px] [corner-shape:squircle] text-left transition-all duration-150 cursor-pointer border-0 shadow-none active:scale-[0.99] ${
      isDark
        ? 'bg-[#222226] hover:bg-[#2A2A30] text-zinc-100'
        : 'bg-[#F1F5F9] hover:bg-[#E2E8F0]/85 text-[#0F172A]'
    }`;

    button.replaceChildren();

    // Left section
    const leftGroup = document.createElement('span');
    leftGroup.className = 'flex items-center gap-3 min-w-0 flex-1';

    const iconBadge = document.createElement('span');
    iconBadge.className =
      'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105';
    iconBadge.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 15%, transparent)`;
    iconBadge.style.color = primaryColor;

    if (matchedNote?.emoji) {
      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'text-lg leading-none';
      emojiSpan.textContent = matchedNote.emoji;
      iconBadge.appendChild(emojiSpan);
    } else {
      iconBadge.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>';
    }

    const textCol = document.createElement('span');
    textCol.className = 'flex flex-col min-w-0 flex-1';

    const titleRow = document.createElement('span');
    titleRow.className = 'flex items-center gap-2 min-w-0';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'text-sm font-bold truncate';
    titleSpan.textContent = label;

    const pillSpan = document.createElement('span');
    pillSpan.className = 'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0';
    pillSpan.style.backgroundColor = `color-mix(in srgb, ${primaryColor} 14%, transparent)`;
    pillSpan.style.color = primaryColor;
    pillSpan.textContent = subT.badge;

    titleRow.appendChild(titleSpan);
    titleRow.appendChild(pillSpan);

    const snippetSpan = document.createElement('span');
    snippetSpan.className = `text-xs truncate mt-0.5 ${
      isDark ? 'text-zinc-400' : 'text-slate-500'
    }`;
    snippetSpan.textContent = snippetText;

    textCol.appendChild(titleRow);
    textCol.appendChild(snippetSpan);

    leftGroup.appendChild(iconBadge);
    leftGroup.appendChild(textCol);

    // Right action badge
    const rightBadge = document.createElement('span');
    rightBadge.className = `flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 transition-colors ${
      isDark
        ? 'bg-[#18181B] text-zinc-300 group-hover:text-white'
        : 'bg-white text-slate-700 group-hover:text-slate-950'
    }`;
    const openText = document.createElement('span');
    openText.className = 'hidden sm:inline';
    openText.textContent = subT.openBtn;
    const chevronWrap = document.createElement('span');
    chevronWrap.className = 'inline-flex transition-transform group-hover:translate-x-0.5';
    chevronWrap.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

    rightBadge.appendChild(openText);
    rightBadge.appendChild(chevronWrap);

    button.appendChild(leftGroup);
    button.appendChild(rightBadge);
  };

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const target = (currentNode.attrs?.target || '').trim();
    window.dispatchEvent(
      new CustomEvent('open-wiki-link', {
        detail: { target, backgroundCreateOnly: false },
      })
    );
  });

  renderCardDOM();
  wrapper.appendChild(button);

  const handleStoreUpdate = () => renderCardDOM();
  if (typeof window !== 'undefined') {
    window.addEventListener('subnotes-store-updated', handleStoreUpdate);
  }

  return {
    dom: wrapper,
    update(updatedNode: any) {
      if (updatedNode.type.name !== 'wikiLink') return false;
      currentNode = updatedNode;
      renderCardDOM();
      return true;
    },
    stopEvent() {
      return true;
    },
    ignoreMutation() {
      return true;
    },
    destroy() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('subnotes-store-updated', handleStoreUpdate);
      }
    },
  };
}

const WikiLinkExtension = Node.create({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addOptions() {
    return {
      primaryColor: '#006FFF',
    };
  },

  addAttributes() {
    return {
      target: { default: '' },
      label: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wiki-link]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const target = el.getAttribute('data-target') || '';
          const label = el.getAttribute('data-label') || target;
          return { target, label };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const target = HTMLAttributes.target || '';
    const label = HTMLAttributes.label || target;
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-wiki-link': 'true',
        'data-target': target,
        'data-label': label,
        class: 'bear-wikilink-pill inline-flex items-center align-baseline mx-0.5',
      }),
      label && label !== target ? `[[${target}|${label}]]` : `[[${target}]]`,
    ];
  },

  addNodeView() {
    const primaryColor = this.options?.primaryColor || '#006FFF';
    return ({ node }) => createSubNoteCardNodeView(node, primaryColor);
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\[\[([^\]|\n]+?)(?:\|([^\]\n]+?))?\]\]$/,
        handler: ({ state, range, match }) => {
          const target = (match[1] || '').trim();
          const label = (match[2] || target).trim();
          if (!target) return null;
          const { tr } = state;
          tr.replaceWith(range.from, range.to, this.type.create({ target, label }));
        },
      }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const target = (node.attrs?.target || '').trim();
          const label = (node.attrs?.label || '').trim();
          if (label && label !== target) {
            state.write(`[[${target}|${label}]]`);
          } else {
            state.write(`[[${target}]]`);
          }
        },
      },
    };
  },
});

function createGitHubMentionNodeView(initialNode: any) {
  let currentNode = initialNode;
  const anchor = document.createElement('a');
  anchor.contentEditable = 'false';

  const avatarImg = document.createElement('img');
  avatarImg.className = 'bear-github-mention-avatar';
  avatarImg.referrerPolicy = 'no-referrer';
  avatarImg.draggable = false;
  avatarImg.addEventListener('error', () => {
    avatarImg.style.display = 'none';
  });
  avatarImg.addEventListener('load', () => {
    avatarImg.style.display = 'inline-block';
  });

  const textSpan = document.createElement('span');

  anchor.appendChild(avatarImg);
  anchor.appendChild(textSpan);

  const syncDOM = () => {
    const username = String(currentNode.attrs?.username || '')
      .replace(/^@+/, '')
      .trim();
    const ghT = getUiTranslations(latestLanguageStore).menus.github;
    anchor.setAttribute('data-github-mention', 'true');
    anchor.setAttribute('data-username', username);
    anchor.href = `https://github.com/${encodeURIComponent(username)}`;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.title = `${ghT.goToProfileTitle} @${username} (github.com/${username})`;
    anchor.className = 'bear-github-mention';

    const nextAvatarUrl = `https://github.com/${encodeURIComponent(username)}.png?size=48`;
    if (avatarImg.getAttribute('src') !== nextAvatarUrl) {
      avatarImg.style.display = 'inline-block';
      avatarImg.src = nextAvatarUrl;
    }
    avatarImg.alt = username;
    textSpan.textContent = `@${username}`;
  };

  anchor.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  anchor.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  syncDOM();

  return {
    dom: anchor,
    update(updatedNode: any) {
      if (updatedNode.type.name !== 'githubMention') return false;
      currentNode = updatedNode;
      syncDOM();
      return true;
    },
    stopEvent(event: Event) {
      return event.type === 'mousedown' || event.type === 'mouseup' || event.type === 'click';
    },
    ignoreMutation() {
      return true;
    },
  };
}

const GitHubMentionExtension = Node.create({
  name: 'githubMention',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      username: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-github-mention]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const username = (el.getAttribute('data-username') || el.textContent || '')
            .replace(/^@+/, '')
            .trim();
          return { username };
        },
      },
      {
        tag: 'a[data-github-mention]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const username = (el.getAttribute('data-username') || el.textContent || '')
            .replace(/^@+/, '')
            .trim();
          return { username };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const username = String(HTMLAttributes.username || '')
      .replace(/^@+/, '')
      .trim();
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-github-mention': 'true',
        'data-username': username,
        href: `https://github.com/${encodeURIComponent(username)}`,
        target: '_blank',
        rel: 'noopener noreferrer',
        title: `Ir al perfil de GitHub de @${username} (github.com/${username})`,
        class: 'bear-github-mention',
      }),
      `@${username}`,
    ];
  },

  addNodeView() {
    return ({ node }) => createGitHubMentionNodeView(node);
  },

  addInputRules() {
    return [
      new InputRule({
        find: /(?:^|\s)@([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})\s$/,
        handler: ({ state, range, match }) => {
          const fullMatch = match[0] || '';
          const username = (match[1] || '').trim();
          if (!username) return null;
          const hasLeadingSpace = /^\s/.test(fullMatch);
          const replaceFrom = hasLeadingSpace ? range.from + 1 : range.from;
          const { tr } = state;
          tr.replaceWith(replaceFrom, range.to, [
            this.type.create({ username }),
            state.schema.text(' '),
          ]);
        },
      }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const username = String(node.attrs?.username || '')
            .replace(/^@+/, '')
            .trim();
          if (username) {
            state.write(`@${username}`);
          }
        },
      },
    };
  },
});

function setupHighlightMarkdownIt(mdInstance: any) {
  if (!mdInstance || mdInstance.__hasHighlightRule) return;
  mdInstance.__hasHighlightRule = true;
  mdInstance.inline.ruler.before('emphasis', 'mark_highlight', (state: any, silent: boolean) => {
    const start = state.pos;
    const src: string = state.src;
    if (src.charCodeAt(start) !== 0x3D /* = */ || src.charCodeAt(start + 1) !== 0x3D /* = */) {
      return false;
    }
    if (start > 0 && src.charCodeAt(start - 1) === 0x3D) {
      return false;
    }
    const afterOpen = src.charCodeAt(start + 2);
    if (!afterOpen || afterOpen === 0x20 || afterOpen === 0x09 || afterOpen === 0x0A || afterOpen === 0x3D) {
      return false;
    }
    const closeIdx = src.indexOf('==', start + 2);
    if (closeIdx === -1) return false;
    const beforeClose = src.charCodeAt(closeIdx - 1);
    if (beforeClose === 0x20 || beforeClose === 0x09 || beforeClose === 0x0A || beforeClose === 0x3D) {
      return false;
    }
    const inner = src.slice(start + 2, closeIdx);
    if (!inner || inner.includes('\n')) return false;

    if (!silent) {
      const tokenOpen = state.push('mark_open', 'mark', 1);
      tokenOpen.markup = '==';
      const oldMax = state.posMax;
      state.pos = start + 2;
      state.posMax = closeIdx;
      state.md.inline.tokenize(state);
      state.posMax = oldMax;
      const tokenClose = state.push('mark_close', 'mark', -1);
      tokenClose.markup = '==';
    }
    state.pos = closeIdx + 2;
    return true;
  });
}

const HIGHLIGHT_INPUT_REGEX = /(?<!=)(==(?=\S)((?:[^=\n]+?))(?<=\S)==)$/;
const HIGHLIGHT_PASTE_REGEX = /(?<!=)(==(?=\S)((?:[^=\n]+?))(?<=\S)==)(?!=)/g;

const HighlightExtension = Mark.create({
  name: 'highlight',
  inclusive: false,

  parseHTML() {
    return [
      { tag: 'mark' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(HTMLAttributes, {
        class: 'bear-highlight',
      }),
      0,
    ];
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () => this.editor.commands.toggleMark(this.name),
      'Mod-Shift-H': () => this.editor.commands.toggleMark(this.name),
    };
  },

  addInputRules() {
    return [
      markInputRule({
        find: HIGHLIGHT_INPUT_REGEX,
        type: this.type,
      }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: HIGHLIGHT_PASTE_REGEX,
        type: this.type,
      }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '==',
          close: '==',
          mixable: true,
          expelEnclosingWhitespace: true,
        },
        parse: {
          setup(markdownitInstance: any) {
            setupHighlightMarkdownIt(markdownitInstance);
          },
        },
      },
    };
  },
});

declare module '@tiptap/core' {
  interface NodeConfig<Options, Storage> {
    tableRole?: string;
  }
}

const sharedTableCellAttributes = {
  colspan: { default: 1 },
  rowspan: { default: 1 },
  colwidth: { default: null },
  align: {
    default: null,
    parseHTML: (element: HTMLElement) => {
      const styleAlign = element.style?.textAlign;
      const attrAlign = element.getAttribute('align') || element.getAttribute('data-align');
      const val = (styleAlign || attrAlign || '').toLowerCase().trim();
      if (val === 'left' || val === 'center' || val === 'right') return val;
      return null;
    },
    renderHTML: (attributes: Record<string, any>) => {
      if (!attributes.align) return {};
      return {
        style: `text-align: ${attributes.align}`,
        'data-align': attributes.align,
      };
    },
  },
};

const TableExtension = Node.create({
  name: 'table',
  content: 'tableRow+',
  tableRole: 'table',
  isolating: true,
  group: 'block',

  extendNodeSchema(extension) {
    const context = {
      name: extension.name,
      options: extension.options,
      storage: extension.storage,
    };
    return {
      tableRole: callOrReturn(getExtensionField(extension, 'tableRole', context)),
    };
  },

  parseHTML() {
    return [{ tag: 'table' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'table',
      mergeAttributes(HTMLAttributes, { class: 'bear-markdown-table' }),
      ['tbody', 0],
    ];
  },

  addProseMirrorPlugins() {
    return [tableEditing()];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.inTable = true;
          node.forEach((row: any, _p: number, i: number) => {
            state.write('| ');
            row.forEach((col: any, _p2: number, j: number) => {
              if (j) {
                state.write(' | ');
              }
              col.forEach((childBlock: any, _offset: number, childIdx: number) => {
                if (childIdx > 0) state.write(' ');
                if (childBlock.textContent.trim()) {
                  state.renderInline(childBlock);
                }
              });
            });
            state.write(' |');
            state.ensureNewLine();
            if (!i) {
              const delimiterRow = Array.from({ length: row.childCount })
                .map((_, colIdx) => {
                  const cell = row.child(colIdx);
                  const align = cell?.attrs?.align;
                  if (align === 'center') return ':---:';
                  if (align === 'right') return '---:';
                  if (align === 'left') return ':---';
                  return '---';
                })
                .join(' | ');
              state.write(`| ${delimiterRow} |`);
              state.ensureNewLine();
            }
          });
          state.closeBlock(node);
          state.inTable = false;
        },
        parse: {
          // handled by markdown-it
        },
      },
    };
  },
});

const TableRowExtension = Node.create({
  name: 'tableRow',
  content: '(tableCell | tableHeader)*',
  tableRole: 'row',

  parseHTML() {
    return [{ tag: 'tr' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['tr', mergeAttributes(HTMLAttributes), 0];
  },
});

const TableHeaderExtension = Node.create({
  name: 'tableHeader',
  content: 'block+',
  tableRole: 'header_cell',
  isolating: true,

  addAttributes() {
    return sharedTableCellAttributes;
  },

  parseHTML() {
    return [{ tag: 'th' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['th', mergeAttributes(HTMLAttributes), 0];
  },
});

const TableCellExtension = Node.create({
  name: 'tableCell',
  content: 'block+',
  tableRole: 'cell',
  isolating: true,

  addAttributes() {
    return sharedTableCellAttributes;
  },

  parseHTML() {
    return [{ tag: 'td' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['td', mergeAttributes(HTMLAttributes), 0];
  },
});

function syncTableStructure(state: any, dispatch?: (tr: any) => void) {
  if (!isInTable(state)) return;
  try {
    const rect = selectedRect(state);
    const { map, table, tableStart } = rect;
    const tr = state.tr;
    let modified = false;

    for (let col = 0; col < map.width; col++) {
      let colAlign: string | null = null;
      for (let row = 0; row < map.height; row++) {
        const cellNode = state.doc.nodeAt(tableStart + map.positionAt(row, col, table));
        if (cellNode?.attrs?.align) {
          colAlign = cellNode.attrs.align;
          break;
        }
      }
      for (let row = 0; row < map.height; row++) {
        const relPos = map.positionAt(row, col, table);
        const absPos = tableStart + relPos;
        const cellNode = state.doc.nodeAt(absPos);
        if (!cellNode) continue;
        const targetType = row === 0 ? state.schema.nodes.tableHeader : state.schema.nodes.tableCell;
        const targetAlign = colAlign || 'left';
        if (cellNode.type !== targetType || cellNode.attrs.align !== targetAlign) {
          tr.setNodeMarkup(absPos, targetType, { ...cellNode.attrs, align: targetAlign });
          modified = true;
        }
      }
    }
    if (modified && dispatch) {
      dispatch(tr);
    }
  } catch {
    // ignore if table state is transient
  }
}

function buildDefaultTableJSON(headers: string[] = ['Columna 1', 'Columna 2', 'Columna 3'], bodyRowCount = 2) {
  return {
    type: 'table',
    content: [
      {
        type: 'tableRow',
        content: headers.map((h) => ({
          type: 'tableHeader',
          attrs: { align: 'left' },
          content: [{ type: 'paragraph', content: h ? [{ type: 'text', text: h }] : [] }],
        })),
      },
      ...Array.from({ length: bodyRowCount }).map(() => ({
        type: 'tableRow',
        content: headers.map(() => ({
          type: 'tableCell',
          attrs: { align: 'left' },
          content: [{ type: 'paragraph' }],
        })),
      })),
    ],
  };
}

export function sortMarkdownTaskLists(content: string): string {
  if (!content) return '';
  const lines = content.split('\n');
  const result: string[] = [];
  let inCodeFence = false;
  let taskBlock: { line: string; indent: string; completed: boolean }[] = [];

  const flushTaskBlock = () => {
    if (taskBlock.length === 0) return;
    if (taskBlock.length > 1) {
      const sorted = [
        ...taskBlock.filter((t) => !t.completed),
        ...taskBlock.filter((t) => t.completed),
      ];
      sorted.forEach((t) => result.push(t.line));
    } else {
      result.push(taskBlock[0].line);
    }
    taskBlock = [];
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      flushTaskBlock();
      inCodeFence = !inCodeFence;
      result.push(line);
      continue;
    }
    if (inCodeFence) {
      result.push(line);
      continue;
    }

    const taskMatch = line.match(/^(\s*)[-*+]\s*\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      const indent = taskMatch[1] || '';
      const completed = taskMatch[2].toLowerCase() === 'x';
      if (taskBlock.length > 0 && taskBlock[0].indent !== indent) {
        flushTaskBlock();
      }
      taskBlock.push({ line, indent, completed });
    } else {
      flushTaskBlock();
      result.push(line);
    }
  }
  flushTaskBlock();
  return result.join('\n');
}

export function preprocessMarkdownForIcons(content: string): string {
  if (!content) return '';
  const sortedContent = sortMarkdownTaskLists(content);
  // Normalize any legacy raw.githubusercontent.com/.../images/<file> URLs to /images/<file>
  const withNormalizedImages = sortedContent.replace(
    /https:\/\/raw\.githubusercontent\.com\/[^/\s)]+\/[^/\s)]+\/[^/\s)]+\/images\/([^\s)]+)/g,
    '/images/$1'
  );
  const withIcons = withNormalizedImages.replace(
    /(?<![a-zA-Z0-9_])\.([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)\.?(?![a-zA-Z0-9_])/g,
    (match, pack, icon) => {
      return `<span data-inline-icon="true" data-pack="${pack}" data-icon="${icon}"></span>`;
    }
  );
  // Convert [[Nombre de la Nota]] or [[Nota|Alias]] and @usuario (GitHub mentions) outside code blocks
  const lines = withIcons.split('\n');
  let inCodeFence = false;
  const processedLines = lines.map((line) => {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      return line;
    }
    if (inCodeFence) return line;
    const withWikiLinks = line.replace(/\[\[([^\]|\n]+?)(?:\|([^\]\n]+?))?\]\]/g, (_m, rawTarget, rawLabel) => {
      const target = String(rawTarget || '').trim().replace(/"/g, '&quot;');
      const label = String(rawLabel || rawTarget || '').trim().replace(/"/g, '&quot;');
      if (!target) return _m;
      return `<span data-wiki-link="true" data-target="${target}" data-label="${label}"></span>`;
    });
    // Protect inline code `...` and HTML tags <...> before converting standalone @github_username
    const segments = withWikiLinks.split(/(`[^`]*`|<[^>]+>)/g);
    return segments
      .map((seg) => {
        if (seg.startsWith('`') || seg.startsWith('<')) return seg;
        return seg.replace(
          /(^|[\s([{"'])@([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})(?=$|[\s)\]}"'.,!?;:])/g,
          (_m, prefix, username) => {
            return `${prefix}<span data-github-mention="true" data-username="${username}">@${username}</span>`;
          }
        );
      })
      .join('');
  });
  return processedLines.join('\n');
}

export function BearMarkdownEditor({
  value,
  onChange,
  isDarkMode,
  placeholder = "Escribe algo brillante... (Escribe / para comandos, [[ para enlazar notas o : para emojis)",
  onSave,
  spellcheck = true,
  primaryColor = '#006FFF',
  onOpenDailyNote,
  onOpenWikiLink,
  wikiLinkNotes = [],
  currentNotePath,
  onShowToast,
  focusMode = false,
  language = 'es',
}: BearMarkdownEditorProps) {
  const isUpdatingFromProps = useRef(false);
  const lastMarkdownRef = useRef(value);
  const editorRef = useRef<any>(null);
  const focusModeRef = useRef(focusMode);
  const uiT = getUiTranslations(language);
  const frT = uiT.findReplace;

  // Floating Slash Command state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilterText, setSlashFilterText] = useState('');
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });

  // Floating Emoji Autocomplete state
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [emojiFilterText, setEmojiFilterText] = useState('');
  const [emojiMenuPos, setEmojiMenuPos] = useState({ top: 0, left: 0 });

  // Floating WikiLink [[Nombre de la Nota]] Autocomplete state
  const [showWikiMenu, setShowWikiMenu] = useState(false);
  const [wikiFilterText, setWikiFilterText] = useState('');
  const [wikiMenuPos, setWikiMenuPos] = useState({ top: 0, left: 0 });

  // Floating GitHub @usuario Mention Autocomplete state
  const [showGitHubMenu, setShowGitHubMenu] = useState(false);
  const [githubFilterText, setGithubFilterText] = useState('');
  const [githubMenuPos, setGithubMenuPos] = useState({ top: 0, left: 0 });

  const menuOpenRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // In-Document Search & Replace (Ctrl+F / Ctrl+H) state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showReplaceRow, setShowReplaceRow] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [docSearchVersion, setDocSearchVersion] = useState(0);
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  // Active Markdown Table Toolbar state
  const [tableContext, setTableContext] = useState<{
    active: boolean;
    top: number;
    colAlign: 'left' | 'center' | 'right';
    rowIndex: number;
    colIndex: number;
    rowCount: number;
    colCount: number;
  } | null>(null);

  useEffect(() => {
    menuOpenRef.current = showSlashMenu || showEmojiMenu || showWikiMenu || showGitHubMenu;
  }, [showSlashMenu, showEmojiMenu, showWikiMenu, showGitHubMenu]);

  useEffect(() => {
    latestSubNotesStore = wikiLinkNotes;
    latestDarkModeStore = isDarkMode;
    latestLanguageStore = language;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('subnotes-store-updated'));
    }
  }, [wikiLinkNotes, isDarkMode, language]);

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    const activeEditor = editorRef.current;
    if (!activeEditor) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      
      activeEditor.chain().focus().setImage({ src: url, alt: file.name || 'imagen' }).run();
      const markdown = (activeEditor.storage as any).markdown?.getMarkdown() || '';
      lastMarkdownRef.current = markdown;
      onChange(markdown);
    } catch (error) {
      console.error('Image upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const customCodeBlock = CodeBlockLowlight.extend({
    addOptions() {
      return {
        ...this.parent?.(),
        lowlight,
        isDarkMode,
        primaryColor,
      } as any;
    },
    addNodeView() {
      return ReactNodeViewRenderer(CodeBlockNodeView);
    },
  }).configure({
    lowlight,
    defaultLanguage: 'typescript',
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        codeBlock: false,
        blockquote: {
          HTMLAttributes: {
            class: 'bear-blockquote p-4 sm:p-5 my-4 text-[#0F172A] dark:text-zinc-100 font-medium bg-slate-100/90 dark:bg-white/[0.06] rounded-2xl border-0 not-italic transition-colors',
          },
        },
        horizontalRule: {
          HTMLAttributes: {
            class: 'bear-hr my-6',
          },
        },
      }),
      customCodeBlock,
      InlineIconExtension,
      WikiLinkExtension.configure({
        primaryColor,
      }),
      GitHubMentionExtension,
      HighlightExtension,
      TableExtension,
      TableRowExtension,
      TableHeaderExtension,
      TableCellExtension,
      SearchHighlightExtension,
      FocusModeExtension,
      Extension.create({
        name: 'bearTaskSort',
        addProseMirrorPlugins() {
          return [
            new Plugin({
              key: new PluginKey('bearTaskSort'),
              appendTransaction(transactions, _oldState, newState) {
                if (!transactions.some((tr) => tr.docChanged)) return null;

                const listsToSort: {
                  pos: number;
                  node: any;
                  items: { node: any; checked: boolean; oldStart: number; oldEnd: number }[];
                }[] = [];

                newState.doc.descendants((node, pos) => {
                  if (node.type.name === 'taskList' && node.childCount > 1) {
                    const items: { node: any; checked: boolean; oldStart: number; oldEnd: number }[] = [];
                    let seenChecked = false;
                    let hasInversion = false;
                    let offset = 0;

                    node.forEach((child) => {
                      const isChecked = Boolean(child.attrs?.checked);
                      if (isChecked) {
                        seenChecked = true;
                      } else if (seenChecked) {
                        hasInversion = true;
                      }
                      const oldStart = pos + 1 + offset;
                      const oldEnd = oldStart + child.nodeSize;
                      items.push({ node: child, checked: isChecked, oldStart, oldEnd });
                      offset += child.nodeSize;
                    });

                    if (hasInversion) {
                      listsToSort.push({ pos, node, items });
                    }
                  }
                });

                if (listsToSort.length === 0) return null;

                const tr = newState.tr;
                const selFrom = newState.selection.from;
                let nextSelPos: number | null = null;

                for (let i = listsToSort.length - 1; i >= 0; i--) {
                  const { pos, node, items } = listsToSort[i];
                  const sorted = [
                    ...items.filter((it) => !it.checked),
                    ...items.filter((it) => it.checked),
                  ];

                  let newOffset = 0;
                  for (const item of sorted) {
                    if (selFrom >= item.oldStart && selFrom <= item.oldEnd) {
                      const relCursor = selFrom - item.oldStart;
                      nextSelPos = pos + 1 + newOffset + relCursor;
                    }
                    newOffset += item.node.nodeSize;
                  }

                  tr.replaceWith(
                    pos + 1,
                    pos + node.nodeSize - 1,
                    sorted.map((it) => it.node)
                  );
                }

                if (nextSelPos !== null) {
                  try {
                    const clampedPos = Math.max(0, Math.min(nextSelPos, tr.doc.content.size));
                    tr.setSelection(TextSelection.near(tr.doc.resolve(clampedPos)));
                  } catch {
                    // ignore selection fallback
                  }
                }

                return tr;
              },
            }),
          ];
        },
      }),
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'bear-task-list list-none pl-0 my-2 space-y-1.5',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'bear-task-item flex items-start gap-2.5 my-1',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'hover:underline cursor-pointer font-medium',
          style: `color: ${primaryColor};`,
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'bear-image rounded-2xl my-6 shadow-md max-w-full h-auto border-0',
        },
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: true,
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: preprocessMarkdownForIcons(value),
    editorProps: {
      attributes: {
        class: `bear-editor-content outline-none min-h-[calc(100vh-280px)] pb-48 focus:outline-none transition-colors leading-[1.75] text-[var(--note-font-size,17px)] ${
          focusMode ? 'bear-focus-mode-enabled ' : ''
        }${
          isDarkMode ? 'selection:bg-zinc-800' : 'selection:bg-[#D9E9FF]'
        }`,
        spellcheck: spellcheck ? 'true' : 'false',
        autocorrect: spellcheck ? 'on' : 'off',
        autocapitalize: spellcheck ? 'sentences' : 'off',
      },
      handleKeyDown: (view, event) => {
        // Cmd/Ctrl + S to save
        if ((event.metaKey || event.ctrlKey) && (event.key || '').toLowerCase() === 's') {
          event.preventDefault();
          if (onSave) onSave();
          return true;
        }

        const activeEditor = editorRef.current;
        if (!activeEditor) return false;

        // Alt + ArrowUp / Alt + ArrowDown to move current block or list item up/down
        if (event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
          event.preventDefault();
          const direction = event.key === 'ArrowUp' ? -1 : 1;
          const { $from } = view.state.selection;
          // Check if inside a listItem or taskItem with sibling items
          let moved = false;
          for (let d = $from.depth; d >= 1; d--) {
            const node = $from.node(d);
            if (node.type.name === 'listItem' || node.type.name === 'taskItem') {
              const listDepth = d - 1;
              const listNode = $from.node(listDepth);
              if (listNode && listNode.childCount > 1) {
                const itemFrom = $from.before(d);
                const itemTo = $from.after(d);
                moved = moveBlockByStep(activeEditor, itemFrom, itemTo, true, direction);
                break;
              }
            }
          }
          if (!moved && $from.depth >= 1) {
            const blockFrom = $from.before(1);
            const blockTo = $from.after(1);
            moveBlockByStep(activeEditor, blockFrom, blockTo, false, direction);
          }
          return true;
        }

        // Smart Indentation with Tab and Shift + Tab
        if (event.key === 'Tab') {
          event.preventDefault();

          if (isInTable(view.state)) {
            if (event.shiftKey) {
              goToNextCell(-1)(view.state, view.dispatch);
            } else {
              const moved = goToNextCell(1)(view.state, view.dispatch);
              if (!moved) {
                addRowAfter(view.state, view.dispatch);
                syncTableStructure(activeEditor.state, activeEditor.view.dispatch);
                goToNextCell(1)(activeEditor.state, activeEditor.view.dispatch);
              }
            }
            return true;
          }

          if (activeEditor.isActive('taskItem')) {
            if (event.shiftKey) {
              activeEditor.chain().focus().liftListItem('taskItem').run();
            } else {
              activeEditor.chain().focus().sinkListItem('taskItem').run();
            }
            return true;
          }

          if (activeEditor.isActive('listItem')) {
            if (event.shiftKey) {
              activeEditor.chain().focus().liftListItem('listItem').run();
            } else {
              activeEditor.chain().focus().sinkListItem('listItem').run();
            }
            return true;
          }

          // Fallback for paragraphs / code blocks: indent/unindent with 2 spaces
          if (event.shiftKey) {
            const { $from } = view.state.selection;
            const startOfBlock = $from.start();
            const textInBlock = $from.parent.textContent;
            if (textInBlock.startsWith('  ')) {
              activeEditor.chain().focus().deleteRange({ from: startOfBlock, to: startOfBlock + 2 }).run();
            } else if (textInBlock.startsWith('\t') || textInBlock.startsWith(' ')) {
              activeEditor.chain().focus().deleteRange({ from: startOfBlock, to: startOfBlock + 1 }).run();
            }
          } else {
            activeEditor.chain().focus().insertContent('  ').run();
          }
          return true;
        }

        // Automatic Enter continuation for tables and task checkboxes [ ]
        if (event.key === 'Enter' && !event.shiftKey && !menuOpenRef.current) {
          if (isInTable(view.state)) {
            event.preventDefault();
            try {
              const rect = selectedRect(view.state);
              const { map, table, tableStart, top: rowIndex, left: colIndex } = rect;
              if (rowIndex < map.height - 1) {
                const nextCellRel = map.positionAt(rowIndex + 1, colIndex, table);
                const nextCellAbs = tableStart + nextCellRel + 2;
                const tr = view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(nextCellAbs)));
                view.dispatch(tr.scrollIntoView());
              } else {
                addRowAfter(view.state, view.dispatch);
                syncTableStructure(activeEditor.state, activeEditor.view.dispatch);
                const updatedRect = selectedRect(activeEditor.state);
                const firstCellRel = updatedRect.map.positionAt(updatedRect.top, 0, updatedRect.table);
                const firstCellAbs = updatedRect.tableStart + firstCellRel + 2;
                const tr = activeEditor.state.tr.setSelection(
                  TextSelection.near(activeEditor.state.doc.resolve(firstCellAbs))
                );
                activeEditor.view.dispatch(tr.scrollIntoView());
              }
            } catch {
              // fallback
            }
            return true;
          }

          const { $from } = view.state.selection;
          const currentText = $from.parent.textContent || '';

          // Quick Markdown table creation when typing "| Col 1 | Col 2 |" + Enter
          const tableRowMatch = currentText.trim().match(/^\|(.+)\|$/);
          if (tableRowMatch && !activeEditor.isActive('codeBlock')) {
            const rawCells = tableRowMatch[1].split('|').map((c: string) => c.trim());
            if (rawCells.length >= 1 && rawCells.some((c: string) => c.length > 0)) {
              event.preventDefault();
              const isDelimiterOnly = rawCells.every((c: string) => /^:?-{2,}:?$/.test(c));
              const headers = isDelimiterOnly
                ? rawCells.map((_: string, i: number) => `Columna ${i + 1}`)
                : rawCells.map((c: string, i: number) => c || `Columna ${i + 1}`);
              const startPos = $from.before($from.depth);
              const endPos = $from.after($from.depth);
              activeEditor
                .chain()
                .focus()
                .deleteRange({ from: startPos, to: endPos })
                .insertContent(buildDefaultTableJSON(headers, 2))
                .run();
              return true;
            }
          }

          if (activeEditor.isActive('taskItem')) {
            event.preventDefault();
            if (currentText.trim().length === 0) {
              // Empty task item -> exit task list cleanly
              activeEditor.chain().focus().liftListItem('taskItem').run();
            } else {
              // Continue with a new unchecked task item [ ] on the next line
              activeEditor
                .chain()
                .focus()
                .splitListItem('taskItem')
                .updateAttributes('taskItem', { checked: false })
                .run();
            }
            return true;
          }

          // Also support literal "[ ] " or "- [ ] " typed in a normal line
          const taskLineMatch = currentText.match(/^(?:[-*+]\s+)?\[([ xX]?)\]\s*(.*)$/);
          if (taskLineMatch && !activeEditor.isActive('codeBlock')) {
            event.preventDefault();
            const isChecked = taskLineMatch[1].toLowerCase() === 'x';
            const cleanTaskText = taskLineMatch[2];
            const startPos = $from.start();
            const endPos = $from.end();

            if (cleanTaskText.trim().length === 0) {
              activeEditor.chain().focus().deleteRange({ from: startPos, to: endPos }).run();
            } else {
              activeEditor
                .chain()
                .focus()
                .deleteRange({ from: startPos, to: endPos })
                .toggleTaskList()
                .updateAttributes('taskItem', { checked: isChecked })
                .insertContent(cleanTaskText)
                .splitListItem('taskItem')
                .updateAttributes('taskItem', { checked: false })
                .run();
            }
            return true;
          }
        }

        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
          if (files.length > 0) {
            event.preventDefault();
            files.forEach(f => handleImageUpload(f));
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // 1. Check clipboardData.files
        if (clipboardData.files && clipboardData.files.length > 0) {
          const imageFiles = Array.from(clipboardData.files).filter(f => f.type.startsWith('image/'));
          if (imageFiles.length > 0) {
            event.preventDefault();
            imageFiles.forEach(f => handleImageUpload(f));
            return true;
          }
        }

        // 2. Fallback: Check clipboardData.items (e.g. screenshots / copied images from browser)
        if (clipboardData.items && clipboardData.items.length > 0) {
          for (let i = 0; i < clipboardData.items.length; i++) {
            const item = clipboardData.items[i];
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                handleImageUpload(file);
                return true;
              }
            }
          }
        }

        return false;
      },
    },
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
    },
    onSelectionUpdate: ({ editor: ed }) => {
      editorRef.current = ed;
      checkMenuTriggers(ed);
      if (focusModeRef.current) {
        centerActiveLineInTypewriterMode(ed);
      }
    },
    onUpdate: ({ editor: ed }) => {
      editorRef.current = ed;
      checkMenuTriggers(ed);
      if (focusModeRef.current) {
        centerActiveLineInTypewriterMode(ed);
      }
      setDocSearchVersion((v) => v + 1);
      if (isUpdatingFromProps.current) return;
      // Get pure standard Markdown
      const markdown = (ed.storage as any).markdown?.getMarkdown() || '';
      lastMarkdownRef.current = markdown;
      onChange(markdown);
    },
  });

  const centerActiveLineInTypewriterMode = (ed: any) => {
    if (!ed || !ed.view || typeof window === 'undefined') return;
    requestAnimationFrame(() => {
      try {
        if (!ed || !ed.view || ed.isDestroyed) return;
        const scrollContainer = wrapperRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
        if (!scrollContainer) return;

        const { from } = ed.state.selection;
        const caretCoords = ed.view.coordsAtPos(from);
        const containerRect = scrollContainer.getBoundingClientRect();

        // Target line position: ~43% from the top of the visible scroll container (natural typewriter eye level)
        const targetViewportY = containerRect.top + containerRect.height * 0.43;
        const deltaY = caretCoords.top - targetViewportY;

        if (Math.abs(deltaY) > 18) {
          scrollContainer.scrollTo({
            top: Math.max(0, scrollContainer.scrollTop + deltaY),
            behavior: 'smooth',
          });
        }
      } catch {
        // ignore transient coords error
      }
    });
  };

  useEffect(() => {
    focusModeRef.current = focusMode;
    focusModeEnabledStore = !!focusMode;
    if (!editor || !editor.view || editor.isDestroyed) return;
    editor.view.dom.classList.toggle('bear-focus-mode-enabled', !!focusMode);
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || !editor || !editor.view || editor.isDestroyed) return;
      try {
        editor.view.dispatch(editor.state.tr.setMeta(focusModePluginKey, focusMode));
        if (focusMode) {
          centerActiveLineInTypewriterMode(editor);
        }
      } catch {}
    });
    return () => {
      cancelled = true;
    };
  }, [focusMode, editor]);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const updateTableToolbarState = (ed: typeof editor) => {
    if (!ed || !ed.view) {
      setTableContext(null);
      return;
    }
    if (!isInTable(ed.state)) {
      setTableContext(null);
      return;
    }
    try {
      const rect = selectedRect(ed.state);
      const colIndex = rect.left;
      const rowIndex = rect.top;
      const headerRelPos = rect.map.positionAt(0, colIndex, rect.table);
      const headerCell = ed.state.doc.nodeAt(rect.tableStart + headerRelPos);
      const currentCellRelPos = rect.map.positionAt(rowIndex, colIndex, rect.table);
      const currentCell = ed.state.doc.nodeAt(rect.tableStart + currentCellRelPos);
      const colAlign = ((headerCell?.attrs?.align || currentCell?.attrs?.align) as 'left' | 'center' | 'right') || 'left';

      const domAtPos = ed.view.domAtPos(ed.state.selection.from);
      const domNode = domAtPos.node instanceof HTMLElement ? domAtPos.node : domAtPos.node.parentElement;
      const tableEl = domNode?.closest('table');
      let topOffset = 0;
      if (tableEl && wrapperRef.current) {
        const tableBounds = tableEl.getBoundingClientRect();
        const wrapperBounds = wrapperRef.current.getBoundingClientRect();
        topOffset = Math.max(0, tableBounds.top - wrapperBounds.top - 46);
      }

      setTableContext({
        active: true,
        top: topOffset,
        colAlign,
        rowIndex,
        colIndex,
        rowCount: rect.map.height,
        colCount: rect.map.width,
      });
    } catch {
      setTableContext(null);
    }
  };

  const checkMenuTriggers = (ed: typeof editor) => {
    if (!ed) return;
    updateTableToolbarState(ed);
    const { selection } = ed.state;
    const { $from } = selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\uFFFC');

    // Slash command trigger
    const slashMatch = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);
    if (slashMatch) {
      try {
        const coords = ed.view.coordsAtPos(selection.from);
        setSlashMenuPos({
          top: coords.bottom + 8,
          left: coords.left
        });
        setSlashFilterText(slashMatch[1]);
        setShowSlashMenu(true);
      } catch {
        setShowSlashMenu(false);
      }
    } else {
      setShowSlashMenu(false);
    }

    // Emoji trigger
    const emojiMatch = textBefore.match(/(?:^|\s):([a-zA-Z0-9_-]+)$/);
    if (emojiMatch && !textBefore.endsWith('::')) {
      try {
        const coords = ed.view.coordsAtPos(selection.from);
        setEmojiMenuPos({
          top: coords.bottom + 8,
          left: coords.left
        });
        setEmojiFilterText(emojiMatch[1]);
        setShowEmojiMenu(true);
      } catch {
        setShowEmojiMenu(false);
      }
    } else {
      setShowEmojiMenu(false);
    }

    // WikiLink trigger [[Nombre de la Nota
    const wikiMatch = textBefore.match(/\[\[([^\]\n]*)$/);
    if (wikiMatch && !ed.isActive('codeBlock')) {
      try {
        const coords = ed.view.coordsAtPos(selection.from);
        setWikiMenuPos({
          top: coords.bottom + 8,
          left: coords.left,
        });
        setWikiFilterText(wikiMatch[1]);
        setShowWikiMenu(true);
      } catch {
        setShowWikiMenu(false);
      }
    } else {
      setShowWikiMenu(false);
    }

    // GitHub @usuario mention trigger
    const githubMatch = textBefore.match(/(?:^|[\s([{"'])@([a-zA-Z0-9-]{0,39})$/);
    if (githubMatch && !ed.isActive('codeBlock')) {
      try {
        const coords = ed.view.coordsAtPos(selection.from);
        setGithubMenuPos({
          top: coords.bottom + 8,
          left: coords.left,
        });
        setGithubFilterText(githubMatch[1]);
        setShowGitHubMenu(true);
      } catch {
        setShowGitHubMenu(false);
      }
    } else {
      setShowGitHubMenu(false);
    }
  };

  const handleSelectSlashCommand = (cmdId: string) => {
    if (!editor) return;
    const { selection } = editor.state;
    const { $from } = selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\uFFFC');
    const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);

    if (match) {
      const matchStart = selection.from - match[1].length - 1;
      editor.chain().focus().deleteRange({ from: matchStart, to: selection.from }).run();
    }

    const todayStr = new Date().toISOString().split('T')[0];

    switch (cmdId) {
      case 'calendario':
        editor.chain().focus().insertContent(`\n\`\`\`calendario\n${todayStr}\n\`\`\`\n`).run();
        break;
      case 'task':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'emoji':
        editor.chain().focus().insertContent(':rocket: ').run();
        break;
      case 'icon':
        // Insert inline icon node directly
        editor.chain().focus().insertContent('<span data-inline-icon="true" data-pack="meteor" data-icon="home"></span> ').run();
        break;
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'bullet':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'code':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'quote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'highlight':
        editor.chain().focus().insertContent(`==${frT.highlightedTextSample}== `).run();
        break;
      case 'table':
        editor.chain().focus().insertContent(buildDefaultTableJSON([frT.defaultCol1, frT.defaultCol2, frT.defaultCol3], 2)).run();
        break;
      case 'wikilink':
        editor.chain().focus().insertContent('[[').run();
        break;
      case 'github-mention':
        editor.chain().focus().insertContent('@').run();
        break;
    }

    setShowSlashMenu(false);
  };

  const handleSelectGitHubMention = (username: string) => {
    if (!editor) return;
    const cleanUser = username.replace(/^@+/, '').trim();
    if (!cleanUser) {
      setShowGitHubMenu(false);
      return;
    }
    const { selection } = editor.state;
    const { $from } = selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\uFFFC');
    const match = textBefore.match(/(?:^|[\s([{"'])(@[a-zA-Z0-9-]{0,39})$/);

    if (match) {
      const tokenWithAt = match[1];
      const matchStart = selection.from - tokenWithAt.length;
      editor
        .chain()
        .focus()
        .deleteRange({ from: matchStart, to: selection.from })
        .insertContent([
          { type: 'githubMention', attrs: { username: cleanUser } },
          { type: 'text', text: ' ' },
        ])
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent([
          { type: 'githubMention', attrs: { username: cleanUser } },
          { type: 'text', text: ' ' },
        ])
        .run();
    }

    setShowGitHubMenu(false);

    const updatedMarkdown = (editor.storage as any).markdown?.getMarkdown() || '';
    lastMarkdownRef.current = updatedMarkdown;
    onChange(updatedMarkdown);
  };

  const handleSelectWikiLink = (targetTitle: string, createSubNoteImmediately = false) => {
    if (!editor) return;
    const cleanTarget = targetTitle.trim();
    if (!cleanTarget) {
      setShowWikiMenu(false);
      return;
    }
    const { selection } = editor.state;
    const { $from } = selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\uFFFC');
    const match = textBefore.match(/\[\[([^\]\n]*)$/);

    if (match) {
      const matchStart = selection.from - match[0].length;
      let deleteTo = selection.from;
      const textAfter = $from.parent.textBetween($from.parentOffset, $from.parent.content.size, null, '\uFFFC');
      if (textAfter.startsWith(']]')) {
        deleteTo += 2;
      } else if (textAfter.startsWith(']')) {
        deleteTo += 1;
      }
      editor
        .chain()
        .focus()
        .deleteRange({ from: matchStart, to: deleteTo })
        .insertContent([
          { type: 'wikiLink', attrs: { target: cleanTarget, label: cleanTarget } },
          { type: 'text', text: ' ' },
        ])
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent([
          { type: 'wikiLink', attrs: { target: cleanTarget, label: cleanTarget } },
          { type: 'text', text: ' ' },
        ])
        .run();
    }

    setShowWikiMenu(false);

    const updatedMarkdown = (editor.storage as any).markdown?.getMarkdown() || '';
    lastMarkdownRef.current = updatedMarkdown;
    onChange(updatedMarkdown);

    if (createSubNoteImmediately) {
      window.dispatchEvent(
        new CustomEvent('open-wiki-link', {
          detail: {
            target: cleanTarget,
            backgroundCreateOnly: true,
            parentMarkdown: updatedMarkdown,
          },
        })
      );
    }
  };

  const handleSetColumnAlign = (align: 'left' | 'center' | 'right') => {
    if (!editor || !isInTable(editor.state)) return;
    try {
      const rect = selectedRect(editor.state);
      const { map, table, tableStart, left: colIndex } = rect;
      const tr = editor.state.tr;
      for (let row = 0; row < map.height; row++) {
        const relPos = map.positionAt(row, colIndex, table);
        const absPos = tableStart + relPos;
        const cellNode = editor.state.doc.nodeAt(absPos);
        if (cellNode) {
          tr.setNodeMarkup(absPos, undefined, { ...cellNode.attrs, align });
        }
      }
      editor.view.dispatch(tr);
      editor.view.focus();
      updateTableToolbarState(editor);
    } catch {
      // ignore
    }
  };

  const handleAddRowAbove = () => {
    if (!editor || !isInTable(editor.state)) return;
    const rect = selectedRect(editor.state);
    if (rect.top === 0) {
      // Keep header row at top and insert body row immediately below header
      addRowAfter(editor.state, editor.view.dispatch);
    } else {
      addRowBefore(editor.state, editor.view.dispatch);
    }
    syncTableStructure(editor.state, editor.view.dispatch);
    editor.view.focus();
    updateTableToolbarState(editor);
  };

  const handleAddRowBelow = () => {
    if (!editor || !isInTable(editor.state)) return;
    addRowAfter(editor.state, editor.view.dispatch);
    syncTableStructure(editor.state, editor.view.dispatch);
    editor.view.focus();
    updateTableToolbarState(editor);
  };

  const handleRemoveRow = () => {
    if (!editor || !isInTable(editor.state)) return;
    const rect = selectedRect(editor.state);
    if (rect.map.height <= 1) {
      deleteTable(editor.state, editor.view.dispatch);
    } else {
      deleteRow(editor.state, editor.view.dispatch);
      syncTableStructure(editor.state, editor.view.dispatch);
    }
    editor.view.focus();
    updateTableToolbarState(editor);
  };

  const handleAddColLeft = () => {
    if (!editor || !isInTable(editor.state)) return;
    addColumnBefore(editor.state, editor.view.dispatch);
    syncTableStructure(editor.state, editor.view.dispatch);
    editor.view.focus();
    updateTableToolbarState(editor);
  };

  const handleAddColRight = () => {
    if (!editor || !isInTable(editor.state)) return;
    addColumnAfter(editor.state, editor.view.dispatch);
    syncTableStructure(editor.state, editor.view.dispatch);
    editor.view.focus();
    updateTableToolbarState(editor);
  };

  const handleRemoveCol = () => {
    if (!editor || !isInTable(editor.state)) return;
    const rect = selectedRect(editor.state);
    if (rect.map.width <= 1) {
      deleteTable(editor.state, editor.view.dispatch);
    } else {
      deleteColumn(editor.state, editor.view.dispatch);
      syncTableStructure(editor.state, editor.view.dispatch);
    }
    editor.view.focus();
    updateTableToolbarState(editor);
  };

  const handleRemoveTable = () => {
    if (!editor || !isInTable(editor.state)) return;
    deleteTable(editor.state, editor.view.dispatch);
    editor.view.focus();
    setTableContext(null);
  };

  // =========================================================
  // 10.C DRAG & DROP BLOCK REORDERING HELPERS
  // =========================================================
  const executeMoveNode = React.useCallback(
    (ed: any, from: number, to: number, targetPos: number) => {
      if (!ed || !ed.view) return false;
      if (targetPos >= from && targetPos <= to) return false;

      const { state } = ed;
      const slice = state.doc.slice(from, to);
      if (!slice || slice.size === 0) return false;

      const tr = state.tr;
      let newSelectionPos = targetPos;

      if (targetPos < from) {
        tr.delete(from, to);
        tr.insert(targetPos, slice.content);
        newSelectionPos = targetPos + 1;
      } else {
        tr.insert(targetPos, slice.content);
        tr.delete(from, to);
        newSelectionPos = targetPos - (to - from) + 1;
      }

      try {
        const clampedPos = Math.max(1, Math.min(tr.doc.content.size - 1, newSelectionPos));
        tr.setSelection(TextSelection.near(tr.doc.resolve(clampedPos)));
      } catch {}

      ed.view.dispatch(tr.scrollIntoView());
      ed.view.focus();
      const updatedMd = (ed.storage as any).markdown?.getMarkdown() || '';
      lastMarkdownRef.current = updatedMd;
      onChange(updatedMd);
      return true;
    },
    [onChange]
  );

  const moveBlockByStep = (
    ed: any,
    from: number,
    to: number,
    isListItem: boolean,
    direction: -1 | 1
  ): boolean => {
    if (!ed || !ed.view) return false;
    const { doc } = ed.state;
    try {
      const $pos = doc.resolve(Math.min(doc.content.size, from + 1));
      if (isListItem) {
        for (let d = $pos.depth; d >= 1; d--) {
          const n = $pos.node(d);
          if (n.type.name === 'listItem' || n.type.name === 'taskItem') {
            const listDepth = d - 1;
            const listNode = $pos.node(listDepth);
            const itemIndex = $pos.index(listDepth);
            const targetIndex = itemIndex + direction;
            if (targetIndex < 0 || targetIndex >= listNode.childCount) return false;

            const listStart = $pos.start(listDepth);
            let offset = listStart;
            for (let i = 0; i < listNode.childCount; i++) {
              const child = listNode.child(i);
              if (i === targetIndex) {
                const targetPos = direction === -1 ? offset : offset + child.nodeSize;
                return executeMoveNode(ed, from, to, targetPos);
              }
              offset += child.nodeSize;
            }
          }
        }
      } else {
        const topIndex = $pos.index(0);
        const targetIndex = topIndex + direction;
        if (targetIndex < 0 || targetIndex >= doc.childCount) return false;

        let offset = 0;
        for (let i = 0; i < doc.childCount; i++) {
          const child = doc.child(i);
          if (i === targetIndex) {
            const targetPos = direction === -1 ? offset : offset + child.nodeSize;
            return executeMoveNode(ed, from, to, targetPos);
          }
          offset += child.nodeSize;
        }
      }
    } catch {}
    return false;
  };

  const handleSelectEmoji = (emoji: string) => {
    if (!editor) return;
    const { selection } = editor.state;
    const { $from } = selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, null, '\uFFFC');
    const match = textBefore.match(/(?:^|\s):([a-zA-Z0-9_-]+)$/);

    if (match) {
      const matchStart = selection.from - match[1].length - 1;
      editor.chain().focus().deleteRange({ from: matchStart, to: selection.from }).insertContent(`${emoji} `).run();
    } else {
      editor.chain().focus().insertContent(`${emoji} `).run();
    }

    setShowEmojiMenu(false);
  };

  // Listen for custom event from EmbeddedCalendar inside code block & WikiLink clicks
  useEffect(() => {
    const handleOpenDailyEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.dateStr && onOpenDailyNote) {
        onOpenDailyNote(customEvent.detail.dateStr);
      }
    };

    const handleOpenWikiLinkEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.target && onOpenWikiLink) {
        const currentMd =
          customEvent.detail.parentMarkdown ||
          (editorRef.current?.storage as any)?.markdown?.getMarkdown() ||
          lastMarkdownRef.current ||
          '';
        onOpenWikiLink(customEvent.detail.target, {
          backgroundCreateOnly: !!customEvent.detail.backgroundCreateOnly,
          parentMarkdown: currentMd,
        });
      }
    };

    window.addEventListener('open-daily-note', handleOpenDailyEvent);
    window.addEventListener('open-wiki-link', handleOpenWikiLinkEvent);
    return () => {
      window.removeEventListener('open-daily-note', handleOpenDailyEvent);
      window.removeEventListener('open-wiki-link', handleOpenWikiLinkEvent);
    };
  }, [onOpenDailyNote, onOpenWikiLink]);

  // Compute live matches and update ProseMirror DecorationSet
  const searchMatches = React.useMemo(() => {
    if (!editor || !isSearchModalOpen || !findQuery) return [];
    // Reference docSearchVersion to recompute whenever document updates
    void docSearchVersion;
    return findMatchesInDoc(editor.state.doc, findQuery, caseSensitive, wholeWord);
  }, [editor, isSearchModalOpen, findQuery, caseSensitive, wholeWord, docSearchVersion]);

  const clampedMatchIndex = searchMatches.length > 0 ? activeMatchIndex % searchMatches.length : 0;

  const scrollActiveMatchIntoView = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => {
      const activeEl = document.querySelector('.bear-search-match-active') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, []);

  useEffect(() => {
    if (!editor || !editor.view) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || !editor || !editor.view) return;
      if (!isSearchModalOpen || !findQuery || searchMatches.length === 0) {
        try {
          editor.view.dispatch(editor.state.tr.setMeta(searchHighlightPluginKey, DecorationSet.empty));
        } catch {}
        return;
      }

      const decos = searchMatches.map((m, idx) =>
        Decoration.inline(m.from, m.to, {
          class: idx === clampedMatchIndex ? 'bear-search-match bear-search-match-active' : 'bear-search-match',
        })
      );
      const decoSet = DecorationSet.create(editor.state.doc, decos);
      try {
        editor.view.dispatch(editor.state.tr.setMeta(searchHighlightPluginKey, decoSet));
      } catch {}
    });
    return () => {
      cancelled = true;
    };
  }, [editor, isSearchModalOpen, findQuery, searchMatches, clampedMatchIndex]);

  const openSearchModal = React.useCallback(
    (withReplace: boolean) => {
      setIsSearchModalOpen(true);
      if (withReplace) {
        setShowReplaceRow(true);
      }
      if (editor) {
        const { from, to } = editor.state.selection;
        if (to > from) {
          const selectedText = editor.state.doc.textBetween(from, to, ' ').trim();
          if (selectedText && !selectedText.includes('\n') && selectedText.length <= 120) {
            setFindQuery(selectedText);
            setActiveMatchIndex(0);
          }
        }
      }
      setTimeout(() => {
        findInputRef.current?.focus();
        findInputRef.current?.select();
      }, 20);
    },
    [editor]
  );

  const closeSearchModal = React.useCallback(() => {
    setIsSearchModalOpen(false);
    if (editor && editor.view) {
      try {
        editor.view.dispatch(editor.state.tr.setMeta(searchHighlightPluginKey, DecorationSet.empty));
        editor.view.focus();
      } catch {}
    }
  }, [editor]);

  // Listen for Ctrl+F / Cmd+F and Ctrl+H / Cmd+H and header button event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const key = (e.key || '').toLowerCase();

      if (isMod && !e.shiftKey && !e.altKey && key === 'f') {
        e.preventDefault();
        openSearchModal(false);
        return;
      }

      if ((isMod && !e.shiftKey && !e.altKey && key === 'h') || (isMod && e.altKey && key === 'f')) {
        e.preventDefault();
        openSearchModal(true);
        return;
      }

      if (e.key === 'Escape' && isSearchModalOpen) {
        e.preventDefault();
        closeSearchModal();
      }
    };

    const handleToggleNoteSearch = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (isSearchModalOpen && !customEvent.detail?.forceOpen) {
        closeSearchModal();
      } else {
        openSearchModal(!!customEvent.detail?.replace);
      }
    };

    const handleEditorCommand = (e: Event) => {
      const customEvent = e as CustomEvent;
      const cmdId = customEvent.detail?.command as string | undefined;
      if (!cmdId || !editorRef.current) return;
      const ed = editorRef.current;
      const todayStr = new Date().toISOString().split('T')[0];

      switch (cmdId) {
        case 'h1':
          ed.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case 'h2':
          ed.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case 'h3':
          ed.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case 'task':
          ed.chain().focus().toggleTaskList().run();
          break;
        case 'bullet':
          ed.chain().focus().toggleBulletList().run();
          break;
        case 'table':
          ed.chain().focus().insertContent(buildDefaultTableJSON([frT.defaultCol1, frT.defaultCol2, frT.defaultCol3], 2)).run();
          break;
        case 'code':
          ed.chain().focus().toggleCodeBlock().run();
          break;
        case 'quote':
          ed.chain().focus().toggleBlockquote().run();
          break;
        case 'highlight':
          ed.chain().focus().insertContent(`==${frT.highlightedTextSample}== `).run();
          break;
        case 'bold':
          ed.chain().focus().toggleBold().run();
          break;
        case 'italic':
          ed.chain().focus().toggleItalic().run();
          break;
        case 'calendario':
          ed.chain().focus().insertContent(`\n\`\`\`calendario\n${todayStr}\n\`\`\`\n`).run();
          break;
        case 'hr':
          ed.chain().focus().setHorizontalRule().run();
          break;
        case 'wikilink':
          ed.chain().focus().insertContent('[[').run();
          break;
        case 'github-mention':
          ed.chain().focus().insertContent('@').run();
          break;
        case 'move-block-up':
        case 'move-block-down': {
          const direction = cmdId === 'move-block-up' ? -1 : 1;
          const { $from } = ed.state.selection;
          let moved = false;
          for (let d = $from.depth; d >= 1; d--) {
            const node = $from.node(d);
            if (node.type.name === 'listItem' || node.type.name === 'taskItem') {
              const listDepth = d - 1;
              const listNode = $from.node(listDepth);
              if (listNode && listNode.childCount > 1) {
                moved = moveBlockByStep(ed, $from.before(d), $from.after(d), true, direction);
                break;
              }
            }
          }
          if (!moved && $from.depth >= 1) {
            moveBlockByStep(ed, $from.before(1), $from.after(1), false, direction);
          }
          break;
        }
        case 'insert-subnote': {
          const title = (customEvent.detail?.title as string | undefined)?.trim();
          if (title) {
            ed.chain()
              .focus()
              .insertContent([
                { type: 'wikiLink', attrs: { target: title, label: title } },
                { type: 'text', text: ' ' },
              ])
              .run();
            const updatedMd = (ed.storage as any).markdown?.getMarkdown() || '';
            lastMarkdownRef.current = updatedMd;
            onChange(updatedMd);
            window.dispatchEvent(
              new CustomEvent('open-wiki-link', {
                detail: {
                  target: title,
                  backgroundCreateOnly: true,
                  parentMarkdown: updatedMd,
                },
              })
            );
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-note-search', handleToggleNoteSearch);
    window.addEventListener('bear-editor-command', handleEditorCommand);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-note-search', handleToggleNoteSearch);
      window.removeEventListener('bear-editor-command', handleEditorCommand);
    };
  }, [isSearchModalOpen, openSearchModal, closeSearchModal, onChange]);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev + 1) % searchMatches.length);
    scrollActiveMatchIntoView();
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    setActiveMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
    scrollActiveMatchIntoView();
  };

  const handleReplaceSingle = () => {
    if (!editor || searchMatches.length === 0) return;
    const targetMatch = searchMatches[clampedMatchIndex];
    if (!targetMatch) return;

    const { state, view } = editor;
    const tr = state.tr;
    if (replaceQuery.length > 0) {
      const marks = state.doc.nodeAt(targetMatch.from)?.marks || state.doc.resolve(targetMatch.from).marks();
      tr.replaceWith(targetMatch.from, targetMatch.to, state.schema.text(replaceQuery, marks));
    } else {
      tr.delete(targetMatch.from, targetMatch.to);
    }

    view.dispatch(tr);
    setDocSearchVersion((v) => v + 1);
    onShowToast?.(frT.replacedSingleToast, 'info');
    scrollActiveMatchIntoView();
  };

  const handleReplaceAll = () => {
    if (!editor || searchMatches.length === 0) return;
    const count = searchMatches.length;
    const { state, view } = editor;
    const tr = state.tr;

    for (let i = searchMatches.length - 1; i >= 0; i--) {
      const m = searchMatches[i];
      if (replaceQuery.length > 0) {
        const marks = state.doc.nodeAt(m.from)?.marks || state.doc.resolve(m.from).marks();
        tr.replaceWith(m.from, m.to, state.schema.text(replaceQuery, marks));
      } else {
        tr.delete(m.from, m.to);
      }
    }

    view.dispatch(tr);
    setDocSearchVersion((v) => v + 1);
    setActiveMatchIndex(0);
    onShowToast?.(
      count === 1 ? frT.replacedAllToastSingular : `${count} ${frT.replacedAllToastPlural}`,
      'success'
    );
  };

  // Sync external changes (e.g. note switch, AI insertions) via microtask to avoid React flushSync during lifecycle
  useEffect(() => {
    if (!editor) return;
    if (value === lastMarkdownRef.current) return;

    let cancelled = false;
    lastMarkdownRef.current = value;
    queueMicrotask(() => {
      if (cancelled || !editor || editor.isDestroyed) return;
      isUpdatingFromProps.current = true;
      try {
        editor.commands.setContent(preprocessMarkdownForIcons(value || ''), { emitUpdate: false });
      } finally {
        isUpdatingFromProps.current = false;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [value, editor]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Sticky In-Document Search & Replace Modal (Ctrl+F / Ctrl+H) */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="sticky top-2 z-40 flex justify-end mb-3 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className={`pointer-events-auto w-full max-w-md p-2.5 rounded-[24px] [corner-shape:squircle] border-0 shadow-none transition-colors select-none ${
                isDarkMode
                  ? 'bg-[#222226]/95 text-zinc-100 backdrop-blur-xl'
                  : 'bg-[#EEF1F6]/95 text-[#0F172A] backdrop-blur-xl'
              }`}
            >
              {/* Row 1: Find Input, Options, Counter & Navigation */}
              <div className="flex items-center gap-1.5">
                <Tooltip
                  content={showReplaceRow ? frT.hideReplace : frT.showReplace}
                  position="bottom"
                >
                  <button
                    type="button"
                    onClick={() => setShowReplaceRow((prev) => !prev)}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                      showReplaceRow
                        ? isDarkMode
                          ? 'bg-zinc-700 text-white'
                          : 'bg-slate-200 text-slate-900'
                        : isDarkMode
                          ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/70'
                    }`}
                    aria-label={showReplaceRow ? frT.hideReplace : frT.showReplace}
                  >
                    {showReplaceRow ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </Tooltip>

                {/* Find Input Pill */}
                <div
                  className={`flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-0 shadow-none transition-colors min-w-0 ${
                    isDarkMode
                      ? 'bg-[#161618]'
                      : 'bg-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
                  <input
                    ref={findInputRef}
                    type="text"
                    value={findQuery}
                    onChange={(e) => {
                      setFindQuery(e.target.value);
                      setActiveMatchIndex(0);
                      scrollActiveMatchIntoView();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          handlePrevMatch();
                        } else {
                          handleNextMatch();
                        }
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        closeSearchModal();
                      }
                    }}
                    placeholder={frT.findPlaceholder}
                    className="w-full bg-transparent text-xs font-medium outline-none min-w-0"
                  />
                  {findQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setFindQuery('');
                        setActiveMatchIndex(0);
                        findInputRef.current?.focus();
                      }}
                      className="p-0.5 rounded-full opacity-60 hover:opacity-100 cursor-pointer shrink-0"
                      aria-label={frT.clearSearch}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  {/* Match Case (Aa) */}
                  <Tooltip content={frT.matchCase} position="bottom">
                    <button
                      type="button"
                      onClick={() => {
                        setCaseSensitive((prev) => !prev);
                        setActiveMatchIndex(0);
                      }}
                      className={`p-1 rounded-full transition-colors cursor-pointer shrink-0 ${
                        caseSensitive
                          ? 'text-white'
                          : isDarkMode
                            ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                      style={{
                        backgroundColor: caseSensitive ? (primaryColor || '#006FFF') : undefined,
                      }}
                      aria-label={frT.matchCase}
                    >
                      <CaseSensitive className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>

                  {/* Whole Word */}
                  <Tooltip content={frT.wholeWord} position="bottom">
                    <button
                      type="button"
                      onClick={() => {
                        setWholeWord((prev) => !prev);
                        setActiveMatchIndex(0);
                      }}
                      className={`p-1 rounded-full transition-colors cursor-pointer shrink-0 ${
                        wholeWord
                          ? 'text-white'
                          : isDarkMode
                            ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                      style={{
                        backgroundColor: wholeWord ? (primaryColor || '#006FFF') : undefined,
                      }}
                      aria-label={frT.wholeWord}
                    >
                      <WholeWord className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>

                {/* Match Count Badge */}
                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-1 rounded-full shrink-0 ${
                    findQuery && searchMatches.length === 0
                      ? 'text-red-500 bg-red-500/10'
                      : isDarkMode
                        ? 'text-zinc-300 bg-[#161618]'
                        : 'text-slate-600 bg-white'
                  }`}
                >
                  {findQuery
                    ? searchMatches.length > 0
                      ? `${clampedMatchIndex + 1}/${searchMatches.length}`
                      : '0/0'
                    : '0/0'}
                </span>

                {/* Previous / Next Match Buttons */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Tooltip content={frT.prevMatch} position="bottom">
                    <button
                      type="button"
                      onClick={handlePrevMatch}
                      disabled={searchMatches.length === 0}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? 'hover:bg-zinc-700 text-zinc-200'
                          : 'hover:bg-slate-200/80 text-slate-700'
                      }`}
                      aria-label={frT.prevMatch}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip content={frT.nextMatch} position="bottom">
                    <button
                      type="button"
                      onClick={handleNextMatch}
                      disabled={searchMatches.length === 0}
                      className={`p-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? 'hover:bg-zinc-700 text-zinc-200'
                          : 'hover:bg-slate-200/80 text-slate-700'
                      }`}
                      aria-label={frT.nextMatch}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>

                {/* Close Modal Button */}
                <Tooltip content={frT.close} position="bottom">
                  <button
                    type="button"
                    onClick={closeSearchModal}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                      isDarkMode
                        ? 'hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100'
                        : 'hover:bg-slate-200/80 text-slate-500 hover:text-slate-900'
                    }`}
                    aria-label={frT.close}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>

              {/* Row 2: Replace Input & Individual / Batch Replace Actions */}
              <AnimatePresence initial={false}>
                {showReplaceRow && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 pt-2 pl-8">
                      <div
                        className={`flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-full border-0 shadow-none transition-colors min-w-0 ${
                          isDarkMode
                            ? 'bg-[#161618]'
                            : 'bg-white'
                        }`}
                      >
                        <Replace className="w-3.5 h-3.5 opacity-50 shrink-0" />
                        <input
                          ref={replaceInputRef}
                          type="text"
                          value={replaceQuery}
                          onChange={(e) => setReplaceQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (e.shiftKey) {
                                handleReplaceAll();
                              } else {
                                handleReplaceSingle();
                              }
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              closeSearchModal();
                            }
                          }}
                          placeholder={frT.replacePlaceholder}
                          className="w-full bg-transparent text-xs font-medium outline-none min-w-0"
                        />
                      </div>

                      <Tooltip content={frT.replaceCurrentTooltip} position="bottom">
                        <button
                          type="button"
                          onClick={handleReplaceSingle}
                          disabled={searchMatches.length === 0}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                            isDarkMode
                              ? 'bg-[#161618] hover:bg-zinc-700 text-zinc-200'
                              : 'bg-white hover:bg-slate-200/80 text-slate-800'
                          }`}
                        >
                          {frT.replaceBtn}
                        </button>
                      </Tooltip>

                      <Tooltip content={frT.replaceAllTooltip} position="bottom">
                        <button
                          type="button"
                          onClick={handleReplaceAll}
                          disabled={searchMatches.length === 0}
                          className="px-3 py-1.5 rounded-full text-[11px] font-bold text-white transition-all cursor-pointer shrink-0 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ backgroundColor: primaryColor || '#006FFF' }}
                        >
                          {frT.allBtn} ({searchMatches.length})
                        </button>
                      </Tooltip>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div 
        ref={wrapperRef}
        className="bear-editor-wrapper relative flex-1 cursor-text pb-48 min-h-[calc(100vh-240px)]"
        onClick={(e) => {
          // If clicking the empty space below the content, focus editor at the end
          if (e.target === e.currentTarget && editor) {
            editor.commands.focus('end');
          }
        }}
      >
        {/* Contextual Floating Table Controls Toolbar */}
        <AnimatePresence>
          {tableContext?.active && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{ top: `${tableContext.top}px` }}
              onMouseDown={(e) => e.preventDefault()}
              className={`absolute left-0 z-30 flex flex-wrap items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors select-none ${
                isDarkMode
                  ? 'bg-[#242424] text-zinc-200 border border-zinc-700/80'
                  : 'bg-[#EEF1F6] text-[#0F172A] border border-slate-200/90'
              }`}
            >
              {/* Column Alignment Controls */}
              <div className="flex items-center gap-0.5 pr-1.5 border-r border-zinc-400/25">
                <Tooltip content={frT.tableAlignLeft} position="top">
                  <button
                    type="button"
                    onClick={() => handleSetColumnAlign('left')}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      tableContext.colAlign === 'left'
                        ? 'text-white'
                        : isDarkMode
                          ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                    }`}
                    style={{
                      backgroundColor: tableContext.colAlign === 'left' ? (primaryColor || '#006FFF') : undefined,
                    }}
                    aria-label={frT.tableAlignLeft}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>

                <Tooltip content={frT.tableAlignCenter} position="top">
                  <button
                    type="button"
                    onClick={() => handleSetColumnAlign('center')}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      tableContext.colAlign === 'center'
                        ? 'text-white'
                        : isDarkMode
                          ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                    }`}
                    style={{
                      backgroundColor: tableContext.colAlign === 'center' ? (primaryColor || '#006FFF') : undefined,
                    }}
                    aria-label={frT.tableAlignCenter}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>

                <Tooltip content={frT.tableAlignRight} position="top">
                  <button
                    type="button"
                    onClick={() => handleSetColumnAlign('right')}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      tableContext.colAlign === 'right'
                        ? 'text-white'
                        : isDarkMode
                          ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                    }`}
                    style={{
                      backgroundColor: tableContext.colAlign === 'right' ? (primaryColor || '#006FFF') : undefined,
                    }}
                    aria-label={frT.tableAlignRight}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>

              {/* Row Controls */}
              <div className="flex items-center gap-1 px-1 border-r border-zinc-400/25">
                <Rows3 className="w-3.5 h-3.5 opacity-60 mr-0.5" />
                <Tooltip content={frT.tableInsertRowAbove} position="top">
                  <button
                    type="button"
                    onClick={handleAddRowAbove}
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-zinc-700/70 text-zinc-200' : 'hover:bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {frT.tableRowAboveBtn}
                  </button>
                </Tooltip>
                <Tooltip content={frT.tableInsertRowBelow} position="top">
                  <button
                    type="button"
                    onClick={handleAddRowBelow}
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-zinc-700/70 text-zinc-200' : 'hover:bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {frT.tableRowBelowBtn}
                  </button>
                </Tooltip>
                <Tooltip content={frT.tableDeleteRow} position="top">
                  <button
                    type="button"
                    onClick={handleRemoveRow}
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'
                    }`}
                  >
                    {frT.tableDeleteRowBtn}
                  </button>
                </Tooltip>
              </div>

              {/* Column Controls */}
              <div className="flex items-center gap-1 px-1 border-r border-zinc-400/25">
                <Columns3 className="w-3.5 h-3.5 opacity-60 mr-0.5" />
                <Tooltip content={frT.tableInsertColLeft} position="top">
                  <button
                    type="button"
                    onClick={handleAddColLeft}
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-zinc-700/70 text-zinc-200' : 'hover:bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {frT.tableColLeftBtn}
                  </button>
                </Tooltip>
                <Tooltip content={frT.tableInsertColRight} position="top">
                  <button
                    type="button"
                    onClick={handleAddColRight}
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-zinc-700/70 text-zinc-200' : 'hover:bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {frT.tableColRightBtn}
                  </button>
                </Tooltip>
                <Tooltip content={frT.tableDeleteCol} position="top">
                  <button
                    type="button"
                    onClick={handleRemoveCol}
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'
                    }`}
                  >
                    {frT.tableDeleteColBtn}
                  </button>
                </Tooltip>
              </div>

              {/* Delete Table */}
              <Tooltip content={frT.tableDeleteAll} position="top">
                <button
                  type="button"
                  onClick={handleRemoveTable}
                  className="p-1.5 rounded-full text-red-500 hover:bg-red-500/15 transition-colors cursor-pointer"
                  aria-label={frT.tableDeleteAll}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Slash Command Menu */}
        {showSlashMenu && (
          <SlashCommandMenu
            position={slashMenuPos}
            filterText={slashFilterText}
            onSelect={handleSelectSlashCommand}
            onClose={() => setShowSlashMenu(false)}
            isDarkMode={isDarkMode}
            language={language}
          />
        )}

        {/* Floating Emoji Autocomplete Menu */}
        {showEmojiMenu && (
          <EmojiAutocompleteMenu
            position={emojiMenuPos}
            query={emojiFilterText}
            onSelect={handleSelectEmoji}
            onClose={() => setShowEmojiMenu(false)}
            isDarkMode={isDarkMode}
            language={language}
          />
        )}

        {/* Floating WikiLink [[Nombre de la Nota]] Autocomplete Menu */}
        {showWikiMenu && (
          <WikiLinkAutocompleteMenu
            position={wikiMenuPos}
            query={wikiFilterText}
            notes={wikiLinkNotes}
            currentNotePath={currentNotePath}
            onSelect={handleSelectWikiLink}
            onClose={() => setShowWikiMenu(false)}
            isDarkMode={isDarkMode}
            primaryColor={primaryColor}
            language={language}
          />
        )}

        {/* Floating GitHub @usuario Mention Autocomplete Menu */}
        {showGitHubMenu && (
          <GitHubMentionAutocompleteMenu
            position={githubMenuPos}
            query={githubFilterText}
            onSelect={handleSelectGitHubMention}
            onClose={() => setShowGitHubMenu(false)}
            isDarkMode={isDarkMode}
            primaryColor={primaryColor}
            language={language}
          />
        )}

        {/* Core TipTap Editor Surface */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.8 }}
              className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-medium border-0 shadow-none ${
                isDarkMode
                  ? 'bg-[#262626] text-zinc-100'
                  : 'bg-[#E2E8F0] text-[#0F172A]'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: primaryColor || '#006FFF' }}
              />
              <span>{uiT.menus.context.uploadingImage}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <EditorContent editor={editor} className="min-h-[500px]" />
      </div>
    </div>
  );
}
