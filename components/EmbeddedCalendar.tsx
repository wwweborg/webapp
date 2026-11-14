"use client";
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, Plus } from 'lucide-react';

interface EmbeddedCalendarProps {
  initialDateStr?: string;
  isDarkMode?: boolean;
  primaryColor?: string;
  onSelectDate?: (dateStr: string) => void;
}

export function EmbeddedCalendar({
  initialDateStr,
  isDarkMode = false,
  primaryColor = '#006FFF',
  onSelectDate
}: EmbeddedCalendarProps) {
  // Parse initial date or default to today
  const parsedDate = useMemo(() => {
    if (initialDateStr && /^\d{4}-\d{2}-\d{2}$/.test(initialDateStr.trim())) {
      const [y, m, d] = initialDateStr.trim().split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [initialDateStr]);

  const [currentDate, setCurrentDate] = useState<Date>(parsedDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const formatDateStr = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const monthDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      date: Date;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Prev month padding
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevLastDay - i);
      const str = formatDateStr(d);
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: false,
        isToday: isSameDay(d, new Date()),
        isSelected: initialDateStr === str
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const str = formatDateStr(d);
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: true,
        isToday: isSameDay(d, new Date()),
        isSelected: initialDateStr === str
      });
    }

    // Next month padding
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const str = formatDateStr(d);
      days.push({
        date: d,
        dateStr: str,
        isCurrentMonth: false,
        isToday: isSameDay(d, new Date()),
        isSelected: initialDateStr === str
      });
    }

    return days;
  }, [year, month, initialDateStr]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentDate(new Date());
  };

  return (
    <div 
      contentEditable={false} 
      className={`my-4 p-4 rounded-2xl border transition-all select-none max-w-sm ${
        isDarkMode 
          ? 'bg-[#181818] border-zinc-800 text-zinc-100' 
          : 'bg-white border-slate-200 text-zinc-900 shadow-sm'
      }`}
    >
      {/* Mini Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
          <span className="font-bold text-sm capitalize">
            {monthNames[month]} {year}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="px-2 py-0.5 text-[11px] font-bold rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {dayNames.map((d, idx) => (
          <span key={idx} className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {monthDays.map((day, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onSelectDate) {
                onSelectDate(day.dateStr);
              } else {
                // Dispatch custom event for app navigation if handler not bound
                window.dispatchEvent(new CustomEvent('open-daily-note', { detail: { dateStr: day.dateStr } }));
              }
            }}
            className={`w-8 h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
              !day.isCurrentMonth
                ? isDarkMode ? 'text-zinc-700' : 'text-zinc-300'
                : day.isToday
                  ? 'bg-blue-600 text-white font-bold'
                  : day.isSelected
                    ? 'text-white font-bold'
                    : isDarkMode ? 'hover:bg-[#242424] text-zinc-300' : 'hover:bg-slate-100 text-zinc-800'
            }`}
            style={{
              backgroundColor: day.isSelected && !day.isToday ? primaryColor : undefined
            }}
            title={`Abrir nota diaria ${day.dateStr}`}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}
