import { File } from 'expo-file-system';
import { supabase } from '~/lib/supabase';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const uploadProfileImage = async (userId: string, imageUri: string) => {
  try {
    const fileObj = new File(imageUri);
    const fh = await fileObj.open();

    const size = fh.size ?? 0; // avoid null
    if (!size) throw new Error('File size is null or zero');

    const bytes = await fh.readBytes(size);

    // Get file extension and mime type
    const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = `image/${ext}`;

    // Upload to /<userId>/<uuid>.<ext>
    const fileName = `${uuidv4()}.${ext}`;
    const path = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: mime, upsert: true });

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

export const uploadEventCoverImage = async (eventId: string, imageUri: string) => {
  try {
    const fileObj = new File(imageUri);
    const fh = await fileObj.open();

    const size = fh.size ?? 0; // avoid null
    if (!size) throw new Error('File size is null or zero');

    const bytes = await fh.readBytes(size);

    // Get file extension and mime type
    const ext = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = `image/${ext}`;

    // Upload to /<userId>/<uuid>.<ext>
    const fileName = `${uuidv4()}.${ext}`;
    const path = `${eventId}/${fileName}`;

    const { error } = await supabase.storage
      .from('event_cover')
      .upload(path, bytes, { contentType: mime, upsert: true });

    if (error) throw error;

    // Get a signed URL
    const { data: signed } = await supabase.storage
      .from('event_cover')
      .createSignedUrl(path, 60 * 10); // 10 minutes

    await supabase.from('events').update({ cover_img: path }).eq('id', eventId);

    return { path, url: signed?.signedUrl };
  } catch (error) {
    console.error('Profile image upload error:', error);
    throw error;
  }
};
