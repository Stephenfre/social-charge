// src/lib/uploadImage.ts
import * as FileSystem from 'expo-file-system';
import 'react-native-url-polyfill/auto';
import { supabase } from '~/lib/supabase';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const uploadProfileImage = async (userId: string, imageUri: string) => {
  try {
    // Read file as base64 → ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Get file extension and mime type
    const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = `image/${ext}`;

    // Upload to /<userId>/<uuid>.<ext>
    const fileName = `${uuidv4()}.${ext}`;
    const path = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, buffer, { contentType: mime, upsert: true });

    if (error) throw error;

    // Get a signed URL
    const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 10); // 10 minutes

    await supabase.from('users').update({ profile_picture: path }).eq('id', userId);

    return { path, url: signed?.signedUrl };
  } catch (error) {
    console.error('Profile image upload error:', error);
    throw error;
  }
};
