import React, { useState } from 'react';
import type { FooterProps, SocialLink } from '@/types';

const socialLinks: SocialLink[] = [
  {
    name: 'Twitter',
    url: 'https://twitter.com/marsexplorer',
    icon: 'twitter',
    label: 'Follow us on Twitter',
  },
  {
    name: 'GitHub',
    url: 'https://github.com/stacktrackerlabs/mars-explorer',
    icon: 'github',
    label: 'View source code on GitHub',
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com/company/stacktrackerlabs',
    icon: 'linkedin',
    label: 'Connect on LinkedIn',
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/@marsexplorer',
    icon: 'youtube',
    label: 'Watch videos on YouTube',
  },
];

const footerLinks = {
  explore: [
    { label: 'Interactive Globe', href: '/' },
    { label: 'Location Database', href: '/locations' },
    { label: 'Research Articles', href: '/explore' },
    { label: 'Mission Timeline', href: '/timeline' },
  ],
  learn: [
    { label: 'About Terraforming', href: '/about' },
    { label: 'Scientific Method', href: '/methodology' },
    { label: 'Current Research', href: '/research' },
    { label: 'Future Missions', href: '/missions' },
  ],
  support: [
    { label: 'Donate', href: '/support' },
    { label: 'Newsletter', href: '/newsletter' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Partnership', href: '/partnership' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Attribution', href: '/attribution' },
  ],
};

const Footer: React.FC<FooterProps> = ({
  showNewsletter = true,
  showSocialLinks = true,
  compactMode = false,
}) => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    
    try {
      // Placeholder for newsletter signup logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubscriptionStatus('success');
      setEmail('');
      
      // Reset status after 3 seconds
      setTimeout(() => setSubscriptionStatus('idle'), 3000);
    } catch (error) {
      setSubscriptionStatus('error');
      setTimeout(() => setSubscriptionStatus('idle'), 3000);
    } finally {
      setIsSubscribing(false);
    }
  };

  const SocialIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className = "w-5 h-5" }) => {
    switch (icon) {
      case 'twitter':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
          </svg>
        );
      case 'github':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (compactMode) {
    return (
      <footer className="bg-white dark:bg-mars-darker border-t border-gwern-border dark:border-mars-brown">
        <div className="container-mars py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gwern-muted">
              <span>&copy; 2025 StackTracker Labs</span>
              <a href="/privacy" className="hover:text-mars-red transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-mars-red transition-colors">Terms</a>
            </div>
            
            {showSocialLinks && (
              <div className="flex items-center space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gwern-muted hover:text-mars-red dark:hover:text-mars-orange transition-colors duration-200"
                    aria-label={social.label}
                  >
                    <SocialIcon icon={social.icon} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-white dark:bg-mars-darker border-t border-gwern-border dark:border-mars-brown">
      <div className="container-mars py-12">
        {/* Newsletter Section */}
        {showNewsletter && (
          <div className="mb-12 p-8 bg-gradient-mars-subtle rounded-lg border border-mars-red/20">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-2xl font-display font-semibold text-mars-red dark:text-mars-orange mb-4">
                Stay Updated on Mars Exploration
              </h3>
              <p className="text-gwern-muted mb-6">
                Get the latest research updates, mission news, and terraforming insights delivered to your inbox.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <div className="flex-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input-mars"
                    required
                    disabled={isSubscribing}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubscribing || !email.trim()}
                  className="btn-mars whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
              
              {subscriptionStatus === 'success' && (
                <p className="mt-4 text-green-600 dark:text-green-400 text-sm">
                  Thank you for subscribing! Check your email for confirmation.
                </p>
              )}
              
              {subscriptionStatus === 'error' && (
                <p className="mt-4 text-red-600 dark:text-red-400 text-sm">
                  Something went wrong. Please try again.
                </p>
              )}
              
              <p className="mt-4 text-xs text-gwern-muted">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        )}

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Explore */}
          <div>
            <h4 className="text-lg font-display font-semibold text-mars-red dark:text-mars-orange mb-4">
              Explore
            </h4>
            <ul className="space-y-2">
              {footerLinks.explore.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gwern-muted hover:text-mars-red dark:hover:text-mars-orange transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="text-lg font-display font-semibold text-mars-red dark:text-mars-orange mb-4">
              Learn
            </h4>
            <ul className="space-y-2">
              {footerLinks.learn.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gwern-muted hover:text-mars-red dark:hover:text-mars-orange transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-display font-semibold text-mars-red dark:text-mars-orange mb-4">
              Support
            </h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gwern-muted hover:text-mars-red dark:hover:text-mars-orange transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-display font-semibold text-mars-red dark:text-mars-orange mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gwern-muted hover:text-mars-red dark:hover:text-mars-orange transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gwern-border dark:border-mars-brown">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            {/* Logo and Copyright */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <svg
                  className="w-8 h-8 text-mars-red"
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
                </svg>
                <div>
                  <div className="font-display font-bold text-mars-red">Mars Explorer</div>
                  <div className="text-sm text-gwern-muted">
                    &copy; 2025 StackTracker Labs. All rights reserved.
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {showSocialLinks && (
              <div className="flex items-center space-x-6">
                <span className="text-sm text-gwern-muted hidden sm:block">Follow us:</span>
                <div className="flex items-center space-x-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gwern-muted hover:text-mars-red dark:hover:text-mars-orange transition-colors duration-200"
                      aria-label={social.label}
                    >
                      <SocialIcon icon={social.icon} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attribution */}
          <div className="mt-4 pt-4 border-t border-gwern-border dark:border-mars-brown text-center">
            <p className="text-xs text-gwern-muted">
              Mars surface data courtesy of NASA/JPL. Built with passion for space exploration and scientific discovery.
              <br />
              This project is open source and dedicated to advancing terraforming research.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;