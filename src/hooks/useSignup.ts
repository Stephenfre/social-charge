import { useMutation } from '@tanstack/react-query';
import { supabase } from '~/lib/supabase';
import { uploadProfileImage } from '~/lib/uploadImage';
import { TablesInsert, Enums, Constants } from '~/types/database.types';

type InterestEnum = Enums<'interest'>;
type UserInsert = TablesInsert<'users'>;

const isInterest = (x: string): x is InterestEnum =>
  (Constants.public.Enums.interest as readonly string[]).includes(x);

export type SignUpArgs = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  birthDate: string; // ISO date string
  age: number | null; // precomputed age
  profileImageUri?: string | null;
  selectedInterests: string[]; // can be plain strings; we’ll narrow to enum
  skipInterests?: boolean;
};

export function useSignUp() {
  return useMutation({
    mutationFn: async (args: SignUpArgs) => {
      const {
        email,
        password,
        firstName,
        lastName,
        city,
        state,
        country,
        birthDate,
        age,
        profileImageUri,
        selectedInterests,
        skipInterests,
      } = args;

      // 1) Auth sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: `${firstName} ${lastName}` } },
      });
      if (signUpError) throw signUpError;

      // 2) If we already have a session/user, finish profile now
      const userId = signUpData.user?.id ?? signUpData.session?.user.id ?? null;

      if (userId) {
        // 2a) Create/Upsert profile
        const userInfo: UserInsert = {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email,
          city: city ?? null,
          state: state ?? null,
          country: country ?? null,
          birth_date: birthDate,
          age,
        };

        const { error: upsertError } = await supabase.from('users').upsert(userInfo);
        if (upsertError) throw upsertError;

        // 2b) Optional image upload → save URL/path on users.profile_picture
        if (profileImageUri) {
          try {
            await uploadProfileImage(userId, profileImageUri);
          } catch (e) {
            // don’t fail the whole flow on image upload issues
            console.warn('Failed to upload profile image:', e);
          }
        }

        // 2c) Optional interests
        if (!skipInterests && selectedInterests.length) {
          const payload = selectedInterests
            .filter((s): s is string => typeof s === 'string')
            .map((s) => s.trim())
            .filter(isInterest)
            .map((i) => ({ user_id: userId, interest: i }));

          if (payload.length) {
            const { error: interestsError } = await supabase
              .from('user_interests')
              .upsert(payload, { onConflict: 'user_id,interest', ignoreDuplicates: true });
            if (interestsError) throw interestsError;
          }
        }

        return { userId, needsEmailConfirm: false as const };
      }

      // 3) No session (email confirmation required)
      return { userId: null, needsEmailConfirm: true as const };
    },
  });
}
