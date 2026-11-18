'use client';
import React from 'react';
import { useTheme } from '../context/ThemeContext';
import Icon from './Icon';

export default function ThemeToggleBtn() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode malam'}
      title={isDark ? 'Mode Terang' : 'Mode Malam'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: '999px',
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        fontSize: 17,
      }}
    >
      <Icon name={isDark ? 'light_mode' : 'dark_mode'} size={18} />
    </button>
  );
}
