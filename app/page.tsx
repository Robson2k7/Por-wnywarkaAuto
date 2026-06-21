'use client';

import React, { useState, useEffect } from 'react';
import { Car } from '../utils/parser';
import { AISettings } from '../utils/ai';
import RadialScore from '../components/RadialScore';
import ComparisonReport from '../components/ComparisonReport';
import { Icon } from '../components/Icons';
import { useAIComparison } from '../context/AIComparisonContext';
import CarDetailDrawer from '../components/CarDetailDrawer';

// Interfejs zapisanego raportu
interface SavedReport {
  id: string;
  title: string;
  date: string;
  carNames: string[];
  reportText: string;
}

// Domyślne dane testowe oparte na linkach użytkownika
const DEFAULT_CARS: Car[] = [
  {
    id: 'test-1',
    brand: 'Peugeot',
    model: '2008',
    year: 2019,
    price: 68900,
    mileage: 64500,
    fuel: 'Benzyna',
    engineSize: 1199,
    power: 130,
    gearbox: 'Automatyczna',
    location: 'Warszawa',
    link: 'https://www.otomoto.pl/osobowe/oferta/peugeot-2008-ID6I5Z5A.html',
    seller: 'Firma',
    vin: 'VF3URYHNSKY123456',
    description: 'Zadbane auto z salonu, I właściciel, bezwypadkowy, bogate wyposażenie, asystent pasa, reflektory LED, klimatyzacja automatyczna.',
    equipment: ['Klimatyzacja', 'Reflektory LED', 'Asystent pasa ruchu', 'Czujniki parkowania', 'Bluetooth'],
    notes: 'Wygląda bardzo ładnie, automatyczna skrzynia na plus do miasta. Trzeba sprawdzić stan rozrządu w kąpieli olejowej (silnik PureTech).',
    status: 'do_sprawdzenia',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: 'test-2',
    brand: 'Skoda',
    model: 'Fabia',
    year: 2020,
    price: 48500,
    mileage: 92000,
    fuel: 'Benzyna',
    engineSize: 999,
    power: 95,
    gearbox: 'Manualna',
    location: 'Poznań',
    link: 'https://www.otomoto.pl/osobowe/oferta/skoda-fabia-ID6I5V8R.html',
    seller: 'Firma',
    vin: '', // BRAK VINU
    description: 'Bezwypadkowy, krajowy, serwisowany w ASO do samego końca. Bardzo oszczędny i tani w utrzymaniu.',
    equipment: ['Klimatyzacja', 'Bluetooth', 'System Start-Stop', 'Czujniki parkowania'],
    notes: 'Brak VIN w ogłoszeniu – muszę o niego poprosić sprzedawcę! Auto bardzo rozsądne cenowo.',
    status: 'do_sprawdzenia',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'test-3',
    brand: 'Opel',
    model: 'Astra',
    year: 2018,
    price: 51900,
    mileage: 124000,
    fuel: 'Diesel',
    engineSize: 1598,
    power: 136,
    gearbox: 'Manualna',
    location: 'Kraków',
    link: 'https://www.otomoto.pl/osobowe/oferta/opel-astra-ID6I5EwF.html',
    seller: 'Prywatny',
    vin: 'W0LPD8EL1JG345678',
    description: 'Opel Astra K, wersja Elite. Tapicerka półskórzana, nawigacja GPS, reflektory LED. Wymieniony rozrząd na 110 tys. km (faktura).',
    equipment: ['Klimatyzacja', 'Nawigacja GPS', 'Reflektory LED', 'Skórzana tapicerka', 'Tempomat', 'Podgrzewane fotele'],
    notes: 'Sprzedawca prywatny. Rozrząd już wymieniony (to częsty problem w silnikach 1.6 CDTI), co jest sporym atutem.',
    status: 'interesujace',
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
  },
  {
    id: 'test-4',
    brand: 'Renault',
    model: 'Clio',
    year: 2021,
    price: 54900,
    mileage: 34200,
    fuel: 'Hybryda',
    engineSize: 1598,
    power: 140,
    gearbox: 'Automatyczna',
    location: 'Wrocław',
    link: 'https://www.otomoto.pl/osobowe/oferta/renault-clio-ID6I5soP.html',
    seller: 'Firma',
    vin: 'VF1RJA00862456789',
    description: 'Renault Clio E-Tech Hybrid. Bardzo oszczędny napęd, niskie spalanie w cyklu miejskim. Pierwszy właściciel, salon Polska.',
    equipment: ['Klimatyzacja', 'Bluetooth', 'Kamery 360/Cofania', 'Apple CarPlay / Android Auto', 'Alufelgi'],
    notes: 'Bardzo niski przebieg i nowszy rocznik. Hybryda Renault cieszy się dobrymi opiniami.',
    status: 'interesujace',
    createdAt: new Date().toISOString()
  }
];

