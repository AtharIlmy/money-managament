import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Wallet,
  Shield,
  Calendar,
  Sparkles,
  Settings,
  HelpCircle,
} from 'lucide-react';
import Logo from './Logo';

const NAV_ITEMS = [
  { href: '/dasbor', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/transaksi', icon: ArrowLeftRight, label: 'Transaksi' },
  { href: '/anggaran', icon: PieChart, label: 'Anggaran' },
  { href: '/laporan', icon: BarChart3, label: 'Laporan' },
  { href: '/dompet', icon: Wallet, label: 'Dompet' },
  { href: '/dana-darurat', icon: Shield, label: 'Dana Darurat' },
  { href: '/kalender-harian', icon: Calendar, label: 'Kalender Harian' },
];

export default function WalletSidebar({ userName = 'Muhammad' }) {
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'MM';

  return (
    <aside
      className="hidden md:flex flex-col justify-between fixed top-0 left-0 bottom-0 z-40 bg-[#101126] text-white border-r border-[#263041] transition-all duration-200 select-none
        md:w-20 md:p-4 md:items-center
        lg:w-56 lg:p-5 lg:items-stretch"
    >
      {/* Glow effect at bottom left */}
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-tr from-indigo-600/20 to-transparent blur-3xl"
        aria-hidden="true"
      />

      {/* TOP SECTION: BRAND & MENU */}
      <div className="flex flex-col gap-6 w-full">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 lg:px-1 md:justify-center lg:justify-start">
          <div className="w-8 h-8 rounded-lg bg-[#191B3D] border border-indigo-900/50 flex items-center justify-center shrink-0 shadow-sm">
            <Logo size={18} rx={12} />
          </div>
          <span className="hidden lg:inline text-xs font-bold text-[#C8CADB] tracking-tight">
            Money Management
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1 w-full">
          <span className="hidden lg:block text-[10px] font-semibold text-[#61647C] tracking-wider px-2 py-1">
            RUANG KEUANGAN
          </span>

          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl transition-colors duration-150 relative group
                  md:justify-center md:p-3 md:h-11 md:w-11 lg:justify-start lg:px-3 lg:py-2.5 lg:h-auto lg:w-full
                  ${
                    isActive
                      ? 'bg-[#191B3D] text-white font-semibold shadow-xs'
                      : 'text-[#8A99AD] hover:text-white hover:bg-white/5 font-medium'
                  }`
                }
                title={item.label}
              >
                {({ isActive }) => (
                  <>
                    <IconComponent
                      size={18}
                      className={isActive ? 'text-white' : 'text-[#8A99AD] group-hover:text-white'}
                    />
                    <span className="hidden lg:inline text-xs">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION: QUOTE & USER PROFILE */}
      <div className="flex flex-col gap-4 w-full">
        {/* Quote / Motivation Box (Visible only on Desktop LG+) */}
        <div className="hidden lg:flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#252744]/70 border border-indigo-900/40 text-xs shadow-xs">
          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-[11px]">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Sedikit demi sedikit.</span>
          </div>
          <p className="text-[10px] text-[#A6AFC2] leading-relaxed">
            Kebiasaan kecil hari ini, ketenangan finansial nanti.
          </p>
        </div>

        {/* User Profile Summary */}
        <div className="pt-3 border-t border-[#263041] flex items-center gap-3 md:justify-center lg:justify-start">
          <div className="w-8 h-8 rounded-full bg-[#252744] border border-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-200 shrink-0">
            {initials}
          </div>
          <div className="hidden lg:flex flex-col overflow-hidden leading-tight">
            <span className="text-xs font-semibold text-white truncate">{userName}</span>
            <span className="text-[10px] text-[#8A99AD]">Personal</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
