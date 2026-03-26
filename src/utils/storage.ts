import createHttpError from 'http-errors';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export const storage = {
  async uploadPdf(userId: string, fileBuffer: Buffer, originalName: string): Promise<string> {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(env.SUPABASE_BUCKET)
      .upload(path, fileBuffer, { contentType: 'application/pdf', upsert: true });

    if (error) {
      throw createHttpError(500, `Failed to upload PDF: ${error.message}`);
    }

    const { data } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
};
