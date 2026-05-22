"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookedRange {
  startDate: string;
  endDate: string;
}

interface Props {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  bookedRanges: BookedRange[];
  selectedStart?: string;
  selectedEnd?: string;
}

function toYMD(date: Date) {
  return date.toISOString().split("T")[0];
}

function isBooked(dateStr: string, ranges: BookedRange[]) {
  return ranges.some((r) => dateStr >= r.startDate && dateStr <= r.endDate);
}

function isInRange(dateStr: string, start: string, end: string) {
  return start && end && dateStr > start && dateStr < end;
}

export default function GuideCalendar({
  value,
  onChange,
  minDate,
  bookedRanges,
  selectedStart,
  selectedEnd,
}: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(
    value ? new Date(value).getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    value ? new Date(value).getMonth() : today.getMonth()
  );

  const { days, firstDow } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const days: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      days.push(toYMD(date));
    }
    return { days, firstDow };
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((dateStr) => {
          const booked = isBooked(dateStr, bookedRanges);
          const past = minDate ? dateStr < minDate : false;
          const disabled = booked || past;
          const selected = dateStr === value;
          const rangeHighlight =
            selectedStart && selectedEnd
              ? isInRange(dateStr, selectedStart, selectedEnd)
              : selectedStart && !selectedEnd
              ? false
              : false;
          const isRangeStart = dateStr === selectedStart;
          const isRangeEnd = dateStr === selectedEnd;

          let cellClass =
            "relative text-center text-sm py-1.5 rounded-md transition-colors ";

          if (booked) {
            cellClass += "bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 cursor-not-allowed line-through";
          } else if (past) {
            cellClass += "text-slate-300 dark:text-slate-600 cursor-not-allowed";
          } else if (selected || isRangeStart || isRangeEnd) {
            cellClass += "bg-emerald-600 text-white font-semibold cursor-pointer";
          } else if (rangeHighlight) {
            cellClass += "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 cursor-pointer";
          } else {
            cellClass += "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer";
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onChange(dateStr)}
              className={cellClass}
            >
              {new Date(dateStr + "T12:00:00").getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-200 dark:bg-red-900" />
          Unavailable
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-600" />
          Selected
        </span>
      </div>
    </div>
  );
}
