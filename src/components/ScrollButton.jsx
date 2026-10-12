import Button from './Button';
import { useEffect, useState } from "react";

function ScrollButton() {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(function () {
    function scrollY() {
      const scroll = window.scrollY;
      if (scroll > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
    scrollY();
    window.addEventListener("scroll", scrollY);
    return function () {
      window.removeEventListener("scroll", scrollY);
    };
  }, []);
  function handleScroll() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }
  return (
        <Button variant="primary"
          className={`btn--icon scroll-to-top-btn ${isVisible ? 'scroll-to-top-btn--visible' : ''}`}
          onClick={() => handleScroll()}
          aria-label="Scroll to top"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </Button>
  );
}

export default ScrollButton;
