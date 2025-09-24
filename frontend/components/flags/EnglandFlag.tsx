import React from 'react';

interface FlagProps {
  size?: number;
  className?: string;
}

export default function EnglandFlag({ size = 24, className }: FlagProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* England flag (St. George's Cross) */}
      <rect width="24" height="24" fill="#012169" />
      <rect x="10" y="0" width="4" height="24" fill="#FFFFFF" />
      <rect x="0" y="10" width="24" height="4" fill="#FFFFFF" />
      <rect x="10" y="0" width="2" height="24" fill="#C8102E" />
      <rect x="0" y="10" width="24" height="2" fill="#C8102E" />
    </svg>
  );
}