export default function DashboardPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'mileage_asc' | 'year_desc'>('year_desc');
  
  // Zapisane raporty oraz aktualnie oglądany zapisany raport
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [viewingSavedReport, setViewingSavedReport] = useState<SavedReport | null>(null);

  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Pobranie kontekstu porównania AI
  const { activeComparison, startComparison, setViewing } = useAIComparison();

  // Załadowanie aut z localStorage lub załadowanie danych domyślnych
  useEffect(() => {
    const saved = localStorage.getItem('autocompare_cars');
    if (saved) {
      try {
        setCars(JSON.parse(saved));
      } catch (e) {
        console.error('Błąd wczytywania aut:', e);
        setCars(DEFAULT_CARS);
      }
    } else {
      localStorage.setItem('autocompare_cars', JSON.stringify(DEFAULT_CARS));
      setCars(DEFAULT_CARS);
    }

    // Załadowanie zapisanych raportów
    const savedR = localStorage.getItem('autocompare_saved_reports');
    if (savedR) {
      try {
        setSavedReports(JSON.parse(savedR));
      } catch (e) {
        console.error('Błąd wczytywania raportów:', e);
      }
    }
  }, []);

  // Funkcja zapisująca zmiany aut
  const saveCars = (updatedCars: Car[]) => {
    localStorage.setItem('autocompare_cars', JSON.stringify(updatedCars));
    setCars(updatedCars);
  };

  // Funkcja zapisująca zaktualizowane auto z szuflady
  const handleSaveEditedCar = (updatedCar: Car) => {
    const updated = cars.map(c => c.id === updatedCar.id ? updatedCar : c);
    saveCars(updated);
    setEditingCar(null);
  };

  // Eksport bazy ofert i raportów do pliku JSON
  const handleExportDatabase = () => {
    const database = {
      cars,
      savedReports
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(database, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `autocompare_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import bazy z pliku JSON
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported.cars && Array.isArray(imported.cars)) {
          if (confirm('Czy chcesz zastąpić aktualną bazę danymi z pliku kopii zapasowej?')) {
            saveCars(imported.cars);
            if (imported.savedReports && Array.isArray(imported.savedReports)) {
              setSavedReports(imported.savedReports);
              localStorage.setItem('autocompare_saved_reports', JSON.stringify(imported.savedReports));
            }
            alert('Dane zostały pomyślnie zaimportowane!');
          }
        } else {
          alert('Błędny format pliku kopii zapasowej.');
        }
      } catch (err) {
        alert('Wystąpił błąd podczas odczytu pliku.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Zapisywanie wygenerowanego raportu do bazy lokalnej
  const handleSaveReport = (reportText: string) => {
    // Sprawdzamy, czy ten raport jest już zapisany w bazy (porównujemy treść)
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

  // Otwieranie zapisanego raportu
  const handleViewSavedReport = (report: SavedReport) => {
    setViewingSavedReport(report);
  };

  // Zmiana statusu pojedynczego auta
  const handleStatusChange = (id: string, newStatus: Car['status']) => {
    const updated = cars.map(car => car.id === id ? { ...car, status: newStatus } : car);
    saveCars(updated);
  };

  // Usunięcie auta z bazy
  const handleDeleteCar = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tę ofertę?')) {
      const updated = cars.filter(car => car.id !== id);
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      saveCars(updated);
    }
  };

  // Obsługa wyboru do porównania
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

  // Wygenerowanie zestawienia przez AI za pomocą globalnego kontekstu
  const handleRunAIComparison = async () => {
    if (selectedIds.length < 2) return;
    const carsToCompare = cars.filter(c => selectedIds.includes(c.id));
    await startComparison(carsToCompare);
  };

  // Obliczenia statystyk rynkowych
  const totalOffers = cars.length;
  const avgPrice = totalOffers > 0 ? Math.round(cars.reduce((sum, c) => sum + c.price, 0) / totalOffers) : 0;
  const avgMileage = totalOffers > 0 ? Math.round(cars.reduce((sum, c) => sum + c.mileage, 0) / totalOffers) : 0;
  const bestValueCar = totalOffers > 0 ? [...cars].sort((a, b) => a.mileage - b.mileage)[0] : null;

  // Pobranie unikalnych marek do filtra
  const uniqueBrands = Array.from(new Set(cars.map(c => c.brand)));

  // Filtrowanie i sortowanie danych
  const filteredCars = cars
    .filter(car => {
      const query = search.toLowerCase();
      const matchesSearch = 
        car.brand.toLowerCase().includes(query) || 
        car.model.toLowerCase().includes(query) ||
        (car.location && car.location.toLowerCase().includes(query)) ||
        (car.vin && car.vin.toLowerCase().includes(query));
      
      const matchesStatus = statusFilter === 'all' || car.status === statusFilter;
      const matchesBrand = brandFilter === 'all' || car.brand === brandFilter;

      return matchesSearch && matchesStatus && matchesBrand;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'mileage_asc') return a.mileage - b.mileage;
      if (sortBy === 'year_desc') return b.year - a.year;
      return 0;
    });

  // Pomocnicza heurystyka wyceny dealu (0-100) na potrzeby wskaźników SVG
  const calculateDealScore = (car: Car): number => {
    const age = new Date().getFullYear() - car.year;
    const mileagePerYear = age > 0 ? car.mileage / age : car.mileage;
    
    let score = 75; // Wynik bazowy
    
    if (mileagePerYear > 25000) score -= 15;
    if (car.mileage > 150000) score -= 15;
    if (car.mileage < 50000) score += 10;
    if (!car.vin) score -= 20;

    if (avgPrice > 0) {
      const priceDiffRatio = (car.price - avgPrice) / avgPrice;
      if (priceDiffRatio < -0.15) {
        score += 15;
      } else if (priceDiffRatio > 0.25) {
        score -= 10;
      }
    }

    return Math.max(10, Math.min(99, score));
  };

  // Jeśli użytkownik otworzył oglądanie zapisanego w bazy raportu
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
    <div className="animate-fade-in">
      {/* Baner z realistycznym tłem u góry strony */}
      <div className="hero-banner no-print">
        <div className="hero-text-container" style={{ maxWidth: '60%' }}>
          <h2 className="hero-title">AutoCompare AI</h2>
          <p className="hero-subtitle-text">
            Twój osobisty asystent analizy i porównywania ofert samochodów używanych. Wklejaj linki, analizuj opisy ze schowka i oceniaj ryzyko z pomocą sztucznej inteligencji.
          </p>
        </div>
      </div>

      {/* Grid ze statystykami */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-label">Monitorowane Oferty</div>
          <div className="stat-value">{totalOffers}</div>
          <div className="stat-desc">samochodów w Twojej bazie</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-label">Średnia Cena Rynkowa</div>
          <div className="stat-value">{avgPrice.toLocaleString('pl-PL')} zł</div>
          <div className="stat-desc">w odniesieniu do Twoich ofert</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-label">Średni Przebieg</div>
          <div className="stat-value">{avgMileage.toLocaleString('pl-PL')} km</div>
          <div className="stat-desc">średnie zużycie aut w bazie</div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-label">Najniższy Przebieg</div>
          <div className="stat-value">
            {bestValueCar ? `${bestValueCar.mileage.toLocaleString('pl-PL')} km` : '0 km'}
          </div>
          <div className="stat-desc">
            {bestValueCar ? `${bestValueCar.brand} ${bestValueCar.model} (${bestValueCar.year}r.)` : 'Brak danych'}
          </div>
        </div>
      </div>

      {/* Pasek filtrowania i wyszukiwania */}
      <div className="filter-bar no-print">
        <div className="search-input-wrapper">
          <Icon.Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Szukaj po marce, modelu, VIN lub lokalizacji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
        >
          <option value="all">Wszystkie Marki</option>
          {uniqueBrands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Wszystkie Statusy</option>
          <option value="do_sprawdzenia">Do sprawdzenia</option>
          <option value="interesujace">Interesujące</option>
          <option value="odrzucone">Odrzucone</option>
          <option value="obejrzane">Obejrzane</option>
        </select>

        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="year_desc">Rocznik: od najnowszego</option>
          <option value="price_asc">Cena: od najniższej</option>
          <option value="price_desc">Cena: od najwyższej</option>
          <option value="mileage_asc">Przebieg: od najmniejszego</option>
        </select>

        <div className="backup-buttons-container">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportDatabase}
            accept=".json"
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-secondary"
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
            onClick={() => fileInputRef.current?.click()}
            title="Importuj kopię zapasową JSON"
          >
            <Icon.Upload size={16} />
            Importuj
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
            onClick={handleExportDatabase}
            title="Eksportuj kopię zapasową JSON"
          >
            <Icon.Download size={16} />
            Eksportuj
          </button>
        </div>
      </div>

      {/* Tabela ofert */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filteredCars.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              <Icon.Car size={48} />
            </div>
            <h4>Brak pojazdów spełniających kryteria</h4>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>Dodaj nową ofertę lub zmień ustawienia filtrów wyszukiwania.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }} className="no-print">Wybierz</th>
                  <th>Pojazd</th>
                  <th>Rocznik</th>
                  <th>Cena</th>
                  <th>Przebieg</th>
                  <th>Silnik & Skrzynia</th>
                  <th>AI Score</th>
                  <th>Status</th>
                  <th className="no-print">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map((car) => {
                  const isSelected = selectedIds.includes(car.id);
                  const dealScore = calculateDealScore(car);
                  return (
                    <tr key={car.id} className={isSelected ? 'selected' : ''}>
                      <td className="no-print">
                        <label className="checkbox-container" style={{ marginBottom: 0 }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(car.id)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </td>
                      <td>
                        <div className="car-name-cell">
                          <div className="car-logo-circle">
                            {car.brand.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                              {car.brand} {car.model}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              VIN: {car.vin || 'BRAK VIN'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{car.year}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {car.price.toLocaleString('pl-PL')} zł
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {car.mileage.toLocaleString('pl-PL')} km
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          ⛽ {car.fuel} {car.engineSize > 0 ? `(${car.engineSize} cm³)` : ''}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          ⚙️ {car.gearbox} ({car.power} KM)
                        </div>
                      </td>
                      <td>
                        <RadialScore score={dealScore} size={42} strokeWidth={4} />
                      </td>
                      <td>
                        <select
                          className={`badge badge-${car.status}`}
                          style={{ border: '1px solid transparent', outline: 'none', cursor: 'pointer' }}
                          value={car.status}
                          onChange={(e) => handleStatusChange(car.id, e.target.value as any)}
                        >
                          <option value="do_sprawdzenia">Do sprawdzenia</option>
                          <option value="interesujace">Interesujące</option>
                          <option value="odrzucone">Odrzucone</option>
                          <option value="obejrzane">Obejrzane</option>
                        </select>
                      </td>
                      <td className="no-print">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => setEditingCar(car)}
                            title="Edytuj i podejrzyj ofertę"
                          >
                            <Icon.Edit size={16} />
                          </button>
                          {car.link && (
                            <a
                              href={car.link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}
                              title="Otwórz oryginalne ogłoszenie"
                            >
                              <Icon.OpenInNew size={16} />
                            </a>
                          )}
                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}
                            onClick={() => handleDeleteCar(car.id)}
                            title="Usuń ofertę"
                          >
                            <Icon.Delete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sekcja Zapisanych Raportów */}
      {savedReports.length > 0 && (
        <div className="glass-card no-print animate-slide" style={{ marginTop: '32px', padding: '24px', background: '#ffffff' }}>
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

      {/* Floating Dock do wywoływania porównania AI */}
      {selectedIds.length >= 2 && (
        <div className="comparison-dock">
          <div className="dock-text">
            Wybrano <span className="glow-text-dock">{selectedIds.length}</span> {selectedIds.length === 2 ? 'oferty' : selectedIds.length < 5 ? 'oferty' : 'ofert'} do porównania
          </div>
          <button className="btn btn-primary" onClick={handleRunAIComparison}>
            <Icon.AutoAwesome size={18} />
            Porównaj Zaznaczone z AI
          </button>
        </div>
      )}

      {/* Szuflada podglądu/edycji oferty */}
      <CarDetailDrawer
        car={editingCar}
        onClose={() => setEditingCar(null)}
        onSave={handleSaveEditedCar}
      />
    </div>
  );
}
