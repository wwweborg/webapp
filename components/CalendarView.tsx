"use client";
import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  FileText, 
  Globe
} from 'lucide-react';

interface CalendarViewProps {
  notes: Array<{ path: string; name: string; type: string }>;
  noteContents: Record<string, string>;
  isDarkMode: boolean;
  primaryColor: string;
  onOpenNote: (path: string) => void;
  onCreateDailyNote: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function CalendarView({
  notes,
  noteContents,
  isDarkMode,
  primaryColor,
  onOpenNote,
  onCreateDailyNote
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(formatDateStr(new Date()));
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');

  // Timezone detection
  const userTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  // Month & Year calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Map of date strings "YYYY-MM-DD" to notes
  const dailyNotesMap = useMemo(() => {
    const map: Record<string, { path: string; name: string; content: string }> = {};

    notes.forEach(note => {
      if (note.type !== 'file' || !note.path.endsWith('.md')) return;
      const match = note.path.match(/(\d{4}-\d{2}-\d{2})\.md$/);
      if (match) {
        const dateStr = match[1];
        map[dateStr] = {
          path: note.path,
          name: note.name,
          content: noteContents[note.path] || ''
        };
      }
    });

    return map;
  }, [notes, noteContents]);

  // Navigate dates
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (calendarMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (calendarMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(formatDateStr(today));
  };

  // Helper date formatters
  function formatDateStr(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  // Generate month grid days (35 or 42 cells)
  const monthDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      dailyNote?: { path: string; name: string };
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = formatDateStr(d);
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: isSameDay(d, new Date()),
        isSelected: dateStr === selectedDateStr,
        dailyNote: dailyNotesMap[dateStr]
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = formatDateStr(d);
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: true,
        isToday: isSameDay(d, new Date()),
        isSelected: dateStr === selectedDateStr,
        dailyNote: dailyNotesMap[dateStr]
      });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = formatDateStr(d);
      days.push({
        date: d,
        dateStr,
        isCurrentMonth: false,
        isToday: isSameDay(d, new Date()),
        isSelected: dateStr === selectedDateStr,
        dailyNote: dailyNotesMap[dateStr]
      });
    }

    return days;
  }, [year, month, dailyNotesMap, selectedDateStr]);

  // Generate week grid days (7 days from Monday to Sunday)
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    let dayOfWeek = d.getDay() - 1;
    if (dayOfWeek === -1) dayOfWeek = 6;

    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      dailyNote?: { path: string; name: string };
    }> = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = formatDateStr(dayDate);
      days.push({
        date: dayDate,
        dateStr,
        isCurrentMonth: dayDate.getMonth() === month,
        isToday: isSameDay(dayDate, new Date()),
        isSelected: dateStr === selectedDateStr,
        dailyNote: dailyNotesMap[dateStr]
      });
    }

    return days;
  }, [currentDate, month, dailyNotesMap, selectedDateStr]);

  const todayStr = formatDateStr(new Date());
  const activeDays = calendarMode === 'month' ? monthDays : weekDays;

  // Title for control bar
  const headerTitle = useMemo(() => {
    if (calendarMode === 'month') {
      return `${MONTH_NAMES[month]} ${year}`;
    } else {
      const startDay = weekDays[0].date.getDate();
      const endDay = weekDays[6].date.getDate();
      const startMonth = MONTH_NAMES[weekDays[0].date.getMonth()];
      const endMonth = MONTH_NAMES[weekDays[6].date.getMonth()];
      if (startMonth === endMonth) {
        return `${startDay} - ${endDay} de ${startMonth}, ${year}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}, ${year}`;
      }
    }
  }, [calendarMode, month, year, weekDays]);

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto p-6 sm:p-10 animate-in fade-in duration-300 ${
      isDarkMode ? 'bg-[#0F0F0F] text-zinc-100' : 'bg-[#F8FAFC] text-[#1E293B]'
    }`}>
      <div className="max-w-7xl mx-auto w-full space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-[#0F172A]'}`}>
              Calendario y Agenda de Notas
            </h1>
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span>Selecciona cualquier día para ver o gestionar su agenda</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {userTimezone}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setSelectedDateStr(todayStr);
                onCreateDailyNote(todayStr);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-extrabold text-white transition-all cursor-pointer hover:opacity-90 active:scale-95 border-none"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nota de Hoy</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Full Width Calendar */}
        <div className="w-full">
          
          {/* Main Calendar View */}
          <div className="space-y-6">
            
            {/* Control Bar */}
            <div className={`p-4 rounded-[28px] [corner-shape:squircle] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
              isDarkMode ? 'bg-[#181818]' : 'bg-white'
            }`}>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className={`text-xl font-bold capitalize ${isDarkMode ? 'text-zinc-100' : 'text-[#0F172A]'}`}>
                  {headerTitle}
                </h2>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrev}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-[#282828] text-zinc-300' : 'hover:bg-slate-100 text-zinc-700'
                    }`}
                    title="Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleToday}
                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer border-none ${
                      isDarkMode ? 'bg-[#242424] hover:bg-[#2F2F2F] text-zinc-200' : 'bg-slate-200 hover:bg-slate-300 text-zinc-800'
                    }`}
                  >
                    Hoy
                  </button>

                  <button
                    onClick={handleNext}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isDarkMode ? 'hover:bg-[#282828] text-zinc-300' : 'hover:bg-slate-100 text-zinc-700'
                    }`}
                    title="Siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className={`flex items-center gap-1 p-1 rounded-full self-start sm:self-auto ${
                isDarkMode ? 'bg-[#242424]' : 'bg-slate-200'
              }`}>
                <button
                  onClick={() => setCalendarMode('month')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border-none ${
                    calendarMode === 'month'
                      ? isDarkMode ? 'bg-[#383838] text-white' : 'bg-white text-zinc-900'
                      : isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setCalendarMode('week')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border-none ${
                    calendarMode === 'week'
                      ? isDarkMode ? 'bg-[#383838] text-white' : 'bg-white text-zinc-900'
                      : isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Semana
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-2 text-center">
              {DAY_NAMES.map(day => (
                <div key={day} className={`text-xs font-bold uppercase tracking-wider py-1 ${
                  isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2.5">
              {activeDays.map((dayObj, i) => {
                const hasNote = Boolean(dayObj.dailyNote);
                return (
                  <div
                    key={`${dayObj.dateStr}-${i}`}
                    onClick={() => {
                      setSelectedDateStr(dayObj.dateStr);
                      if (hasNote && dayObj.dailyNote) {
                        onOpenNote(dayObj.dailyNote.path);
                      } else {
                        onCreateDailyNote(dayObj.dateStr);
                      }
                    }}
                    className={`group ${
                      calendarMode === 'week' ? 'min-h-[160px] sm:min-h-[220px]' : 'min-h-[90px] sm:min-h-[110px]'
                    } p-3 sm:p-3.5 rounded-[22px] [corner-shape:squircle] flex flex-col justify-between transition-all duration-200 cursor-pointer select-none ${
                      !dayObj.isCurrentMonth && calendarMode === 'month'
                        ? isDarkMode ? 'opacity-30 bg-[#121212]' : 'opacity-40 bg-slate-50'
                        : isDarkMode ? 'bg-[#181818] hover:bg-[#222222]' : 'bg-white hover:bg-slate-50'
                    } ${
                      dayObj.isSelected
                        ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#0F0F0F]'
                        : dayObj.isToday ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#0F0F0F]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                        dayObj.isToday
                          ? 'bg-blue-600 text-white'
                          : dayObj.isSelected
                          ? 'bg-emerald-600 text-white'
                          : isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
                      }`}>
                        {dayObj.date.getDate()}
                      </span>

                      {hasNote && (
                        <span 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: primaryColor }}
                          title="Nota Diaria existente"
                        />
                      )}
                    </div>

                    <div className="mt-2">
                      {hasNote ? (
                        <div className={`p-1.5 rounded-xl text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5 truncate ${
                          isDarkMode ? 'bg-[#242424] text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate">Ver nota</span>
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          <span>Crear</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
