import { createBrowserClient } from '@/lib/supabase';

export async function uploadFileToR2(file: File, key: string): Promise<string> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke<{
    uploadUrl?: string;
    publicUrl?: string;
    error?: string;
  }>('get-upload-url', {
    body: { key, contentType: file.type || 'application/octet-stream' },
  });

  if (error) throw error;
  if (!data) throw new Error('R2 upload helper did not return data');
  if (data.error) throw new Error(data.error);
  if (!data.uploadUrl || !data.publicUrl) {
    throw new Error('R2 upload helper did not return uploadUrl or publicUrl');
  }

  const response = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed with status ${response.status}`);
  }

  return data.publicUrl;
}
