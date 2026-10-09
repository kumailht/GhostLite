export type PreviewDevice = 'desktop' | 'mobile';

/** The post's public preview URL: `/p/:uuid/` on the site, empty for a post with no uuid yet. */
export function postPreviewUrl(siteUrl: string, uuid: string | null | undefined): string {
  if (!uuid) {
    return '';
  }

  return `${siteUrl.replace(/\/+$/, '')}/p/${uuid}/`;
}
