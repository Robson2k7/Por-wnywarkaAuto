import React, { useEffect, useState } from 'react';

interface RadialScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function RadialScore({
  score,
  size = 60,
  strokeWidth = 6,
  label
}: RadialScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Prosta animacja nabierania wartości po zamontowaniu
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Dobór koloru na podstawie wyniku
  let strokeColor = '#f43f5e'; // Red
  if (score >= 75) {
    strokeColor = '#10b981'; // Green
  } else if (score >= 50) {
    strokeColor = '#f59e0b'; // Amber
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Tło koła */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Koło postępu */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out',
              filter: `drop-shadow(0 0 4px ${strokeColor}55)`
            }}
          />
        </svg>
        {/* Wynik tekstowy w środku */}
        <div style={{
          position: 'absolute',
          fontSize: size > 80 ? '20px' : '13px',
          fontWeight: 'bold',
          color: '#f9fafb',
          fontFamily: 'var(--font-mono)'
        }}>
          {score}%
        </div>
      </div>
      {label && <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>{label}</span>}
    </div>
  );
}
