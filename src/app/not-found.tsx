'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    // Redirect to home page when route not found
    useEffect(() => {
        router.replace('/');
    }, [router]);

    return null; // or show a loading spinner until redirect
}
