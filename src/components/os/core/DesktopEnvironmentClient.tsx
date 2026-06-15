'use client';

import React from 'react';
import DesktopEnvironment, { type DesktopEnvironmentProps } from './DesktopEnvironment';

export default function DesktopEnvironmentClient(props: DesktopEnvironmentProps) {
  return <DesktopEnvironment {...props} />;
}
