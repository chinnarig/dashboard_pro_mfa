import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Post Schemas
export const createPostSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    excerpt: z.string().max(300).optional(),
    coverImage: z.string().url().optional().or(z.literal('')),
    published: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
});

export const updatePostSchema = createPostSchema.partial();

// Comment Schemas
export const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000),
    postId: z.string(),
    parentId: z.string().optional(),
});

export const updateCommentSchema = z.object({
    content: z.string().min(1, 'Comment cannot be empty').max(1000),
});

// User Schemas
export const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .optional(),
    bio: z.string().max(500).optional(),
    image: z.string().url().optional(),
});

// MFA Schemas
export const mfaVerificationSchema = z.object({
    email: z.string().email('Invalid email address'),
    code: z.string().length(6, 'Code must be 6 digits'),
});

export const mfaEnableSchema = z.object({
    code: z.string().length(6, 'Code must be 6 digits'),
});

export const mfaDisableSchema = z.object({
    password: z.string().min(6, 'Password is required'),
    code: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type MfaVerificationInput = z.infer<typeof mfaVerificationSchema>;
export type MfaEnableInput = z.infer<typeof mfaEnableSchema>;
export type MfaDisableInput = z.infer<typeof mfaDisableSchema>;