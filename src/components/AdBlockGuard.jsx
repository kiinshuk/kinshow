import { useState, useEffect } from 'react';

function detectAdBlocker() {
  return new Promise((resolve) => {
    const bait = document.createElement('div');
    bait.className = 'ad_unit ad-zone adsbox doubleclick ad-placement';
    bait.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;';
    bait.innerHTML = '&nbsp;';
    document.body.appendChild(bait);

    setTimeout(() => {
      const blocked = !bait ||
        bait.offsetHeight === 0 ||
        bait.clientHeight === 0 ||
        bait.offsetParent === null ||
        window.getComputedStyle(bait).display === 'none' ||
        window.getComputedStyle(bait).visibility === 'hidden';
      document.body.removeChild(bait);
      resolve(blocked);
    }, 200);
  });
}

export default function AdBlockGuard({ children, onDismiss }) {
  const [blocked, setBlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    detectAdBlocker().then((isBlocked) => {
      setBlocked(isBlocked);
      setChecking(false);
    });
  }, []);

  if (checking) return null;

  if (blocked && !dismissed) {
    return (
      <div className="adb-overlay">
        <div className="adb-modal">
          <div className="adb-icon">🚫</div>
          <h3 className="adb-title">Ad Blocker Detected</h3>
          <p className="adb-text">
            Our video player requires ads to be enabled. Please disable your ad blocker for this site, then try again.
          </p>
          <p className="adb-hint">
            Video streams are served through ad-supported domains. Blocking ads also blocks the video.
          </p>
          <div className="adb-actions">
            <button className="btn btn--primary" onClick={() => {
              setChecking(true);
              detectAdBlocker().then((stillBlocked) => {
                setBlocked(stillBlocked);
                setChecking(false);
                if (!stillBlocked && onDismiss) onDismiss();
              });
            }}>I've Disabled It — Check Again</button>
            <button className="btn btn--ghost" onClick={() => { setDismissed(true); if (onDismiss) onDismiss(); }}>
              Continue Anyway (may not work)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
