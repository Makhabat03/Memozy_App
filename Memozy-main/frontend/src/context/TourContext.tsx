import React, { createContext, useContext, useState, useCallback } from 'react';

export interface TourStep {
  target: string | null;
  route: string;
  title: string;
  desc: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  emoji?: string;
}

export const TOUR_STEPS: TourStep[] = [
  { target: null,                   route: '/',       placement: 'center', emoji: '🌸', title: 'Welcome to Memozy!',       desc: "Here's a quick tour of the key things you need to know. Takes about 30 seconds." },
  { target: 'streak-display',      route: '/',       placement: 'bottom',              title: 'Your Daily Streak 🔥',     desc: 'Study every day to keep this alive. Miss a day and it resets to zero — so make it a daily habit!' },
  { target: 'new-deck-btn',        route: '/',       placement: 'bottom',              title: 'Create a Deck',            desc: 'Click here to make flashcards. Paste text, upload a PDF or image, and AI generates the cards for you instantly.' },
  { target: 'create-tabs',         route: '/create', placement: 'bottom',              title: 'Three Ways to Create',     desc: 'Text, PDF, or Image — all three use AI to turn your content into question-and-answer flashcards automatically.' },
  { target: null,                   route: '/',       placement: 'center', emoji: '🧠', title: 'How Studying Works',       desc: 'Tap a card to flip it, then rate yourself: Hard, Good, or Easy. Memozy uses this to schedule your next review — Hard cards come back sooner, Easy ones later.' },
  { target: 'decks-actions',       route: '/decks',  placement: 'top',                 title: 'Sharing a Deck',           desc: 'The link icon copies a share link that works for anyone — even if your deck is set to Private. Use the toggle to control whether it shows up in the social feed.' },
  { target: 'social-leaderboard',  route: '/social', placement: 'right',               title: 'Weekly Leaderboard 🏆',   desc: 'Follow friends to compete here. Resets every Monday — top XP earner wins bragging rights.' },
  { target: 'theme-picker',        route: '/profile', placement: 'top',                title: 'Change Your Theme 🎨',    desc: 'Pick from 5 animated themes anytime. Each one has a completely different background and vibe.' },
  { target: null,                   route: '/',       placement: 'center', emoji: '🚀', title: "You're ready!",            desc: "That's it! Create your first deck and start building that streak. Good luck!" },
];

interface TourCtx {
  isActive: boolean;
  step: number;
  total: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourCtx>({
  isActive: false, step: 0, total: TOUR_STEPS.length,
  startTour: () => {}, nextStep: () => {}, prevStep: () => {}, endTour: () => {},
});

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0);

  const startTour = useCallback(() => { setStep(0); setIsActive(true); }, []);
  // Clamp step whenever TOUR_STEPS length changes (e.g. hot-reload)
  React.useEffect(() => { setStep(s => Math.min(s, TOUR_STEPS.length - 1)); }, []);
  const endTour   = useCallback(() => {
    setIsActive(false);
    localStorage.setItem('memozy_onboarded', '1');
  }, []);
  const nextStep  = useCallback(() => setStep(s => Math.min(s + 1, TOUR_STEPS.length - 1)), []);
  const prevStep  = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

  return (
    <TourContext.Provider value={{ isActive, step, total: TOUR_STEPS.length, startTour, nextStep, prevStep, endTour }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);
