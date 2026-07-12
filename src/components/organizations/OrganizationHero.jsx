import React from 'react';
import { CheckCircle2, Globe, Mail, MapPin, ExternalLink } from 'lucide-react';

export default function OrganizationHero({ org }) {
  if (!org) return null;

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

  const getBannerImage = (id) => {
    switch (id) {
      case 'org-stanford':
        return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80';
      case 'org-iowastate':
        return 'https://images.unsplash.com/photo-1498243691581-b145c3f54a91?auto=format&fit=crop&w=1200&q=80';
      case 'org-ucm':
        return 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80';
      default:
        return 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80';
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-850/60 shadow-sm bg-white dark:bg-[#0f111a]/40">
      
      {/* Banner Cover with school photography cover and gradient overlay */}
      <div className="h-44 sm:h-56 w-full relative overflow-hidden">
        <img
          src={getBannerImage(org.id)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover filter brightness-[0.6] contrast-[1.05] scale-101 select-none pointer-events-none"
        />
        <div className={`absolute inset-0 bg-gradient-to-tr ${getGradientClass(org.id)} opacity-45 mix-blend-multiply`} />
        
        {/* Modern Stripe grid layout overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0c_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0c_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        
        {/* Soft dark shadow cover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
      </div>

      {/* Hero Metadata Layout Area */}
      <div className="px-6 pb-6 pt-4 relative flex flex-col sm:flex-row gap-5 items-start sm:items-end -mt-10 sm:-mt-12 z-10">
        
        {/* Large Logo container */}
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-white dark:border-[#0c0d12] bg-white dark:bg-[#0c0d12] p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-lg transition-transform duration-300 hover:scale-102">
          {org.logo ? (
            <img src={org.logo} alt={`${org.name} Logo`} loading="lazy" className="h-full w-full object-contain rounded-xl" />
          ) : (
            <span className="text-3xl font-extrabold text-slate-300">U</span>
          )}
        </div>

        {/* Name and Tags Area */}
        <div className="flex-1 space-y-2 pb-1 text-white sm:text-slate-950 dark:sm:text-white">
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-none text-white sm:text-slate-900 dark:sm:text-white">
              {org.name}
            </h1>
            {org.verified && (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase select-none tracking-wider">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Verified Partner
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-300 sm:text-slate-500 dark:sm:text-slate-450">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {org.address || `${org.state}, ${org.country}`}
            </span>
            {org.website && (
              <a
                href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {org.website}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
