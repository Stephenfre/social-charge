// src/features/events/schemas/createEvent.ts
import { z } from 'zod';
import { toMinutes12 } from '~/utils/datetime';

export const eventSchema = z
  .object({
    title: z.string().min(1, 'Event title is required'),
    hostId: z.string().min(1, 'Host is required'),
    hostName: z.string().min(1, 'Host name missing'),
    ageLimit: z.string().min(1, 'Age Limit is required'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(1000, 'Description too long (max 1000 characters)'),
    location: z.object({
      locationText: z.string().min(1, 'Place id is required'),
      formattedAddress: z.string().min(1, 'Address  is required'),
      provider: z.string().min(1, 'Provider is required'),
      placeid: z.string().min(1, 'Place id is required'),
    }),
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    capacity: z.string().min(1, 'Capacity is required'),
    creditCost: z.string().min(1, 'Credit is required'),
    coverImageUri: z.string().min(1, 'Image required'),
    interests: z
      .array(z.string())
      .min(1, 'Select at least one interest')
      .max(5, 'You can choose up to 5'),
  })
  .superRefine((val, ctx) => {
    const s = toMinutes12(val.startTime);
    const e = toMinutes12(val.endTime);
    if (Number.isNaN(s)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid start time',
        path: ['startTime'],
      });
    }
    if (Number.isNaN(e)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid end time', path: ['endTime'] });
    }
    if (!Number.isNaN(s) && !Number.isNaN(e) && e <= s) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be after start time',
        path: ['endTime'],
      });
    }
  });

export type CreateEventFormValues = z.infer<typeof eventSchema>;
