import React from 'react';
import type { LoadingSpinnerProps } from '@/types';

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  text,
  overlay = false,
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  // Mars-themed spinner with orbital animation
  const MarsSpinner = () => (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Central Mars sphere */}
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br from-mars-red to-mars-rust opacity-90 animate-pulse`}
        style={color ? { backgroundColor: color } : {}}
      />
      
      {/* Orbital ring */}
      <div className="absolute inset-0 rounded-full border-2 border-mars-orange border-opacity-30 animate-spin">
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-mars-orange rounded-full animate-pulse" />
      </div>
      
      {/* Secondary orbital ring */}
      <div className="absolute inset-1 rounded-full border border-mars-tan border-opacity-20 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}>
        <div className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-mars-tan rounded-full" />
      </div>
    </div>
  );

  // Simple spinning loader for minimal contexts
  const SimpleSpinner = () => (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      fill="none"
      viewBox="0 0 24 24"
      style={color ? { color } : {}}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const spinner = color ? <SimpleSpinner /> : <MarsSpinner />;

  if (overlay) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        role="status"
        aria-label={text || 'Loading'}
      >
        <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-mars-dark rounded-lg shadow-xl max-w-sm mx-4">
          {spinner}
          {text && (
            <p className={`font-medium text-gwern-ink dark:text-gwern-paper text-center ${textSizeClasses[size]}`}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center space-x-3"
      role="status"
      aria-label={text || 'Loading'}
    >
      {spinner}
      {text && (
        <span className={`font-medium text-gwern-ink dark:text-gwern-paper ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  );
};

// Specialized loading components for different contexts
export const GlobeLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading Mars globe...' }) => (
  <div className="flex flex-col items-center justify-center h-64 space-y-6">
    <div className="relative">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mars-red via-mars-orange to-mars-rust animate-pulse" />
      <div className="absolute inset-0 rounded-full border-4 border-mars-orange border-opacity-30 animate-spin">
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-mars-orange rounded-full animate-bounce" />
      </div>
      <div className="absolute inset-2 rounded-full border-2 border-mars-tan border-opacity-20 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '4s' }}>
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-mars-tan rounded-full" />
      </div>
    </div>
    <div className="text-center">
      <p className="text-lg font-medium text-mars-red dark:text-mars-orange mb-2">{text}</p>
      <p className="text-sm text-gwern-muted">Preparing 3D visualization...</p>
    </div>
  </div>
);

export const DataLoadingSpinner: React.FC<{ text?: string }> = ({ text = 'Loading data...' }) => (
  <div className="flex items-center justify-center space-x-3 p-4">
    <div className="relative w-6 h-6">
      <div className="absolute inset-0 border-2 border-mars-red border-opacity-20 rounded-full" />
      <div className="absolute inset-0 border-2 border-mars-red border-t-transparent rounded-full animate-spin" />
    </div>
    <span className="text-sm font-medium text-gwern-muted">{text}</span>
  </div>
);

export const ArticleLoadingSpinner: React.FC = () => (
  <div className="animate-pulse space-y-4 p-6">
    <div className="h-8 bg-mars-red bg-opacity-20 rounded w-3/4" />
    <div className="space-y-2">
      <div className="h-4 bg-gwern-muted bg-opacity-20 rounded w-full" />
      <div className="h-4 bg-gwern-muted bg-opacity-20 rounded w-5/6" />
      <div className="h-4 bg-gwern-muted bg-opacity-20 rounded w-4/5" />
    </div>
    <div className="h-32 bg-gwern-muted bg-opacity-20 rounded" />
    <div className="space-y-2">
      <div className="h-4 bg-gwern-muted bg-opacity-20 rounded w-full" />
      <div className="h-4 bg-gwern-muted bg-opacity-20 rounded w-3/4" />
    </div>
  </div>
);

export const InlineLoadingSpinner: React.FC<{ size?: 'small' | 'medium'; className?: string }> = ({ 
  size = 'small', 
  className = '' 
}) => (
  <div className={`inline-flex items-center ${className}`}>
    <svg
      className={`animate-spin ${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} text-mars-red`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
);

export default LoadingSpinner;