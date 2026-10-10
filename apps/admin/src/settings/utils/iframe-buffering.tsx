import React, { useEffect, useRef, useState } from 'react';
import { debounce } from './debounce';

type IframeBufferingProps = {
  generateContent: (iframe: HTMLIFrameElement) => void;
  // Apply lightweight changes without rebuilding or fading the iframe contents.
  updateContent?: (iframe: HTMLIFrameElement) => void;
  className?: string;
  parentClassName?: string;
  height?: string;
  width?: string;
  testId?: string;
  addDelay?: boolean;
};

const IframeBuffering: React.FC<IframeBufferingProps> = ({
  generateContent,
  updateContent,
  className,
  height,
  width,
  parentClassName,
  testId,
  addDelay = false,
}) => {
  const [visibleIframeIndex, setVisibleIframeIndex] = useState(0);
  const iframes = [useRef<HTMLIFrameElement>(null), useRef<HTMLIFrameElement>(null)];
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const invisibleIframeIndex = visibleIframeIndex === 0 ? 1 : 0;
    const iframe = iframes[invisibleIframeIndex].current;

    if (iframe) {
      // Start generating the content for the invisible iframe
      generateContent(iframe);

      // Attach a load listener to the iframe
      const onLoad = () => {
        // Once content is loaded, introduce a delay before swapping visibility
        if (addDelay) {
          setTimeout(() => {
            setVisibleIframeIndex(invisibleIframeIndex);
          }, 500); // 500ms delay
        } else {
          setVisibleIframeIndex(invisibleIframeIndex);
        }
      };

      iframe.addEventListener('load', onLoad);

      return () => {
        // Cleanup: Remove the event listener to prevent memory leaks
        iframe.removeEventListener('load', onLoad);
      };
    }
  }, [generateContent]);

  useEffect(() => {
    const iframe = iframes[visibleIframeIndex].current;

    const onScroll = debounce(() => {
      setScrollPosition(iframe?.contentWindow?.scrollY || 0);
    }, 250);

    iframe?.contentWindow?.addEventListener('scroll', onScroll);

    return () => {
      iframe?.contentWindow?.removeEventListener('scroll', onScroll);
    };
  }, [visibleIframeIndex, iframes]);

  useEffect(() => {
    const iframe = iframes[visibleIframeIndex].current;

    if (iframe) {
      // Code injected into the site can make this throw; don't let it crash Settings.
      try {
        iframe.contentWindow?.scrollTo(0, scrollPosition);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    }
  }, [scrollPosition, visibleIframeIndex, iframes]);

  useEffect(() => {
    if (!updateContent) {
      return;
    }

    iframes.forEach(({ current }) => {
      if (current) {
        updateContent(current);
      }
    });
  }, [updateContent]);

  return (
    <div className={parentClassName} data-testid={testId}>
      <iframe
        ref={iframes[0]}
        className={`${className} ${visibleIframeIndex !== 0 ? 'z-10 opacity-0' : 'z-20 opacity-100'}`}
        data-visible={visibleIframeIndex === 0}
        frameBorder="0"
        height={height}
        title="Buffered Preview 1"
        width={width}
      ></iframe>

      <iframe
        ref={iframes[1]}
        className={`${className} ${visibleIframeIndex !== 1 ? 'z-10 opacity-0' : 'z-20 opacity-100'}`}
        data-visible={visibleIframeIndex === 1}
        frameBorder="0"
        height={height}
        title="Buffered Preview 2"
        width={width}
      ></iframe>
    </div>
  );
};

export default IframeBuffering;
