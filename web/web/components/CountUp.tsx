'use client';
import { useEffect, useRef, useState } from 'react';
import { useInView } from '@/lib/hooks/useInView';

interface CountUpProps {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export default function CountUp({ to, suffix = '', prefix = '', duration = 1800, className = '' }: CountUpProps) {
  const { ref, inView } = useInView(0.3);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-quint
      const eased = 1 - Math.pow(1 - progress, 5);
      setValue(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [inView, to, duration]);

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={`tabular ${className}`}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
