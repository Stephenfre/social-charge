import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nickName?: string;
  gender: string;
  city: string;
  state: string;
  country: string;
  birthDate: string;
  age?: number;
  profileImageUri?: string;
  interests: string[];
}

type SignupWizardState = SignupData & {
  setField: <K extends keyof SignupData>(key: K, value: SignupData[K]) => void;
  setInterests: (ints: string[]) => void;
  reset: () => void;
};

export const useSignupWizard = create<SignupWizardState>()(
  persist(
    (set) => ({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      nickName: '',
      gender: '',
      city: '',
      state: '',
      country: '',
      birthDate: '',
      age: undefined,
      profileImageUri: '',
      interests: [],
      setField: (key, value) => set((s) => ({ ...s, [key]: value })),
      setInterests: (ints) => set(() => ({ interests: ints })),
      reset: () =>
        set({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          nickName: '',
          gender: '',
          city: '',
          state: '',
          country: '',
          birthDate: '',
          age: undefined,
          profileImageUri: '',
          interests: [],
        }),
    }),
    {
      name: 'signup-wizard', // comment out to avoid persistence across app restarts
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => s, // or pick specific fields
    }
  )
);
