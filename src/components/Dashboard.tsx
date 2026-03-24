import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, where } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, User, Bookmark, BookmarkCheck, LogOut, LayoutDashboard, Shield, History, Church as ChurchIcon, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface EventSession {
  eventId: string;
  title: string;
  description: string;
  speakerName: string;
  startTime: any;
  endTime: any;
  location: string;
}

interface Registration {
  registrationId: string;
  userId: string;
  eventId: string;
  checkInStatus?: boolean;
}

export default function Dashboard() {
  const { profile, logout } = useAuth();
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  useEffect(() => {
    const q = query(collection(db, 'events_and_sessions'), orderBy('startTime', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ eventId: doc.id, ...doc.data() } as EventSession)));
    }, (error) => {
      handleFirestoreError(error, 'list', 'events_and_sessions');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (profile) {
      const q = query(collection(db, 'registrations'), where('userId', '==', profile.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setRegistrations(snapshot.docs.map(doc => ({ registrationId: doc.id, ...doc.data() } as Registration)));
      }, (error) => {
        handleFirestoreError(error, 'list', 'registrations');
      });
      return () => unsubscribe();
    }
  }, [profile]);

  const toggleRegistration = async (eventId: string) => {
    if (!profile) return;
    const existing = registrations.find(r => r.eventId === eventId);
    if (existing) {
      try {
        await deleteDoc(doc(db, 'registrations', existing.registrationId));
      } catch (error) {
        handleFirestoreError(error, 'delete', `registrations/${existing.registrationId}`);
      }
    } else {
      try {
        await addDoc(collection(db, 'registrations'), {
          userId: profile.uid,
          eventId,
          checkInStatus: false,
          registeredAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, 'create', 'registrations');
      }
    }
  };

  const isRegistered = (eventId: string) => registrations.some(r => r.eventId === eventId);

  const displayedSessions = activeTab === 'all' 
    ? sessions 
    : sessions.filter(s => isRegistered(s.eventId));

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif italic text-xl leading-none">Legacy Portal</h1>
              <span className="text-[10px] font-mono uppercase tracking-tighter text-black/40">Soweto 50th Anniversary</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {profile?.role === 'Admin' && (
              <a href="/admin" className="p-2 hover:bg-black/5 rounded-full transition-all text-black/60 hover:text-black">
                <Shield className="w-5 h-5" />
              </a>
            )}
            <button onClick={logout} className="p-2 hover:bg-black/5 rounded-full transition-all text-black/60 hover:text-black">
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-black/5 border border-black/10 overflow-hidden">
              <img src={profile?.photoURL || ''} alt="Profile" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black text-white rounded-[2rem] p-8 mb-12 shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <span className="text-xs font-mono uppercase tracking-widest text-white/40 mb-2 block">Welcome Back</span>
            <h2 className="text-4xl font-serif italic mb-4">{profile?.displayName}</h2>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                <ChurchIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{profile?.churchName}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{profile?.generationCohort}</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        </motion.div>

        {/* About the Initiative Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-3xl font-serif italic">The 50th Anniversary Legacy Process</h3>
            <div className="prose prose-sm text-black/70 leading-relaxed space-y-4">
              <p>
                The Soweto 50th Anniversary Legacy Process is a momentous initiative commemorating the 1976 Student Uprising. 
                This event serves as a bridge between the past and the future, honoring the sacrifices of the 'Class of 76' 
                while empowering the 'Rising Generation' with innovation and technology.
              </p>
              <p>
                It is a call to action for all South Africans to reflect on our journey toward freedom and to actively 
                participate in building a legacy of education, equality, and progress for the next 50 years. 
                Through this portal, we mobilize over 900 churches to gather data, coordinate events, and ensure 
                that the spirit of June 16 continues to inspire future generations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://picsum.photos/seed/soweto76-1/800/600?grayscale" 
                alt="Soweto Uprising 1976" 
                className="rounded-2xl w-full h-48 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
              <img 
                src="https://picsum.photos/seed/soweto76-2/800/600?grayscale" 
                alt="Students Protesting in Soweto" 
                className="rounded-2xl w-full h-48 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm h-fit">
            <h4 className="font-serif italic text-xl mb-4">Why it Matters</h4>
            <ul className="space-y-4">
              {[
                { title: "Preserving History", desc: "Ensuring the stories of 1976 are never forgotten." },
                { title: "Generational Bridge", desc: "Connecting elders with youth for knowledge transfer." },
                { title: "Future Innovation", desc: "Equipping the youth with AI and Robotics skills." },
                { title: "National Unity", desc: "Bringing together 900+ churches for a common goal." }
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 shrink-0" />
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-black/50">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Additional Historical Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="space-y-4">
            <img 
              src="https://picsum.photos/seed/regina-mundi/800/600?grayscale" 
              alt="Regina Mundi Church" 
              className="rounded-[2rem] w-full h-64 object-cover shadow-sm border border-black/5"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs font-mono uppercase tracking-widest text-black/40 text-center">Regina Mundi: The People's Cathedral</p>
          </div>
          <div className="space-y-4">
            <img 
              src="https://picsum.photos/seed/soweto-youth-legacy/800/600" 
              alt="Soweto Legacy" 
              className="rounded-[2rem] w-full h-64 object-cover shadow-sm border border-black/5"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs font-mono uppercase tracking-widest text-black/40 text-center">Building the Generational Blueprint</p>
          </div>
        </div>
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-serif italic">Conference Schedule</h3>
          <div className="bg-white p-1 rounded-xl border border-black/5 flex gap-1">
            <button 
              onClick={() => setActiveTab('all')}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === 'all' ? "bg-black text-white" : "hover:bg-black/5")}
            >
              All Sessions
            </button>
            <button 
              onClick={() => setActiveTab('my')}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === 'my' ? "bg-black text-white" : "hover:bg-black/5")}
            >
              My Bookmarks
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedSessions.length > 0 ? displayedSessions.map((session, idx) => (
            <motion.div
              key={session.eventId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-black/5 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-black/60">
                  {session.location}
                </div>
                <button 
                  onClick={() => toggleRegistration(session.eventId)}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    isRegistered(session.eventId) ? "bg-black text-white" : "bg-black/5 text-black/40 hover:text-black"
                  )}
                >
                  {isRegistered(session.eventId) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
              </div>
              <h4 className="text-xl font-medium mb-2 group-hover:text-black/70 transition-colors">{session.title}</h4>
              <p className="text-black/60 text-sm mb-6">{session.description}</p>
              
              <div className="space-y-3 pt-4 border-t border-black/5">
                <div className="flex items-center gap-3 text-sm text-black/60">
                  <User className="w-4 h-4" />
                  <span>{session.speakerName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-black/60">
                  <Clock className="w-4 h-4" />
                  <span>
                    {session.startTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {session.endTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-black/10">
              <Calendar className="w-12 h-12 text-black/10 mx-auto mb-4" />
              <p className="text-black/40">No sessions found for this view.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
