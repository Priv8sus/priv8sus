import { useState } from 'react';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onContinue, onSkip }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleContinue = () => {
    setIsVisible(false);
    onContinue();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible) return null;

  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-icon">🏀</div>
        <h1>Welcome to Sharp Edge!</h1>
        <p className="welcome-tagline">
          We predict NBA player stats better than anyone else.
        </p>
        <div className="welcome-features">
          <div className="welcome-feature">
            <span className="feature-icon">🎯</span>
            <span>Today's top predictions with confidence scores</span>
          </div>
          <div className="welcome-feature">
            <span className="feature-icon">📊</span>
            <span>Track our accuracy and improve your betting</span>
          </div>
          <div className="welcome-feature">
            <span className="feature-icon">💰</span>
            <span>Paper trade to practice risk-free</span>
          </div>
        </div>
        <p className="welcome-prompt">
          Start with your personalized Best Bet below.
        </p>
        <div className="welcome-actions">
          <button className="welcome-continue" onClick={handleContinue}>
            See My Best Bet
          </button>
          <button className="welcome-skip" onClick={handleSkip}>
            Skip - go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export function useWelcomeComplete() {
  const [completed, setCompleted] = useState(() => {
    return localStorage.getItem('welcome_completed') === 'true';
  });

  const markComplete = () => {
    localStorage.setItem('welcome_completed', 'true');
    setCompleted(true);
  };

  return { completed, markComplete };
}