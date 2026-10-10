import { type Config } from '@tryghost/admin-x-framework/api/config';
import { type Setting, getSettingValue } from '@tryghost/admin-x-framework/api/settings';
import { type SiteData, getHomepageUrl } from '@tryghost/admin-x-framework/api/site';
import type { AutocompleteLink } from '@/shared/autocomplete-links';
import type { LinkSearchGroup } from './link-suggestions';

export type PostType = 'post' | 'page';

export interface CardConfigPost {
  displayName: PostType;
  isPage: boolean;
  showTitleAndFeatureImage: boolean;
}

export interface CardConfigPostSource {
  displayName: PostType;
  showTitleAndFeatureImage?: boolean;
}

export interface CardConfigSnippet {
  id: string;
  name: string;
  value: string;
}

export interface CardConfigSnippetInput {
  name: string;
  value: string;
}

export interface PostCardConfigSources {
  settings: Setting[];
  config: Config;
  site: SiteData;
  unsplashHeaders: Record<string, string | boolean>;
  post: CardConfigPost | undefined;
  snippets: CardConfigSnippet[];
}

export interface PostCardConfigPorts {
  fetchEmbed: (url: string, options: { type?: string }) => Promise<unknown>;
  fetchAutocompleteLinks: () => Promise<AutocompleteLink[]>;
  searchLinks: (term?: string) => Promise<LinkSearchGroup[] | undefined>;
  createSnippet?: (snippet: CardConfigSnippetInput) => void;
  deleteSnippet?: (snippet: { name: string }) => void;
}

export interface PostCardConfig extends PostCardConfigPorts {
  unsplash: Record<string, string | boolean> | null;
  klipy: NonNullable<Config['klipy']> | null;
  embedPreviewUrl: string | undefined;
  deprecated: { headerV1: boolean };
  siteTitle: string;
  siteDescription: string;
  siteOgImage: string | null;
  siteTwitterImage: string | null;
  siteCoverImage: string | null;
  siteUrl: string;
  siteUuid: string;
  post: CardConfigPost | undefined;
  snippets: CardConfigSnippet[];
  /** GhostLite has no members or email, so cards carry no visibility settings. */
  visibilitySettings: 'none';
}

export function buildCardConfigPost(
  post: CardConfigPostSource | undefined,
): CardConfigPost | undefined {
  if (!post) {
    return undefined;
  }

  return {
    displayName: post.displayName,
    isPage: post.displayName === 'page',
    showTitleAndFeatureImage: post.showTitleAndFeatureImage ?? true,
  };
}

function imageSetting(settings: Setting[], key: string): string | null {
  const value = getSettingValue(settings, key);
  return typeof value === 'string' ? value : null;
}

export function buildPostCardConfig(
  sources: PostCardConfigSources,
  ports: PostCardConfigPorts,
): PostCardConfig {
  const { settings, config, site } = sources;

  return {
    unsplash: getSettingValue<boolean>(settings, 'unsplash') ? sources.unsplashHeaders : null,
    klipy: config.klipy?.apiKey ? config.klipy : null,
    embedPreviewUrl: config.security?.embedPreviewUrl || undefined,
    fetchAutocompleteLinks: ports.fetchAutocompleteLinks,
    fetchEmbed: ports.fetchEmbed,
    deprecated: {
      headerV1: true,
    },
    searchLinks: ports.searchLinks,
    siteTitle: getSettingValue<string>(settings, 'title') ?? '',
    siteDescription: getSettingValue<string>(settings, 'description') ?? '',
    siteOgImage: imageSetting(settings, 'og_image'),
    siteTwitterImage: imageSetting(settings, 'twitter_image'),
    siteCoverImage: imageSetting(settings, 'cover_image'),
    siteUrl: getHomepageUrl(site),
    siteUuid: site.site_uuid,
    post: sources.post,
    snippets: sources.snippets,
    createSnippet: ports.createSnippet,
    deleteSnippet: ports.deleteSnippet,
    visibilitySettings: 'none',
  };
}

export interface LiveCardConfigSettings {
  showTitleAndFeatureImage?: boolean | null;
}

// The live settings fields, not the saved record: a hidden title the writer
// has only staged still decides what the cards describe.
export function withLiveSettings(
  cardConfig: PostCardConfig,
  live: LiveCardConfigSettings,
): PostCardConfig {
  if (!cardConfig.post) {
    return cardConfig;
  }

  return {
    ...cardConfig,
    post: {
      ...cardConfig.post,
      showTitleAndFeatureImage: live.showTitleAndFeatureImage ?? true,
    },
  };
}
