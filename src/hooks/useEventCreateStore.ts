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

type location = {
  locationText: string;
  formattedAddress: string;
  provider: string;
  placeId: string;
};

type EventDraft = {
  eventId: string;
  title: string;
  hostId: string;
  hostName: string;
  ageLimit: string;
  description: string;
  location: location | null;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'h:mm AM/PM'
  endTime: string; // 'h:mm AM/PM'
  capacity: string;
  creditCost: string;
  coverImageUri: string;
  originalCoverImageUri: string; // signed URL you display in UI
  originalCoverPath: string;
  selectedInterests: string[];
};

type EventActions = {
  setField: <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => void;
  setEventId: (v: string) => void;
  setTitle: (v: string) => void;
  setHostId: (v: string) => void;
  setHostName: (v: string) => void;
  setAgeLimit: (v: string) => void;
  setDescription: (v: string) => void;
  setLocation: (v: location) => void;
  setDate: (v: string) => void;
  setStartTime: (v: string) => void;
  setEndTime: (v: string) => void;
  setCapacity: (v: string) => void;
  setCreditCost: (v: string) => void;
  setCoverImageUri: (v: string) => void;
  setOriginalCoverImageUri: (v: string) => void;
  setOriginalCoverPath: (v: string) => void;
  hasCoverChanged: () => boolean;
  toggleInterest: (interest: string) => void;
  setInterests: (list: string[]) => void;
  reset: () => void;

  // helpers for submission:
  buildPayload: () => {
    eventId: string;
    title: string;
    hostId: string;
    hostName: string;
    ageLimit: string;
    description: string;
    location: location | null;
    capacity: string;
    creditCost: string;
    startAtISO?: string;
    endAtISO?: string;
    interests: string[];
    date: string;
    startTime: string;
    endTime: string;
    coverImageUri: string;
    originalCoverImageUri: string;
  };
};

const initialState: EventDraft = {
  eventId: '',
  title: '',
  hostId: '',
  hostName: '',
  ageLimit: '',
  description: '',
  location: null,
  date: '',
  startTime: '',
  endTime: '',
  capacity: '',
  creditCost: '',
  coverImageUri: '',
  originalCoverImageUri: '',
  originalCoverPath: '',
  selectedInterests: [],
};

export const useEventCreateStore = create<EventDraft & EventActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setField: (key, value) => set({ [key]: value } as any),
      setEventId: (v) => set({ eventId: v }),
      setTitle: (v) => set({ title: v }),
      setHostId: (v) => set({ hostId: v }),
      setHostName: (v) => set({ hostName: v }),
      setAgeLimit: (v) => set({ ageLimit: v }),
      setDescription: (v) => set({ description: v }),
      setLocation: (v) => set({ location: v }),
      setDate: (v) => set({ date: v }),
      setStartTime: (v) => set({ startTime: v }),
      setEndTime: (v) => set({ endTime: v }),
      setCapacity: (v) => set({ capacity: v }),
      setCoverImageUri: (v) => set({ coverImageUri: v }),
      setOriginalCoverImageUri: (v) => set({ originalCoverImageUri: v }),
      setOriginalCoverPath: (v) => set({ originalCoverPath: v }),

      hasCoverChanged: () => {
        const { coverImageUri } = get();
        // if user picked a *local* file, it changed
        return !!coverImageUri && coverImageUri.startsWith('file://');
      },

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
          eventId: s.eventId,
          title: s.title.trim(),
          hostId: s.hostId.trim(),
          hostName: s.hostName.trim(),
          ageLimit: s.ageLimit.trim(),
          description: s.description.trim(),
          location: s.location,
          capacity: s.capacity,
          creditCost: s.creditCost,
          startAtISO,
          endAtISO,
          interests: s.selectedInterests,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          coverImageUri: s.coverImageUri,
          originalCoverImageUri: s.originalCoverImageUri,
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
