'use client';

import { useEffect, useRef, useState } from 'react';

export default function Reveal({
  as: Tag = 'div',
  delay,
  immediate = false,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (immediate) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -48px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <Tag
      ref={ref}
      data-reveal={visible ? 'visible' : ''}
      {...(delay ? { 'data-reveal-delay': String(delay) } : {})}
      {...rest}
    >
      {children}
    </Tag>
  );
}
