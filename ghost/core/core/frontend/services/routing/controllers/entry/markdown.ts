import type { Request, Response } from 'express';
import type { Entry, EntryResponse } from '../entry';
import buildCanonicalUrl from './canonical-url';

const urlUtils = require('../../../../../shared/url-utils').default;
const { getMarkdownPath, renderEntryMarkdown } = require('../../../llms/markdown');

function llmsEnabled(req: Request): boolean {
  const llmsService = req.app.get('llmsService') || null;
  return Boolean(llmsService && llmsService.isEnabled());
}

function serveMarkdown(res: Response, entry: Entry) {
  const llmsIndexUrl = urlUtils.urlFor({ relativeUrl: '/llms.txt' }, true);
  res.set('Content-Location', getMarkdownPath(new URL(entry.url).pathname));
  res.type('text/markdown');
  return res.send(renderEntryMarkdown(entry, { llmsIndexUrl }));
}

/**
 * Whether this is a `.md` URL request (the scoped suffix route sets the flag).
 */
export function isMdRequest(res: EntryResponse): boolean {
  return Boolean(res.routerOptions.isMarkdownRequest);
}

/**
 * Serve a `.md` URL as markdown for LLM consumption. When the feature is
 * disabled we redirect to the canonical (html) url. GhostLite has no members,
 * so every entry is public.
 */
export async function serveMdRequest(req: Request, res: EntryResponse, entry: Entry) {
  if (!llmsEnabled(req)) {
    return res.redirect(302, buildCanonicalUrl(req, entry));
  }

  return serveMarkdown(res, entry);
}
