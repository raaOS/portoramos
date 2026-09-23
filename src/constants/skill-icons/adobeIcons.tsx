import React from 'react';

export const getAdobeIcons = (className: string): Record<string, React.ReactNode> => ({
  photoshop: (
    <div
      className={`${className} flex items-center justify-center rounded bg-blue-500 text-xs font-bold text-white`}
    >
      Ps
    </div>
  ),
  illustrator: (
    <div
      className={`${className} flex items-center justify-center rounded bg-orange-500 text-xs font-bold text-white`}
    >
      Ai
    </div>
  ),
  indesign: (
    <div
      className={`${className} flex items-center justify-center rounded bg-pink-600 text-xs font-bold text-white`}
    >
      Id
    </div>
  ),
  premiere: (
    <div
      className={`${className} flex items-center justify-center rounded bg-purple-600 text-xs font-bold text-white`}
    >
      Pr
    </div>
  ),
  aftereffects: (
    <div
      className={`${className} flex items-center justify-center rounded bg-purple-700 text-xs font-bold text-white`}
    >
      Ae
    </div>
  ),
  lightroom: (
    <div
      className={`${className} flex items-center justify-center rounded bg-blue-600 text-xs font-bold text-white`}
    >
      Lr
    </div>
  ),
  xd: (
    <div
      className={`${className} flex items-center justify-center rounded bg-purple-500 text-xs font-bold text-white`}
    >
      Xd
    </div>
  ),
  acrobat: (
    <div
      className={`${className} flex items-center justify-center rounded bg-red-600 text-xs font-bold text-white`}
    >
      Ac
    </div>
  ),
  audition: (
    <div
      className={`${className} flex items-center justify-center rounded bg-green-700 text-xs font-bold text-white`}
    >
      Au
    </div>
  ),
  animate: (
    <div
      className={`${className} flex items-center justify-center rounded bg-red-700 text-xs font-bold text-white`}
    >
      An
    </div>
  ),
  dreamweaver: (
    <div
      className={`${className} flex items-center justify-center rounded bg-green-600 text-xs font-bold text-white`}
    >
      Dw
    </div>
  ),
});
