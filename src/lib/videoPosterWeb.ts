/**
 * Extract a JPEG frame from a local video file (browser) for reel/spotlight thumbnails.
 */
export async function captureVideoFrameJpegBlob(file: File, seekSec = 0.12): Promise<Blob | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      const onDone = () => resolve();
      const onErr = () => reject(new Error('video_load'));
      video.addEventListener('loadeddata', onDone, { once: true });
      video.addEventListener('error', onErr, { once: true });
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const t = duration > 0 ? Math.min(Math.max(seekSec, 0.05), duration * 0.15) : seekSec;
    video.currentTime = t;

    await new Promise<void>((resolve, reject) => {
      const onSeeked = () => resolve();
      const onErr = () => reject(new Error('video_seek'));
      video.addEventListener('seeked', onSeeked, { once: true });
      video.addEventListener('error', onErr, { once: true });
    });

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;

    const canvas = document.createElement('canvas');
    const maxW = 720;
    const scale = w > maxW ? maxW / w : 1;
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.82);
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
