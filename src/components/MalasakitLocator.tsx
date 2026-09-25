'use client';

import React from 'react';
import { DirectoryView } from './DirectoryView';
import { Language } from '@/lib/i18n';

export interface MalasakitLocatorProps {
  language: Language;
  initialTab?: 'malasakit' | 'agencies';
}

/**
 * MalasakitLocator
 * Unified Civic Editorial Hospital Directory & Government Hotline Hub.
 * Defaults to Tab A (Malasakit Center Hospital Desks) with immediate toggle to Tab B.
 */
export const MalasakitLocator: React.FC<MalasakitLocatorProps> = ({
  language,
  initialTab = 'malasakit',
}) => {
  return <DirectoryView language={language} initialTab={initialTab} />;
};
