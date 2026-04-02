import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { captureTourComplete } from '../analytics';
import './TourGuide.css';

interface TourStep {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '.predictions-section h2',
    title: 'Top Predictions',
    content: 'These are today\'s player predictions. Green confidence badges (70%+) indicate our best bets.',
    position: 'bottom'
  },
  {
    target: '.paper-trade-btn',
    title: 'Paper Trading',
    content: 'Practice with fake money first. No risk, real odds. Your Best Bet has a gold border!',
    position: 'top'
  },
  {
    target: '.accuracy-sidebar',
    title: 'Model Accuracy',
    content: 'We track our record daily. Higher accuracy = more confidence in our picks.',
    position: 'left'
  }
];

interface TourGuideProps {
  onComplete: () => void;
}

export function TourGuide({ onComplete }: TourGuideProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (currentStep < TOUR_STEPS.length) {
      const step = TOUR_STEPS[currentStep];
      const element = document.querySelector(step.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setVisible(false);
    localStorage.setItem('tour_completed', 'true');
    if (user) {
      captureTourComplete(user.id);
    }
    onComplete();
  };

  if (!visible || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="tour-overlay">
      <div
        className="tour-highlight"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8
        }}
      />
      <div className={`tour-tooltip tour-tooltip-${step.position}`} style={{
        top: step.position === 'bottom' ? targetRect.bottom + 10 : step.position === 'top' ? targetRect.top - 10 : targetRect.top,
        left: step.position === 'left' ? targetRect.left - 10 : step.position === 'right' ? targetRect.right + 10 : targetRect.left
      }}>
        <div className="tour-step-indicator">
          {currentStep + 1} / {TOUR_STEPS.length}
        </div>
        <h3>{step.title}</h3>
        <p>{step.content}</p>
        <div className="tour-buttons">
          <button className="tour-skip" onClick={handleSkip}>Skip Tour</button>
          <button className="tour-next" onClick={handleNext}>
            {currentStep < TOUR_STEPS.length - 1 ? 'Next' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}