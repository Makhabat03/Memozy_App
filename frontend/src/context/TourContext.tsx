import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { TranslationKeys } from '../i18n/translations';

export interface TourStep {
  target: string | null;
  route: string;
  title: string;
  desc: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  emoji?: string;
}

// Builds the tour step content from the current language's translations.
// Target/route/placement/emoji are structural and stay constant across languages.
const getTourSteps = (t: (key: keyof TranslationKeys) => string): TourStep[] => [
  { target: null,                  route: '/',        placement: 'center', emoji: '🌸', title: t('tourStep0Title'), desc: t('tourStep0Desc') },
  { target: 'streak-display',      route: '/',        placement: 'bottom',              title: t('tourStep1Title'), desc: t('tourStep1Desc') },
  { target: 'new-deck-btn',        route: '/',        placement: 'bottom',              title: t('tourStep2Title'), desc: t('tourStep2Desc') },
  { target: 'create-tabs',         route: '/create',  placement: 'bottom',              title: t('tourStep3Title'), desc: t('tourStep3Desc') },
  { target: null,                  route: '/',        placement: 'center', emoji: '🧠', title: t('tourStep4Title'), desc: t('tourStep4Desc') },
  { target: 'decks-actions',       route: '/decks',   placement: 'top',                 title: t('tourStep5Title'), desc: t('tourStep5Desc') },
  { target: 'social-leaderboard',  route: '/social',  placement: 'right',               title: t('tourStep6Title'), desc: t('tourStep6Desc') },
  { target: 'theme-picker',        route: '/profile', placement: 'top',                 title: t('tourStep7Title'), desc: t('tourStep7Desc') },
  { target: null,                  route: '/',        placement: 'center', emoji: '🚀', title: t('tourStep8Title'), desc: t('tourStep8Desc') },
];

interface TourCtx {
  isActive: boolean;
  step: number;
  total: number;
  steps: TourStep[];
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourCtx>({
  isActive: false, step: 0, total: 0, steps: [],
  startTour: () => {}, nextStep: () => {}, prevStep: () => {}, endTour: () => {},
});

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const [isActive, setIsActive] = useState(false);
  const [step, setStep] = useState(0);

  // Recomputes whenever the language changes, so switching language mid-tour
  // immediately updates the visible step text.
  const steps = useMemo(() => getTourSteps(t), [t]);

  const startTour = useCallback(() => { setStep(0); setIsActive(true); }, []);
  // Clamp step whenever steps length changes (e.g. hot-reload or language switch)
  React.useEffect(() => { setStep(s => Math.min(s, steps.length - 1)); }, [steps.length]);
  const endTour = useCallback(() => {
    setIsActive(false);
    localStorage.setItem('memozy_onboarded', '1');
  }, []);
  const nextStep = useCallback(() => setStep(s => Math.min(s + 1, steps.length - 1)), [steps.length]);
  const prevStep = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

  return (
    <TourContext.Provider value={{ isActive, step, total: steps.length, steps, startTour, nextStep, prevStep, endTour }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);
