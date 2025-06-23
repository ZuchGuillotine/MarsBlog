import React, { useEffect } from 'react';
import type { LocationPanelProps } from '../types';

const LocationPanel: React.FC<LocationPanelProps> = ({ 
  location, 
  isVisible, 
  onClose 
}) => {
  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onClose]);

  if (!location) return null;

  return (
    <>
      {/* Backdrop */}
      {isVisible && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Panel */}
      <div className={`
        fixed lg:absolute top-0 right-0 h-full w-full lg:w-96 
        bg-gradient-to-br from-dark-800 to-dark-900 
        border-l border-dark-600 shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-x-0' : 'translate-x-full'}
        overflow-y-auto
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-dark-800/95 backdrop-blur-sm border-b border-dark-600 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-display font-semibold text-white">
                {location.name}
              </h2>
              <p className="text-sm text-mars-400 mt-1">
                {location.coordinates.lat.toFixed(2)}°N, {Math.abs(location.coordinates.lng).toFixed(2)}°W
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-dark-700"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Elevation Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-mars-900/50 border border-mars-600">
            <svg className="w-4 h-4 text-mars-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
            </svg>
            <span className="text-mars-300 text-sm font-medium">
              {location.elevation.toLocaleString()}m elevation
            </span>
          </div>

          {/* Description */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Overview</h3>
            <p className="text-gray-300 leading-relaxed font-body">
              {location.description}
            </p>
          </section>

          {/* Terraforming Potential */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Terraforming Potential
            </h3>
            <p className="text-gray-300 leading-relaxed font-body">
              {location.terraformingRationale}
            </p>
          </section>

          {/* External Links */}
          {location.externalLinks && location.externalLinks.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">Research & References</h3>
              <div className="space-y-2">
                {location.externalLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors border border-dark-600 hover:border-mars-500 group"
                  >
                    <svg className="w-4 h-4 text-mars-400 mr-3 group-hover:text-mars-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="text-gray-300 group-hover:text-white text-sm">
                      {link.title}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Blog Link */}
          {location.blogSlug && (
            <section>
              <a
                href={`/blog/${location.blogSlug}`}
                className="block p-4 rounded-lg bg-gradient-to-r from-mars-600 to-mars-700 hover:from-mars-500 hover:to-mars-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white mb-1">Deep Dive Article</h4>
                    <p className="text-mars-100 text-sm">
                      Explore detailed analysis and research
                    </p>
                  </div>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </a>
            </section>
          )}

          {/* Quick Stats */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3">Quick Facts</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-dark-700/30 border border-dark-600">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Latitude</div>
                <div className="text-lg font-semibold text-white">
                  {location.coordinates.lat > 0 ? '+' : ''}{location.coordinates.lat.toFixed(2)}°
                </div>
              </div>
              <div className="p-3 rounded-lg bg-dark-700/30 border border-dark-600">
                <div className="text-xs text-gray-400 uppercase tracking-wide">Longitude</div>
                <div className="text-lg font-semibold text-white">
                  {location.coordinates.lng > 0 ? '+' : ''}{location.coordinates.lng.toFixed(2)}°
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-dark-800/95 backdrop-blur-sm border-t border-dark-600 p-4">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors font-medium"
          >
            Close Panel
          </button>
        </div>
      </div>
    </>
  );
};

export default LocationPanel;