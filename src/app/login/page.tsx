'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoginForm } from '@/components/form/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';

export default function LoginPage() {
    const router = useRouter();
    const [showingMfa, setShowingMfa] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        {showingMfa 
                            ? 'Enter your authentication code to continue'
                            : 'Enter your credentials to sign in to your account'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <LoginForm onMfaStateChange={setShowingMfa} />
                    {!showingMfa && (
                        <div className="mt-4 text-center text-sm">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-primary hover:underline font-medium">
                                Sign up
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}