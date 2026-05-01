import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingNav.css';

const LandingNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="landing-nav-container">
        <Link to="/" className="landing-logo">
          SPDPT
        </Link>

        <div className="landing-desktop-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
        </div>

        <div className="landing-auth-buttons">
          <Link to="/login" className="btn-login">Login</Link>
          <Link to="/register" className="btn-register">Get Started</Link>
        </div>

        {/* Mobile menu toggle */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
        <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a>
        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
        <Link to="/register" className="mobile-btn-register" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
      </div>
    </nav>
  );
};

export default LandingNav;
