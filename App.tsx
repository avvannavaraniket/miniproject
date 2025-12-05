import React, { useState, useCallback, useEffect } from 'react';
import { getOutfitRecommendation } from './services/geminiService';
import OutfitDisplay from './components/OutfitDisplay';
import { StylistResponse } from './types';
import { SendIcon, HangerIcon, RefreshCwIcon, SparklesIcon } from './components/Icons';

const OCCASION_MIN_LENGTH = 5;
const OCCASION_MAX_LENGTH = 300;
const PREFERENCES_MAX_LENGTH = 200;

const SUGGESTED_OCCASIONS = [
  "Casual Coffee Date",
  "Summer Wedding Guest",
  "Tech Job Interview",
  "Weekend Brunch",
  "Gallery Opening",
  "Beach Vacation"
];

const GENDER_OPTIONS = ["Female", "Male", "Non-Binary"];

const BackgroundDecorations = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[100px] mix-blend-multiply animate-blob" />
    <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-rose-200/30 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />
    <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-4000" />
  </div>
);

const App: React.FC = () => {
  const [occasion, setOccasion] = useState('');
  const [gender, setGender] = useState('');
  const [preferences, setPreferences] = useState('');
  const [result, setResult] = useState<StylistResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation State
  const [validationErrors, setValidationErrors] = useState({
    occasion: '',
    gender: '',
    preferences: ''
  });
  const [touched, setTouched] = useState({
    occasion: false,
    gender: false,
    preferences: false
  });

  const validate = useCallback((field: 'occasion' | 'preferences' | 'gender', value: string) => {
    let message = '';
    const trimmed = value.trim();

    if (field === 'occasion') {
      if (!trimmed) {
        message = 'Please describe the occasion.';
      } else if (trimmed.length < OCCASION_MIN_LENGTH) {
        message = `Add at least ${OCCASION_MIN_LENGTH} characters.`;
      } else if (value.length > OCCASION_MAX_LENGTH) {
        message = `Limit to ${OCCASION_MAX_LENGTH} characters.`;
      } else if (!/[a-zA-Z]/.test(trimmed)) {
        message = 'Please include descriptive text.';
      }
    } else if (field === 'gender') {
        if (!trimmed) {
            message = 'Please select a style focus.';
        }
    } else if (field === 'preferences') {
       if (value.length > PREFERENCES_MAX_LENGTH) {
         message = `Limit to ${PREFERENCES_MAX_LENGTH} characters.`;
       } else if (value.length > 0 && !/[a-zA-Z0-9]/.test(value)) {
         message = 'Please include valid text.';
       }
    }

    setValidationErrors(prev => ({ ...prev, [field]: message }));
    return message;
  }, []);

  // Real-time validation for touched fields
  useEffect(() => {
    if (touched.occasion) validate('occasion', occasion);
  }, [occasion, touched.occasion, validate]);

  useEffect(() => {
    if (touched.gender) validate('gender', gender);
  }, [gender, touched.gender, validate]);

  useEffect(() => {
    if (touched.preferences) validate('preferences', preferences);
  }, [preferences, touched.preferences, validate]);

  const handleBlur = (field: 'occasion' | 'preferences') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validate(field, field === 'occasion' ? occasion : preferences);
  };

  const handleGenderSelect = (selected: string) => {
      setGender(selected);
      setTouched(prev => ({ ...prev, gender: true }));
  };

  const handleSuggestionClick = (text: string) => {
    setOccasion(text);
    setTouched(prev => ({ ...prev, occasion: true }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all before submit
    const occasionError = validate('occasion', occasion);
    const genderError = validate('gender', gender);
    const preferencesError = validate('preferences', preferences);
    
    setTouched({ occasion: true, gender: true, preferences: true });

    if (occasionError || genderError || preferencesError) return;
    if (!occasion.trim() || !gender) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await getOutfitRecommendation(occasion, gender, preferences);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [occasion, gender, preferences, validate]);

  const handleReset = () => {
    setResult(null);
    setOccasion('');
    setGender('');
    setPreferences('');
    setError(null);
    setValidationErrors({ occasion: '', gender: '', preferences: '' });
    setTouched({ occasion: false, gender: false, preferences: false });
  };

  const isFormValid = !validationErrors.occasion && !validationErrors.gender && !validationErrors.preferences && occasion.trim().length >= OCCASION_MIN_LENGTH && gender;

  return (
    <div className="min-h-screen text-stone-800 selection:bg-rose-200 font-sans">
      <BackgroundDecorations />
      
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${result ? 'bg-white/80 backdrop-blur-xl border-b border-white/20' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
            <div className="bg-stone-900 text-white p-2.5 rounded-full shadow-lg group-hover:bg-stone-800 transition-colors">
                <HangerIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-900 group-hover:opacity-80 transition-opacity">
              FashionMate
            </h1>
          </div>
          {result && (
              <button 
                onClick={handleReset}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 hover:bg-white border border-stone-200/50 shadow-sm hover:shadow-md transition-all text-sm font-medium backdrop-blur-md"
              >
                  <RefreshCwIcon className="w-4 h-4 text-stone-500 group-hover:rotate-180 transition-transform duration-700" />
                  <span className="hidden sm:inline text-stone-600">New Search</span>
              </button>
          )}
        </div>
      </header>

      <main className="pt-36 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
        
        {/* Intro / Input Section */}
        {!result && (
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            
            <div className="mb-12 space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full border border-stone-200/60 bg-white/50 backdrop-blur-sm text-[11px] font-bold tracking-[0.2em] uppercase text-stone-500 shadow-sm mb-4">
                AI Personal Stylist
              </span>
              <h2 className="text-5xl md:text-7xl font-serif text-stone-900 leading-[1.1]">
                What is the <br/>
                <span className="italic relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-stone-900 via-stone-700 to-stone-900">
                    occasion?
                    <span className="absolute -right-8 -top-4 animate-bounce duration-[3000ms]">
                        <SparklesIcon className="w-8 h-8 text-amber-400" />
                    </span>
                </span>
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 max-w-xl mx-auto text-left">
              
              <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-white/50 transition-all focus-within:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] focus-within:bg-white/90">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <label htmlFor="occasion" className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                           Describe the Event
                        </label>
                        <span className={`text-[10px] font-medium ${occasion.length > OCCASION_MAX_LENGTH ? 'text-rose-500' : 'text-stone-300'}`}>
                            {occasion.length}/{OCCASION_MAX_LENGTH}
                        </span>
                    </div>
                    <textarea
                        id="occasion"
                        required
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        onBlur={() => handleBlur('occasion')}
                        placeholder="e.g. A gallery opening in Soho, minimal but chic..."
                        className="w-full bg-transparent resize-none text-2xl md:text-3xl font-serif text-stone-800 placeholder:text-stone-300/80 outline-none h-32 leading-tight"
                    />
                    {touched.occasion && validationErrors.occasion && (
                        <p className="text-rose-500 text-xs mt-2 font-medium flex items-center gap-1">
                           <span className="w-1 h-1 bg-rose-500 rounded-full"></span> {validationErrors.occasion}
                        </p>
                    )}
                </div>

                 {/* Gender Section */}
                 <div className="border-t border-stone-100/50 p-6">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 block">Style Focus</label>
                    <div className="flex flex-wrap gap-3">
                        {GENDER_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => handleGenderSelect(opt)}
                                className={`px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 border shadow-sm ${
                                    gender === opt
                                    ? 'bg-stone-800 text-white border-stone-800 shadow-lg scale-105'
                                    : 'bg-white/80 text-stone-500 border-stone-100 hover:bg-white hover:border-stone-200 hover:text-stone-800'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                    {touched.gender && validationErrors.gender && (
                        <p className="text-rose-500 text-xs mt-2 font-medium flex items-center gap-1">
                           <span className="w-1 h-1 bg-rose-500 rounded-full"></span> {validationErrors.gender}
                        </p>
                    )}
                </div>

                <div className="border-t border-stone-100/50 p-6">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <label htmlFor="preferences" className="text-xs font-bold text-stone-400 uppercase tracking-wider">Any Preferences? (Optional)</label>
                        <span className={`text-[10px] font-medium ${preferences.length > PREFERENCES_MAX_LENGTH ? 'text-rose-500' : 'text-stone-300'}`}>
                             {preferences.length}/{PREFERENCES_MAX_LENGTH}
                        </span>
                    </div>
                    <input
                        id="preferences"
                        type="text"
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                        onBlur={() => handleBlur('preferences')}
                        placeholder="e.g. No heels, love pastels..."
                        className="w-full bg-transparent text-base md:text-lg text-stone-600 placeholder:text-stone-300/80 outline-none"
                    />
                    {touched.preferences && validationErrors.preferences && (
                        <p className="text-rose-500 text-xs mt-2 font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-rose-500 rounded-full"></span> {validationErrors.preferences}
                        </p>
                    )}
                </div>
                
                <div className="p-3">
                    <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className={`w-full py-4 rounded-[2rem] font-medium text-lg flex items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden group
                        ${loading || !isFormValid 
                        ? 'bg-stone-100 text-stone-300 cursor-not-allowed' 
                        : 'bg-stone-900 text-white hover:shadow-xl hover:shadow-stone-900/20'
                        }`}
                    >
                    {loading ? (
                        <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-base tracking-wide">Curating Style...</span>
                        </>
                    ) : (
                        <>
                        <span className="relative z-10">Curate My Look</span>
                        <SendIcon className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-stone-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </>
                    )}
                    </button>
                </div>
              </div>

              {/* Suggestions Chips */}
              <div className="mt-10 flex flex-wrap justify-center gap-3 opacity-0 animate-fade-in-up" style={{animationDelay: '0.2s', animationFillMode: 'forwards'}}>
                  {SUGGESTED_OCCASIONS.map((text) => (
                    <button
                        key={text}
                        type="button"
                        onClick={() => handleSuggestionClick(text)}
                        className="px-5 py-2.5 text-xs font-semibold bg-white/60 backdrop-blur-sm border border-white/50 text-stone-500 rounded-full hover:bg-white hover:border-stone-300 hover:text-stone-900 hover:shadow-sm transition-all duration-300"
                    >
                        {text}
                    </button>
                   ))}
              </div>

            </form>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
           <div className="max-w-md mx-auto mt-8 p-8 bg-rose-50/80 backdrop-blur-sm border border-rose-100 text-rose-900 rounded-3xl text-center animate-fade-in-up shadow-lg shadow-rose-100/50">
              <p className="font-serif text-xl mb-2">Style Crisis</p>
              <p className="text-sm opacity-80 mb-6">{error}</p>
              <button onClick={() => setError(null)} className="px-6 py-2 bg-white rounded-full text-xs font-bold uppercase tracking-wider text-rose-900 shadow-sm hover:shadow-md transition-all">Try Again</button>
           </div>
        )}

        {/* Results Section */}
        {result && !loading && (
           <OutfitDisplay data={result} />
        )}
      </main>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default App;