'use client';

import React, { useState, useEffect } from 'react';
import { Car } from '../../utils/parser';
import { AISettings } from '../../utils/ai';
import ComparisonReport from '../../components/ComparisonReport';
import { Icon } from '../../components/Icons';
import Link from 'next/link';
import { useAIComparison } from '../../context/AIComparisonContext';

interface SavedReport {
  id: string;
  title: string;
  date: string;
  carNames: string[];
  reportText: string;
}

export default function ComparisonSetupPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Zapisane raporty oraz aktualnie oglądany zapisany raport
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [viewingSavedReport, setViewingSavedReport] = useState<SavedReport | null>(null);

  // Pobranie kontekstu porównania AI
  const { activeComparison, startComparison, setViewing } = useAIComparison();

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

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 10) {
        alert('Możesz porównać maksymalnie 10 ofert naraz.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleRunAIComparison = async () => {
    if (selectedIds.length < 2) return;
    const carsToCompare = cars.filter(c => selectedIds.includes(c.id));
    await startComparison(carsToCompare);
  };

  // Zapisywanie wygenerowanego raportu do bazy lokalnej
  const handleSaveReport = (reportText: string) => {
    const exists = savedReports.some(r => r.reportText === reportText);
    if (exists) {
      alert('Ten raport jest już zapisany w aplikacji.');
      return;
    }

    const selectedCars = cars.filter(c => selectedIds.includes(c.id));
    const carNames = selectedCars.map(c => `${c.brand} ${c.model}`);
    const title = `Porównanie: ${carNames.join(' vs ')}`;
    
    const newReport: SavedReport = {
      id: `report-${Date.now()}`,
      title,
      date: new Date().toLocaleString('pl-PL', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      carNames,
      reportText
    };
    
    const updated = [newReport, ...savedReports];
    localStorage.setItem('autocompare_saved_reports', JSON.stringify(updated));
    setSavedReports(updated);
  };

  // Usuwanie zapisanego raportu
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

  // Jeśli użytkownik ogląda zapisany w bazie raport
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

  // Jeśli użytkownik otworzył aktywny raport porównawczy
  if (activeComparison && activeComparison.isViewing) {
    const isAlreadySaved = savedReports.some(r => r.reportText === activeComparison.reportText);
    return (
      <div className="animate-fade-in">
        <ComparisonReport
          report={activeComparison.reportText}
          isLoading={activeComparison.isLoading}
          selectedCars={activeComparison.cars}
          onClose={() => setViewing(false)}
          onSaveReport={handleSaveReport}
          isAlreadySaved={isAlreadySaved}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Porównanie AI</h2>
          <p className="page-subtitle">Zaznacz od 2 do 10 ofert z bazy, aby przeprowadzić głęboką analizę porównawczą</p>
        </div>
      </div>

      {cars.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            <Icon.CompareArrows size={48} />
          </div>
          <h4>Twoja baza aut jest pusta</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '24px' }}>
            Dodaj najpierw kilka ofert, aby móc je porównać za pomocą sztucznej inteligencji.
          </p>
          <Link href="/dodaj" className="btn btn-primary">
            Dodaj Ofertę
          </Link>
        </div>
      ) : (
        <div>
          {/* Siatka aut z checkboxami */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {cars.map((car) => {
              const isSelected = selectedIds.includes(car.id);
              return (
                <div 
                  key={car.id} 
                  className={`glass-card summary-car-card animate-slide ${isSelected ? 'selected' : ''}`}
                  style={{ 
                    cursor: 'pointer',
                    padding: '24px',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--surface-border)',
                    boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.08)' : 'none'
                  }}
                  onClick={() => handleToggleSelect(car.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <span className="car-badge">{car.year}r.</span>
                    <label className="checkbox-container" style={{ paddingLeft: 0, margin: 0 }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(car.id)}
                      />
                      <span className="checkmark" style={{ position: 'static', display: 'block' }}></span>
                    </label>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {car.brand} {car.model}
                  </h3>
                  
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
                    {car.price.toLocaleString('pl-PL')} zł
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <div>🚗 {car.mileage.toLocaleString('pl-PL')} km</div>
                    <div>⛽ {car.fuel} ({car.power} KM)</div>
                    <div>⚙️ {car.gearbox}</div>
                    {car.location && <div>📍 {car.location}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dolny przycisk wywołujący porównanie */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
            <button 
              className="btn btn-primary" 
              style={{ padding: '16px 40px', borderRadius: '30px', fontSize: '15px' }}
              disabled={selectedIds.length < 2}
              onClick={handleRunAIComparison}
            >
              <Icon.AutoAwesome size={18} />
              Porównaj {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} Auta z AI
            </button>
          </div>

          {/* Sekcja Zapisanych Raportów w zakładce Porównanie */}
          {savedReports.length > 0 && (
            <div className="glass-card no-print animate-slide" style={{ padding: '24px', background: '#ffffff' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--color-success)', display: 'inline-flex' }}><Icon.CheckCircle size={20} /></span>
                📂 Zapisane Raporty Porównawcze
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedReports.map((report) => (
                  <div 
                    key={report.id} 
                    className="saved-report-row" 
                    onClick={() => handleViewSavedReport(report)}
                  >
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{report.title}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Wygenerowano: {report.date} • Pojazdy: {report.carNames.join(', ')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 14px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                        onClick={() => handleViewSavedReport(report)}
                      >
                        Otwórz
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}
                        onClick={(e) => handleDeleteSavedReport(report.id, e)}
                      >
                        <Icon.Delete size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
