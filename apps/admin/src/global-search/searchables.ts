import type { SearchIndexItem } from '@/shared/search-index';

export type SearchableModel = 'user' | 'tag' | 'post' | 'page';

/** A search-index entry. */
export type SearchItem = SearchIndexItem & { path?: string; keywords?: string };

export interface Searchable {
  name: string;
  key?: string;
  model: SearchableModel;
  idField: 'id' | 'slug';
  titleField: 'name' | 'title';
  index: Array<'name' | 'title' | 'keywords'>;
}

export interface SearchResult {
  id: string;
  path?: string;
  title: string;
  keywords?: string;
  groupName: string;
  groupKey?: string;
  status?: string;
}

export interface SearchResultGroup {
  groupName: string;
  groupKey?: string;
  options: SearchResult[];
}

const STAFF: Searchable = {
  name: 'Staff',
  model: 'user',
  idField: 'slug',
  titleField: 'name',
  index: ['name'],
};

const TAGS: Searchable = {
  name: 'Tags',
  model: 'tag',
  idField: 'slug',
  titleField: 'name',
  index: ['name'],
};

const POSTS: Searchable = {
  name: 'Posts',
  model: 'post',
  idField: 'id',
  titleField: 'title',
  index: ['title'],
};

const PAGES: Searchable = {
  name: 'Pages',
  model: 'page',
  idField: 'id',
  titleField: 'title',
  index: ['title'],
};

export function getSearchables(): Searchable[] {
  return [STAFF, TAGS, POSTS, PAGES];
}

const STATUS_PRIORITY: Record<string, number> = {
  scheduled: 1,
  draft: 2,
  published: 3,
  sent: 4,
};

export function sortSearchResultsByStatus(
  results: SearchResult[],
  model: SearchableModel,
): SearchResult[] {
  if (model !== 'post' && model !== 'page') {
    return results;
  }

  const priority = (result: SearchResult) => STATUS_PRIORITY[result.status ?? ''] ?? 5;
  return [...results].sort((a, b) => priority(a) - priority(b));
}

export function createSearchResult(searchable: Searchable, item: SearchItem): SearchResult {
  return {
    id: `${searchable.model}.${item[searchable.idField]}`,
    path: item.path,
    title: item[searchable.titleField] ?? '',
    keywords: item.keywords,
    groupName: searchable.name,
    groupKey: searchable.key,
    status: item.status,
  };
}
