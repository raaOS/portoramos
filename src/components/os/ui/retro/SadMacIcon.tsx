import React from 'react';

// Sad Mac SVG - Pixelated Style
export const SadMacIcon = () => (
  <svg
    width="60"
    height="60"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="pixelated"
  >
    <rect width="40" height="40" fill="black" />
    <rect x="2" y="2" width="36" height="30" fill="white" />
    <rect x="2" y="34" width="36" height="4" fill="white" />
    {/* Screen Area */}
    <rect x="6" y="6" width="28" height="20" fill="white" stroke="black" strokeWidth="2" />
    {/* Sad Face */}
    <rect x="12" y="12" width="2" height="2" fill="black" />
    <rect x="26" y="12" width="2" height="2" fill="black" />
    <path d="M14 22C14 22 16 19 20 19C24 19 26 22 26 22" stroke="black" strokeWidth="2" />
    {/* Small details */}
    <rect x="32" y="35" width="2" height="2" fill="black" />
  </svg>
);
