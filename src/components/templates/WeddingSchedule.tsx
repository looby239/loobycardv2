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
    <section
      style={{
        padding: '4rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2
          className="section-title"
          style={{
            fontFamily: 'var(--font-serif, serif)',
            fontSize: '2rem',
            color: 'var(--color-primary, #e11d48)',
            marginBottom: '0.75rem',
          }}
        >
          Lịch Trình Lễ Cưới
        </h2>
        <div
          style={{
            width: '4rem',
            height: '2px',
            background: 'var(--color-gold, #d4af37)',
            margin: '0 auto 0.75rem',
            borderRadius: '999px',
          }}
        />
        <p
          style={{
            fontSize: '0.7rem',
            opacity: 0.7,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--color-text, #475569)',
          }}
        >
          Các mốc thời gian đáng nhớ trong ngày vui của chúng mình
        </p>
      </div>

      {/* Timeline wrapper — centred, with enough left offset so circles don't clip */}
      <div
        style={{
          position: 'relative',
          maxWidth: '28rem',
          margin: '0 auto',
          /* left offset: half-circle (16px) + gap (8px) = 24px */
          paddingLeft: '2.5rem',
          paddingRight: '1rem',
          textAlign: 'left',
        }}
      >
        {/* Vertical dashed line — positioned inside padding so it never overflows */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: '1.25rem',          /* half of circle width = 16px, sits at centre of circles */
            width: '1px',
            borderLeft: '2px dashed var(--color-gold, #d4af37)',
            opacity: 0.5,
          }}
        />

        {schedule.map((item, index) => (
          <div
            key={index}
            style={{ position: 'relative', marginBottom: '2rem' }}
          >
            {/* Circle Node — centred on the line at left: 1.25rem */}
            <div
              style={{
                position: 'absolute',
                left: '-1.25rem',          /* = -(paddingLeft/2), centres on the line */
                top: '0.375rem',
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: 'var(--bg-primary, #ffffff)',
                border: '1.5px solid var(--color-gold, #d4af37)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--color-primary, #e11d48)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                transform: 'translateX(-50%)',
                zIndex: 1,
              }}
            >
              {index + 1}
            </div>

            {/* Content card */}
            <div
              style={{
                background: 'var(--bg-secondary, rgba(255,255,255,0.85))',
                padding: '1rem 1.25rem',
                borderRadius: '1rem',
                border: '1px solid var(--color-border, rgba(0,0,0,0.07))',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--color-primary, #e11d48)',
                  background: 'var(--bg-accent, rgba(225,29,72,0.07))',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '999px',
                  fontFamily: 'monospace',
                  marginBottom: '0.4rem',
                }}
              >
                {item.time}
              </span>
              <h4
                style={{
                  fontFamily: 'var(--font-serif, serif)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--color-text, #1e293b)',
                  margin: '0.25rem 0',
                }}
              >
                {item.title}
              </h4>
              {item.description && (
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-text, #475569)',
                    lineHeight: 1.55,
                    opacity: 0.85,
                    margin: 0,
                  }}
                >
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
