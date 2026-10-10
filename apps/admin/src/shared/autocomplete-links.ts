export interface AutocompleteLink {
  label: string;
  value: string;
}

export interface AutocompleteLinkSettings {
  /** Adds a share link for the post or page being edited */
  postType?: 'post' | 'page';
  homepageUrl: string;
}

export function buildAutocompleteLinks(settings: AutocompleteLinkSettings): AutocompleteLink[] {
  const shareLink = settings.postType
    ? [{ label: `Share ${settings.postType}`, value: '#/share' }]
    : [];

  return [{ label: 'Homepage', value: settings.homepageUrl }, ...shareLink];
}
