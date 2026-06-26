'use client';

import React from 'react';

interface ScheduleItem {
  time: string;
  title: string;
  description?: string;
}

interface WeddingScheduleProps {
  schedule?: ScheduleItem[] | null;
  hasSchedule?: boolean;
}

export default function WeddingSchedule({ schedule, hasSchedule = false }: WeddingScheduleProps) {
  if (!hasSchedule || !schedule || schedule.length === 0) return null;

  return (
    <section className="wedding-schedule py-16 px-6 max-w-3xl mx-auto text-center">
      <div className="mb-12">
        <h2 className="section-title text-3xl font-serif font-bold mb-3 tracking-wide text-[var(--color-primary,#e11d48)]">
          Lịch Trình Lễ Cưới
        </h2>
        <div className="w-16 h-1 bg-[var(--color-gold,#d4af37)] mx-auto rounded-full mb-3"></div>
        <p className="text-xs opacity-75 uppercase tracking-widest text-[var(--color-text,#475569)]">
          Các mốc thời gian đáng nhớ trong ngày vui của chúng mình
        </p>
      </div>

      <div className="relative border-l border-dashed border-[var(--color-gold,#d4af37)]/50 mx-auto pl-8 pr-4 space-y-8 text-left max-w-md">
        {schedule.map((item, index) => (
          <div key={index} className="relative group transition-all duration-300">
            {/* Circle Node */}
            <div className="absolute -left-[45px] top-1.5 bg-[var(--bg-primary,#ffffff)] text-[var(--color-gold,var(--color-primary,#e11d48))] w-8 h-8 rounded-full border border-[var(--color-gold,#d4af37)]/70 flex items-center justify-center text-xs font-bold shadow-sm group-hover:scale-110 transition-transform">
              {index + 1}
            </div>

            {/* Content card */}
            <div className="space-y-2 bg-[var(--bg-secondary,rgba(255,255,255,0.75))] backdrop-blur-md p-5 rounded-2xl border border-[var(--color-border,rgba(0,0,0,0.06))] shadow-sm group-hover:shadow-md transition-all duration-300">
              <span className="inline-block text-xs font-bold text-[var(--color-primary,var(--color-gold,#e11d48))] bg-[var(--bg-accent,rgba(225,29,72,0.06))] px-3 py-1 rounded-full font-mono">
                {item.time}
              </span>
              <h4 className="text-base font-bold text-[var(--color-light-gold,#1e293b)] font-serif tracking-wide">
                {item.title}
              </h4>
              {item.description && (
                <p className="text-xs text-[var(--color-text,#475569)] leading-relaxed font-sans opacity-90">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
