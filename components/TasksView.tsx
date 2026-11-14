"use client";
import { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Search, 
  Filter, 
  FileText, 
  CheckSquare, 
  Clock, 
  ArrowRight,
  ListTodo,
  Calendar as CalendarIcon,
  Sparkles
} from 'lucide-react';
import { AppIcon } from '@/components/AppIcon';

export interface TaskItem {
  id: string;
  notePath: string;
  noteTitle: string;
  text: string;
  completed: boolean;
  lineIndex: number;
}

interface TasksViewProps {
  notes: Array<{ path: string; name: string; type: string }>;
  noteContents: Record<string, string>;
  isDarkMode: boolean;
  primaryColor: string;
  iconPack: string;
  onToggleTask: (notePath: string, lineIndex: number, currentCompleted: boolean) => void;
  onOpenNote: (path: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TasksView({
  notes,
  noteContents,
  isDarkMode,
  primaryColor,
  iconPack,
  onToggleTask,
  onOpenNote,
  onShowToast
}: TasksViewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedNoteFilter, setSelectedNoteFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scan all note contents to extract all tasks
  const allTasks = useMemo(() => {
    const tasks: TaskItem[] = [];

    notes.forEach(note => {
      if (note.type !== 'file' || !note.path.endsWith('.md')) return;
      const content = noteContents[note.path] || '';
      if (!content) return;

      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const match = line.match(/^[-*+]\s*\[([ xX])\]\s*(.+)$/);
        if (match) {
          const completed = match[1].toLowerCase() === 'x';
          const text = match[2].trim();
          const noteTitle = note.name.replace(/\.md$/, '');
          
          tasks.push({
            id: `${note.path}:${idx}`,
            notePath: note.path,
            noteTitle,
            text,
            completed,
            lineIndex: idx
          });
        }
      });
    });

    return tasks;
  }, [notes, noteContents]);

  // Unique notes that contain tasks for filter dropdown
  const notesWithTasks = useMemo(() => {
    const set = new Set<string>();
    allTasks.forEach(t => set.add(t.notePath));
    return Array.from(set).sort();
  }, [allTasks]);

  // Filtered tasks according to user choices (incomplete tasks always at the top, completed at the bottom)
  const filteredTasks = useMemo(() => {
    return allTasks
      .filter(task => {
        // Status filter
        if (filterStatus === 'pending' && task.completed) return false;
        if (filterStatus === 'completed' && !task.completed) return false;

        // Note filter
        if (selectedNoteFilter !== 'all' && task.notePath !== selectedNoteFilter) return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return task.text.toLowerCase().includes(q) || task.noteTitle.toLowerCase().includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return 0;
      });
  }, [allTasks, filterStatus, selectedNoteFilter, searchQuery]);

  // Stats
  const totalCount = allTasks.length;
  const completedCount = allTasks.filter(t => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto p-6 sm:p-10 animate-in fade-in duration-300 ${
      isDarkMode ? 'bg-[#0F0F0F] text-zinc-100' : 'bg-[#F8FAFC] text-[#1E293B]'
    }`}>
      {/* Header */}
      <div className="max-w-5xl mx-auto w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-[#0F172A]'}`}>
              Todas las tareas
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Vista global de todas las tareas de tus documentos
            </p>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'text-white'
                  : isDarkMode ? 'bg-[#181818] text-zinc-400 hover:text-zinc-200' : 'bg-white text-zinc-600 hover:text-zinc-900'
              }`}
              style={{ backgroundColor: filterStatus === 'all' ? primaryColor : undefined }}
            >
              Todas ({totalCount})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'pending'
                  ? 'text-white'
                  : isDarkMode ? 'bg-[#181818] text-zinc-400 hover:text-zinc-200' : 'bg-white text-zinc-600 hover:text-zinc-900'
              }`}
              style={{ backgroundColor: filterStatus === 'pending' ? primaryColor : undefined }}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'completed'
                  ? 'text-white'
                  : isDarkMode ? 'bg-[#181818] text-zinc-400 hover:text-zinc-200' : 'bg-white text-zinc-600 hover:text-zinc-900'
              }`}
              style={{ backgroundColor: filterStatus === 'completed' ? primaryColor : undefined }}
            >
              Completadas ({completedCount})
            </button>
          </div>
        </div>

        {/* Progress Card */}
        {totalCount > 0 && (
          <div className={`p-6 rounded-[28px] [corner-shape:squircle] space-y-3 transition-colors ${
            isDarkMode ? 'bg-[#181818]' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className={`font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Progreso de tareas completadas
              </span>
              <span className="font-bold text-base" style={{ color: primaryColor }}>
                {progressPercent}% completado ({completedCount} de {totalCount})
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#242424]' : 'bg-slate-100'}`}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, backgroundColor: primaryColor }}
              />
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-7 relative">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tareas por texto o nota..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium outline-none transition-all ${
                isDarkMode 
                  ? 'bg-[#181818] text-zinc-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/40' 
                  : 'bg-white text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/20'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-md text-zinc-400 hover:text-zinc-600"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Note Select Dropdown */}
          <div className="sm:col-span-5">
            <select
              value={selectedNoteFilter}
              onChange={(e) => setSelectedNoteFilter(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold outline-none transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-[#181818] text-zinc-200 focus:ring-2 focus:ring-blue-500/40' 
                  : 'bg-white text-zinc-800 focus:ring-2 focus:ring-blue-500/20'
              }`}
            >
              <option value="all">Todas las notas con tareas ({notesWithTasks.length})</option>
              {notesWithTasks.map(path => (
                <option key={path} value={path}>
                  📄 {path.split('/').pop()?.replace(/\.md$/, '')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3 pb-16">
          {filteredTasks.length === 0 ? (
            <div className={`p-12 rounded-[32px] [corner-shape:squircle] text-center flex flex-col items-center justify-center space-y-2 ${
              isDarkMode ? 'bg-[#181818]' : 'bg-white'
            }`}>
              <CheckSquare className={`w-12 h-12 ${isDarkMode ? 'text-zinc-700' : 'text-zinc-300'}`} />
              <p className={`text-base font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                No se encontraron tareas
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`group p-4 rounded-2xl [corner-shape:squircle] flex items-start gap-3.5 transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-[#181818] hover:bg-[#202020] text-zinc-200' 
                    : 'bg-white hover:bg-slate-50 text-zinc-800'
                } ${task.completed ? 'opacity-60' : ''}`}
              >
                {/* Checkbox button */}
                <button
                  type="button"
                  onClick={() => onToggleTask(task.notePath, task.lineIndex, task.completed)}
                  className="mt-0.5 shrink-0 cursor-pointer hover:scale-110 transition-transform"
                  title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                  ) : (
                    <Circle className={`w-5 h-5 ${isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-600'}`} />
                  )}
                </button>

                {/* Task Text & Origin Note Link */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-relaxed break-words ${
                    task.completed ? 'line-through text-zinc-400 dark:text-zinc-500' : ''
                  }`}>
                    {task.text}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => onOpenNote(task.notePath)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                        isDarkMode ? 'bg-[#242424] hover:bg-[#2F2F2F] text-zinc-400 hover:text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      <FileText className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[200px]">{task.noteTitle}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
