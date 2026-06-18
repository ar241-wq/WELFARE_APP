'use client';
import { useInView } from '@/lib/hooks/useInView';

type Direction = 'up' | 'left' | 'right' | 'scale' | 'fade';

interface AnimatedSectionProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside' | 'li' | 'span';
}

const directionClass: Record<Direction, string> = {
  up:    'animate-fade-up',
  left:  'animate-slide-left',
  right: 'animate-slide-right',
  scale: 'animate-scale-in',
  fade:  'animate-fade-in',
};

export default function AnimatedSection({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  as: Tag = 'div',
}: AnimatedSectionProps) {
  const { ref, inView } = useInView();

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`${className} transition-[opacity,transform] ${
        inView
          ? `${directionClass[direction]} opacity-100`
          : 'opacity-0'
      }`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
        animationPlayState: inView ? 'running' : 'paused',
      }}
    >
      {children}
    </Tag>
  );
}
