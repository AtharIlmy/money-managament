import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PrivacyProvider } from './context/PrivacyContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Wallets from './pages/Wallets';
import Budgets from './pages/Budgets';
import Savings from './pages/Savings';
import Bills from './pages/Bills';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Help from './pages/Help';
import EmergencyFund from './pages/EmergencyFund';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <PrivacyProvider>
          <AuthProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/masuk" element={<Login />} />
            <Route path="/lupa-sandi" element={<Login defaultShowForgot={true} />} />
            <Route path="/daftar" element={<Register />} />

            {/* Protected App Routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dasbor" replace />} />
              <Route path="/dasbor" element={<Dashboard />} />
              <Route path="/transaksi" element={<Transactions />} />
              <Route path="/dompet" element={<Wallets />} />
              <Route path="/tabungan" element={<Savings />} />
              <Route path="/anggaran" element={<Budgets />} />
              <Route path="/tagihan" element={<Bills />} />
              <Route path="/laporan" element={<Reports />} />
              <Route path="/dana-darurat" element={<EmergencyFund />} />
              <Route path="/pengaturan" element={<Settings />} />
              <Route path="/bantuan" element={<Help />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dasbor" replace />} />
          </Routes>
          </AuthProvider>
        </PrivacyProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
