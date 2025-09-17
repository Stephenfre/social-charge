import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- time helpers (12h <-> Date) ---
const toDateFrom12h = (t?: string, base?: Date) => {
  const d = base ? new Date(base) : new Date();
  if (!t) return d;
  const [time, meridian] = t.split(' ');
  if (!time) return d;
  const [hh, mm] = time.split(':').map(Number);
  let hours = hh || 0;
  const mer = meridian?.toUpperCase();
  if (mer === 'PM' && hours < 12) hours += 12;
  if (mer === 'AM' && hours === 12) hours = 0;
  d.setHours(hours, Number.isFinite(mm) ? mm! : 0, 0, 0);
  return d;
};

const combineDateTimeToISO = (dateISO: string, time12h: string) => {
  // dateISO: 'YYYY-MM-DD', time12h: 'h:mm AM/PM'
  const [y, mo, d] = dateISO.split('-').map(Number);
  const base = new Date(y, (mo || 1) - 1, d || 1, 0, 0, 0, 0);
  const combined = toDateFrom12h(time12h, base);
  return combined.toISOString();
};

type EventDraft = {
  name: string;
  description: string;
  location: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'h:mm AM/PM'
  endTime: string; // 'h:mm AM/PM'
  capacity: string;
  creditCost: string;
  coverImageUri: string;
  selectedInterests: string[];
};

type EventActions = {
  setField: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
  setName: (v: string) => void;
  setDescription: (v: string) => void;
  setLocation: (v: string) => void;
  setDate: (v: string) => void;
  setStartTime: (v: string) => void;
  setEndTime: (v: string) => void;
  setCapacity: (v: string) => void;
  setCreditCost: (v: string) => void;
  setCoverImageUri: (v: string) => void;
  toggleInterest: (interest: string) => void;
  setInterests: (list: string[]) => void;
  reset: () => void;

  // helpers for submission:
  buildPayload: () => {
    name: string;
    description: string;
    location: string;
    capacity: string;
    creditCost: string;
    startAtISO?: string;
    endAtISO?: string;
    interests: string[];
    date: string;
    startTime: string;
    endTime: string;
    coverImageUri: string;
  };
};

const initialState: EventDraft = {
  name: '',
  description: '',
  location: '',
  date: '',
  startTime: '',
  endTime: '',
  capacity: '',
  creditCost: '',
  coverImageUri: '',
  selectedInterests: [],
};

export const useEventCreateStore = create<EventDraft & EventActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setField: (key, value) => set({ [key]: value } as any),
      setName: (v) => set({ name: v }),
      setDescription: (v) => set({ description: v }),
      setLocation: (v) => set({ location: v }),
      setDate: (v) => set({ date: v }),
      setStartTime: (v) => set({ startTime: v }),
      setEndTime: (v) => set({ endTime: v }),
      setCapacity: (v) => set({ capacity: v }),
      setCoverImageUri: (v) => set({ coverImageUri: v }),
      setCreditCost: (v) => set({ creditCost: v }),

      toggleInterest: (interest) => {
        const { selectedInterests } = get();
        const exists = selectedInterests.includes(interest);
        if (exists) {
          set({ selectedInterests: selectedInterests.filter((i) => i !== interest) });
        } else {
          if (selectedInterests.length >= 5) return; // enforce max 5
          set({ selectedInterests: [...selectedInterests, interest] });
        }
      },

      setInterests: (list) => set({ selectedInterests: list.slice(0, 5) }),

      reset: () => set({ ...initialState }),

      buildPayload: () => {
        const s = get();
        const startAtISO =
          s.date && s.startTime ? combineDateTimeToISO(s.date, s.startTime) : undefined;
        const endAtISO = s.date && s.endTime ? combineDateTimeToISO(s.date, s.endTime) : undefined;

        return {
          name: s.name.trim(),
          description: s.description.trim(),
          location: s.location.trim(),
          capacity: s.capacity,
          creditCost: s.creditCost,
          startAtISO,
          endAtISO,
          interests: s.selectedInterests,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          coverImageUri: s.coverImageUri,
        };
      },
    }),
    {
      name: 'event-create-draft',
      storage: createJSONStorage(() => AsyncStorage),
      // Optional: versioning/migrate if you tweak schema later
      version: 1,
    }
  )
);
