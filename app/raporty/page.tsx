'use client';

import React, { useState, useEffect } from 'react';
import { Car } from '../../utils/parser';
import ComparisonReport from '../../components/ComparisonReport';
import { Icon } from '../../components/Icons';
import Link from 'next/link';

interface SavedReport {
  id: string;
  title: string;
  date: string;
  carNames: string[];
  reportText: string;
}

export default function SavedReportsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [viewingSavedReport, setViewingSavedReport] = useState<SavedReport | null>(null);

  // Załadowanie aut i raportów z localStorage
  useEffect(() => {
    const saved = localStorage.getItem('autocompare_cars');
    if (saved) {
      try {
        setCars(JSON.parse(saved));
      } catch (e) {
        console.error('Błąd wczytywania aut:', e);
      }
    }

    const savedR = localStorage.getItem('autocompare_saved_reports');
    if (savedR) {
      try {
        setSavedReports(JSON.parse(savedR));
      } catch (e) {
        console.error('Błąd wczytywania raportów:', e);
      }
    }
  }, []);

  const handleDeleteSavedReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć ten zapisany raport?')) {
      const updated = savedReports.filter(r => r.id !== id);
      localStorage.setItem('autocompare_saved_reports', JSON.stringify(updated));
      setSavedReports(updated);
    }
  };

  const handleViewSavedReport = (report: SavedReport) => {
    setViewingSavedReport(report);
  };

  // Jeśli użytkownik otworzył oglądanie raportu
  if (viewingSavedReport) {
    const reportCars: Car[] = viewingSavedReport.carNames.map((name, idx) => {
      const existing = cars.find(c => `${c.brand} ${c.model}` === name);
      if (existing) return existing;
      const [brand, ...modelParts] = name.split(' ');
      return {
        id: `mock-c-${idx}`,
        brand,
        model: modelParts.join(' '),
        year: 0,
        price: 0,
        mileage: 0,
        fuel: '',
        engineSize: 0,
        power: 0,
        gearbox: '',
        location: '',
        link: '',
        seller: '',
        vin: '',
        description: '',
        equipment: [],
        notes: '',
        status: 'do_sprawdzenia',
        createdAt: ''
      };
    });

    return (
      <div className="animate-fade-in">
        <ComparisonReport
          report={viewingSavedReport.reportText}
          isLoading={false}
          selectedCars={reportCars}
          onClose={() => setViewingSavedReport(null)}
          isAlreadySaved={true}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="page-title">📂 Zapisane Raporty</h2>
          <p className="page-subtitle">Przeglądaj, czytaj i zarządzaj zapisanymi wcześniej analizami porównawczymi AI</p>
        </div>
      </div>

      {savedReports.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', background: '#ffffff' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            <Icon.FileText size={48} />
          </div>
          <h4>Brak zapisanych raportów</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '24px' }}>
            Wygeneruj porównanie na Panelu Głównym lub w zakładce Porównanie AI, a następnie kliknij przycisk "Zapisz w aplikacji".
          </p>
          <Link href="/porownanie" className="btn btn-primary">
            Przejdź do Porównania
          </Link>
        </div>
      ) : (
        <div className="glass-card animate-slide" style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {savedReports.map((report) => (
              <div 
                key={report.id} 
                className="saved-report-row" 
                onClick={() => handleViewSavedReport(report)}
              >
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--accent-primary)', display: 'inline-flex' }}><Icon.FileText size={18} /></span>
                    {report.title}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    📅 Wygenerowano: {report.date} • 🚗 Pojazdy: {report.carNames.join(', ')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-sm)' }}
                    onClick={() => handleViewSavedReport(report)}
                  >
                    Otwórz i Czytaj
                  </button>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}
                    onClick={(e) => handleDeleteSavedReport(report.id, e)}
                    title="Usuń raport"
                  >
                    <Icon.Delete size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
