import { useMemo } from 'react';
import { useFramework } from '@tryghost/admin-x-framework';
import { useKoenigFetchEmbed } from '@tryghost/admin-x-framework/hooks';
import { useBrowseConfig } from '@tryghost/admin-x-framework/api/config';
import { useCurrentUser } from '@tryghost/admin-x-framework/api/current-user';
import { getHomepageUrl, useBrowseSite } from '@tryghost/admin-x-framework/api/site';
import {
  type CardConfigPostSource,
  type CardConfigSnippet,
  type CardConfigSnippetInput,
  type PostCardConfig,
  buildCardConfigPost,
  buildPostCardConfig,
} from './card-config';
import { EDITOR_REQUEST_OPTIONS } from './request-options';
import { useEditorSettings, useSiteTimezone } from './use-editor-settings';
import { usePostLinkSuggestions } from './use-post-link-suggestions';

export interface PostCardConfigOptions {
  post: CardConfigPostSource;
  snippets: CardConfigSnippet[];
  createSnippet?: (snippet: CardConfigSnippetInput) => void;
  deleteSnippet?: (snippet: { name: string }) => void;
}

export interface PostCardConfigState {
  /** Null until the boot data it reads has resolved. */
  cardConfig: PostCardConfig | null;
  /** A boot read failed with no copy cached, so the config waits until it is read again. */
  failed: boolean;
  /** Reads the failed boot data again. */
  retry: () => void;
}

/**
 * Assembles the post editor's Koenig `cardConfig` from the framework's data
 * hooks, and says when the boot data it reads could not be loaded.
 */
export function usePostCardConfig({
  post,
  snippets,
  createSnippet,
  deleteSnippet,
}: PostCardConfigOptions): PostCardConfigState {
  const settingsRead = useEditorSettings();
  const timezone = useSiteTimezone();
  const configRead = useBrowseConfig({ requestOptions: EDITOR_REQUEST_OPTIONS });
  const siteRead = useBrowseSite({ requestOptions: EDITOR_REQUEST_OPTIONS });
  const currentUserRead = useCurrentUser({ requestOptions: EDITOR_REQUEST_OPTIONS });
  const { unsplashConfig } = useFramework();
  const fetchEmbed = useKoenigFetchEmbed(EDITOR_REQUEST_OPTIONS);

  const settings = settingsRead.data?.settings ?? null;
  const config = configRead.data?.config;
  const site = siteRead.data?.site;
  const currentUser = currentUserRead.data;

  const { fetchAutocompleteLinks, searchLinks } = usePostLinkSuggestions({
    postType: post.displayName,
    homepageUrl: site ? getHomepageUrl(site) : '/',
    timezone,
  });

  const cardConfigPost = useMemo(() => buildCardConfigPost(post), [post]);

  const cardConfig = useMemo(() => {
    if (!settings || !config || !site || !currentUser) {
      return null;
    }

    return buildPostCardConfig(
      {
        settings,
        config,
        site,
        unsplashHeaders: unsplashConfig,
        post: cardConfigPost,
        snippets,
      },
      {
        fetchEmbed,
        fetchAutocompleteLinks,
        searchLinks,
        createSnippet,
        deleteSnippet,
      },
    );
  }, [
    settings,
    config,
    site,
    currentUser,
    unsplashConfig,
    cardConfigPost,
    snippets,
    fetchEmbed,
    fetchAutocompleteLinks,
    searchLinks,
    createSnippet,
    deleteSnippet,
  ]);

  // Nothing reads a failed query again on its own, so without a copy the config never builds.
  const failedReads = [settingsRead, configRead, siteRead, currentUserRead].filter(
    (read) => read.data === undefined && read.isError && !read.isFetching,
  );

  return {
    cardConfig,
    failed: failedReads.length > 0,
    retry: () => {
      for (const read of failedReads) {
        void read.refetch();
      }
    },
  };
}
