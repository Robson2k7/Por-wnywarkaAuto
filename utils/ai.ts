import { Car } from './parser';

export interface AISettings {
  provider: 'gemini' | 'openai' | 'none';
  apiKey: string;
  modelName?: string;
}

// Funkcja generująca prompt dla modelu AI
export function generateComparePrompt(cars: Car[]): string {
  const carsFormatted = cars.map((car, idx) => `
Samochód #${idx + 1}: ${car.brand} ${car.model}
- Rocznik: ${car.year}
- Cena: ${car.price.toLocaleString('pl-PL')} PLN
- Przebieg: ${car.mileage.toLocaleString('pl-PL')} km
- Paliwo: ${car.fuel}
- Silnik: ${car.engineSize} cm³ (${car.power} KM)
- Skrzynia biegów: ${car.gearbox}
- Lokalizacja: ${car.location || 'Brak danych'}
- Sprzedawca: ${car.seller || 'Brak danych'}
- VIN: ${car.vin || 'Brak danych (Uwaga!)'}
- Wyposażenie: ${car.equipment ? car.equipment.join(', ') : 'Brak danych'}
- Notatki własne: ${car.notes || 'Brak'}
- Link ogłoszenia: ${car.link || 'Brak'}
- Opis ogłoszenia (fragment): ${car.description ? car.description.substring(0, 300) : 'Brak'}
  `).join('\n---\n');

  return `Jesteś doświadczonym rzeczoznawcą samochodowym i doradcą ds. zakupu aut używanych w Polsce.
Przeanalizuj poniższe ${cars.length} ofert samochodów i przygotuj szczegółowy, profesjonalny raport porównawczy w języku polskim.

Dane samochodów do analizy:
${carsFormatted}

Zbuduj swój raport w czytelnym formacie Markdown, korzystając z poniższej struktury:

### 📊 Ranking Opłacalności (Na Papierze)
Stwórz ustrukturyzowany ranking od najbardziej obiecującego samochodu do najmniej opłacalnego. Krótko uzasadnij pozycję każdego pojazdu w 2 zdaniach (biorąc pod uwagę stosunek ceny, przebiegu, rocznika i wyposażenia).

### 🔍 Kluczowe Różnice i Analiza Jakościowa
Porównaj najważniejsze cechy pojazdów (np. "Samochód A wyróżnia się bardzo niskim przebiegiem, ale ma uboższe wyposażenie niż Samochód B"). Zwróć uwagę na pojemności silników, moc i rodzaj skrzyni biegów.

### ⚠️ Czerwone Flagi (Analiza Ryzyka)
Wskaż potencjalne ryzyka dla każdej oferty:
- Brak podanego numeru VIN (bardzo ważny punkt!).
- Ceny znacznie odbiegające od średniej rynkowej (zbyt tanie / zbyt drogie).
- Niejasne sformułowania w opisie (np. "do opłat", "uszkodzony zderzak ale jeździ", sprzeczności).
- Niski przebieg przy starym roczniku (potrzeba weryfikacji).

### 💬 Pytania do Sprzedawcy (Do Zadania Przed Oględzinami)
Stwórz listę 3-4 konkretnych, trudnych pytań do sprzedawcy każdego auta (np. w oparciu o typowe usterki danego modelu, pochodzenie auta, historię serwisową, wymiany rozrządu/ sprzęgła).

### 🛠️ Indywidualna Checklista Oględzin na Miejscu
Przygotuj checklistę punktów do sprawdzenia przy oględzinach na żywo. Dostosuj ją technicznie do specyfiki każdego auta:
- Dla diesli: sprawdzenie DPF, koła dwumasowego, wtrysków.
- Dla silników benzynowych: pobór oleju, łańcuch rozrządu.
- Dla skrzyń automatycznych: płynność zmiany biegów, historia wymian oleju w skrzyni.
- Wiek i potencjalna korozja.

Pamiętaj: Nie podejmuj ostatecznej decyzji za użytkownika. Działaj jako analityk, który obiektywnie wypunktowuje fakty i ostrzega przed ryzykiem.`;
}

