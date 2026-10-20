import React from 'react';

export default function Logo({ size = 38, className = '', style = {}, rx = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Background Rounded Square */}
      <rect width="100" height="100" rx={rx} fill="#0B1728" />

      {/* Main Teal / Mint Green Arc (bottom, left, top-left) */}
      <path
        d="M 80.32 56.45 A 31 31 0 1 1 46.76 19.17"
        stroke="#4AE3B5"
        strokeWidth="7.5"
        strokeLinecap="round"
      />

      {/* Sky Blue Arc (top-right segment) */}
      <path
        d="M 59.58 20.52 A 31 31 0 0 1 80.32 43.55"
        stroke="#52B5FD"
        strokeWidth="7.5"
        strokeLinecap="round"
      />

      {/* Bar 1 (Left - Shortest, Light Ice Blue) */}
      <rect
        x="35"
        y="52"
        width="6.6"
        height="12"
        rx="3.3"
        fill="#E6F5FC"
      />

      {/* Bar 2 (Middle - Medium, Pure White) */}
      <rect
        x="46.7"
        y="45"
        width="6.6"
        height="19"
        rx="3.3"
        fill="#FFFFFF"
      />

      {/* Bar 3 (Right - Tallest, Sky Blue) */}
      <rect
        x="58.4"
        y="37"
        width="6.6"
        height="27"
        rx="3.3"
        fill="#52B5FD"
      />
    </svg>
  );
}
