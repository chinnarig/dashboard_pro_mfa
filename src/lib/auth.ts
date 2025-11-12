import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

import { cache } from 'react';
import { getServerSession } from 'next-auth/next';
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
        signOut: '/',
        error: '/login',
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Invalid credentials');
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                });

                if (!user || !user.password) {
                    throw new Error('Invalid credentials');
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isCorrectPassword) {
                    throw new Error('Invalid credentials');
                }

                // Call your backend API to get the API key
                let apiKey = '';
                try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;
                    const response = await fetch(`${backendUrl}/api/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        apiKey = data.apiKey || data.api_key || data.token || '';
                    }
                } catch (error) {
                    console.error('Failed to fetch API key from backend:', error);
                    // Continue without API key - you can throw error here if API key is mandatory
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    username: user.username || user.email.split('@')[0], // Ensure username is never null
                    role: user.role,
                    image: user.image,
                    apiKey, // Include API key in the user object
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
                token.apiKey = user.apiKey; // Store API key in JWT token
            }

            // Handle session updates
            if (trigger === 'update' && session) {
                token = { ...token, ...session };
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role;
                session.user.username = token.username as string;
                session.user.apiKey = token.apiKey as string; // Include API key in session
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to get current user
export const getCurrentUser = cache(async () => {
    try {
        const session = await getServerSession(authOptions);
        return session?.user;
    } catch (error) {
        console.error('Session error:', error);
        return null;
    }
});