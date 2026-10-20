import React, { createContext, useContext, useState, useEffect } from 'react';

const PWAContext = createContext({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  showInstallModal: false,
  openInstallModal: () => {},
  closeInstallModal: () => {},
  installApp: () => {},
});

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(Boolean(isStandalone));
    };

    checkInstalled();

    // Check if iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(isIosDevice);

    // Capture beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__deferredPrompt = e;
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallModal(false);
      window.__deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const openInstallModal = () => setShowInstallModal(true);
  const closeInstallModal = () => setShowInstallModal(false);

  const installApp = async () => {
    const promptEvent = deferredPrompt || window.__deferredPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setShowInstallModal(false);
          setDeferredPrompt(null);
          window.__deferredPrompt = null;
        }
      } catch (err) {
        console.warn('Error during PWA prompt:', err);
      }
    } else {
      // If no prompt event (e.g. iOS or manual install needed), open modal with instructions
      setShowInstallModal(true);
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable: Boolean(deferredPrompt) || isIOS,
        deferredPrompt,
        isInstalled,
        isIOS,
        showInstallModal,
        openInstallModal,
        closeInstallModal,
        installApp,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  return useContext(PWAContext);
}
