import React, { createContext, useContext, useState } from 'react';

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const [isHidden, setIsHidden] = useState(
    () => localStorage.getItem('privacy_mode') === 'true'
  );

  const toggle = () => {
    setIsHidden((prev) => {
      const next = !prev;
      localStorage.setItem('privacy_mode', String(next));
      return next;
    });
  };

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isHidden) {
        document.body.classList.add('privacy-masked');
      } else {
        document.body.classList.remove('privacy-masked');
      }
    }
  }, [isHidden]);

  /**
   * maskAmount(value)
   * Returns "Rp ••••••" or "••••••" when hidden, otherwise the original string/value.
   */
  const maskAmount = (value) => {
    if (!isHidden) return value;
    if (typeof value === 'string' && value.startsWith('Rp')) {
      return 'Rp ••••••';
    }
    return '••••••';
  };

  return (
    <PrivacyContext.Provider value={{ isHidden, toggle, maskAmount }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be used within PrivacyProvider');
  return ctx;
}
