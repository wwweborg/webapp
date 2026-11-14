"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { ExternalLink, AtSign, Loader2 } from 'lucide-react';
import { AppLanguage, getUiTranslations } from '@/lib/i18n';

export interface GitHubUserOption {
  login: string;
  avatar_url: string;
  html_url: string;
  type?: string;
}

interface GitHubMentionAutocompleteMenuProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (username: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
  primaryColor?: string;
  language?: AppLanguage;
}

const githubSearchCache = new Map<string, GitHubUserOption[]>();

const VALID_GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export function GitHubMentionAutocompleteMenu({
  query,
  position,
  onSelect,
  onClose,
  isDarkMode,
  primaryColor = '#006FFF',
  language = 'es',
}: GitHubMentionAutocompleteMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [adjustedPos, setAdjustedPos] = useState(position);
  const [remoteUsers, setRemoteUsers] = useState<GitHubUserOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const ghT = getUiTranslations(language).menus.github;

  const cleanQuery = query.trim().replace(/^@+/, '');
  const isValidDirectUsername = VALID_GITHUB_USERNAME_REGEX.test(cleanQuery);

  useEffect(() => {
    if (!cleanQuery) {
      queueMicrotask(() => {
        setRemoteUsers([]);
        setIsLoading(false);
      });
      return;
    }

    const cacheKey = cleanQuery.toLowerCase();
    if (githubSearchCache.has(cacheKey)) {
      queueMicrotask(() => {
        setRemoteUsers(githubSearchCache.get(cacheKey) || []);
        setIsLoading(false);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsLoading(true);
    });

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.github.com/search/users?q=${encodeURIComponent(cleanQuery)}+type:user&per_page=6`,
          {
            headers: {
              Accept: 'application/vnd.github+json',
            },
          }
        );
        if (!res.ok) throw new Error('GitHub search failed');
        const data = await res.json();
        if (cancelled) return;
        const items: GitHubUserOption[] = Array.isArray(data?.items)
          ? data.items.map((u: any) => ({
              login: String(u.login || ''),
              avatar_url: String(u.avatar_url || `https://github.com/${u.login}.png?size=64`),
              html_url: String(u.html_url || `https://github.com/${u.login}`),
              type: String(u.type || 'User'),
            }))
          : [];
        githubSearchCache.set(cacheKey, items);
        setRemoteUsers(items);
      } catch {
        if (!cancelled) {
          setRemoteUsers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cleanQuery]);

  const options = useMemo<GitHubUserOption[]>(() => {
    const list: GitHubUserOption[] = [];
    const seen = new Set<string>();

    if (isValidDirectUsername) {
      const exactMatch = remoteUsers.find(
        (u) => u.login.toLowerCase() === cleanQuery.toLowerCase()
      );
      const firstItem: GitHubUserOption = exactMatch || {
        login: cleanQuery,
        avatar_url: `https://github.com/${cleanQuery}.png?size=64`,
        html_url: `https://github.com/${cleanQuery}`,
        type: 'User',
      };
      list.push(firstItem);
      seen.add(firstItem.login.toLowerCase());
    }

    for (const user of remoteUsers) {
      const key = user.login.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(user);
      }
    }

    return list.slice(0, 6);
  }, [cleanQuery, isValidDirectUsername, remoteUsers]);

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
  }, [position, options.length, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        if (options.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % options.length);
        }
      } else if (e.key === 'ArrowUp') {
        if (options.length > 0) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
        }
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (options.length > 0 && options[selectedIndex]) {
          e.preventDefault();
          onSelect(options[selectedIndex].login);
        } else if (isValidDirectUsername) {
          e.preventDefault();
          onSelect(cleanQuery);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, options, isValidDirectUsername, cleanQuery, onSelect, onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedPos.top}px`, left: `${adjustedPos.left}px` }}
      className={`fixed z-50 w-72 max-h-80 overflow-y-auto p-2 rounded-[24px] [corner-shape:squircle] border-0 shadow-none backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 select-none ${
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
        <span className="flex items-center gap-1.5">
          <AtSign className="w-3 h-3" style={{ color: primaryColor }} />
          {ghT.header}
        </span>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin opacity-70" />}
      </div>

      {!cleanQuery ? (
        <div
          className={`px-3 py-3 rounded-2xl text-xs ${
            isDarkMode ? 'bg-[#18181B] text-zinc-400' : 'bg-white text-slate-500'
          }`}
        >
          {ghT.typeAfterAt}
        </div>
      ) : options.length === 0 && !isLoading ? (
        <div
          className={`px-3 py-3 rounded-2xl text-xs ${
            isDarkMode ? 'bg-[#18181B] text-zinc-400' : 'bg-white text-slate-500'
          }`}
        >
          {ghT.noUsersFound} «@{cleanQuery}»
        </div>
      ) : (
        <div className="space-y-1">
          {options.map((user, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={user.login}
                type="button"
                onClick={() => onSelect(user.login)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-2xl text-left transition-colors cursor-pointer border-0 shadow-none ${
                  isSelected
                    ? 'text-white'
                    : isDarkMode
                      ? 'bg-[#18181B] hover:bg-[#2C2C32] text-zinc-100'
                      : 'bg-white hover:bg-slate-100 text-slate-900'
                }`}
                style={{
                  backgroundColor: isSelected ? primaryColor : undefined,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    className="w-7 h-7 rounded-full object-cover shrink-0 bg-zinc-500/20"
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-bold truncate">
                      @{user.login}
                    </span>
                    <span
                      className={`text-[10px] truncate ${
                        isSelected
                          ? 'text-white/80'
                          : isDarkMode
                            ? 'text-zinc-400'
                            : 'text-slate-500'
                      }`}
                    >
                      github.com/{user.login}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-75" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
