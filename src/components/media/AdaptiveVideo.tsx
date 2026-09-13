'use client';

import { forwardRef, useEffect, useRef } from 'react';

function isHlsUrl(url: string): boolean {
  const path = url.split('?')[0].toLowerCase();
  return path.includes('.m3u8') || path.includes('/manifest/video');
}

type AdaptiveVideoProps = React.VideoHTMLAttributes<HTMLVideoElement> & {
  src: string;
};

/**
 * Progressive MP4 or HLS. Native HLS on Safari; hls.js on Chromium when needed (#101).
 */
const AdaptiveVideo = forwardRef<HTMLVideoElement, AdaptiveVideoProps>(function AdaptiveVideo(
  { src, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLVideoElement | null>(null);

  const setRefs = (node: HTMLVideoElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    const video = innerRef.current;
    if (!video || !src) return;

    let hls: { destroy: () => void } | null = null;
    let cancelled = false;

    const run = async () => {
      if (!isHlsUrl(src)) {
        if (video.src !== src) video.src = src;
        return;
      }

      const canNative =
        video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
        video.canPlayType('application/x-mpegURL') !== '';

      if (canNative) {
        if (video.src !== src) video.src = src;
        return;
      }

      try {
        const HlsModule = await import('hls.js');
        const Hls = HlsModule.default;
        if (cancelled || !Hls.isSupported()) {
          video.src = src;
          return;
        }
        const instance = new Hls({ enableWorker: true });
        instance.loadSource(src);
        instance.attachMedia(video);
        hls = instance;
      } catch {
        video.src = src;
      }
    };

    void run();

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src]);

  return <video ref={setRefs} {...rest} />;
});

export default AdaptiveVideo;
