/**
 * @description      :
 * @author           :
 * @group            :
 * @created          : 28/06/2025 - 23:08:03
 *
 * MODIFICATION LOG
 * - Version         : 1.0.0
 * - Date            : 28/06/2025
 * - Author          :
 * - Modification    :
 **/
import React, { useState, useRef, useEffect } from 'react';
import {
  Rocket,
  Satellite,
  Building2,
  Mountain,
  Droplets,
  Shield,
  DollarSign,
  Cloud,
} from 'lucide-react';

interface SidebarCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const categories: SidebarCategory[] = [
  {
    name: 'Transport',
    icon: Rocket,
    description: 'Transportation systems and infrastructure',
  },
  {
    name: 'Communications',
    icon: Satellite,
    description: 'Communication networks and technology',
  },
  {
    name: 'Infrastructure',
    icon: Building2,
    description: 'Essential infrastructure and construction',
  },
  {
    name: 'Regolith',
    icon: Mountain,
    description: 'Martian soil and geological resources',
  },
  {
    name: 'Water',
    icon: Droplets,
    description: 'Water extraction and management systems',
  },
  {
    name: 'Radiation',
    icon: Shield,
    description: 'Radiation protection and mitigation',
  },
  {
    name: 'Financials',
    icon: DollarSign,
    description: 'Economic planning and resource allocation',
  },
  {
    name: 'Weather',
    icon: Cloud,
    description: 'Atmospheric conditions and climate',
  },
];

interface ExpandableSidebarProps {
  className?: string;
}

const ExpandableSidebar: React.FC<ExpandableSidebarProps> = ({
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mouse enter for the entire sidebar
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  // Handle mouse leave for the entire sidebar
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      setSelectedCategory(null);
    }, 300); // Small delay to prevent flickering
  };

  const handleCategoryClick = (categoryName: string) => {
    if (isExpanded) {
      setSelectedCategory(
        selectedCategory === categoryName ? null : categoryName
      );
    } else {
      setIsExpanded(true);
      setSelectedCategory(categoryName);
    }
  };

  const handleCategoryHover = (categoryName: string | null) => {
    setHoveredCategory(categoryName);
    if (categoryName && !isExpanded) {
      setIsExpanded(true);
      setSelectedCategory(categoryName);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={sidebarRef}
      className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Always visible icon column */}
      <div className="bg-gray-700 shadow-2xl border-l border-gray-600 flex flex-col">
        {categories.map((category, index) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.name}
              onClick={() => handleCategoryClick(category.name)}
              onMouseEnter={() => handleCategoryHover(category.name)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`p-3 transition-all duration-200 hover:bg-gray-600 ${
                selectedCategory === category.name ? 'bg-mars-red' : ''
              } ${index === 0 ? 'rounded-tl-lg' : ''} ${
                index === categories.length - 1 ? 'rounded-bl-lg' : ''
              } border-b border-gray-600 last:border-b-0`}
              title={category.name}
            >
              <IconComponent className="w-6.5 h-6.5 text-white" />
            </button>
          );
        })}
      </div>

      {/* Expandable content panel */}
      <div
        className={`absolute right-12 top-0 transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-gray-700 backdrop-blur-md rounded-l-lg shadow-2xl border-l border-gray-600">
          <div className="w-80 max-h-[70vh] overflow-y-auto scrollbar-mars">
            {/* Header */}
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-lg font-display font-semibold text-white">
                    Mars Systems
                  </h2>
                  <p className="text-sm text-gray-300 mt-1">
                    Explore terraforming categories
                  </p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="p-2">
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <div key={category.name} className="mb-2">
                    <button
                      onClick={() =>
                        setSelectedCategory(
                          selectedCategory === category.name
                            ? null
                            : category.name
                        )
                      }
                      className={`w-full text-left p-3 transition-all duration-200 ${
                        selectedCategory === category.name
                          ? 'bg-mars-red/20 border-l-4 border-l-mars-red'
                          : 'hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-6.5 h-6.5 text-white" />
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {category.name}
                          </div>
                          {selectedCategory === category.name &&
                            category.description && (
                              <div className="text-sm text-gray-300 mt-1">
                                {category.description}
                              </div>
                            )}
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                            selectedCategory === category.name
                              ? 'rotate-90'
                              : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>

                    {selectedCategory === category.name && (
                      <div className="ml-6 pl-4 border-l border-gray-600 mt-2">
                        <div className="text-sm text-gray-300 space-y-2">
                          <p>
                            Detailed information about{' '}
                            {category.name.toLowerCase()} systems for Mars
                            terraforming.
                          </p>
                          <div className="flex space-x-2">
                            <button className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1 transition-colors">
                              Learn More
                            </button>
                            <button className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-3 py-1 transition-colors">
                              Explore
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpandableSidebar;
