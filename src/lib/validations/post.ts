import { z } from 'zod';

// Create Post Schema
export const createPostSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    excerpt: z.string().max(300, 'Excerpt must be less than 300 characters').optional(),
    coverImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    published: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
});

// Update Post Schema
export const updatePostSchema = createPostSchema.partial();

// Type exports
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;