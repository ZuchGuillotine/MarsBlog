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
import { ChevronRight } from 'lucide-react';

type SystemIconName =
  | 'transport'
  | 'communications'
  | 'infrastructure'
  | 'regolith'
  | 'water'
  | 'radiation'
  | 'financials'
  | 'weather';

// Compact, consistent line icons designed for the sidebar's two sizes.
const SystemIcon: React.FC<{ name: SystemIconName; className?: string }> = ({
  name,
  className = '',
}) => {
  const drawings: Record<SystemIconName, React.ReactNode> = {
    transport: (
      <>
        <path d="M4 16.5c2.2-5.5 7.1-9.4 13.3-10.5" />
        <path d="m14.5 4.5 3.2 1.4-2.3 2.7" />
        <path d="M5.5 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M9 19.5c3.6.8 7.4-.1 10.5-2.5" />
      </>
    ),
    communications: (
      <>
        <path d="M12 13.5v7" />
        <path d="M8.5 20.5h7" />
        <path d="M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
        <path d="M7.8 8.3a6 6 0 0 0 0 7" />
        <path d="M16.2 8.3a6 6 0 0 1 0 7" />
        <path d="M5 5.4a10 10 0 0 0 0 12.8" />
        <path d="M19 5.4a10 10 0 0 1 0 12.8" />
      </>
    ),
    infrastructure: (
      <>
        <path d="M2.5 19.5h19" />
        <path d="M4.5 19.5v-4.2a7.5 7.5 0 0 1 15 0v4.2" />
        <path d="M8 19.5v-3h8v3" />
        <path d="M12 7.8v-3.3" />
        <path d="M9.5 4.5h5" />
      </>
    ),
    regolith: (
      <>
        <path d="m3 8 5-3 4 2 4-2 5 3" />
        <path d="m3 12 5-3 4 2 4-2 5 3" />
        <path d="m3 16 5-3 4 2 4-2 5 3" />
        <path d="m3 20 5-3 4 2 4-2 5 3" />
      </>
    ),
    water: (
      <>
        <path d="M12 3.5c-2.9 4-6 7.6-6 11a6 6 0 0 0 12 0c0-3.4-3.1-7-6-11Z" />
        <path d="M8.8 15.2c.4 1.4 1.3 2.2 2.8 2.5" />
        <path d="M14.5 17.5h3" />
      </>
    ),
    radiation: (
      <>
        <path d="M12 2.8 20 6v5.2c0 4.6-3.1 8.1-8 10-4.9-1.9-8-5.4-8-10V6l8-3.2Z" />
        <path d="M12 7v2.5" />
        <path d="m8 15 2.2-1.3" />
        <path d="m16 15-2.2-1.3" />
        <circle cx="12" cy="12" r="1.5" />
      </>
    ),
    financials: (
      <>
        <path d="M4 19.5h16" />
        <path d="M6 16v-4" />
        <path d="M10 16V9" />
        <path d="M14 16v-5" />
        <path d="M18 16V6" />
        <path d="m5 7 5-3 4 2 5-3" />
      </>
    ),
    weather: (
      <>
        <path d="M7 7.5a4 4 0 0 1 7.6-1.7" />
        <path d="M17.8 13.5a3.2 3.2 0 0 0-1.1-6.2 4.6 4.6 0 0 0-8.6 1.2A3.7 3.7 0 0 0 6 15.5h11" />
        <path d="M4 19h11" />
        <path d="M18 19h2" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {drawings[name]}
    </svg>
  );
};

interface SidebarLink {
  label: string;
  href: string;
  description?: string;
}

interface SidebarCategory {
  name: string;
  icon: SystemIconName;
  description?: string;
  links: SidebarLink[];
}

const categories: SidebarCategory[] = [
  {
    name: 'Transport',
    icon: 'transport',
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
    icon: 'communications',
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
    icon: 'infrastructure',
    description: 'Essential infrastructure and construction',
    links: [
      {
        label: 'Infrastructure Blueprint',
        href: '/construction',
        description: 'Full technical specification',
      },
      {
        label: 'Solar Regolith Paving',
        href: '/construction/sintering-bricks',
        description: 'Paving pads and roads with concentrated sunlight',
      },
    ],
  },
  {
    name: 'Regolith',
    icon: 'regolith',
    description: 'Martian soil and geological resources',
    links: [
      {
        label: 'Solar Regolith Paving',
        href: '/construction/sintering-bricks',
        description: 'Melting local rock into road base',
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
    icon: 'water',
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
    icon: 'radiation',
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
    icon: 'financials',
    description: 'Economic planning and resource allocation',
    links: [],
  },
  {
    name: 'Weather',
    icon: 'weather',
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
      <div className="flex flex-col overflow-hidden rounded-l-2xl border border-r-0 border-white/15 bg-slate-950/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {categories.map(category => {
          const isSelected = selectedCategory === category.name;
          return (
            <button
              key={category.name}
              onClick={() => handleCategoryClick(category.name)}
              className={`group relative flex h-[52px] w-[52px] items-center justify-center border-b border-white/10 transition-colors duration-200 last:border-b-0 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-mars-orange ${
                isSelected
                  ? 'bg-mars-orange/15 text-mars-orange'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              title={category.name}
              aria-label={category.name}
              aria-expanded={isExpanded && selectedCategory === category.name}
            >
              {isSelected && (
                <span className="absolute inset-y-3 left-0 w-0.5 rounded-r bg-mars-orange" />
              )}
              <SystemIcon
                name={category.icon}
                className="h-[22px] w-[22px] transition-transform duration-200 group-hover:scale-110"
              />
            </button>
          );
        })}
      </div>

      {/* Expandable content panel */}
      <div
        className={`absolute right-[52px] top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="rounded-l-2xl border border-r-0 border-white/15 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="systems-scrollbar max-h-[78vh] w-72 max-w-[calc(100vw-3.5rem)] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-base font-display font-semibold tracking-wide text-white">
                    Mars Systems
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Explore terraforming categories
                  </p>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-1 p-2">
              {categories.map(category => {
                const isSelected = selectedCategory === category.name;
                return (
                  <div key={category.name}>
                    <button
                      onClick={() =>
                        setSelectedCategory(isSelected ? null : category.name)
                      }
                      className={`group w-full rounded-xl px-2.5 py-2 text-left transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-mars-orange ${
                        isSelected
                          ? 'bg-mars-orange/10'
                          : 'hover:bg-white/[0.07]'
                      }`}
                      aria-expanded={isSelected}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200 ${
                            isSelected
                              ? 'border-mars-orange/35 bg-mars-orange/15 text-mars-orange'
                              : 'border-white/10 bg-white/5 text-slate-300 group-hover:border-white/20 group-hover:text-white'
                          }`}
                        >
                          <SystemIcon
                            name={category.icon}
                            className="h-5 w-5"
                          />
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">
                            {category.name}
                          </div>
                          {isSelected && category.description && (
                            <div className="mt-1 text-xs leading-relaxed text-slate-400">
                              {category.description}
                            </div>
                          )}
                        </div>
                        <ChevronRight
                          aria-hidden="true"
                          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                            isSelected ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isSelected && (
                      <div className="ml-[30px] mt-1 border-l border-white/15 pb-1 pl-5">
                        {category.links.length > 0 ? (
                          <ul className="space-y-1">
                            {category.links.map(link => (
                              <li key={link.href + link.label}>
                                <a
                                  href={link.href}
                                  className="-ml-2 block rounded-lg p-2 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-mars-orange"
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
