import type {
  CreateContentData,
  PageEditableData,
  PostEditableData,
} from '@tryghost/admin-x-framework/api/content-types';

/**
 * The fields the editor writes. `show_title_and_feature_image` is a page field;
 * the write contract strips it from post payloads (post-contract.ts).
 */
export type EditorWritableData = PostEditableData &
  Pick<PageEditableData, 'show_title_and_feature_image'>;

/** A create carries no identity: the server assigns the id and the first token. */
export type EditorCreatePayload = CreateContentData<EditorWritableData>;

/**
 * An update carries the id and the collision token the save was built at. A
 * settings save writes the settings alone, so an update need not carry a title.
 */
export type EditorEditPayload = EditorWritableData & {
  id: string;
  updated_at: string;
};
