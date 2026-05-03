import { useState } from 'react';
import type { Settings } from '../types';

const STORAGE_KEY = 'apg-settings';

const defaults: Settings = {
  geminiApiKey: '',
  jsearchApiKey: '',
  newsApiKey: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  const updateSettings = (next: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isConfigured =
    !!settings.geminiApiKey &&
    !!settings.jsearchApiKey &&
    !!settings.newsApiKey;

  return { settings, updateSettings, isConfigured };
}
