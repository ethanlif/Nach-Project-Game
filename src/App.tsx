/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle } from './lib/firebase';
import { HostView } from './components/HostView';
import { PlayerView } from './components/PlayerView';
import { LandingView } from './components/LandingView';
import { GameHeader } from './components/common/Header';
import { GamePhase } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'host' | 'player'>('landing');
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed:", error);
      setAuthError(error.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--desert)] bg-texture p-6">
        <div className="scanline" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full bg-[var(--ink)] p-8 border border-[var(--gold)] shadow-2xl text-center"
        >
          <Shield className="w-12 h-12 text-[var(--gold)] mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-[var(--sand)] uppercase mb-2">Kings of the Desert</h1>
          <p className="text-[10px] text-[var(--gold)] uppercase tracking-[0.2em] mb-8">Authentication Required</p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-[var(--gold)] text-[var(--ink)] py-4 font-bold uppercase tracking-widest hover:brightness-110 flex items-center justify-center gap-2 mb-4"
          >
            Sign in with Google
          </button>

          {authError && (
            <div className="mt-4 p-3 bg-red-600/10 border border-red-600/30 text-[10px] text-red-500 uppercase leading-tight">
              {authError.includes('admin-restricted-operation') 
                ? "Note: Please ensure Google Authentication is enabled in your Firebase Console." 
                : authError}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--desert)] bg-texture">
      <div className="scanline" />
      
      {view !== 'landing' && <GameHeader phase={gamePhase} />}

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <LandingView 
            onSelectHost={() => setView('host')} 
            onSelectPlayer={() => setView('player')} 
          />
        )}

        {view === 'host' && (
          <HostView 
            userId={user.uid} 
            onChangePhase={setGamePhase}
            onBack={() => setView('landing')}
          />
        )}

        {view === 'player' && (
          <PlayerView 
            userId={user.uid} 
            onChangePhase={setGamePhase}
            onBack={() => setView('landing')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
