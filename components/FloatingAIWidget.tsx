'use client';

import React from 'react';
import { useAIComparison } from '../context/AIComparisonContext';
import { Icon } from './Icons';

export default function FloatingAIWidget() {
  const { activeComparison, setViewing, closeComparison } = useAIComparison();

  if (!activeComparison) return null;
  
  // Ukryj widget, jeśli użytkownik aktualnie ogląda ten raport na ekranie głównym
  if (activeComparison.isViewing) return null;

  return (
    <div className="floating-ai-widget no-print">
      <div className="widget-content">
        <div className="widget-status">
          <span className={`status-dot ${activeComparison.isLoading ? 'loading-pulse' : 'success-active'}`}></span>
          <span className="widget-text">
            {activeComparison.isLoading 
              ? `Porównywanie ${activeComparison.cars.length} aut w tle...` 
              : 'Raport AI jest gotowy!'
            }
          </span>
        </div>
        <div className="widget-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setViewing(true)}
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
          >
            {activeComparison.isLoading ? 'Podgląd' : 'Otwórz'}
          </button>
          <button 
            className="close-btn" 
            onClick={closeComparison}
            title="Zamknij"
            style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Icon.Close size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
