"use client";

import React, { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

interface ThaiDatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function ThaiDatePicker({ value, onChange, placeholder = "เลือกวันที่", className = "" }: ThaiDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatThaiBuddhist = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = (date.getFullYear() + 543).toString();
    return `${d}/${m}/${y}`;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      >
        <span>{value ? formatThaiBuddhist(value) : <span className="text-slate-400">{placeholder}</span>}</span>
        <CalendarIcon className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2">
          <DayPicker
            mode="single"
            selected={value || undefined}
            onSelect={(d) => { onChange(d || null); setIsOpen(false); }}
            locale={th}
            formatters={{
              formatCaption: (date, options) => {
                const month = format(date, "LLLL", { locale: options?.locale });
                const year = date.getFullYear() + 543;
                return `${month} ${year}`;
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

interface ThaiTimePickerProps {
  value: Date | null | undefined;
  onChange: (time: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function ThaiTimePicker({ value, onChange, placeholder = "00:00", className = "" }: ThaiTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const generateTimeOptions = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        times.push(`${hh}:${mm}`);
      }
    }
    return times;
  };

  const handleSelectTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(parseInt(h, 10));
    newDate.setMinutes(parseInt(m, 10));
    newDate.setSeconds(0);
    onChange(newDate);
    setIsOpen(false);
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      >
        <span>{value ? `${formatTime(value)} น.` : <span className="text-slate-400">{placeholder}</span>}</span>
        <Clock className="w-4 h-4 text-slate-500 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg w-full max-h-48 overflow-y-auto">
          <div className="flex flex-col py-1">
            {generateTimeOptions().map((timeStr) => (
              <button
                key={timeStr}
                type="button"
                onClick={() => handleSelectTime(timeStr)}
                className="px-4 py-2 text-sm text-left hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              >
                {timeStr} น.
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
