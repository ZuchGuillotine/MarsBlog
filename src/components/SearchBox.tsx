import { useState, useEffect, useRef, useMemo } from 'react';
import type { SearchResult, SearchDocument } from '../utils/searchIndex';

interface SearchBoxProps {
  placeholder?: string;
  maxResults?: number;
  onResultSelect?: (result: SearchDocument) => void;
  className?: string;
}

export default function SearchBox({ 
  placeholder = "Search articles and locations...", 
  maxResults = 10,
  onResultSelect,
  className = "" 
}: SearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        // In a real implementation, this would use the search index
        // For now, we'll simulate the search
        const mockResults: SearchResult[] = [
          {
            document: {
              id: 'sample-1',
              title: 'Transportation Systems for Mars',
              description: 'Exploring rocket technology and surface transport options',
              content: 'Sample content about Mars transportation...',
              url: '/blog/transportation-systems',
              type: 'article',
              category: 'transportation',
              tags: ['rockets', 'transport'],
            },
            score: 0.95,
            matches: {}
          },
          {
            document: {
              id: 'sample-2',
              title: 'Olympus Mons',
              description: 'The largest volcano in the solar system',
              content: 'Sample content about Olympus Mons...',
              url: '/locations/olympus-mons',
              type: 'location',
              category: 'Tharsis',
              tags: ['volcano', 'landmark'],
            },
            score: 0.87,
            matches: {}
          }
        ].filter(result => 
          result.document.title.toLowerCase().includes(query.toLowerCase()) ||
          result.document.description.toLowerCase().includes(query.toLowerCase())
        );
        
        setResults(mockResults.slice(0, maxResults));
        setIsOpen(mockResults.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, maxResults]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultSelect(results[selectedIndex].document);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          searchInputRef.current?.blur();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);
  
  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleResultSelect = (document: SearchDocument) => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
    
    if (onResultSelect) {
      onResultSelect(document);
    } else {
      // Navigate to the result URL
      window.location.href = document.url;
    }
  };
  
  const highlightQuery = (text: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-mars-orange/30 text-mars-orange">
          {part}
        </mark>
      ) : part
    );
  };
  
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'article':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'location':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };
  
  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mars-orange focus:border-transparent"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && results.length > 0 && setIsOpen(true)}
          autoComplete="off"
          spellCheck="false"
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-mars-orange"></div>
          </div>
        )}
      </div>
      
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-auto">
          <div className="py-2">
            {results.map((result, index) => (
              <button
                key={result.document.id}
                className={`w-full px-4 py-3 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors ${
                  index === selectedIndex ? 'bg-gray-700' : ''
                }`}
                onClick={() => handleResultSelect(result.document)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1 text-gray-400">
                    {getResultIcon(result.document.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-white truncate">
                        {highlightQuery(result.document.title)}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        result.document.type === 'article' 
                          ? 'bg-mars-red/20 text-mars-orange' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {result.document.type}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {highlightQuery(result.document.description)}
                    </p>
                    
                    {result.document.category && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">
                          {result.document.category}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="px-4 py-2 border-t border-gray-700 bg-gray-900/50">
            <p className="text-xs text-gray-500">
              Press <kbd className="px-1 py-0.5 text-xs bg-gray-700 rounded">↑</kbd>
              <kbd className="px-1 py-0.5 text-xs bg-gray-700 rounded ml-1">↓</kbd> to navigate,
              <kbd className="px-1 py-0.5 text-xs bg-gray-700 rounded ml-1">Enter</kbd> to select,
              <kbd className="px-1 py-0.5 text-xs bg-gray-700 rounded ml-1">Esc</kbd> to close
            </p>
          </div>
        </div>
      )}
      
      {isOpen && query && !isLoading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
          <div className="px-4 py-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or browse our categories.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}