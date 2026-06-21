import React, { useState, useEffect } from 'react';
import { Car } from '../utils/parser';
import { Icon } from './Icons';

interface CarDetailDrawerProps {
  car: Car | null;
  onClose: () => void;
  onSave: (updatedCar: Car) => void;
}

export default function CarDetailDrawer({ car, onClose, onSave }: CarDetailDrawerProps) {
  const [formData, setFormData] = useState<Car | null>(null);
  const [equipmentInput, setEquipmentInput] = useState('');

  // Załadowanie danych auta do formularza po otraciu
  useEffect(() => {
    if (car) {
      setFormData({ ...car });
      setEquipmentInput(car.equipment ? car.equipment.join(', ') : '');
    } else {
      setFormData(null);
      setEquipmentInput('');
    }
  }, [car]);

  if (!car || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Obsługa pól liczbowych
    if (['year', 'price', 'mileage', 'engineSize', 'power'].includes(name)) {
      const numVal = value === '' ? 0 : parseInt(value, 10);
      setFormData(prev => prev ? { ...prev, [name]: isNaN(numVal) ? 0 : numVal } : null);
    } else {
      setFormData(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Przekształcenie ciągu tekstowego wyposażenia na tablicę
    const equipmentArray = equipmentInput
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '');

    onSave({
      ...formData,
      equipment: equipmentArray
    });
  };

  return (
    <div className="drawer-overlay no-print" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>Edytuj i Podejrzyj Ofertę</h3>
          <button className="close-btn" onClick={onClose} title="Zamknij">
            <Icon.Close size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="drawer-body">
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Marka *</label>
              <input
                type="text"
                name="brand"
                className="form-input"
                required
                value={formData.brand}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Model *</label>
              <input
                type="text"
                name="model"
                className="form-input"
                required
                value={formData.model}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Rocznik *</label>
              <input
                type="number"
                name="year"
                className="form-input"
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cena (PLN) *</label>
              <input
                type="number"
                name="price"
                className="form-input"
                required
                min="0"
                value={formData.price || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Przebieg (km) *</label>
              <input
                type="number"
                name="mileage"
                className="form-input"
                required
                min="0"
                value={formData.mileage || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Paliwo</label>
              <select
                name="fuel"
                className="form-input"
                value={formData.fuel}
                onChange={handleChange}
              >
                <option value="Benzyna">Benzyna</option>
                <option value="Diesel">Diesel</option>
                <option value="LPG">LPG</option>
                <option value="Hybryda">Hybryda</option>
                <option value="Elektryczny">Elektryczny</option>
              </select>
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Pojemność silnika (cm³)</label>
              <input
                type="number"
                name="engineSize"
                className="form-input"
                min="0"
                value={formData.engineSize || ''}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Moc silnika (KM)</label>
              <input
                type="number"
                name="power"
                className="form-input"
                min="0"
                value={formData.power || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Skrzynia biegów</label>
              <select
                name="gearbox"
                className="form-input"
                value={formData.gearbox}
                onChange={handleChange}
              >
                <option value="Manualna">Manualna</option>
                <option value="Automatyczna">Automatyczna</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Numer VIN</label>
              <input
                type="text"
                name="vin"
                className="form-input"
                placeholder="17 znaków"
                value={formData.vin}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Sprzedawca</label>
              <select
                name="seller"
                className="form-input"
                value={formData.seller}
                onChange={handleChange}
              >
                <option value="Prywatny">Osoba prywatna</option>
                <option value="Firma">Firma / Dealer</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lokalizacja</label>
              <input
                type="text"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Link do ogłoszenia</label>
            <input
              type="text"
              name="link"
              className="form-input"
              value={formData.link}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Wyposażenie (oddziel przecinkami)</label>
            <input
              type="text"
              className="form-input"
              placeholder="np. Klimatyzacja, Nawigacja GPS, Skóra"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fragment opisu ogłoszenia</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              style={{ minHeight: '120px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Twoje notatki własne</label>
            <textarea
              name="notes"
              className="form-input"
              placeholder="Zapisz swoje spostrzeżenia, pytania do zadania lub uwagi z oględzin..."
              value={formData.notes}
              onChange={handleChange}
              style={{ minHeight: '120px' }}
            />
          </div>
        </form>

        <div className="drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            <Icon.Save size={18} />
            Zapisz Zmiany
          </button>
        </div>
      </div>
    </div>
  );
}
