import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadFileToR2 } from '@/lib/mediaUpload';

export async function sendChatImageMessage(
  supabase: SupabaseClient,
  input: {
    chatId: string;
    userId: string;
    file: File;
    caption?: string;
  },
): Promise<{ id: string; image_url: string; text: string; created_at: string }> {
  const ext = (input.file.name.split('.').pop() || 'jpg').toLowerCase();
  const key = `chat-attachments/${input.userId}/${Date.now()}.${ext}`;
  const publicUrl = await uploadFileToR2(input.file, key);
  const text = input.caption?.trim() || 'Sent a photo';

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.chatId,
      sender_id: input.userId,
      text,
      image_url: publicUrl,
      type: 'image',
    })
    .select('id, image_url, text, created_at')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Could not send image.');
  return data as { id: string; image_url: string; text: string; created_at: string };
}