// Pomocnicza funkcja realizująca pobieranie z automatycznym ponawianiem (retry) i wykładniczym czasem oczekiwania (exponential backoff)
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelayMs = 1500
): Promise<Response> {
  let attempt = 0;
  let delayMs = initialDelayMs;

  while (true) {
    let response: Response;
    try {
      response = await fetch(url, options);
    } catch (networkError: any) {
      attempt++;
      if (attempt >= maxRetries) {
        throw networkError;
      }
      console.warn(
        `Błąd połączenia sieciowego (Próba ${attempt}/${maxRetries}). Ponowna próba za ${delayMs}ms... Błąd: ${networkError.message}`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
      continue;
    }

    if (response.ok) {
      return response;
    }

    // Obsługa błędu HTTP (response.ok === false)
    const isRetryableStatus = [429, 502, 503, 504].includes(response.status);
    let isRetryableBody = false;
    let errorMessage = '';

    try {
      const clone = response.clone();
      const errData = await clone.json();
      errorMessage = errData?.error?.message || '';
      const msgLower = errorMessage.toLowerCase();
      if (
        msgLower.includes('demand') ||
        msgLower.includes('rate limit') ||
        msgLower.includes('temporary') ||
        msgLower.includes('try again') ||
        msgLower.includes('overloaded') ||
        msgLower.includes('quota') ||
        msgLower.includes('experiencing high demand')
      ) {
        isRetryableBody = true;
      }
    } catch (e) {
      // Ignorujemy błędy parsowania odpowiedzi błędu
    }

    if (isRetryableStatus || isRetryableBody) {
      attempt++;
      if (attempt >= maxRetries) {
        throw new Error(errorMessage || `Błąd HTTP ${response.status}`);
      }
      console.warn(
        `Wykryto przeciążenie/limit API (Próba ${attempt}/${maxRetries}). Ponowna próba za ${delayMs}ms... Błąd: ${errorMessage || response.statusText}`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2;
      continue;
    }

    // Błędy niepodlegające ponowieniu (np. 400 Bad Request, 401/403 Invalid API Key)
    let nonRetryError = `Błąd HTTP ${response.status}`;
    try {
      const errData = await response.json();
      nonRetryError = errData?.error?.message || nonRetryError;
    } catch (e) {}
    throw new Error(nonRetryError);
  }
}

// Funkcja wykonująca bezpośrednie zapytanie API
export async function fetchAIComparison(
  cars: Car[],
  settings: AISettings
): Promise<string> {
  if (settings.provider === 'none' || !settings.apiKey) {
    return generateSimulatedComparison(cars);
  }

  const prompt = generateComparePrompt(cars);

  try {
    if (settings.provider === 'gemini') {
      const model = settings.modelName || 'gemini-2.5-flash';
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Nie otrzymano odpowiedzi z modelu.';
    } else if (settings.provider === 'openai') {
      const model = settings.modelName || 'gpt-4o-mini';
      const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
        }),
      });

      const data = await response.json();
      return data?.choices?.[0]?.message?.content || 'Nie otrzymano odpowiedzi z modelu.';
    }

    return generateSimulatedComparison(cars);
  } catch (error: any) {
    console.error('Błąd wywołania API:', error);
    return `### ❌ Błąd połączenia z API\n\nPodczas próby połączenia z API dostawcy wystąpił błąd: \`${error.message}\`.\n\n*Upewnij się, że wklejony klucz API jest poprawny i masz aktywne połączenie z internetem. Poniżej wygenerowaliśmy raport awaryjny (symulowany):*\n\n---\n\n${generateSimulatedComparison(cars)}`;
  }
}

