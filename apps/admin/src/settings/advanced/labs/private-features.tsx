import FeatureToggle from './feature-toggle';
import LabItem from './lab-item';
import React from 'react';
import { ActionList } from '@tryghost/shade/components';

type Feature = {
  title: string;
  description: string;
  flag: string;
};

const features: Feature[] = [
  {
    title: 'CSV Content Importer',
    description: 'Enables importing posts from CSV files in the Universal Importer',
    flag: 'csvContentImporter',
  },
  {
    title: 'Admin 7 · Settings navigation',
    description: 'Preview Settings in the Admin navigation shell.',
    flag: 'admin7settings',
  },
  {
    title: 'Updated theme translation (beta)',
    description: 'Enable theme translation using i18next instead of the old translation package.',
    flag: 'themeTranslation',
  },
  {
    title: 'Picture Element',
    description:
      'Use the HTML picture element to serve modern image formats (AVIF, WebP) with automatic fallbacks',
    flag: 'pictureImageFormats',
  },
  {
    title: 'Get helper deduplication',
    description:
      'Deduplicate identical {{#get}} helper queries within a single request to avoid redundant database calls',
    flag: 'getHelperDeduplication',
  },
  {
    title: 'Navigation URL suggestions',
    description:
      'Suggest pages and posts when editing navigation URLs in settings',
    flag: 'navigationUrlSuggestions',
  },
];

const AlphaFeatures: React.FC = () => {
  return (
    <ActionList>
      {features.map((feature) => (
        <LabItem
          key={feature.flag}
          action={<FeatureToggle flag={feature.flag} label={feature.title} />}
          detail={feature.description}
          title={feature.title}
        />
      ))}
    </ActionList>
  );
};

export default AlphaFeatures;
