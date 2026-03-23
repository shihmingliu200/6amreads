'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';

const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English', nameNative: 'English' },
  { code: 'zh-Hant', name: 'Chinese Traditional', nameNative: '繁體中文' },
  { code: 'zh-Hans', name: 'Chinese Simplified', nameNative: '简体中文' },
  { code: 'ko', name: 'Korean', nameNative: '한국어' },
  { code: 'ja', name: 'Japanese', nameNative: '日本語' },
  { code: 'fr', name: 'French', nameNative: 'Français' },
  { code: 'es', name: 'Spanish', nameNative: 'Español' },
  { code: 'de', name: 'German', nameNative: 'Deutsch' },
  { code: 'it', name: 'Italian', nameNative: 'Italiano' },
  { code: 'vi', name: 'Vietnamese', nameNative: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nameNative: 'ไทย' },
  { code: 'ms', name: 'Malaysian', nameNative: 'Bahasa Melayu' },
  { code: 'id', name: 'Indonesian', nameNative: 'Bahasa Indonesia' },
  { code: 'km', name: 'Cambodian', nameNative: 'ភាសាខ្មែរ' },
  { code: 'hi', name: 'Hindi', nameNative: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', nameNative: 'العربية' },
];

export default function LanguagePicker({ value, onChange, disabled, className = '' }) {
  const [languages, setLanguages] = useState(DEFAULT_LANGUAGES);

  useEffect(() => {
    fetch(`${API_URL}/languages`)
      .then((r) => r.json())
      .then((d) => d.languages && setLanguages(d.languages))
      .catch(() => {});
  }, []);

  return (
    <select
      value={value || 'en'}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={className}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nameNative} ({lang.name})
        </option>
      ))}
    </select>
  );
}
