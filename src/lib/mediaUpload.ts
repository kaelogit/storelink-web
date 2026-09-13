import { createBrowserClient } from '@/lib/supabase';

/**
 * Upload a File/Blob to Cloudflare R2 via the get-upload-url Edge Function.
 * Returns the public R2 URL (never Supabase Storage).
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

  const { data, error } = await supabase.functions.invoke<{
    uploadUrl?: string;
    publicUrl?: string;
    error?: string;
  }>('get-upload-url', {
    body: { key, contentType: type },
  });

  if (error) throw error;
  if (!data) throw new Error('R2 upload helper did not return data');
  if (data.error) throw new Error(data.error);
  if (!data.uploadUrl || !data.publicUrl) {
    throw new Error('R2 upload helper did not return uploadUrl or publicUrl');
  }
  if (!/^https?:\/\//i.test(data.publicUrl)) {
    throw new Error(`R2 publicUrl is not a valid http(s) url: ${data.publicUrl}`);
  }

  const response = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': type },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed with status ${response.status}`);
  }

  return data.publicUrl;
}
