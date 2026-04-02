import { useState } from 'react';

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