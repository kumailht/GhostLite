import type { SearchResult } from './searchables';

export interface SearchDestination {
  path: string;
}

/** Where selecting a search result goes, keyed on its model rather than its group's display name. */
export function getSearchDestination(result: SearchResult): SearchDestination | null {
  const separator = result.id.indexOf('.');
  const model = result.id.slice(0, separator);
  const key = encodeURIComponent(result.id.slice(separator + 1));

  switch (model) {
    case 'post':
      return { path: `/editor/post/${key}` };
    case 'page':
      return { path: `/editor/page/${key}` };
    case 'user':
      return { path: `/settings/staff/${key}` };
    case 'tag':
      return { path: `/tags/${key}` };
    default:
      return null;
  }
}
