import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Wallet,
  Settings as SettingsIcon,
} from 'lucide-react';

const BOTTOM_NAV_ITEMS = [
  { href: '/dasbor', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/transaksi', icon: ArrowLeftRight, label: 'Transaksi' },
  { href: '/anggaran', icon: PieChart, label: 'Anggaran' },
  { href: '/dompet', icon: Wallet, label: 'Dompet' },
  { href: '/pengaturan', icon: SettingsIcon, label: 'Pengaturan' },
];

/**
 * SettingsBottomNav Component
 * Mobile Navigation Bar:
 * - Mobile View (< md): Fixed bottom bar with frosted glass / solid dark background (#101126),
 *   rounded top corners, active glow indicator.
 * - Tablet & Desktop View (md+): Hidden.
 */
export default function SettingsBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#101126] dark:bg-[#141721] border-t border-[#263041] dark:border-gray-800 rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.4)] px-3 py-2 select-none"
      aria-label="Navigasi Bawah Mobile Pengaturan"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 relative ${
                  isActive
                    ? 'text-indigo-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <IconComponent
                      size={20}
                      className={isActive ? 'text-indigo-400' : 'text-slate-400'}
                    />
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 shadow-sm animate-pulse" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-none tracking-tight ${
                      isActive ? 'text-indigo-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