// Generator symulowanych (lokalnych) raportów w oparciu o reguły
export function generateSimulatedComparison(cars: Car[]): string {
  if (cars.length === 0) return 'Brak aut do analizy.';

  // Sortowanie po roczniku (nowsze = teoretycznie lepsze) i cenie
  const sortedByYear = [...cars].sort((a, b) => b.year - a.year);
  
  // Obliczanie średnich rynkowych dla wybranego zestawu
  const avgPrice = cars.reduce((sum, c) => sum + c.price, 0) / cars.length;
  const avgMileage = cars.reduce((sum, c) => sum + c.mileage, 0) / cars.length;

  let rankingMarkdown = '### 📊 Ranking Opłacalności (Na Papierze)\n\n';
  sortedByYear.forEach((car, index) => {
    // Prosta heurystyka wyceny
    const isCheap = car.price < avgPrice;
    const isLowMileage = car.mileage < avgMileage;
    let scoreText = '';
    
    if (isCheap && isLowMileage) {
      scoreText = 'Świetny stosunek ceny do przebiegu. Auto wygląda na najatrakcyjniejszą ofertę w tej grupie.';
    } else if (isLowMileage) {
      scoreText = 'Niski przebieg podnosi wartość pojazdu, mimo nieco wyższej ceny początkowej.';
    } else if (isCheap) {
      scoreText = 'Cena jest przystępna, ale wyższy przebieg sugeruje rychłą potrzebę pakietu serwisowego.';
    } else {
      scoreText = 'Cena jest wysoka, a przebieg przeciętny. Wymaga weryfikacji, czy stan techniczny lub bogate wyposażenie uzasadniają ten koszt.';
    }

    rankingMarkdown += `${index + 1}. **${car.brand} ${car.model}** (${car.year}r. | ${car.price.toLocaleString('pl-PL')} zł)\n   * ${scoreText}\n`;
  });

  let differencesMarkdown = '\n### 🔍 Kluczowe Różnice i Analiza Jakościowa\n\n';
  const lowestMileageCar = [...cars].sort((a, b) => a.mileage - b.mileage)[0];
  const cheapestCar = [...cars].sort((a, b) => a.price - b.price)[0];
  const newestCar = [...cars].sort((a, b) => b.year - a.year)[0];

  differencesMarkdown += `* **Najniższy przebieg:** Samochód **${lowestMileageCar.brand} ${lowestMileageCar.model}** ma zaledwie **${lowestMileageCar.mileage.toLocaleString('pl-PL')} km**, co stanowi znaczną przewagę nad pozostałymi.\n`;
  differencesMarkdown += `* **Najtańsza oferta:** Najmniej zapłacisz za **${cheapestCar.brand} ${cheapestCar.model}** (**${cheapestCar.price.toLocaleString('pl-PL')} zł**), co może zwolnić budżet na ewentualne naprawy startowe.\n`;
  differencesMarkdown += `* **Najnowszy rocznik:** Model **${newestCar.brand} ${newestCar.model}** z roku **${newestCar.year}** oferuje najnowszą konstrukcję i prawdopodobnie najnowocześniejsze multimedia.\n`;

  // Różnice skrzyni biegów
  const manualCount = cars.filter(c => c.gearbox === 'Manualna').length;
  const autoCount = cars.filter(c => c.gearbox === 'Automatyczna').length;
  if (manualCount > 0 && autoCount > 0) {
    differencesMarkdown += `* **Skrzynie biegów:** W zestawieniu znajdują się zarówno samochody z przekładnią manualną (${manualCount} szt.), jak i automatyczną (${autoCount} szt.). Automaty podwyższają komfort miejski, ale mogą generować wyższe koszty serwisowania (np. dynamiczna wymiana oleju).\n`;
  }

  let redFlagsMarkdown = '\n### ⚠️ Czerwone Flagi (Analiza Ryzyka)\n\n';
  let flagCount = 0;

  cars.forEach(car => {
    const carFlags: string[] = [];
    if (!car.vin) {
      carFlags.push(`Ukryty numer VIN. Sprzedawca nie podał VIN w ogłoszeniu, co utrudnia weryfikację historii powypadkowej w bazie CEPiK.`);
    }
    if (car.mileage < 30000 && car.year < 2017) {
      carFlags.push(`Podejrzanie niski przebieg (${car.mileage.toLocaleString('pl-PL')} km) w stosunku do wieku auta (${new Date().getFullYear() - car.year} lat). Wymaga dokładnej weryfikacji w bazie CEPIK i książce serwisowej.`);
    }
    if (car.price < avgPrice * 0.7) {
      carFlags.push(`Cena jest o ponad 30% niższa niż średnia porównywanych pojazdów. Istnieje podwyższone ryzyko ukrytych wad blacharskich lub mechanicznych.`);
    }
    if (car.description && (/uszkodzon|lekko koliz|do lakier|do poprawek/i.test(car.description))) {
      carFlags.push(`W opisie pojawiają się słowa sugerujące uszkodzenia lub naprawy blacharskie/lakiernicze.`);
    }

    if (carFlags.length > 0) {
      redFlagsMarkdown += `**${car.brand} ${car.model} (${car.year}r.):**\n`;
      carFlags.forEach(flag => {
        redFlagsMarkdown += `- 🛑 ${flag}\n`;
      });
      flagCount++;
    }
  });

  if (flagCount === 0) {
    redFlagsMarkdown += `*Brak rażących czerwonych flag na podstawie wprowadzonych danych. Pamiętaj jednak o weryfikacji VIN każdego pojazdu przed zakupem.*\n`;
  }

  let questionsMarkdown = '\n### 💬 Pytania do Sprzedawcy (Do Zadania Przed Oględzinami)\n\n';
  cars.forEach(car => {
    questionsMarkdown += `**Pytania odnośnie: ${car.brand} ${car.model} (${car.year}r.):**\n`;
    if (!car.vin) {
      questionsMarkdown += `1. *Czy może Pan/Pani podać numer VIN oraz datę pierwszej rejestracji i numer rejestracyjny do sprawdzenia na HistoriaPojazdu.gov.pl?*\n`;
    } else {
      questionsMarkdown += `1. *Czy wyraża Pan/Pani zgodę na wizytę na stacji kontroli pojazdów lub w autoryzowanym serwisie ASO?*\n`;
    }

    if (car.fuel === 'Diesel') {
      questionsMarkdown += `2. *W jakim stanie jest filtr cząstek stałych (DPF) i czy koło dwumasowe było wymieniane?*\n`;
    } else if (car.fuel === 'Benzyna' && car.engineSize < 1400 && car.power > 110) {
      questionsMarkdown += `2. *Czy silnik wykazuje podwyższony pobór oleju silnikowego i kiedy był wymieniany łańcuch/pasek rozrządu?*\n`;
    } else {
      questionsMarkdown += `2. *Kiedy był przeprowadzany ostatni serwis olejowy silnika i w jakim stanie jest rozrząd?*\n`;
    }

    if (car.gearbox === 'Automatyczna') {
      questionsMarkdown += `3. *Kiedy i przy jakim przebiegu był wymieniany olej w skrzyni biegów i czy skrzynia nie szarpie na zimnym silniku?*\n`;
    } else {
      questionsMarkdown += `3. *Czy sprzęgło bierze wysoko i czy słychać jakiekolwiek szumy z łożyska oporowego przy wciskaniu pedału?*\n`;
    }

    questionsMarkdown += `4. *Czy auto pochodzi z polskiego salonu, czy jest sprowadzane? Jeśli sprowadzane, to czy posiada pełną dokumentację celno-skarbową i zdjęcia z momentu zakupu za granicą?*\n\n`;
  });

  let checklistMarkdown = '\n### 🛠️ Indywidualna Checklista Oględzin na Miejscu\n\n';
  cars.forEach(car => {
    checklistMarkdown += `#### 📌 Checklista dla: ${car.brand} ${car.model} (${car.year}r.)\n`;
    checklistMarkdown += `- [ ] **Weryfikacja historii:** Sprawdzenie zgodności przebiegu na liczniku z rządową bazą CEPiK.\n`;
    
    if (car.fuel === 'Diesel') {
      checklistMarkdown += `- [ ] **Układ wtryskowy i DPF:** Sprawdzenie końcówki wydechu (czarny nalot sugeruje uszkodzony DPF) oraz weryfikacja korekcji wtryskiwaczy komputerem diagnostycznym.\n`;
      checklistMarkdown += `- [ ] **Koło dwumasowe:** Nasłuchiwanie metalicznych stuków przy gaszeniu silnika bez wciśniętego sprzęgła oraz drgań na karoserii na biegu jałowym.\n`;
    } else {
      checklistMarkdown += `- [ ] **Praca zimnego silnika:** Sprawdzenie odgłosów rozrządu zaraz po uruchomieniu (potencjalne grzechotanie łańcucha przez pierwsze sekundy).\n`;
      checklistMarkdown += `- [ ] **Wycieki oleju:** Inspekcja pod pokrywą zaworów oraz w okolicach łączenia silnika ze skrzynią biegów.\n`;
    }

    if (car.gearbox === 'Automatyczna') {
      checklistMarkdown += `- [ ] **Test automatycznej skrzyni:** Sprawdzenie płynności przy zmianie przełożeń P-R-N-D na postoju oraz weryfikacja, czy nie ma opóźnień (tzw. uślizgów) przy redukcji biegów podczas jazdy.\n`;
    }

    checklistMarkdown += `- [ ] **Pomiary lakieru:** Użycie miernika grubości lakieru na słupkach, progu oraz wnękach drzwi (wartości >150-200 um sugerują drugą warstwę lakieru, >400 um to szpachla).\n`;
    checklistMarkdown += `- [ ] **Stan opon i tarcz hamulcowych:** Ocena zużycia klocków/tarcz oraz sprawdzenie daty produkcji opon (DOT) – opony starsze niż 5-6 lat kwalifikują się do wymiany bez względu na bieżnik.\n\n`;
  });

  return `*Raport wygenerowany w trybie lokalnym na podstawie analizy specyfikacji technicznych.*\n\n` + 
    rankingMarkdown + differencesMarkdown + redFlagsMarkdown + questionsMarkdown + checklistMarkdown;
}
