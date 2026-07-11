import React from 'react';
import { CheckCircle2, Globe, Mail, MapPin, ExternalLink } from 'lucide-react';

export default function OrganizationHero({ org }) {
  if (!org) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-205 dark:border-slate-800/40 shadow-sm bg-white dark:bg-[#12131a]/30">
      {/* Banner Cover */}
      <div className="h-44 sm:h-56 w-full relative">
        {org.banner ? (
          <img
            src={org.banner}
            alt={`${org.name} Banner`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-slate-900 to-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Hero Meta Info */}
      <div className="px-6 pb-6 pt-4 relative flex flex-col sm:flex-row gap-5 items-start sm:items-end -mt-10 sm:-mt-12 z-10">
        {/* Large Logo */}
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-white dark:border-[#0c0d12] bg-white dark:bg-[#0c0d12] p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
          {org.logo ? (
            <img src={org.logo} alt={`${org.name} Logo`} loading="lazy" className="h-full w-full object-contain rounded-xl" />
          ) : (
            <span className="text-3xl font-extrabold text-slate-300">U</span>
          )}
        </div>

        {/* Text Metadata */}
        <div className="flex-1 space-y-2 pb-1 text-white sm:text-slate-950 dark:sm:text-white">
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-none text-white sm:text-slate-900 dark:sm:text-white">
              {org.name}
            </h1>
            {org.verified && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase select-none">
                <CheckCircle2 className="h-3 w-3" />
                Verified Partner
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-300 sm:text-slate-500 dark:sm:text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {org.address || `${org.state}, ${org.country}`}
            </span>
            {org.website && (
              <a
                href={`https://${org.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {org.website}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
            {org.contactEmail && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {org.contactEmail}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
