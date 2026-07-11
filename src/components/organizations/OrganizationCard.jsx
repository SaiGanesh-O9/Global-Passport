import React from 'react';
import { CheckCircle2, MapPin, ChevronRight, GraduationCap } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { organizationsData } from '../../data/organizations/index.js';

export default function OrganizationCard({ org, onClick }) {
  const details = organizationsData[org.id] || {};
  const programsList = details.programs || [];

  // Determine beautiful custom visual gradients based on the school colors
  const getGradientClass = (id) => {
    switch (id) {
      case 'org-stanford':
        return 'from-[#8C1515] to-[#B26F2C]';
      case 'org-iowastate':
        return 'from-[#C8102E] to-[#F1BE48]';
      case 'org-ucm':
        return 'from-[#D00C2D] to-[#1E293B]';
      default:
        return 'from-blue-600 to-indigo-600';
    }
  };

  return (
    <Card
      onClick={onClick}
      className="bg-white/80 dark:bg-[#0f111a]/60 border border-slate-200/80 dark:border-slate-850/60 shadow-md hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-500/20 flex flex-col justify-between overflow-hidden relative group hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] cursor-pointer h-full rounded-2xl"
    >
      {/* Visual glowing border overlay */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/10 pointer-events-none rounded-2xl transition-all duration-300" />

      {/* Campus Gradient Banner */}
      <div className="h-28 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-900">
        <div className={`absolute inset-0 bg-gradient-to-tr ${getGradientClass(org.id)} opacity-90 group-hover:scale-105 transition-transform duration-500`} />
        
        {/* Modern grid overlays for Stripe/Linear tech feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Soft shadow gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Category Chip */}
        <span className="absolute top-3 left-3 text-[8px] font-extrabold uppercase bg-black/40 backdrop-blur-md text-white border border-white/10 px-2 py-0.5 rounded-md tracking-wider">
          {org.category}
        </span>
      </div>

      {/* Profile Details Area */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 -mt-8 relative z-10">
        <div className="space-y-4">
          
          {/* Logo & School Name Row */}
          <div className="flex items-end gap-3.5">
            <div className="h-15 w-15 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c0d12] p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-md group-hover:scale-102 transition-transform duration-300">
              {org.logo ? (
                <img 
                  src={org.logo} 
                  alt={`${org.name} Logo`} 
                  loading="lazy" 
                  className="h-full w-full object-contain rounded-xl" 
                />
              ) : (
                <GraduationCap className="h-7 w-7 text-slate-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-extrabold text-slate-950 dark:text-white truncate leading-none">
                  {org.name}
                </h3>
                {org.verified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" title="Verified Institution" />
                )}
              </div>
              <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-extrabold mt-1.5 uppercase tracking-wider">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>
                  {org.state ? `${org.state}, ` : ''}{org.country || 'Global'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-semibold">
            {org.description}
          </p>

          {/* Featured Programs chips */}
          {programsList.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Top Programs
              </span>
              <div className="flex flex-wrap gap-1">
                {programsList.slice(0, 2).map((prog) => (
                  <span
                    key={prog.id}
                    className="text-[9px] font-bold bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/40 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded-lg transition-colors group-hover:border-blue-500/10"
                  >
                    {prog.name}
                  </span>
                ))}
                {programsList.length > 2 && (
                  <span className="text-[9px] font-bold bg-slate-100/50 dark:bg-slate-800/20 text-slate-400 px-1.5 py-0.5 rounded-lg">
                    +{programsList.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* View Details Action Link */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-850/60 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <span>Explore Institution</span>
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-300" />
        </div>

      </div>
    </Card>
  );
}
