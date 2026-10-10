import { createQuery } from '../utils/api/hooks';

// Types

export type SiteData = {
  title: string;
  description: string;
  logo: string;
  icon: string;
  cover_image: string;
  accent_color: string;
  url: string;
  locale: string;
  version: string;
  site_uuid: string;
};

export interface SiteResponseType {
  site: SiteData;
}

// Requests

const dataType = 'SiteResponseType';

export const useBrowseSite = createQuery<SiteResponseType>({
  dataType,
  path: '/site/',
});

// Helpers

export function getHomepageUrl(siteData: SiteData): string {
  const url = new URL(siteData.url);
  const subdir = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;

  return `${url.origin}${subdir}`;
}
