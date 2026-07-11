import React from 'react';
import { useOrganizations } from '../../context/OrganizationContext.jsx';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export default function OrganizationSearch({ activeCategory, setActiveCategory }) {
  const { searchQuery, setSearchQuery, organizationsList } = useOrganizations();

  // Extract unique categories dynamically
  const categories = React.useMemo(() => {
    const cats = organizationsList.map(org => org.category).filter(Boolean);
    return ['All', ...new Set(cats)];
  }, [organizationsList]);

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="Search institutions, degrees, deadlines, scholarships, requirements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900/40 text-slate-950 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/80 font-semibold transition-all shadow-sm"
        />
      </div>

      {/* Category Pills Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mr-2 flex items-center gap-1">
          <SlidersHorizontal className="h-3 w-3" />
          Filter Category:
        </span>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer ${
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10'
                  : 'bg-white dark:bg-[#12131a]/40 border-slate-205 dark:border-slate-800/80 text-slate-655 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
