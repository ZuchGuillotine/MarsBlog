/**
 * @description      : Expandable category sidebar with navigation links
 * @author           :
 * @group            :
 * @created          : 28/06/2025 - 23:08:03
 *
 * MODIFICATION LOG
 * - Version         : 1.1.0
 * - Date            : 29/07/2026
 * - Modification    : Added real navigation links, touch/mobile support
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

interface SidebarLink {
  label: string;
  href: string;
  description?: string;
}

interface SidebarCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  links: SidebarLink[];
}

const categories: SidebarCategory[] = [
  {
    name: 'Transport',
    icon: Rocket,
    description: 'Transportation systems and infrastructure',
    links: [
      {
        label: 'Orbital Mechanics',
        href: '/orbit',
        description: 'Earth–Mars transfer windows and orbits',
      },
      {
        label: 'Mobility & Maintenance',
        href: '/construction#mobility',
        description: 'Rovers, garages, and surface transport',
      },
    ],
  },
  {
    name: 'Communications',
    icon: Satellite,
    description: 'Communication networks and technology',
    links: [
      {
        label: 'Surface Communications',
        href: '/construction#comms',
        description: 'Mesh networks, relays, and beacons',
      },
    ],
  },
  {
    name: 'Infrastructure',
    icon: Building2,
    description: 'Essential infrastructure and construction',
    links: [
      {
        label: 'Infrastructure Blueprint',
        href: '/construction',
        description: 'Full technical specification',
      },
      {
        label: 'Brick Sintering Project',
        href: '/construction/sintering-bricks',
        description: 'Sintering MGS-1 regolith with solar power',
      },
    ],
  },
  {
    name: 'Regolith',
    icon: Mountain,
    description: 'Martian soil and geological resources',
    links: [
      {
        label: 'Sintering Bricks with MGS-1',
        href: '/construction/sintering-bricks',
        description: 'Parabolic mirrors, bricks, and thermal batteries',
      },
      {
        label: 'Materials Matrix',
        href: '/construction#materials',
        description: 'What Mars can provide locally',
      },
    ],
  },
  {
    name: 'Water',
    icon: Droplets,
    description: 'Water extraction and management systems',
    links: [
      {
        label: 'Water Extraction & Purification',
        href: '/construction#water',
        description: 'Ice mining, desalination, storage',
      },
    ],
  },
  {
    name: 'Radiation',
    icon: Shield,
    description: 'Radiation protection and mitigation',
    links: [
      {
        label: 'Radiation & Storm Shelters',
        href: '/construction#shelter',
        description: 'Shielding strategies and shelters',
      },
    ],
  },
  {
    name: 'Financials',
    icon: DollarSign,
    description: 'Economic planning and resource allocation',
    links: [],
  },
  {
    name: 'Weather',
    icon: Cloud,
    description: 'Atmospheric conditions and climate',
    links: [],
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mouse enter for the entire sidebar (desktop hover)
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  // Handle mouse leave for the entire sidebar (desktop hover)
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      setSelectedCategory(null);
    }, 300); // Small delay to prevent flickering
  };

  // Tapping/clicking an icon toggles the panel — works on touch devices
  const handleCategoryClick = (categoryName: string) => {
    if (isExpanded && selectedCategory === categoryName) {
      setIsExpanded(false);
      setSelectedCategory(null);
    } else {
      setIsExpanded(true);
      setSelectedCategory(categoryName);
    }
  };

  // Collapse when tapping/clicking outside the sidebar (touch devices
  // never fire mouseleave, so this is the mobile close path)
  useEffect(() => {
    const handleOutside = (event: PointerEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
        setSelectedCategory(null);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, []);

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
              className={`p-3 transition-all duration-200 hover:bg-gray-600 ${
                selectedCategory === category.name ? 'bg-mars-red' : ''
              } ${index === 0 ? 'rounded-tl-lg' : ''} ${
                index === categories.length - 1 ? 'rounded-bl-lg' : ''
              } border-b border-gray-600 last:border-b-0`}
              title={category.name}
              aria-expanded={isExpanded && selectedCategory === category.name}
            >
              <IconComponent className="w-6.5 h-6.5 text-white" />
            </button>
          );
        })}
      </div>

      {/* Expandable content panel */}
      <div
        className={`absolute right-12 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-gray-700 backdrop-blur-md rounded-l-lg shadow-2xl border-l border-gray-600">
          <div className="w-72 max-w-[calc(100vw-3.5rem)] max-h-[70vh] overflow-y-auto scrollbar-mars">
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
                const isSelected = selectedCategory === category.name;
                return (
                  <div key={category.name} className="mb-2">
                    <button
                      onClick={() =>
                        setSelectedCategory(isSelected ? null : category.name)
                      }
                      className={`w-full text-left p-3 transition-all duration-200 ${
                        isSelected
                          ? 'bg-mars-red/20 border-l-4 border-l-mars-red'
                          : 'hover:bg-gray-600'
                      }`}
                      aria-expanded={isSelected}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-6.5 h-6.5 text-white" />
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {category.name}
                          </div>
                          {isSelected && category.description && (
                            <div className="text-sm text-gray-300 mt-1">
                              {category.description}
                            </div>
                          )}
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                            isSelected ? 'rotate-90' : ''
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

                    {isSelected && (
                      <div className="ml-6 pl-4 border-l border-gray-600 mt-2 pb-1">
                        {category.links.length > 0 ? (
                          <ul className="space-y-1">
                            {category.links.map(link => (
                              <li key={link.href + link.label}>
                                <a
                                  href={link.href}
                                  className="block p-2 -ml-2 rounded hover:bg-gray-600 transition-colors"
                                >
                                  <span className="text-sm font-medium text-mars-orange">
                                    {link.label}
                                  </span>
                                  {link.description && (
                                    <span className="block text-xs text-gray-300 mt-0.5">
                                      {link.description}
                                    </span>
                                  )}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400 italic p-2 -ml-2">
                            Articles coming soon.
                          </p>
                        )}
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
