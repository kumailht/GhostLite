import React from 'react';

import PublicationLanguage from './publication-language';
import SEOMeta from './seo-meta';
import SearchableSection from '@/settings/components/searchable-section';
import SocialAccounts from './social-accounts';
import TimeZone from './time-zone';
import TitleAndDescription from './title-and-description';
import SiteAccess from './site-access';
import { searchKeywords } from './search-keywords';

const GeneralSettings: React.FC = () => {
  // This section is going to be updated with merging Twitter and Facebook to the Metadata group,
  // that's why we're using a dedicated searchKeywords array for it.
  return (
    <SearchableSection keywords={Object.values(searchKeywords).flat()} title="General settings">
      <TitleAndDescription keywords={searchKeywords.titleAndDescription} />
      <TimeZone keywords={searchKeywords.timeZone} />
      <PublicationLanguage keywords={searchKeywords.publicationLanguage} />
      <SiteAccess keywords={searchKeywords.siteAccess} />
      <SEOMeta keywords={searchKeywords.metadata} />
      <SocialAccounts keywords={searchKeywords.socialAccounts} />
    </SearchableSection>
  );
};

export default GeneralSettings;
