import './globals.css';
import ThemeProvider from './components/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Arus - Manajemen Keuangan',
  description: 'Kenali arus uangmu. Rencanakan hidupmu. Platform manajemen keuangan pribadi yang membantu Anda melacak, mengelola, dan merencanakan keuangan dengan bijak.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
