import React from 'react';

interface FlagProps {
  size?: number;
  className?: string;
}

export default function RwandaFlag({ size = 24, className }: FlagProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rwanda flag - Blue stripe (top, double height) */}
      <rect width="24" height="16" y="0" fill="#00A1DE" />
      
      {/* Yellow stripe (middle) */}
      <rect width="24" height="4" y="16" fill="#FAD201" />
      
      {/* Green stripe (bottom) */}
      <rect width="24" height="4" y="20" fill="#20603D" />
      
      {/* Yellow sun with rays in upper fly corner */}
      <g transform="translate(16, 4)">
        {/* Sun rays */}
        <g fill="#FAD201">
          {Array.from({ length: 24 }, (_, i) => (
            <line
              key={i}
              x1="0"
              y1="0"
              x2="0"
              y2="2"
              stroke="#FAD201"
              strokeWidth="0.3"
              transform={`rotate(${i * 15} 0 0)`}
              transformOrigin="0 0"
            />
          ))}
        </g>
        
        {/* Sun circle */}
        <circle cx="0" cy="0" r="1.5" fill="#E5BE01" />
      </g>
    </svg>
  );
}
