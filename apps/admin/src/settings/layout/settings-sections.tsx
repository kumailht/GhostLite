import React from 'react';

import AdvancedSettings from '@/settings/advanced/advanced-settings';
import GeneralSettings from '@/settings/general/general-settings';
import SiteSettings from '@/settings/site/site-settings';
import { Stack } from '@tryghost/shade/primitives';
import { useFeatureFlag } from '@tryghost/admin-x-framework/hooks';

const Settings: React.FC = () => {
  const admin7Settings = useFeatureFlag('admin7settings');

  const sections = (
    <>
      <GeneralSettings />
      <SiteSettings />
      <AdvancedSettings />
    </>
  );

  if (!admin7Settings) {
    return (
      <div className="mb-[60vh] px-8 pt-16 tablet:max-w-[760px] tablet:px-14 tablet:pt-0">
        {sections}
      </div>
    );
  }

  // Sections sit 64px apart, matching the page's top and bottom padding.
  return (
    <Stack className="mx-auto max-w-[760px] gap-16 px-8 py-16 tablet:px-(--page-gutter)" gap="none">
      {sections}
    </Stack>
  );
};

export default Settings;
