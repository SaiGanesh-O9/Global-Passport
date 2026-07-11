import React from 'react';
import { CheckCircle2, MapPin, ChevronRight, GraduationCap } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { organizationsData } from '../../data/organizations/index.js';

export default function OrganizationCard({ org, onClick }) {
  const details = organizationsData[org.id] || {};
  const programsList = details.programs || [];

  return (
    <Card
      onClick={onClick}
      className="bg-white dark:bg-[#12131a]/60 border border-slate-205 dark:border-slate-800/40 shadow-sm flex flex-col justify-between overflow-hidden relative group hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-300 cursor-pointer h-full"
    >
      {/* Banner Image */}
      <div className="h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
        {org.banner ? (
          <img
            src={org.banner}
            alt={`${org.name} Banner`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600/10 to-indigo-600/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 text-[9px] font-extrabold uppercase bg-black/40 backdrop-blur-md text-white border border-white/10 px-2 py-0.5 rounded">
          {org.category}
        </span>
      </div>

      {/* Profile Details Container */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 -mt-8 relative z-10">
        <div className="space-y-3">
          {/* Logo & Name Row */}
          <div className="flex items-end gap-3">
            <div className="h-14 w-14 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c0d12] p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              {org.logo ? (
                <img src={org.logo} alt={`${org.name} Logo`} loading="lazy" className="h-full w-full object-contain rounded-lg" />
              ) : (
                <GraduationCap className="h-7 w-7 text-slate-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white truncate leading-none">
                  {org.name}
                </h3>
                {org.verified && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" title="Verified Institution" />
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {org.state ? `${org.state}, ` : ''}{org.country || 'Global'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] text-slate-555 dark:text-slate-400 line-clamp-2 leading-relaxed font-semibold">
            {org.description}
          </p>

          {/* Featured Programs */}
          {programsList.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Featured Programs
              </span>
              <div className="flex flex-wrap gap-1">
                {programsList.slice(0, 2).map((prog) => (
                  <span
                    key={prog.id}
                    className="text-[9px] font-bold bg-slate-50 dark:bg-[#1a1c24] border border-slate-200/50 dark:border-slate-800/40 text-slate-655 dark:text-slate-350 px-2 py-0.5 rounded"
                  >
                    {prog.name}
                  </span>
                ))}
                {programsList.length > 2 && (
                  <span className="text-[9px] font-bold bg-slate-100/50 dark:bg-slate-800/40 text-slate-400 px-1.5 py-0.5 rounded">
                    +{programsList.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Details Action Link */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[10px] font-extrabold text-blue-600 dark:text-blue-400">
          <span>Explore Institution</span>
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Card>
  );
}
