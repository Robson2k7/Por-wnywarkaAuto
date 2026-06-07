'use client';

import React, { createContext, useContext, useState } from 'react';
import { Car } from '../utils/parser';
import { AISettings, fetchAIComparison } from '../utils/ai';

export interface ActiveComparison {
  carIds: string[];
  cars: Car[];
  reportText: string;
  isLoading: boolean;
  isViewing: boolean;
}

interface AIComparisonContextType {
  activeComparison: ActiveComparison | null;
  startComparison: (selectedCars: Car[]) => Promise<void>;
  closeComparison: () => void;
  setViewing: (viewing: boolean) => void;
}

const AIComparisonContext = createContext<AIComparisonContextType | undefined>(undefined);

export function AIComparisonProvider({ children }: { children: React.ReactNode }) {
  const [activeComparison, setActiveComparison] = useState<ActiveComparison | null>(null);

  const startComparison = async (selectedCars: Car[]) => {
    const carIds = selectedCars.map(c => c.id);
    
    // Ustawienie początkowego stanu ładowania raportu
    setActiveComparison({
      carIds,
      cars: selectedCars,
      reportText: '',
      isLoading: true,
      isViewing: true
    });

    try {
      // Wczytanie ustawień AI z localStorage
      let aiSettings: AISettings = { provider: 'none', apiKey: '' };
      const savedSettings = localStorage.getItem('autocompare_ai_settings');
      if (savedSettings) {
        try {
          aiSettings = JSON.parse(savedSettings);
        } catch (e) {
          console.error('Błąd czytania ustawień AI:', e);
        }
      }

      // Wywołanie zewnętrznego API do generowania porównania
      const report = await fetchAIComparison(selectedCars, aiSettings);
      
      // Aktualizacja stanu po załadowaniu raportu
      setActiveComparison(prev => {
        if (!prev) return null;
        return {
          ...prev,
          reportText: report,
          isLoading: false
        };
      });
    } catch (e) {
      console.error('Błąd generowania raportu AI:', e);
      setActiveComparison(prev => {
        if (!prev) return null;
        return {
          ...prev,
          reportText: '### 🛑 Wystąpił błąd\n\nNie udało się wygenerować raportu przez sztuczną inteligencję. Upewnij się, że masz połączenie z internetem oraz że wprowadzony klucz API jest prawidłowy.',
          isLoading: false
        };
      });
    }
  };

  const closeComparison = () => {
    setActiveComparison(null);
  };

  const setViewing = (viewing: boolean) => {
    setActiveComparison(prev => {
      if (!prev) return null;
      return {
        ...prev,
        isViewing: viewing
      };
    });
  };

  return (
    <AIComparisonContext.Provider value={{ activeComparison, startComparison, closeComparison, setViewing }}>
      {children}
    </AIComparisonContext.Provider>
  );
}

export function useAIComparison() {
  const context = useContext(AIComparisonContext);
  if (context === undefined) {
    throw new Error('useAIComparison must be used within an AIComparisonProvider');
  }
  return context;
}
