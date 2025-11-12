// src/app/layout.tsx (ROOT LAYOUT)
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import './globals.css';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Zlavox AI - AI Voce Agents for Automated Phone Calls',
    description: 'Enterprise-Ready AI Voice Agents for Automated Phone Calls',
    keywords: ['blog', 'articles', 'writing', 'community'],
    authors: [{ name: 'Zlavox AI Team' }],
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: process.env.NEXT_PUBLIC_APP_URL,
        siteName: 'Zlavox AI',
        title: 'Zlavox AI - Enterprise-Ready AI Voice Agents for Automated Phone Calls',
        description: 'Enterprise-Ready AI Voice Agents for Automated Phone Calls',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Zlavox AI - Share Your Stories',
        description: 'Enterprise-Ready AI Voice Agents for Automated Phone Calls',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    <Header />
                    <main className="flex-1">{children}</main>
                    {/* <Footer /> */}
                </Providers>
            </body>
        </html>
    );
}