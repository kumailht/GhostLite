import Explore from './explore';
import Network from './network';
import Offers from './offers';
import React from 'react';
import Recommendations from './recommendations';
import SearchableSection from '@/settings/components/searchable-section';
import { checkStripeEnabled } from '@tryghost/admin-x-framework/api/settings';
import { searchKeywords } from './search-keywords';
import { useGlobalData } from '@/settings/providers/global-data-context';

const GrowthSettings: React.FC = () => {
  const { config, settings } = useGlobalData();
  const hasStripeEnabled = checkStripeEnabled(settings || [], config || {});
  const visibleSearchKeywords = [
    searchKeywords.network,
    searchKeywords.explore,
    searchKeywords.recommendations,
    ...(hasStripeEnabled ? [searchKeywords.offers] : []),
  ].flat();

  return (
    <SearchableSection keywords={visibleSearchKeywords} title="Growth">
      <Network keywords={searchKeywords.network} />
      <Explore keywords={searchKeywords.explore} />
      <Recommendations keywords={searchKeywords.recommendations} />
      {hasStripeEnabled && <Offers keywords={searchKeywords.offers} />}
    </SearchableSection>
  );
};

export default GrowthSettings;
