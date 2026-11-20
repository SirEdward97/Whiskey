'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateScrollBar = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const pct = Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100));
      setProgress(Number(pct.toFixed(2)));
    };

    updateScrollBar();
    window.addEventListener('scroll', updateScrollBar, { passive: true });
    window.addEventListener('resize', updateScrollBar, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScrollBar);
      window.removeEventListener('resize', updateScrollBar);
    };
  }, []);

  return (
    <div className="scroll-progress-bar" aria-hidden="true">
      <div
        className="scroll-progress-fill"
        id="scroll-progress-fill"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
