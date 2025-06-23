import React, { useState, useEffect } from 'react';
import type { HeaderProps, NavigationItem } from '@/types';

const navigationItems: NavigationItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'Locations', href: '/locations' },
  { label: 'About', href: '/about' },
  { label: 'Support', href: '/support' },
];

const Header: React.FC<HeaderProps> = ({
  currentPath,
  showDonationButton = true,
  transparent = false,
  sticky = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    if (sticky) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [sticky]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const headerClasses = [
    'w-full transition-all duration-300 z-50',
    sticky ? 'sticky top-0' : 'relative',
    transparent && !isScrolled
      ? 'bg-transparent'
      : 'bg-white/90 dark:bg-mars-darker/90 backdrop-blur-md border-b border-gwern-border dark:border-mars-brown',
    isScrolled ? 'shadow-lg' : '',
  ].join(' ');

  return (
    <header className={headerClasses}>
      <div className="container-mars">
        <nav className="flex items-center justify-between h-16" role="navigation" aria-label="Main navigation">
          {/* Logo */}
          <div className="flex items-center">
            <a
              href="/"
              className="flex items-center space-x-3 text-xl font-display font-bold text-mars-red hover:text-mars-rust transition-colors duration-200"
              aria-label="Mars Population Explorer - Home"
            >
              <svg
                className="w-8 h-8"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="currentColor"
                  opacity="0.2"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx="10"
                  cy="12"
                  r="1.5"
                  fill="currentColor"
                />
                <circle
                  cx="22"
                  cy="14"
                  r="1"
                  fill="currentColor"
                />
                <circle
                  cx="14"
                  cy="20"
                  r="1.2"
                  fill="currentColor"
                />
                <path
                  d="M8 18 C12 22, 20 22, 24 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.6"
                />
              </svg>
              <span className="hidden sm:block">Mars Explorer</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`nav-link ${
                  currentPath === item.href ? 'nav-link-active' : ''
                }`}
                {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              type="button"
              className="p-2 text-gwern-muted hover:text-mars-red dark:hover:text-mars-orange transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-mars-red rounded-md"
              aria-label="Toggle dark mode"
              onClick={() => {
                document.documentElement.classList.toggle('dark');
                localStorage.setItem(
                  'theme',
                  document.documentElement.classList.contains('dark') ? 'dark' : 'light'
                );
              }}
            >
              <svg
                className="w-5 h-5 dark:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
              <svg
                className="w-5 h-5 hidden dark:block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </button>

            {/* Donation Button */}
            {showDonationButton && (
              <a
                href="/support"
                className="btn-mars text-sm px-4 py-2"
                aria-label="Support terraforming research"
              >
                Support Research
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="p-2 text-gwern-muted hover:text-mars-red transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-mars-red rounded-md"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
              onClick={toggleMenu}
            >
              <svg
                className={`w-6 h-6 transition-transform duration-200 ${
                  isMenuOpen ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? 'max-h-96 opacity-100'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="px-2 pt-2 pb-4 space-y-1 bg-white/95 dark:bg-mars-darker/95 backdrop-blur-md border-t border-gwern-border dark:border-mars-brown">
            {navigationItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  currentPath === item.href
                    ? 'bg-mars-red bg-opacity-10 text-mars-red dark:text-mars-orange'
                    : 'text-gwern-ink dark:text-gwern-paper hover:text-mars-red dark:hover:text-mars-orange hover:bg-mars-red hover:bg-opacity-10'
                }`}
                onClick={closeMenu}
                {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {item.label}
              </a>
            ))}
            
            {/* Mobile Actions */}
            <div className="pt-4 border-t border-gwern-border dark:border-mars-brown">
              <div className="flex items-center justify-between px-3">
                {/* Theme Toggle */}
                <button
                  type="button"
                  className="flex items-center space-x-2 p-2 text-gwern-muted hover:text-mars-red dark:hover:text-mars-orange transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-mars-red rounded-md"
                  aria-label="Toggle dark mode"
                  onClick={() => {
                    document.documentElement.classList.toggle('dark');
                    localStorage.setItem(
                      'theme',
                      document.documentElement.classList.contains('dark') ? 'dark' : 'light'
                    );
                  }}
                >
                  <svg
                    className="w-5 h-5 dark:hidden"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <svg
                    className="w-5 h-5 hidden dark:block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="text-sm">Dark Mode</span>
                </button>

                {/* Mobile Donation Button */}
                {showDonationButton && (
                  <a
                    href="/support"
                    className="btn-mars text-sm px-4 py-2"
                    onClick={closeMenu}
                    aria-label="Support terraforming research"
                  >
                    Support
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;