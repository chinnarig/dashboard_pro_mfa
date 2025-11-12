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

// MFA Response types
export interface MfaSetupResponse {
    secret: string;
    qrCode: string;
    manualEntryKey: string;
}

export interface MfaEnableResponse {
    message: string;
    backupCodes: string[];
}

export interface MfaVerifyResponse {
    success: boolean;
    message: string;
    backupCodeUsed?: boolean;
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
    MfaVerificationInput,
    MfaEnableInput,
    MfaDisableInput,
} from '@/lib/validations/schemas';