import Button from './Button';
import { useState, useEffect } from 'react';
import { hasConsent, setConsent } from '../utils/cookies';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasConsent()) {
      setTimeout(() => setShow(true), 1500);
    }
  }, []);

  const handleAccept = () => { setConsent(true); setShow(false); };
  const handleDecline = () => { setConsent(false); setShow(false); };

  if (!show) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <div className="cookie-icon">🍪</div>
        <div className="cookie-text">
          <h4>We Value Your Privacy</h4>
          <p>We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies. <a href="/privacy"><b><u>Learn More</u></b></a></p>
        </div>
        <div className="cookie-actions">
          <Button variant="primary" onClick={handleAccept}>Accept</Button>
          <Button variant="secondary" onClick={handleDecline}>Decline</Button>
        </div>
      </div>
    </div>
  );
}
