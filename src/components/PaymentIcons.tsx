import type { FC } from 'react';
import { Landmark } from 'lucide-react';

type PaymentIconProps = {
  id: string;
  className?: string;
};

const PaymentIcon: FC<PaymentIconProps> = ({ id, className = 'w-6 h-6' }) => {
  switch (id) {
    case 'bkash':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 15.15V6.85h4.4c1.63 0 2.8.96 2.8 2.4 0 1.05-.73 1.83-1.78 2.13v.07c1.3.26 2.18 1.15 2.18 2.3 0 1.63-1.28 2.7-3.2 2.7h-4.4z"
            fill="#E2136E"
          />
          <path
            d="M10.8 9.05h1.9c.8 0 1.25-.4 1.25-.95s-.45-.95-1.25-.95h-1.9v1.9zm0 6.2h2.2c.93 0 1.45-.48 1.45-1.15s-.52-1.15-1.45-1.15h-2.2v2.3z"
            fill="white"
          />
        </svg>
      );
    case 'nagad':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
            fill="#F58220"
          />
          <path
            d="M16.5 14.5c0 .83-.67 1.5-1.5 1.5h-6c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5h1.75l2.5 5V8h2.25v6.5z"
            fill="white"
          />
        </svg>
      );
    case 'paypal':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.05,5.26A1.28,1.28,0,0,0,5.81,6.59c0,1.38,1,3.41,3.13,3.41H10.1a.53.53,0,0,1,.52.56,1,1,0,0,1-1.05,1h-1a1.53,1.53,0,0,0-1.59,1.58c0,1.19,1.21,1.5,1.59,1.5H9.7a.54.54,0,0,1,.53.57,1,1,0,0,1-1.06,1h-1A3.58,3.58,0,0,1,4.6,15.7c0-2.58,2.23-4.28,4.84-4.28h.7a1.59,1.59,0,0,0,1.6-1.59c0-1.12-1.09-1.57-1.6-1.57Z"
            fill="#253B80"
          />
          <path
            d="M13.68,8.67c-2.61,0-4.84,1.7-4.84,4.28a3.58,3.58,0,0,0,3.57,4.24H13.5c2.31,0,3.22-1,3.22-2.13a1.7,1.7,0,0,0-1.6-1.83h-1a.54.54,0,0,1-.53-.57.54.54,0,0,1,.53-.57H15a1.28,1.28,0,0,0,1.24-1.33c0-1.38-1-3.41-3.13-3.41Z"
            fill="#179BD7"
          />
        </svg>
      );
    case 'payoneer':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" fill="url(#payoneer-gradient)" />
          <defs>
            <radialGradient
              id="payoneer-gradient"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(18 6) rotate(90) scale(12)"
            >
              <stop stopColor="#FF4800" />
              <stop offset="1" stopColor="#FF8C00" />
            </radialGradient>
          </defs>
        </svg>
      );
    case 'wise':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.23 8.363H5.24v2.545h5.182L5.24 16.59h5.99v-2.545H6.046L11.23 8.363zM18.76 7.41h-2.91v9.18h2.91V7.41z"
            fill="#00B9FF"
          />
        </svg>
      );
    case 'wallet':
        return <Landmark className={className} />;
    default:
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 18H3V6h18v12zm-2-2V8H5v8h14z"
          />
        </svg>
      );
  }
};

export default PaymentIcon;
