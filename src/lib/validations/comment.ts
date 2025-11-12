import { z } from 'zod';

// Create Comment Schema
export const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment must be less than 1000 characters'),
    postId: z.string(),
    parentId: z.string().optional(),
});

// Update Comment Schema
export const updateCommentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment must be less than 1000 characters'),
});

// Type exports
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;