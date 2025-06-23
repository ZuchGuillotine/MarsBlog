import React, { useEffect, useRef } from 'react';
import type { InfoPanelProps } from '@/types';

const InfoPanel: React.FC<InfoPanelProps> = ({
  location,
  isVisible,
  onClose,
  onReadMore,
  position = 'right',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation and focus management
  useEffect(() => {
    if (isVisible && panelRef.current) {
      // Focus the panel when it opens
      panelRef.current.focus();
      
      // Add escape key listener
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onClose]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!location && !isVisible) return null;

  const positionClasses = {
    right: 'right-4 top-1/2 -translate-y-1/2 max-w-sm w-80',
    left: 'left-4 top-1/2 -translate-y-1/2 max-w-sm w-80',
    bottom: 'bottom-4 left-1/2 -translate-x-1/2 max-w-2xl w-full mx-4',
  };

  const animationClasses = {
    right: isVisible ? 'animate-slide-in-right' : 'animate-slide-out-right',
    left: isVisible ? 'animate-slide-in-left' : 'animate-slide-out-left',
    bottom: isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-4',
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-600 dark:text-green-400';
    if (rating >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (rating >= 4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 8) return 'Excellent';
    if (rating >= 6) return 'Good';
    if (rating >= 4) return 'Moderate';
    return 'Limited';
  };

  return (
    <div
      ref={panelRef}
      className={`
        fixed z-40 
        ${positionClasses[position]}
        ${animationClasses[position]}
        ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}
        transition-all duration-300 ease-out
      `}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-panel-title"
      aria-describedby="info-panel-description"
      tabIndex={-1}
    >
      <div className="card-mars backdrop-blur-md bg-white/95 dark:bg-mars-dark/95 shadow-2xl max-h-[80vh] overflow-y-auto scrollbar-mars">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {location ? (
              <>
                <h3 id="info-panel-title" className="text-xl font-display font-semibold text-mars-red dark:text-mars-orange mb-1">
                  {location.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gwern-muted">
                  <span>
                    {Math.abs(location.coordinates.lat).toFixed(2)}°
                    {location.coordinates.lat >= 0 ? 'N' : 'S'}
                  </span>
                  <span>
                    {Math.abs(location.coordinates.lng).toFixed(2)}°
                    {location.coordinates.lng >= 0 ? 'E' : 'W'}
                  </span>
                  <span>{location.elevation.toLocaleString()}m</span>
                </div>
              </>
            ) : (
              <div className="animate-pulse">
                <div className="h-6 bg-mars-red/20 rounded mb-2"></div>
                <div className="h-4 bg-gwern-muted/20 rounded w-2/3"></div>
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gwern-muted hover:text-mars-red dark:hover:text-mars-orange transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-mars-red"
            aria-label="Close information panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {location ? (
          <>
            {/* Description */}
            <div id="info-panel-description" className="mb-6">
              <p className="text-gwern-ink dark:text-gwern-paper leading-relaxed">
                {location.description}
              </p>
            </div>

            {/* Terraforming Potential */}
            <div className="mb-6">
              <h4 className="text-lg font-display font-medium text-mars-red dark:text-mars-orange mb-3">
                Terraforming Potential
              </h4>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gwern-ink dark:text-gwern-paper">
                  Overall Rating
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-bold ${getRatingColor(location.terraformingPotential.rating)}`}>
                    {location.terraformingPotential.rating}/10
                  </span>
                  <span className={`text-sm px-2 py-1 rounded-full ${getRatingColor(location.terraformingPotential.rating)} bg-current bg-opacity-10`}>
                    {getRatingLabel(location.terraformingPotential.rating)}
                  </span>
                </div>
              </div>

              {/* Rating Bar */}
              <div className="w-full bg-gray-200 dark:bg-mars-brown rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    location.terraformingPotential.rating >= 8
                      ? 'bg-green-500'
                      : location.terraformingPotential.rating >= 6
                      ? 'bg-yellow-500'
                      : location.terraformingPotential.rating >= 4
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${(location.terraformingPotential.rating / 10) * 100}%` }}
                />
              </div>

              {/* Key Factors */}
              <div>
                <span className="text-sm font-medium text-gwern-ink dark:text-gwern-paper mb-2 block">
                  Key Factors:
                </span>
                <div className="flex flex-wrap gap-2">
                  {location.terraformingPotential.factors.map((factor, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-mars-red bg-opacity-10 text-mars-red dark:text-mars-orange text-xs rounded-full border border-mars-red border-opacity-20"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Related Articles */}
            {location.relatedArticles && location.relatedArticles.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-display font-medium text-mars-red dark:text-mars-orange mb-3">
                  Related Research
                </h4>
                <div className="space-y-2">
                  {location.relatedArticles.slice(0, 3).map((articleSlug, index) => (
                    <button
                      key={index}
                      onClick={() => onReadMore(articleSlug)}
                      className="w-full text-left p-3 rounded-lg border border-gwern-border dark:border-mars-brown hover:border-mars-red dark:hover:border-mars-orange hover:bg-mars-red hover:bg-opacity-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-mars-red"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gwern-accent dark:text-mars-orange capitalize">
                          {articleSlug.replace(/-/g, ' ')}
                        </span>
                        <svg className="w-4 h-4 text-gwern-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onReadMore(location.id)}
                className="btn-mars flex-1 text-sm"
              >
                Read Full Analysis
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${location.name}: ${location.coordinates.lat}, ${location.coordinates.lng} - Mars Explorer`
                  );
                }}
                className="btn-mars-outline flex-1 text-sm"
                title="Copy coordinates to clipboard"
              >
                Share Location
              </button>
            </div>

            {/* Image Preview (if available) */}
            {location.imageUrl && (
              <div className="mt-6">
                <img
                  src={location.imageUrl}
                  alt={`Satellite view of ${location.name}`}
                  className="w-full h-32 object-cover rounded-lg border border-gwern-border dark:border-mars-brown"
                  loading="lazy"
                />
              </div>
            )}
          </>
        ) : (
          /* Loading State */
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gwern-muted/20 rounded w-full"></div>
            <div className="h-4 bg-gwern-muted/20 rounded w-3/4"></div>
            <div className="h-4 bg-gwern-muted/20 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gwern-muted/20 rounded w-full"></div>
              <div className="h-3 bg-gwern-muted/20 rounded w-2/3"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-gwern-muted/20 rounded flex-1"></div>
              <div className="h-8 bg-gwern-muted/20 rounded flex-1"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;