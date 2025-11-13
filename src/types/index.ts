import { User } from '@prisma/client';

// Extended types with relations

export type CommentWithRelations = Comment & {
    author: Pick<User, 'id' | 'name' | 'username' | 'image'>;
    replies?: CommentWithRelations[];
    _count: {
        likes: number;
        replies: number;
    };
};

export type UserWithStats = User & {
    _count: {
        posts: number;
        comments: number;
    };
};

// API Response types
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        pages: number;
        page: number;
        limit: number;
    };
}

// Form types (re-exported from validation schemas)
export type {
    LoginInput,
    RegisterInput,
    CreatePostInput,
    UpdatePostInput,
    CreateCommentInput,
    UpdateCommentInput,
    UpdateProfileInput,
} from '@/lib/validations/schemas';