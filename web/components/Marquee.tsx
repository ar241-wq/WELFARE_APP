interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export default function Marquee({ children, speed = 40, className = '' }: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <div
        className="flex gap-0 w-max"
        style={{
          animation: `marquee ${speed}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
