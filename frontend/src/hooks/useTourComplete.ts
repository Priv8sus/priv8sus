import { useState } from 'react';

export function useTourComplete() {
  const [completed, setCompleted] = useState(() => {
    return localStorage.getItem('tour_completed') === 'true';
  });

  const markComplete = () => {
    localStorage.setItem('tour_completed', 'true');
    setCompleted(true);
  };

  return { completed, markComplete };
}