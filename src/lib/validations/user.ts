import { z } from 'zod';

// Update Profile Schema
export const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    image: z.string().url('Must be a valid URL').optional(),
});

// Type exports
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;