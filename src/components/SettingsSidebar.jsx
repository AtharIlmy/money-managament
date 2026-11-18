import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Wallet,
  Shield,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
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
  { href: '/pengaturan', icon: SettingsIcon, label: 'Pengaturan' },
];

/**
 * SettingsSidebar Component
 * Responsive Sidebar:
 * - Desktop View (lg+): Full sidebar (w-64), logo, icon + label navigation, profile card at bottom.
 * - Tablet View (md - lg): Mini sidebar (w-20), icon only, compact logo, profile avatar.
 * - Mobile View (< md): Hidden (replaced by SettingsBottomNav).
 */
export default function SettingsSidebar({
  userName = 'Muhammad Aisyar',
  userEmail = 'aisyar@example.com',
  onLogout,
}) {
  const navigate = useNavigate();

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'MA';

  const handleProfileClick = () => {
    navigate('/pengaturan');
  };

  return (
    <aside
      className="hidden md:flex flex-col justify-between fixed top-0 left-0 bottom-0 z-40 bg-[#101126] dark:bg-[#141721] text-white border-r border-[#263041] dark:border-gray-800 transition-all duration-200 select-none
        md:w-20 md:p-3 md:items-center
        lg:w-64 lg:p-5 lg:items-stretch"
      aria-label="Sidebar Navigasi Pengaturan"
    >
      {/* Background ambient light */}
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-tr from-indigo-600/20 to-transparent blur-3xl"
        aria-hidden="true"
      />

      {/* TOP SECTION: BRAND LOGO & MENU */}
      <div className="flex flex-col gap-6 w-full">
        {/* Brand Header */}
        <NavLink
          to="/dasbor"
          className="flex items-center gap-3 py-1 px-1 rounded-xl hover:opacity-90 transition-opacity"
        >
          <div className="shrink-0 flex items-center justify-center">
            <Logo size={32} rx={16} />
          </div>
          <div className="hidden lg:flex flex-col leading-tight min-w-0">
            <span className="font-extrabold text-sm tracking-tight text-white truncate">
              Money Management
            </span>
            <span className="text-[10px] text-indigo-300 font-medium tracking-wide">
              Personal Pro Plan
            </span>
          </div>
        </NavLink>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1 w-full" aria-label="Menu Utama">
          <div className="hidden lg:block px-2 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </div>

          {NAV_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  } md:justify-center lg:justify-start`
                }
                title={item.label}
              >
                {({ isActive }) => (
                  <>
                    <IconComponent
                      size={18}
                      className={`shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span className="hidden lg:inline-block truncate">
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM SECTION: USER PROFILE & LOGOUT */}
      <div className="flex flex-col gap-2 w-full pt-4 border-t border-slate-800/80">
        {/* User Card */}
        <div
          onClick={handleProfileClick}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group md:justify-center lg:justify-start"
          title={`Profil: ${userName}`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/20 group-hover:ring-indigo-400 transition-all">
            {initials}
          </div>
          <div className="hidden lg:flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
              {userName}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {userEmail}
            </span>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Keluar"
              aria-label="Keluar dari akun"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
