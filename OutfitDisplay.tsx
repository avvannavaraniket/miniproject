import React, { useState, useEffect } from 'react';
import { StylistResponse, PrimaryOutfit } from '../types';
import { ShirtIcon, FootprintsIcon, GemIcon, SparklesIcon, ScissorsIcon, HeartIcon, BookmarkIcon } from './Icons';

interface OutfitDisplayProps {
  data: StylistResponse;
}

const SAVED_OUTFITS_KEY = 'fashion_mate_saved_outfits';

const OutfitDisplay: React.FC<OutfitDisplayProps> = ({ data }) => {
  const { primary_outfit, additional_suggestions, styling_notes } = data;
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Check if current outfit is already saved
    try {
      const savedData = localStorage.getItem(SAVED_OUTFITS_KEY);
      if (savedData) {
        const outfits: PrimaryOutfit[] = JSON.parse(savedData);
        // We use the title as a simple unique identifier for this demo
        const exists = outfits.some(o => o.title === primary_outfit.title);
        setIsSaved(exists);
      }
    } catch (e) {
      console.error("Failed to read from local storage", e);
    }
  }, [primary_outfit]);

  const toggleSave = () => {
    try {
      const savedData = localStorage.getItem(SAVED_OUTFITS_KEY);
      let outfits: PrimaryOutfit[] = savedData ? JSON.parse(savedData) : [];

      if (isSaved) {
        // Remove
        outfits = outfits.filter(o => o.title !== primary_outfit.title);
      } else {
        // Add
        outfits.push(primary_outfit);
      }

      localStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(outfits));
      setIsSaved(!isSaved);
    } catch (e) {
      console.error("Failed to save to local storage", e);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 animate-fade-in-up">
      
      {/* Primary Outfit Section */}
      <div className="mb-20">
        <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-[0.2em] text-stone-400 uppercase mb-3 block">Your Curated Look</span>
            <h2 className="text-5xl md:text-7xl font-serif text-stone-900 mb-6 relative inline-block">
                {primary_outfit.title}
            </h2>
            
            <div className="flex flex-col items-center justify-center mt-6">
            <button 
                onClick={toggleSave}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-full border transition-all duration-300 group ${
                isSaved 
                    ? 'bg-stone-900 border-stone-900 text-white shadow-lg shadow-stone-900/20' 
                    : 'bg-white border-stone-200 text-stone-500 hover:border-stone-800 hover:text-stone-900'
                }`}
            >
                <BookmarkIcon filled={isSaved} className={`w-4 h-4 ${isSaved ? 'text-amber-300' : 'text-current transition-colors'}`} />
                <span className="text-sm font-semibold tracking-wide">
                    {isSaved ? 'Saved to Collection' : 'Save Outfit'}
                </span>
            </button>
            </div>
        </div>

        {/* Masonry-like Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main "Look" Card - Spans 7 columns */}
          <div className="md:col-span-7 bg-gradient-to-br from-white via-rose-50/30 to-rose-50/50 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/60 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-shadow duration-500">
            <div className="absolute -right-16 -top-16 text-rose-100 opacity-60 group-hover:rotate-12 transition-transform duration-1000">
               <SparklesIcon className="w-80 h-80 stroke-[0.5]" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-[1px] bg-rose-300"></div>
                  <span className="uppercase tracking-widest text-xs font-bold text-rose-900/60">The Vibe</span>
              </div>
              <p className="text-2xl md:text-3xl font-serif text-stone-800 leading-relaxed italic">
                "{primary_outfit.reasoning}"
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-rose-100/60 relative z-10 bg-white/40 backdrop-blur-sm -mx-4 px-4 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-rose-100 rounded-full text-rose-600">
                    <ScissorsIcon className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide">Stylist Note</h4>
              </div>
              <p className="text-stone-600 leading-7 font-light text-lg">{styling_notes}</p>
            </div>
          </div>

          {/* Details Column - Spans 5 columns */}
          <div className="md:col-span-5 space-y-6">
            
            {/* Top & Bottom Card */}
            <div className="bg-gradient-to-br from-[#F5F7FA] to-white rounded-[2.5rem] p-8 hover:shadow-lg transition-all duration-300 group border border-stone-50">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-white p-3.5 rounded-2xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform duration-500 ring-1 ring-indigo-50">
                  <ShirtIcon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-xl text-stone-800">The Essentials</h3>
              </div>
              <div className="space-y-6">
                <div className="group/item">
                   <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-widest mb-1 block">Top</span>
                   <p className="text-stone-700 text-lg group-hover/item:text-indigo-900 transition-colors">{primary_outfit.top}</p>
                </div>
                <div className="w-full h-[1px] bg-indigo-50/50"></div>
                <div className="group/item">
                   <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-widest mb-1 block">Bottom</span>
                   <p className="text-stone-700 text-lg group-hover/item:text-indigo-900 transition-colors">{primary_outfit.bottom}</p>
                </div>
              </div>
            </div>

            {/* Accessories & Shoes Split */}
            <div className="grid grid-cols-1 gap-6">
               <div className="bg-gradient-to-br from-white to-[#FAF8F5] rounded-[2.5rem] p-8 border border-stone-50 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-amber-50 rounded-full text-amber-600 group-hover:rotate-12 transition-transform">
                        <FootprintsIcon className="w-5 h-5" />
                     </div>
                     <h4 className="font-serif text-lg text-stone-800">Footwear</h4>
                  </div>
                  <p className="text-stone-600 leading-relaxed font-medium">{primary_outfit.footwear}</p>
               </div>

               <div className="bg-gradient-to-br from-white to-[#FDF4FF] rounded-[2.5rem] p-8 border border-stone-50 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-purple-50 rounded-full text-purple-600 group-hover:rotate-12 transition-transform">
                        <GemIcon className="w-5 h-5" />
                     </div>
                     <h4 className="font-serif text-lg text-stone-800">Accents</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {primary_outfit.accessories.map((acc, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white text-purple-900/80 text-xs font-medium rounded-lg border border-purple-100 shadow-sm">
                        {acc}
                      </span>
                    ))}
                  </div>
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mood Board / Suggestions Section */}
      <div className="pt-12 border-t border-stone-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
                <h3 className="text-3xl font-serif text-stone-900 mb-2">Alternative Moods</h3>
                <p className="text-stone-500 text-sm">Stylist curated variations for your occasion</p>
            </div>
            <div className="hidden md:block h-[1px] flex-1 bg-stone-100 mx-8"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {additional_suggestions.map((suggestion, idx) => (
            <div 
              key={idx} 
              className={`p-8 rounded-[2rem] transition-all duration-500 hover:-translate-y-2 border border-transparent hover:border-white/50 hover:shadow-xl
                ${idx === 0 ? 'bg-gradient-to-b from-[#FFF0F0] to-[#FFF5F5] hover:shadow-rose-100/50' : ''} 
                ${idx === 1 ? 'bg-gradient-to-b from-[#F0F7FF] to-[#F5FAFF] hover:shadow-blue-100/50' : ''} 
                ${idx === 2 ? 'bg-gradient-to-b from-[#F2F9F4] to-[#F7FCF9] hover:shadow-emerald-100/50' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-6">
                 <h4 className={`font-serif text-xl ${
                     idx === 0 ? 'text-rose-900' : idx === 1 ? 'text-blue-900' : 'text-emerald-900'
                 }`}>{suggestion.label}</h4>
                 <div className={`p-2 rounded-full bg-white/60 backdrop-blur-sm ${
                     idx === 0 ? 'text-rose-400' : idx === 1 ? 'text-blue-400' : 'text-emerald-400'
                 }`}>
                    <HeartIcon className="w-4 h-4" />
                 </div>
              </div>
              <p className="text-stone-600 text-sm leading-7 font-medium opacity-90">
                {suggestion.outfit_summary}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default OutfitDisplay;