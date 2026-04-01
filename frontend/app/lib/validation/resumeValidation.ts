
import { z } from 'zod';

// Personal Details validation schema
export const personalDetailsSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional(),
  cityState: z.string().optional(),
  country: z.string().optional(),
  photoUrl: z.string().optional(), // Photo is not required
});

// Reference validation schema
export const referenceSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional().refine((val) => {
    if (!val || val === '') return true; // Allow empty string
    return z.string().email().safeParse(val).success;
  }, 'Please enter a valid email address'),
});

// References section validation schema
export const referencesSchema = z.object({
  hideReferences: z.boolean(),
  references: z.array(referenceSchema),
});

export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>;
export type ReferenceFormData = z.infer<typeof referenceSchema>;
export type ReferencesFormData = z.infer<typeof referencesSchema>;
