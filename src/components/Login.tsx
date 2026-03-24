import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { LogIn, History, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-8 shadow-2xl">
          <History className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-5xl font-serif italic text-black mb-4 tracking-tight">
          Soweto 50th Legacy
        </h1>
        <p className="text-xl text-black/60 mb-12 leading-relaxed">
          "Be The Legacy, Be The Future"<br />
          Join the generational blueprint for economic renewal and moral transformation.
        </p>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-black/5 mb-8">
          <h2 className="text-lg font-medium mb-6">Access the Legacy Portal</h2>
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-black/10 hover:border-black py-4 rounded-2xl transition-all group"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            <span className="font-semibold">Continue with Google</span>
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-4 text-black/40 text-sm">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Access</span>
            </div>
            <div className="w-1 h-1 bg-black/10 rounded-full" />
            <span>Official Portal</span>
          </div>
        </div>

        <p className="text-xs text-black/40 uppercase tracking-widest font-mono">
          Wandile Zulu Foundation & Batlagae Trust
        </p>
      </motion.div>
    </div>
  );
}
