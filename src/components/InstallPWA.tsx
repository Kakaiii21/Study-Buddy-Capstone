// src/components/InstallPWA.tsx
import { useState } from 'react';
import { useInstallPWA } from '../hooks/useInstallPWA';

const InstallPWA = () => {
  const { isInstallable, installApp, isIOS, isStandalone } = useInstallPWA();
  const [dismissed, setDismissed] = useState(false);

  // Already installed or user dismissed
  if (isStandalone || dismissed) return null;

  // Android/Desktop — show install button
  if (isInstallable) {
    return (
      <div className="install-banner">
        <span>📲 Install Study Buddy for offline use!</span>
        <button onClick={installApp}>Install</button>
        <button onClick={() => setDismissed(true)}>✕</button>
      </div>
    );
  }

  // iOS — show manual instructions
  if (isIOS) {
    return (
      <div className="install-banner">
        <span>
          📲 Install Study Buddy: tap <strong>Share</strong> then{' '}
          <strong>"Add to Home Screen"</strong>
        </span>
        <button onClick={() => setDismissed(true)}>✕</button>
      </div>
    );
  }

  return null;
};

export default InstallPWA;