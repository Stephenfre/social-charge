import { useMutation } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { uploadProfileImage } from '~/lib/uploadImage';
import { TablesUpdate } from '~/types/database.types';

type UserUpdate = TablesUpdate<'users'>;

export type UpdateProfileArgs = {
  userId: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  birthDate: string; // ISO date string (YYYY-MM-DD)
  age: number | null; // precomputed age
  profileImageUri?: string | null;
};

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (args: UpdateProfileArgs) => {
      const {
        userId,
        firstName,
        lastName,
        gender,
        city,
        state,
        country,
        birthDate,
        age,
        profileImageUri,
      } = args;

      // 1) Update user profile
      const userInfo: UserUpdate = {
        first_name: firstName,
        last_name: lastName,
        gender: gender as any, // Cast to enum type
        city: city ?? null,
        state: state ?? null,
        country: country ?? null,
        birth_date: birthDate,
        age,
      };

      const { error: updateError } = await supabase
        .from('users')
        .update(userInfo)
        .eq('id', userId);
      if (updateError) throw updateError;

      // 2) Optional image upload → save URL/path on users.profile_picture
      if (profileImageUri) {
        try {
          await uploadProfileImage(userId, profileImageUri);
        } catch (e) {
          // don't fail the whole flow on image upload issues
          console.warn('Failed to upload profile image:', e);
        }
      }

      return { success: true };
    },
  });
}
