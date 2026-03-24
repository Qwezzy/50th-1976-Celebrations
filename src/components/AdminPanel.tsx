import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { Shield, Users, Church as ChurchIcon, BarChart3, ArrowLeft, Download, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface Stats {
  totalUsers: number;
  byCohort: Record<string, number>;
  byChurch: Record<string, number>;
}

import { seedDatabase } from '../lib/seed';

export default function AdminPanel() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, byCohort: {}, byChurch: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase();
      alert('Database seeded successfully!');
    } catch (error) {
      console.error('Seed error:', error);
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    if (profile?.role !== 'Admin') return;

    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
      const newStats: Stats = {
        totalUsers: users.length,
        byCohort: {},
        byChurch: {}
      };

      users.forEach(user => {
        if (user.generationCohort) {
          newStats.byCohort[user.generationCohort] = (newStats.byCohort[user.generationCohort] || 0) + 1;
        }
        if (user.churchName) {
          newStats.byChurch[user.churchName] = (newStats.byChurch[user.churchName] || 0) + 1;
        }
      });

      setStats(newStats);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'users');
    });

    return () => unsubscribe();
  }, [profile]);

  if (profile?.role !== 'Admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif italic">Access Denied</h1>
          <p className="text-black/40">You do not have administrative privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <a href="/" className="p-2 hover:bg-black/5 rounded-full transition-all">
              <ArrowLeft className="w-6 h-6" />
            </a>
            <div>
              <h1 className="text-3xl font-serif italic">Admin Dashboard</h1>
              <p className="text-sm text-black/40 font-mono uppercase tracking-widest">Mobilization Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="bg-black/5 text-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-black/10 transition-all disabled:opacity-50"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{isSeeding ? 'Seeding...' : 'Seed Data'}</span>
            </button>
            <button className="bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-black/90 transition-all">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-4xl font-serif italic mb-1">{stats.totalUsers}</div>
            <div className="text-sm text-black/40 uppercase tracking-widest font-mono">Total Registrations</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
          >
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
              <ChurchIcon className="w-6 h-6 text-purple-500" />
            </div>
            <div className="text-4xl font-serif italic mb-1">{Object.keys(stats.byChurch).length}</div>
            <div className="text-sm text-black/40 uppercase tracking-widest font-mono">Churches Represented</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
          >
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-4xl font-serif italic mb-1">4</div>
            <div className="text-sm text-black/40 uppercase tracking-widest font-mono">Generational Cohorts</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cohort Breakdown */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm"
          >
            <h3 className="text-xl font-serif italic mb-8">Cohort Breakdown</h3>
            <div className="space-y-6">
              {Object.entries(stats.byCohort).map(([cohort, count]) => (
                <div key={cohort}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{cohort}</span>
                    <span className="text-black/40">{count} users</span>
                  </div>
                  <div className="h-3 bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((count as number) / stats.totalUsers) * 100}%` }}
                      className="h-full bg-black"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Church Breakdown */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-serif italic">Church Mobilization</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
                <input 
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-black/5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-black/10 transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-4 pr-2 custom-scrollbar">
              {Object.entries(stats.byChurch)
                .filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between p-4 bg-black/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <ChurchIcon className="w-4 h-4 text-black/40" />
                      </div>
                      <span className="font-medium text-sm">{name}</span>
                    </div>
                    <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-mono">{count as number}</span>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
