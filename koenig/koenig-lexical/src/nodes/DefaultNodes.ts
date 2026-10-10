import {
    AtLinkNode,
    AtLinkSearchNode,
    ExtendedHeadingNode,
    ExtendedQuoteNode,
    ExtendedTextNode,
    TKNode,
    ZWNJNode,
    extendedHeadingNodeReplacement,
    extendedQuoteNodeReplacement,
    extendedTextNodeReplacement
} from '@tryghost/kg-default-nodes';

import {AsideNode} from './AsideNode';
import {AudioNode} from './AudioNode';
import {BookmarkNode} from './BookmarkNode';
import {ButtonNode} from './ButtonNode';
import {CalloutNode} from './CalloutNode';
import {CodeBlockNode} from './CodeBlockNode';
import {EmbedNode} from './EmbedNode';
import {FileNode} from './FileNode';
import {GalleryNode} from './GalleryNode';
import {HeaderNode} from './HeaderNode';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {HorizontalRuleNode} from './HorizontalRuleNode';
import {HtmlNode} from './HtmlNode';
import {ImageNode} from './ImageNode';
import {LinkNode} from '@lexical/link';
import {ListItemNode, ListNode} from '@lexical/list';
import {MarkdownNode} from './MarkdownNode';
import {ToggleNode} from './ToggleNode';
import {VideoNode} from './VideoNode';

const DEFAULT_NODES = [
    ExtendedTextNode,
    extendedTextNodeReplacement,
    HeadingNode,
    ExtendedHeadingNode,
    extendedHeadingNodeReplacement,
    QuoteNode,
    ExtendedQuoteNode,
    extendedQuoteNodeReplacement,
    ListNode,
    ListItemNode,
    AsideNode,
    LinkNode,
    CodeBlockNode,
    HorizontalRuleNode,
    ImageNode,
    MarkdownNode,
    AudioNode,
    VideoNode,
    CalloutNode,
    HtmlNode,
    FileNode,
    ButtonNode,
    ToggleNode,
    HeaderNode,
    BookmarkNode,
    EmbedNode,
    GalleryNode,
    TKNode,
    AtLinkNode,
    AtLinkSearchNode,
    ZWNJNode
];

export default DEFAULT_NODES;
