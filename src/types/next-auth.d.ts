import { Role } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            username: string;
            role: Role;
            image?: string | null;
        };
    }

    interface User {
        id: string;
        email: string;
        name?: string | null;
        username: string;
        role: Role;
        image?: string | null;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: Role;
        username: string;
    }
}