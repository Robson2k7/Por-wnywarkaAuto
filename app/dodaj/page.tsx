'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, parseCarUrl, parseCarText } from '../../utils/parser';
import { Icon } from '../../components/Icons';

export default function AddCarPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'manual'>('url');
  
  // URL Tab State
  const [urlInput, setUrlInput] = useState('');
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);

  // Text Paste Tab State
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const [parsedFeedback, setParsedFeedback] = useState<string[]>([]);

  // Manual Form / Final Review State
  const [formData, setFormData] = useState<Omit<Car, 'id' | 'createdAt'>>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: 0,
    fuel: 'Benzyna',
    engineSize: 1598,
    power: 110,
    gearbox: 'Manualna',
    location: '',
    link: '',
    seller: 'Prywatny',
    vin: '',
    description: '',
    equipment: [],
    notes: '',
    status: 'do_sprawdzenia'
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});

  // Obsługa analizy adresu URL
  const handleAnalyzeUrl = () => {
    if (!urlInput.trim()) return;
    setIsAnalyzingUrl(true);

    // Symulacja skanowania
    setTimeout(() => {
      const { brand, model } = parseCarUrl(urlInput);
      setFormData(prev => ({
        ...prev,
        brand: brand || prev.brand,
        model: model || prev.model,
        link: urlInput
      }));
      setIsAnalyzingUrl(false);
      setActiveTab('manual'); // Przełącz na formularz w celu uzupełnienia
      alert(`Odczytano markę: ${brand || 'Brak'}, model: ${model || 'Brak'}. Uzupelnij resztę danych ręcznie.`);
    }, 1500);
  };

  // Obsługa analizy wklejonego tekstu
  const handleAnalyzeText = () => {
    if (!pastedText.trim()) return;
    setIsAnalyzingText(true);
    setParsedFeedback([]);

    setTimeout(() => {
      const parsedData = parseCarText(pastedText);
      const feedback: string[] = [];

      if (parsedData.brand) feedback.push(`Marka: ${parsedData.brand}`);
      if (parsedData.price) feedback.push(`Cena: ${parsedData.price.toLocaleString('pl-PL')} zł`);
      if (parsedData.year) feedback.push(`Rocznik: ${parsedData.year}`);
      if (parsedData.mileage) feedback.push(`Przebieg: ${parsedData.mileage.toLocaleString('pl-PL')} km`);
      if (parsedData.fuel) feedback.push(`Paliwo: ${parsedData.fuel}`);
      if (parsedData.engineSize) feedback.push(`Pojemność silnika: ${parsedData.engineSize} cm³`);
      if (parsedData.power) feedback.push(`Moc: ${parsedData.power} KM`);
      if (parsedData.gearbox) feedback.push(`Skrzynia: ${parsedData.gearbox}`);
      if (parsedData.vin) feedback.push(`VIN: ${parsedData.vin}`);
      if (parsedData.location) feedback.push(`Lokalizacja: ${parsedData.location}`);
      if (parsedData.seller) feedback.push(`Sprzedawca: ${parsedData.seller}`);
      if (parsedData.equipment && parsedData.equipment.length > 0) feedback.push(`Wykryto wyposażenie: ${parsedData.equipment.length} opcji`);

      setFormData(prev => ({
        ...prev,
        ...parsedData,
        // Zapewniamy, że wartości tablic nie będą undefined
        equipment: parsedData.equipment || prev.equipment
      }));
      
      setParsedFeedback(feedback);
      setIsAnalyzingText(false);
      
      if (feedback.length > 0) {
        setTimeout(() => {
          setActiveTab('manual');
        }, 1500);
      } else {
        alert('Nie udało się wyodrębnić żadnych danych z wklejonego tekstu. Upewnij się, że kopiujesz całe ogłoszenie (Ctrl+A w oknie ogłoszenia Otomoto).');
      }
    }, 1200);
  };

  // Obsługa zmiany checkboxów wyposażenia
  const handleEquipmentChange = (item: string) => {
    const isSelected = formData.equipment.includes(item);
    if (isSelected) {
      setFormData({
        ...formData,
        equipment: formData.equipment.filter(e => e !== item)
      });
    } else {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, item]
      });
    }
  };

  // Weryfikacja i zapis
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof formErrors = {};

    if (!formData.brand.trim()) errors.brand = 'Marka jest wymagana';
    if (!formData.model.trim()) errors.model = 'Model jest wymagany';
    if (!formData.price || formData.price <= 0) errors.price = 'Cena musi być większa od 0';
    if (!formData.mileage || formData.mileage <= 0) errors.mileage = 'Przebieg musi być większy od 0';
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      errors.year = 'Podaj poprawny rocznik';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setActiveTab('manual');
      alert('Proszę poprawić błędy w formularzu przed zapisem.');
      return;
    }

    // Odczyt aktualnej bazy z localStorage
    const saved = localStorage.getItem('autocompare_cars');
    let currentCars: Car[] = [];
    if (saved) {
      try {
        currentCars = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    const newCar: Car = {
      ...formData,
      id: `car-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newCar, ...currentCars];
    localStorage.setItem('autocompare_cars', JSON.stringify(updated));
    
    alert('Pomyślnie dodano nową ofertę!');
    router.push('/');
  };

  // Lista wyposażenia do wyboru
  const availableEquipment = [
    'Klimatyzacja', 'Nawigacja GPS', 'Kamery 360/Cofania', 'Czujniki parkowania',
    'Tempomat', 'Podgrzewane fotele', 'Reflektory LED', 'Skórzana tapicerka',
    'Bluetooth', 'Apple CarPlay / Android Auto', 'Panoramiczny dach', 'Alufelgi',
    'Asystent pasa ruchu', 'System Start-Stop'
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="page-title">Dodaj Nową Ofertę</h2>
          <p className="page-subtitle">Wklej link, skopiuj treść ogłoszenia lub uzupełnij pola ręcznie</p>
        </div>
      </div>

      {/* Zakładki wyboru metody wprowadzania */}
      <div className="tab-header no-print">
        <button 
          className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => setActiveTab('url')}
        >
          🔗 Wklej Link
        </button>
        <button 
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          📋 Wklej Tekst Ogłoszenia
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          ✍️ Formularz Ręczny
        </button>
      </div>

      {/* Widok wklejania URL */}
      {activeTab === 'url' && (
        <div className="glass-card" style={{ padding: '36px 30px' }}>
          {isAnalyzingUrl ? (
            <div className="scanner-container">
              <div className="radar-scanner">
                <div className="scanner-line"></div>
                <div className="scanner-glow"></div>
              </div>
              <h4 style={{ color: '#f9fafb', marginBottom: '8px' }}>Analiza adresu URL...</h4>
              <p style={{ color: '#9ca3af', fontSize: '13px' }} className="pulse-text">
                Odczytujemy markę i model pojazdu bezpośrednio ze ścieżki linku...
              </p>
            </div>
          ) : (
            <div>
              <h4 style={{ color: '#f9fafb', marginBottom: '12px' }}>Wklej adres ogłoszenia (np. z Otomoto)</h4>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '24px', lineHeight: '1.4' }}>
                Aplikacja nie odpytuje serwerów Otomoto w celu ominięcia zabezpieczeń. Wyodrębnimy podstawowe dane z samego linku, a resztę będziesz mógł wpisać lub wkleić w kolejnym kroku.
              </p>
              
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.otomoto.pl/osobowe/oferta/peugeot-2008-..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-primary"
                  onClick={handleAnalyzeUrl}
                  disabled={!urlInput.trim()}
                >
                  <Icon.Search size={16} />
                  Analizuj Link
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widok wklejania całego tekstu ogłoszenia */}
      {activeTab === 'text' && (
        <div className="glass-card" style={{ padding: '36px 30px' }}>
          {isAnalyzingText ? (
            <div className="scanner-container">
              <div className="radar-scanner">
                <div className="scanner-line"></div>
                <div className="scanner-glow"></div>
              </div>
              <h4 style={{ color: '#f9fafb', marginBottom: '8px' }}>Trwa wyodrębnianie danych...</h4>
              <p style={{ color: '#9ca3af', fontSize: '13px' }} className="pulse-text">
                Regex skanuje tekst w poszukiwaniu ceny, rocznika, przebiegu, wyposażenia oraz numeru VIN...
              </p>
            </div>
          ) : (
            <div>
              <h4 style={{ color: '#f9fafb', marginBottom: '12px' }}>Wklej skopiowany tekst strony (Ctrl+A → Ctrl+C → wklej)</h4>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px', lineHeight: '1.4' }}>
                Otwórz ogłoszenie na Otomoto, naciśnij <strong>Ctrl + A</strong> (zaznacz wszystko), skopiuj (<strong>Ctrl + C</strong>), a następnie wklej całą treść w poniższe pole. Nasz skrypt automatycznie odnajdzie specyfikacje pojazdu.
              </p>

              {parsedFeedback.length > 0 && (
                <div className="animate-slide" style={{ padding: '14px', background: 'var(--color-success-bg)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                  <h5 style={{ color: 'var(--color-success)', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon.CheckCircle size={18} />
                    Wyodrębniono następujące parametry:
                  </h5>
                  <ul style={{ fontSize: '12.5px', color: '#e5e7eb', paddingLeft: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {parsedFeedback.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <textarea
                  className="form-input"
                  style={{ minHeight: '200px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  placeholder="Tutaj wklej zawartość schowka..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-primary"
                  onClick={handleAnalyzeText}
                  disabled={!pastedText.trim()}
                >
                  <Icon.Search size={16} />
                  Analizuj Tekst ze Schowka
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Widok formularza manualnego / edycji */}
      {activeTab === 'manual' && (
        <form onSubmit={handleSubmit} className="glass-card animate-slide" style={{ padding: '36px 30px' }}>
          <h4 style={{ color: '#f9fafb', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
            Specyfikacja Pojazdu
          </h4>

          {/* Podstawowe dane */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Marka *</label>
              <input
                type="text"
                className="form-input"
                placeholder="np. Peugeot"
                value={formData.brand}
                onChange={(e) => {
                  setFormData({ ...formData, brand: e.target.value });
                  if (formErrors.brand) setFormErrors({ ...formErrors, brand: '' });
                }}
              />
              {formErrors.brand && <p style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px' }}>{formErrors.brand}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Model *</label>
              <input
                type="text"
                className="form-input"
                placeholder="np. 2008"
                value={formData.model}
                onChange={(e) => {
                  setFormData({ ...formData, model: e.target.value });
                  if (formErrors.model) setFormErrors({ ...formErrors, model: '' });
                }}
              />
              {formErrors.model && <p style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px' }}>{formErrors.model}</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Rocznik *</label>
              <input
                type="number"
                className="form-input"
                value={formData.year}
                onChange={(e) => {
                  setFormData({ ...formData, year: parseInt(e.target.value, 10) });
                  if (formErrors.year) setFormErrors({ ...formErrors, year: '' });
                }}
              />
              {formErrors.year && <p style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px' }}>{formErrors.year}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Cena (PLN) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="np. 55000"
                value={formData.price || ''}
                onChange={(e) => {
                  setFormData({ ...formData, price: parseDouble(e.target.value) });
                  if (formErrors.price) setFormErrors({ ...formErrors, price: '' });
                }}
              />
              {formErrors.price && <p style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px' }}>{formErrors.price}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Przebieg (km) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="np. 120000"
                value={formData.mileage || ''}
                onChange={(e) => {
                  setFormData({ ...formData, mileage: parseDouble(e.target.value) });
                  if (formErrors.mileage) setFormErrors({ ...formErrors, mileage: '' });
                }}
              />
              {formErrors.mileage && <p style={{ fontSize: '11px', color: 'var(--color-danger)', marginTop: '4px' }}>{formErrors.mileage}</p>}
            </div>
          </div>

          {/* Silnik / Skrzynia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Rodzaj Paliwa</label>
              <select
                className="form-input"
                value={formData.fuel}
                onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
              >
                <option value="Benzyna">Benzyna</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybryda">Hybryda</option>
                <option value="Benzyna+LPG">Benzyna+LPG</option>
                <option value="Elektryczny">Elektryczny</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Skrzynia Biegów</label>
              <select
                className="form-input"
                value={formData.gearbox}
                onChange={(e) => setFormData({ ...formData, gearbox: e.target.value })}
              >
                <option value="Manualna">Manualna</option>
                <option value="Automatyczna">Automatyczna</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Pojemność (cm³)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="np. 1598"
                  value={formData.engineSize || ''}
                  onChange={(e) => setFormData({ ...formData, engineSize: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Moc (KM)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="np. 130"
                  value={formData.power || ''}
                  onChange={(e) => setFormData({ ...formData, power: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Dane sprzedawcy, VIN i link */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Numer VIN (Opcjonalnie)</label>
              <input
                type="text"
                className="form-input"
                placeholder="17 znaków"
                style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sprzedawca</label>
              <select
                className="form-input"
                value={formData.seller}
                onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
              >
                <option value="Prywatny">Osoba prywatna</option>
                <option value="Firma">Firma / Komis / Dealer</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Lokalizacja</label>
              <input
                type="text"
                className="form-input"
                placeholder="np. Warszawa, Mazowieckie"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status Monitorowania</label>
              <select
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="do_sprawdzenia">Do sprawdzenia</option>
                <option value="interesujace">Interesujące</option>
                <option value="odrzucone">Odrzucone</option>
                <option value="obejrzane">Obejrzane</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Link do Ogłoszenia (Opcjonalnie)</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>

          {/* Notatki */}
          <div className="form-group">
            <label className="form-label">Twoje Notatki (Co warto sprawdzić, co powiedział sprzedawca)</label>
            <textarea
              className="form-input"
              placeholder="Wpisz swoje spostrzeżenia..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Wyposażenie */}
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Ważne Wyposażenie</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
              {availableEquipment.map((item) => {
                const isChecked = formData.equipment.includes(item);
                return (
                  <label key={item} className="checkbox-container" style={{ fontSize: '13px', paddingLeft: '24px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleEquipmentChange(item)}
                    />
                    <span className="checkmark" style={{ height: '16px', width: '16px' }}></span>
                    {item}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--surface-border)', paddingTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/')}>
              Anuluj
            </button>
            <button type="submit" className="btn btn-primary">
              <Icon.Save size={16} />
              Zapisz Ofertę
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Funkcja pomocnicza do bezpiecznego parsowania liczb float/int
function parseDouble(val: string): number {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
}
