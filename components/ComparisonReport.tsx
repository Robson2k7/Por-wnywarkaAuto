import React from 'react';
import { Car } from '../utils/parser';
import { Icon } from './Icons';

interface ComparisonReportProps {
  report: string;
  isLoading: boolean;
  selectedCars: Car[];
  onClose: () => void;
  onSaveReport?: (reportMarkdown: string) => void;
  isAlreadySaved?: boolean;
}

export default function ComparisonReport({
  report,
  isLoading,
  selectedCars,
  onClose,
  onSaveReport,
  isAlreadySaved = false
}: ComparisonReportProps) {
  const [isSaved, setIsSaved] = React.useState(isAlreadySaved);

  React.useEffect(() => {
    setIsSaved(isAlreadySaved);
  }, [isAlreadySaved]);

  // Funkcja konwertująca prosty Markdown do elementów HTML/React
  const renderMarkdown = (md: string) => {
    if (!md) return null;

    const lines = md.split('\n');
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    const elements: React.ReactNode[] = [];

    const closeList = () => {
      if (inList) {
        inList = false;
        listType = null;
      }
    };

    const parseTableRow = (row: string) => {
      let cols = row.split('|');
      if (row.startsWith('|')) cols.shift();
      if (row.endsWith('|')) cols.pop();
      return cols.map(col => col.trim());
    };

    const renderTable = (tableLines: string[], tableKey: string) => {
      if (tableLines.length === 0) return null;

      // Filtruj wiersze wyrównania (np. |:---|---|)
      const activeRows = tableLines.filter(row => {
        const clean = row.replace(/[|:\-\s]/g, '');
        return clean.length > 0;
      });

      if (activeRows.length === 0) return null;

      const headerCols = parseTableRow(activeRows[0]);
      const bodyRows = activeRows.slice(1);

      return (
        <div key={tableKey} className="report-table-wrapper" style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table className="report-table">
            <thead>
              <tr>
                {headerCols.map((col, idx) => (
                  <th key={`th-${idx}`}>{parseInlineStyles(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, rowIdx) => {
                const cols = parseTableRow(row);
                return (
                  <tr key={`tr-${rowIdx}`}>
                    {cols.map((col, colIdx) => (
                      <td key={`td-${rowIdx}-${colIdx}`}>{parseInlineStyles(col)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const key = `md-line-${i}`;

      // Detekcja tabeli Markdown
      if (trimmedLine.startsWith('|')) {
        closeList();
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        const tableElement = renderTable(tableLines, `table-${i}`);
        if (tableElement) {
          elements.push(tableElement);
        }
        continue;
      }

      // Nagłówki H3
      if (trimmedLine.startsWith('### ')) {
        closeList();
        const text = trimmedLine.replace('### ', '');
        elements.push(<h3 key={key} className="report-h3">{parseInlineStyles(text)}</h3>);
        i++;
        continue;
      }

      // Nagłówki H4
      if (trimmedLine.startsWith('#### ')) {
        closeList();
        const text = trimmedLine.replace('#### ', '');
        elements.push(<h4 key={key} className="report-h4">{parseInlineStyles(text)}</h4>);
        i++;
        continue;
      }

      // Separatory
      if (trimmedLine === '---') {
        closeList();
        elements.push(<hr key={key} className="report-hr" />);
        i++;
        continue;
      }

      // Checkbox listy: "- [ ]" lub "- [x]"
      const checklistMatch = trimmedLine.match(/^-\s*\[([ x])\]\s*(.*)/i);
      if (checklistMatch) {
        if (!inList || listType !== 'ul') {
          closeList();
          inList = true;
          listType = 'ul';
        }
        const isChecked = checklistMatch[1].toLowerCase() === 'x';
        const text = checklistMatch[2];
        elements.push(
          <div key={key} className="report-checklist-item">
            {isChecked ? (
              <Icon.CheckCircle className="check-icon checked" size={18} />
            ) : (
              <div className="check-box-outline"></div>
            )}
            <span className="checklist-text">{parseInlineStyles(text)}</span>
          </div>
        );
        i++;
        continue;
      }

      // Listy nienumerowane: "- " lub "* "
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList || listType !== 'ul') {
          closeList();
          inList = true;
          listType = 'ul';
        }
        const text = trimmedLine.substring(2);
        
        // Specjalne stylowanie czerwonych flag / ostrzeżeń
        const isRedFlag = text.includes('🛑') || text.includes('Red Flag') || text.includes('czerwona flaga') || text.includes('Ryzyko');
        
        elements.push(
          <li key={key} className={`report-li ${isRedFlag ? 'red-flag-li' : ''}`}>
            {isRedFlag && (
              <span style={{ marginRight: '6px', color: 'var(--color-danger)', display: 'inline-flex', verticalAlign: 'middle' }}>
                <Icon.AlertCircle size={16} />
              </span>
            )}
            {parseInlineStyles(text.replace('🛑', '').trim())}
          </li>
        );
        i++;
        continue;
      }

      // Listy numerowane: "1. "
      const olMatch = trimmedLine.match(/^(\d+)\.\s*(.*)/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          closeList();
          inList = true;
          listType = 'ol';
        }
        const num = olMatch[1];
        const text = olMatch[2];
        elements.push(
          <li key={key} className="report-li-ordered">
            <span className="ordered-num">{num}.</span>
            <span className="ordered-text">{parseInlineStyles(text)}</span>
          </li>
        );
        i++;
        continue;
      }

      // Puste linie
      if (trimmedLine === '') {
        closeList();
        i++;
        continue;
      }

      // Zwykłe paragrafy
      closeList();
      elements.push(<p key={key} className="report-p">{parseInlineStyles(trimmedLine)}</p>);
      i++;
    }

    return <div className="markdown-body">{elements}</div>;
  };

  const parseInlineStyles = (text: string): React.ReactNode => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={`bold-${index}`} className="bold-highlight">{part}</strong>;
      }
      return part;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-inline-container glass-card animate-fade-in">
      {/* Górny pasek raportu */}
      <div className="report-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="back-btn no-print" onClick={onClose} title="Wróć do listy">
            <Icon.ArrowBack size={20} />
          </button>
          <div>
            <h2 className="report-title">📝 Raport Porównawczy AI</h2>
            <p className="report-subtitle">
              Analiza dla {selectedCars.length} ofert: {selectedCars.map(c => `${c.brand} ${c.model}`).join(', ')}
            </p>
          </div>
        </div>
        
        <div className="report-actions no-print" style={{ display: 'flex', gap: '12px' }}>
          {!isLoading && onSaveReport && (
            <button 
              className="btn btn-secondary" 
              onClick={() => { onSaveReport(report); setIsSaved(true); }}
              disabled={isSaved}
              style={isSaved ? { opacity: 0.8, cursor: 'default', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.2)' } : {}}
            >
              <Icon.Check size={16} />
              {isSaved ? 'Zapisano w aplikacji' : 'Zapisz w aplikacji'}
            </button>
          )}
          {!isLoading && (
            <button className="btn btn-secondary" onClick={handlePrint}>
              <Icon.Print size={16} />
              Zapisz PDF / Drukuj
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            Powrót
          </button>
        </div>
      </div>

      {/* Zawartość raportu */}
      <div className="report-body print-area">
        {isLoading ? (
          <div className="report-loader-container">
            <div className="radar-scanner">
              <div className="scanner-line"></div>
              <div className="scanner-glow"></div>
            </div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', zIndex: 10 }}>Trwa analiza ofert przez AI...</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', zIndex: 10 }} className="pulse-text">
              Weryfikujemy ceny, roczniki, przebiegi, rodzaje silników oraz potencjalne ryzyka...
            </p>
            
            <div className="shimmer-placeholder-group">
              <div className="shimmer-line header-shimmer"></div>
              <div className="shimmer-line text-shimmer"></div>
              <div className="shimmer-line text-shimmer" style={{ width: '90%' }}></div>
              <div className="shimmer-line text-shimmer" style={{ width: '80%' }}></div>
              <br />
              <div className="shimmer-line header-shimmer" style={{ width: '40%' }}></div>
              <div className="shimmer-line text-shimmer"></div>
              <div className="shimmer-line text-shimmer" style={{ width: '95%' }}></div>
            </div>
          </div>
        ) : (
          <div className="report-content-wrapper">
            {/* Podsumowanie wybranych aut u góry raportu */}
            <div className="report-cars-summary-grid no-print">
              {selectedCars.map((car, idx) => (
                <div key={`${car.id}-${idx}`} className="summary-car-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span className="car-badge">{car.year}r.</span>
                    <span className="price-tag">{car.price.toLocaleString('pl-PL')} zł</span>
                  </div>
                  <h4 style={{ margin: '4px 0 8px 0', color: 'var(--text-primary)' }}>{car.brand} {car.model}</h4>
                  <div className="car-spec-mini">
                    <span>🚗 {car.mileage.toLocaleString('pl-PL')} km</span>
                    <span>⚙️ {car.gearbox}</span>
                    <span>⛽ {car.fuel}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Wygenerowany tekst Markdown */}
            <div className="report-markdown-container">
              {renderMarkdown(report)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
