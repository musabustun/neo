import { create } from 'zustand';
import { Session } from '@/types';

interface SessionState {
  activeSession: Session | null;
  setActiveSession: (session: Session | null) => void;
  updateSessionCost: (currentDuration: number, currentCost: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,

  setActiveSession: (session) => set({ activeSession: session }),

  updateSessionCost: (currentDuration, currentCost) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            currentDuration,
            currentCost,
          }
        : null,
    })),
}));
