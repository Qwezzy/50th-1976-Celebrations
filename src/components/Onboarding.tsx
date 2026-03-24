import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Church as ChurchIcon, Users, ArrowRight, Check, Calendar as CalendarIcon, Info, History } from 'lucide-react';
import { cn } from '../lib/utils';

interface Church {
  churchId: string;
  churchName: string;
  wardLocation?: string;
  affiliation?: string;
}

const COHORT_INFO = {
  "Class of '76": {
    label: "Class of '76",
    description: "The pioneers who stood at the forefront of the 1976 Student Uprising, fighting for the freedom we enjoy today.",
    icon: <History className="w-5 h-5" />
  },
  "Bridge Generation": {
    label: "Bridge Generation",
    description: "Born in the fire of apartheid, this generation bridges the gap between the struggle and the future. Turning 50 in 2026.",
    icon: <Users className="w-5 h-5" />
  },
  "Born-Free": {
    label: "Born-Free",
    description: "Born at the dawn of democracy, inheriting the gift of freedom secured by the sacrifice of those before them.",
    icon: <Check className="w-5 h-5" />
  },
  "Rising Generation": {
    label: "Rising Generation",
    description: "Today's youth and university students, advancing freedom through innovation, AI, and robotics.",
    icon: <ArrowRight className="w-5 h-5" />
  }
};

const INITIAL_CHURCHES = [
  { churchId: 'regina-mundi', churchName: 'Regina Mundi Catholic Church', wardLocation: 'Moroka, Soweto', affiliation: 'Catholic' },
  { churchId: 'st-paul', churchName: 'St. Paul’s Anglican Church', wardLocation: 'Jabavu, Soweto', affiliation: 'Anglican' },
  { churchId: 'holy-cross', churchName: 'Holy Cross Anglican Church', wardLocation: 'Orlando West, Soweto', affiliation: 'Anglican' },
  { churchId: 'grace-bible', churchName: 'Grace Bible Church', wardLocation: 'Pimville, Soweto', affiliation: 'Pentecostal' },
  { churchId: 'sacc-soweto', churchName: 'SACC Soweto Affiliate', wardLocation: 'Various', affiliation: 'Inter-denominational' }
];

export default function Onboarding() {
  const { user, profile } = useAuth();
  // Fix: Initialize step based on profile data to prevent "redirect" back to step 1
  const [step, setStep] = useState(profile?.churchId ? 2 : 1);
  const [churches, setChurches] = useState<Church[]>([]);
  const [search, setSearch] = useState('');
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dob = useMemo(() => {
    if (!day || !month || !year) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }, [day, month, year]);

  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'churches'));
        if (querySnapshot.empty) {
          setChurches(INITIAL_CHURCHES);
        } else {
          setChurches(querySnapshot.docs.map(doc => ({ churchId: doc.id, ...doc.data() } as Church)));
        }
      } catch (error) {
        handleFirestoreError(error, 'list', 'churches');
      }
    };
    fetchChurches();
  }, []);

  // Auto-calculate cohort based on DOB
  const calculatedCohort = useMemo(() => {
    if (!dob) return null;
    const birthYear = new Date(dob).getFullYear();
    if (birthYear < 1965) return "Class of '76";
    if (birthYear <= 1985) return "Bridge Generation";
    if (birthYear <= 2000) return "Born-Free";
    return "Rising Generation";
  }, [dob]);

  const filteredChurches = churches.filter(c => 
    c.churchName.toLowerCase().includes(search.toLowerCase())
  );

  const handleStep1Complete = async () => {
    if (!user || !selectedChurch) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        churchId: selectedChurch.churchId,
        churchName: selectedChurch.churchName,
        updatedAt: serverTimestamp()
      });
      setStep(2);
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${user.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!user || !calculatedCohort || !dob) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        dob,
        generationCohort: calculatedCohort,
        onboarded: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', `users/${user.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 border border-black/5"
      >
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-black/40">Step {step} of 2</span>
            <div className="flex gap-2">
              <div className={cn("h-1 w-8 rounded-full transition-colors", step >= 1 ? "bg-black" : "bg-black/10")} />
              <div className={cn("h-1 w-8 rounded-full transition-colors", step >= 2 ? "bg-black" : "bg-black/10")} />
            </div>
          </div>
          <h1 className="text-4xl font-serif italic text-black leading-tight">
            {step === 1 ? "Select Your Church" : "Your Generation"}
          </h1>
          <p className="text-black/60 mt-3 text-sm leading-relaxed">
            {step === 1 
              ? "The Church is a co-host of this legacy. Find your local Soweto congregation to join the mobilization." 
              : "We are building a generational blueprint. Your date of birth helps us classify your legacy role."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input 
                  type="text"
                  placeholder="Search Soweto churches..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black/10 outline-none transition-all text-sm"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredChurches.map(church => (
                  <button
                    key={church.churchId}
                    onClick={() => setSelectedChurch(church)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                      selectedChurch?.churchId === church.churchId 
                        ? "bg-black text-white border-black" 
                        : "bg-white border-black/10 hover:border-black/30"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      selectedChurch?.churchId === church.churchId ? "bg-white/20" : "bg-black/5"
                    )}>
                      <ChurchIcon className={cn("w-5 h-5", selectedChurch?.churchId === church.churchId ? "text-white" : "text-black/40")} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{church.churchName}</div>
                      <div className={cn("text-[10px] uppercase tracking-wider font-mono", selectedChurch?.churchId === church.churchId ? "text-white/60" : "text-black/40")}>
                        {church.wardLocation}
                      </div>
                    </div>
                    {selectedChurch?.churchId === church.churchId && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
              <button
                disabled={!selectedChurch || isSubmitting}
                onClick={handleStep1Complete}
                className="w-full mt-4 bg-black text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 transition-all shadow-lg shadow-black/10"
              >
                {isSubmitting ? "Saving..." : "Continue"} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-black/40 ml-1">Date of Birth (Day Month Year)</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full px-4 py-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black/10 outline-none transition-all text-sm appearance-none"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-4 py-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black/10 outline-none transition-all text-sm appearance-none"
                  >
                    <option value="">Month</option>
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-4 bg-black/5 rounded-2xl border-none focus:ring-2 focus:ring-black/10 outline-none transition-all text-sm appearance-none"
                  >
                    <option value="">Year</option>
                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {calculatedCohort && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black text-white p-6 rounded-3xl space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-white/60">Your Cohort</div>
                      <div className="text-xl font-serif italic">{calculatedCohort}</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed relative z-10">
                    {COHORT_INFO[calculatedCohort as keyof typeof COHORT_INFO].description}
                  </p>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                </motion.div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl border border-black/10 font-medium hover:bg-black/5 transition-all text-sm"
                >
                  Back
                </button>
                <button
                  disabled={!dob || isSubmitting}
                  onClick={handleComplete}
                  className="flex-[2] bg-black text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 transition-all shadow-lg shadow-black/10 text-sm"
                >
                  {isSubmitting ? "Saving..." : "Complete Profile"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
