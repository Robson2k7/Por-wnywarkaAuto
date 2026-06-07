export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuel: string;
  engineSize: number; // cm3
  power: number; // KM
  gearbox: string; // Manualna / Automatyczna
  location: string;
  link: string;
  seller: string; // Prywatny / Firma
  vin: string;
  description: string;
  equipment: string[];
  notes: string;
  status: 'do_sprawdzenia' | 'interesujace' | 'odrzucone' | 'obejrzane';
  createdAt: string;
}

// Wyciąganie marki i modelu z adresu URL
export function parseCarUrl(url: string): { brand: string; model: string } {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) return { brand: '', model: '' };

    // Dopasowanie do Otomoto / OLX
    // Przykład: https://www.otomoto.pl/osobowe/oferta/peugeot-2008-ID6I5Z5A.html
    const ofertaMatch = cleanUrl.match(/\/oferta\/([a-zA-Z0-9-]+)/);
    if (ofertaMatch && ofertaMatch[1]) {
      const parts = ofertaMatch[1].split('-');
      if (parts.length >= 2) {
        const brand = capitalizeFirstLetter(parts[0]);
        // Ignorujemy ostatni człon, jeśli to hash (np. ID...)
        const possibleHash = parts[parts.length - 1];
        const hasHash = possibleHash.toLowerCase().startsWith('id') || (possibleHash.length > 5 && /^[a-zA-Z0-9]+$/.test(possibleHash));
        const modelParts = parts.slice(1, hasHash ? -1 : undefined);
        const model = modelParts.map(capitalizeFirstLetter).join(' ');
        return { brand, model };
      }
      return { brand: capitalizeFirstLetter(parts[0]), model: '' };
    }

    return { brand: '', model: '' };
  } catch (e) {
    console.error('Błąd podczas parsowania URL:', e);
    return { brand: '', model: '' };
  }
}

