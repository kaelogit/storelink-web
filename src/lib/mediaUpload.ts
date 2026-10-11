import { createBrowserClient } from '@/lib/supabase';

/**
 * Upload a File/Blob to Cloudflare R2 via the get-upload-url Edge Function.
 * Public media → CDN URL. KYC (`kyc-documents/…`) → private object key (no public URL).
 *
 * Contract: key must be `{prefix}/{auth.uid()}/…` (enforced server-side).
 */
export async function uploadFileToR2(
  file: File | Blob,
  key: string,
  contentType?: string,
): Promise<string> {
  const supabase = createBrowserClient();
  const type =
    contentType ||
    (file instanceof File && file.type ? file.type : '') ||
    'application/octet-stream';

  const contentLength =
    typeof file.size === 'number' && file.size > 0 ? file.size : undefined;

  const body: { key: string; contentType: string; contentLength?: number } = {
    key,
    contentType: type,
  };
  if (contentLength != null) {
    body.contentLength = contentLength;
  }

  const { data, error } = await supabase.functions.invoke<{
    uploadUrl?: string;
    publicUrl?: string;
    key?: string;
    private?: boolean;
    error?: string;
    code?: string;
  }>('get-upload-url', { body });

  if (error) throw error;
  if (!data) throw new Error('R2 upload helper did not return data');
  if (data.error) {
    const code = data.code ? ` [${data.code}]` : '';
    throw new Error(`${data.error}${code}`);
  }
  if (!data.uploadUrl) {
    throw new Error('R2 upload helper did not return uploadUrl');
  }

  const response = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': type },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed with status ${response.status}`);
  }

  const isPrivate = data.private === true || key.startsWith('kyc-documents/');
  if (isPrivate) {
    const storageKey = (data.key || key).replace(/^\//, '');
    if (!storageKey.startsWith('kyc-documents/')) {
      throw new Error('R2 KYC upload did not return a kyc-documents key');
    }
    return storageKey;
  }

  if (!data.publicUrl || !/^https?:\/\//i.test(data.publicUrl)) {
    throw new Error(`R2 publicUrl is not a valid http(s) url: ${data.publicUrl ?? '(missing)'}`);
  }

  return data.publicUrl;
}
