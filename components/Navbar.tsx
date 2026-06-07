'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AISettings } from '../utils/ai';
import { Icon } from './Icons';

export default function Navbar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings>({
    provider: 'none',
    apiKey: '',
    modelName: ''
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Ładowanie ustawień z localStorage przy zamontowaniu
  useEffect(() => {
    const saved = localStorage.getItem('autocompare_ai_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Jeśli modelName nie był ustawiony, przypisz domyślny
        if (!parsed.modelName) {
          parsed.modelName = parsed.provider === 'gemini' 
            ? 'gemini-2.5-flash' 
            : parsed.provider === 'openai' 
              ? 'gpt-4o-mini' 
              : '';
        }
        setSettings(parsed);
      } catch (e) {
        console.error('Błąd ładowania ustawień:', e);
      }
    }
  }, []);

  const handleProviderChange = (provider: AISettings['provider']) => {
    const defaultModel = provider === 'gemini' 
      ? 'gemini-2.5-flash' 
      : provider === 'openai' 
        ? 'gpt-4o-mini' 
        : '';
    
    setSettings(prev => ({
      ...prev,
      provider,
      modelName: defaultModel
    }));
  };

  const handleSave = () => {
    localStorage.setItem('autocompare_ai_settings', JSON.stringify(settings));
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
      setIsSettingsOpen(false);
      // Odświeżenie strony aby zaktualizować kontekst AI
      window.location.reload();
    }, 800);
  };

  const getModelLabel = () => {
    if (!settings.modelName) return '';
    if (settings.modelName.includes('2.5-flash')) return 'Flash';
    if (settings.modelName.includes('2.5-pro')) return 'Pro';
    if (settings.modelName.includes('4o-mini')) return '4o-mini';
    if (settings.modelName.includes('gpt-4o')) return 'GPT-4o';
    return settings.modelName;
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <Icon.AutoAwesome className="logo-icon" size={28} />
            <div>
              <h1 className="sidebar-title">AutoCompare AI</h1>
              <p className="sidebar-subtitle">Osobisty Asystent</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            <Icon.Dashboard size={18} />
            <span>Panel Główny</span>
          </Link>
          <Link href="/dodaj" className={`nav-link ${pathname === '/dodaj' ? 'active' : ''}`}>
            <Icon.AddCircle size={18} />
            <span>Dodaj Ofertę</span>
          </Link>
          <Link href="/porownanie" className={`nav-link ${pathname === '/porownanie' ? 'active' : ''}`}>
            <Icon.CompareArrows size={18} />
            <span>Porównanie AI</span>
          </Link>
          <Link href="/raporty" className={`nav-link ${pathname === '/raporty' ? 'active' : ''}`}>
            <Icon.FileText size={18} />
            <span>Zapisane Raporty</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="settings-btn" onClick={() => setIsSettingsOpen(true)}>
            <Icon.Settings size={16} />
            <span>Ustawienia API</span>
          </button>
          
          <div className="api-status-badge">
            <span className={`status-dot ${settings.provider !== 'none' && settings.apiKey ? 'active' : ''}`}></span>
            <span>
              {settings.provider === 'none' 
                ? 'AI: Symulacja' 
                : `AI: ${settings.provider === 'gemini' ? 'Gemini' : 'OpenAI'} (${getModelLabel()})`
              }
            </span>
          </div>
        </div>
      </aside>

      {/* Settings Modal (Overlay) */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ Ustawienia API Asystenta</h3>
              <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>
                <Icon.Close size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                Wklej swój klucz API, aby aplikacja mogła generować rzeczywiste, inteligentne raporty porównawcze. 
                Klucz jest zapisywany <strong>wyłącznie lokalnie</strong> w Twojej przeglądarce i nie trafia na żadne serwery zewnętrzne poza dostawcą usługi.
              </p>

              <div className="form-group">
                <label className="form-label">Dostawca AI</label>
                <select 
                  className="form-input" 
                  value={settings.provider}
                  onChange={(e) => handleProviderChange(e.target.value as any)}
                >
                  <option value="none">Tryb Symulacji (Bez klucza API)</option>
                  <option value="gemini">Google Gemini API (Zalecane)</option>
                  <option value="openai">OpenAI API (GPT-4o-mini)</option>
                </select>
              </div>

              {settings.provider !== 'none' && (
                <>
                  <div className="form-group animate-slide">
                    <label className="form-label">Model AI</label>
                    <select
                      className="form-input"
                      value={settings.modelName}
                      onChange={(e) => setSettings({ ...settings, modelName: e.target.value })}
                    >
                      {settings.provider === 'gemini' ? (
                        <>
                          <option value="gemini-2.5-flash">Gemini 2.5 Flash (Szybki i darmowy w limitach)</option>
                          <option value="gemini-2.5-pro">Gemini 2.5 Pro (Bardzo dokładna analiza)</option>
                        </>
                      ) : (
                        <>
                          <option value="gpt-4o-mini">GPT-4o Mini (Szybki i ekonomiczny)</option>
                          <option value="gpt-4o">GPT-4o (Pełny, zaawansowany model)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group animate-slide">
                    <label className="form-label">Klucz API</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Wklej swój klucz API tutaj..."
                      value={settings.apiKey}
                      onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {settings.provider === 'gemini' ? (
                        <span>Zdobądź darmowy klucz na <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>Google AI Studio</a>.</span>
                      ) : (
                        <span>Zdobądź klucz na <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline' }}>OpenAI Platform</a>.</span>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(false)}>
                Anuluj
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                {saveStatus === 'saved' ? 'Zapisano!' : 'Zapisz Ustawienia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
