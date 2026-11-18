import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Wallet,
} from 'lucide-react';

const BOTTOM_NAV_ITEMS = [
  { href: '/dasbor', icon: LayoutDashboard, label: 'Dasbor' },
  { href: '/transaksi', icon: ArrowLeftRight, label: 'Transaksi' },
  { href: '/anggaran', icon: PieChart, label: 'Anggaran' },
  { href: '/laporan', icon: BarChart3, label: 'Laporan' },
  { href: '/dompet', icon: Wallet, label: 'Dompet' },
];

export default function WalletBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#101126] border-t border-[#263041] rounded-t-2xl shadow-2xl px-3 py-2"
      aria-label="Navigasi Bawah Mobile"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-[#8A99AD] hover:text-white font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <IconComponent
                    size={20}
                    className={isActive ? 'text-white' : 'text-[#8A99AD]'}
                  />
                  <span className="text-[10px] leading-none tracking-tight">
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
