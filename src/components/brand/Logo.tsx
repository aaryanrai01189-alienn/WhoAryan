import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
}) => {
  const sizeMap = {
    sm: { icon: 24, text: 'text-lg', ringW: 2.5 },
    md: { icon: 36, text: 'text-2xl', ringW: 3 },
    lg: { icon: 48, text: 'text-3xl', ringW: 3.5 },
    xl: { icon: 64, text: 'text-4xl', ringW: 4 },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Futuristic Progress Ring Logo Icon */}
      <div className="relative flex items-center justify-center">
        <svg
          width={current.icon}
          height={current.icon}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
        >
          {/* Subtle background track */}
          <circle
            cx="24"
            cy="24"
            r="19"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth="3.5"
          />
          {/* Active progressive circular arc (270 degrees) */}
          <circle
            cx="24"
            cy="24"
            r="19"
            stroke="url(#nexora-progress-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="120"
            strokeDashoffset="32"
            transform="rotate(-90 24 24)"
          />
          {/* Inner core node with sharp futuristic crosshair */}
          <circle cx="24" cy="24" r="5" fill="url(#nexora-core-grad)" />
          <path
            d="M24 10V14M24 34V38M10 24H14M34 24H38"
            stroke="url(#nexora-progress-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Progress leading spark point */}
          <circle cx="37.5" cy="11.5" r="2.5" fill="#38BDF8" className="animate-pulse" />

          <defs>
            <linearGradient id="nexora-progress-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="nexora-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col">
        <span
          className={`font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent ${current.text}`}
        >
          NEXORA
        </span>
        {showTagline && (
          <span className="text-[10px] tracking-widest uppercase font-medium text-slate-400 dark:text-slate-400">
            Turn Your Time Into Progress
          </span>
        )}
      </div>
    </div>
  );
};