function capitalizeFirstLetter(string: string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Czyszczenie i parsowanie liczb (usuwanie spacji, jednostek itp.)
function parseNumber(valStr: string): number {
  const clean = valStr.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

// Główny inteligentny parser wklejonego tekstu ogłoszenia (Ctrl+A -> Ctrl+C z Otomoto)
export function parseCarText(text: string): Partial<Car> {
  const result: Partial<Car> = {};
  if (!text) return result;

  // 1. Marka i Model (często na początku lub po "Szczegóły" / "OtoMoto")
  const brandKeywords = [
    'Audi', 'BMW', 'Peugeot', 'Opel', 'Skoda', 'Ford', 'Fiat', 'Renault', 'Volkswagen', 'VW',
    'Toyota', 'Mercedes', 'Hyundai', 'Kia', 'Volvo', 'Mazda', 'Honda', 'Nissan', 'Citroen', 'Dacia',
    'Seat', 'Alfa Romeo', 'Lexus', 'Mitsubishi', 'Suzuki', 'Jeep', 'Land Rover', 'Porsche'
  ];

  // Szukanie marki w tekście
  for (const b of brandKeywords) {
    const regex = new RegExp(`\\b${b}\\b`, 'i');
    if (regex.test(text)) {
      result.brand = b;
      break;
    }
  }

  // 2. Cena
  // Często występuje jako: "52 900 PLN" lub "Cena\n52 900" lub "52 900 zł"
  const priceRegexes = [
    /(?:Cena|Wartość)\s*\n*\s*([0-9\s]{4,10})\s*(?:PLN|zł|PLZ|EUR)/i,
    /([0-9\s]{4,10})\s*(?:PLN|zł)\b/i,
    /(?:Cena|Cena brutto)\s*\n*\s*([0-9\s]{4,10})/i
  ];
  for (const regex of priceRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const price = parseNumber(match[1]);
      if (price > 1000) { // Odrzucamy nierealne ceny
        result.price = price;
        break;
      }
    }
  }

  // 3. Rok produkcji / Rocznik
  const yearRegexes = [
    /Rok produkcji\s*\n*\s*([0-9]{4})/i,
    /Rocznik\s*\n*\s*([0-9]{4})/i,
    /\b(199\d|20[0-2]\d)\b/ // Znajdź dowolny rok z zakresu 1990-2029
  ];
  for (const regex of yearRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const year = parseInt(match[1], 10);
      if (year >= 1990 && year <= new Date().getFullYear() + 1) {
        result.year = year;
        break;
      }
    }
  }

  // 4. Przebieg
  const mileageRegexes = [
    /Przebieg\s*\n*\s*([0-9\s]+)(?:km)?/i,
    /([0-9\s]+)\s*km\b/i
  ];
  for (const regex of mileageRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const mileage = parseNumber(match[1]);
      if (mileage > 0) {
        result.mileage = mileage;
        break;
      }
    }
  }

  // 5. Pojemność skokowa silnika
  const engineRegexes = [
    /Pojemność skokowa\s*\n*\s*([0-9\s]+)(?:cm3|cm³)?/i,
    /([0-9\s]+)\s*cm[3³]\b/i,
    /Silnik\s*\n*\s*([0-9\.,]+)\b/i // Np. "1.6" lub "2.0"
  ];
  for (const regex of engineRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      let rawVal = match[1].trim();
      if (rawVal.includes('.') || rawVal.includes(',')) {
        // Np. 1.6 litra -> przeliczamy na cm3 (w przybliżeniu)
        const liters = parseFloat(rawVal.replace(',', '.'));
        if (liters > 0.5 && liters < 8.0) {
          result.engineSize = Math.round(liters * 1000);
          break;
        }
      } else {
        const size = parseNumber(rawVal);
        if (size > 500 && size < 10000) {
          result.engineSize = size;
          break;
        }
      }
    }
  }

  // 6. Moc silnika
  const powerRegexes = [
    /Moc\s*\n*\s*([0-9\s]+)(?:KM|HP)?/i,
    /([0-9\s]+)\s*KM\b/i
  ];
  for (const regex of powerRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      const power = parseNumber(match[1]);
      if (power > 20 && power < 1000) {
        result.power = power;
        break;
      }
    }
  }

  // 7. Rodzaj paliwa
  if (/Benzyna/i.test(text)) {
    result.fuel = 'Benzyna';
  } else if (/Diesel/i.test(text) || /olej napędowy/i.test(text)) {
    result.fuel = 'Diesel';
  } else if (/Hybryda/i.test(text)) {
    result.fuel = 'Hybryda';
  } else if (/LPG/i.test(text) || /Benzyna\+LPG/i.test(text)) {
    result.fuel = 'Benzyna+LPG';
  } else if (/Elektryczny/i.test(text) || /Electric/i.test(text)) {
    result.fuel = 'Elektryczny';
  }

  // 8. Skrzynia biegów
  if (/Manualna/i.test(text) || /ręczna/i.test(text)) {
    result.gearbox = 'Manualna';
  } else if (/Automatyczna/i.test(text) || /automat/i.test(text) || /DSG|CVT|S-Tronic/i.test(text)) {
    result.gearbox = 'Automatyczna';
  }

  // 9. VIN
  const vinRegex = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
  const vinMatch = text.match(vinRegex);
  if (vinMatch && vinMatch[1]) {
    result.vin = vinMatch[1].toUpperCase();
  }

  // 10. Lokalizacja
  // Szukamy frazy w stylu "Lokalizacja: Warszawa" lub linii po nazwie miejscowości
  const locationRegexes = [
    /Lokalizacja\s*\n*\s*([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)(?:\n|,)/,
    /Miejscowość\s*\n*\s*([A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)(?:\n|,)/
  ];
  for (const regex of locationRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      result.location = match[1].trim();
      break;
    }
  }

  // 11. Oferta od (sprzedawca)
  if (/Osoby prywatnej/i.test(text) || /Prywatne/i.test(text)) {
    result.seller = 'Prywatny';
  } else if (/Firmy/i.test(text) || /Dealer|Faktura|Komis/i.test(text)) {
    result.seller = 'Firma';
  }

  // 12. Wyposażenie (automatyczne tagowanie na podstawie wykrytych słów)
  const equipmentKeywords = {
    'Klimatyzacja': /klimatyzacja|climatronic/i,
    'Nawigacja GPS': /nawigacja|gps|mapy/i,
    'Kamery 360/Cofania': /kamera cofania|kamery 360/i,
    'Czujniki parkowania': /czujnik(?:i)? parkowania|parktronic/i,
    'Tempomat': /tempomat/i,
    'Podgrzewane fotele': /podgrzewan(?:e|ych) fotel/i,
    'Reflektory LED': /led|xenon|ksenon/i,
    'Skórzana tapicerka': /skór(?:z|an)(?:a|e|tapicerka)/i,
    'Bluetooth': /bluetooth/i,
    'Apple CarPlay / Android Auto': /carplay|android auto/i,
    'Panoramiczny dach': /dach panoramiczny|szyberdach/i,
    'Alufelgi': /alufelgi|felgi aluminiowe/i,
    'Asystent pasa ruchu': /asystent pasa|lane assist/i,
    'System Start-Stop': /start-stop|keyless/i
  };

  const detectedEquipment: string[] = [];
  for (const [key, value] of Object.entries(equipmentKeywords)) {
    if (value.test(text)) {
      detectedEquipment.push(key);
    }
  }
  if (detectedEquipment.length > 0) {
    result.equipment = detectedEquipment;
  }

  // Próba wyciągnięcia opisu (szukamy bloku po słowie "Opis" lub "Opis pojazdu")
  const descriptionRegex = /(?:Opis|Opis pojazdu|Dodatkowe informacje)\s*\n*([\s\S]{50,1000})/i;
  const descMatch = text.match(descriptionRegex);
  if (descMatch && descMatch[1]) {
    // Czyszczenie opisu z ewentualnych tagów reklamowych na końcu
    result.description = descMatch[1].trim().split('\n').slice(0, 10).join('\n'); // Bierzemy pierwsze 10 linii
  }

  return result;
}
