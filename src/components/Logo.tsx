
import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {}

const Logo: React.FC<LogoProps> = (props) => {
  return (
    <svg
      viewBox="0 0 350 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#38bdf8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* <!-- Circular arrows icon --> */}
      <g transform="translate(50, 50)">
        <path
          d="M 0, -35 A 35,35 0 1,1 -34.9,5.5"
          fill="none"
          stroke="url(#logo-gradient)"
          strokeWidth="10"
        />
        <path d="M -40,15 -28,5.5 -40,-4" fill="none" stroke="url(#logo-gradient)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        
        <path
          d="M 0, 35 A 35,35 0 1,1 34.9,-5.5"
          fill="none"
          stroke="url(#logo-gradient)"
          strokeWidth="10"
        />
        <path d="M 40,-15 28,-5.5 40,4" fill="none" stroke="url(#logo-gradient)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        
        <text
          x="0"
          y="8" 
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="40"
          fill="#0f172a"
          textAnchor="middle"
          className="dark:fill-slate-50"
        >
          WX
        </text>
      </g>
      
      {/* <!-- Text part --> */}
      <g transform="translate(120, 30)">
        <text
          x="0"
          y="0"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="36"
          fill="#0f172a"
           className="dark:fill-slate-50"
        >
          Wallet
        </text>
        <text
          x="0"
          y="40"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize="36"
          fill="url(#logo-gradient)"
        >
          Exchange
        </text>
      </g>
    </svg>
  );
};

export default Logo;
