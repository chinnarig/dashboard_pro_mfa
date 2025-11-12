'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { loginSchema, type LoginInput } from '@/lib/validations/schemas';
import { Loader2, Shield } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface LoginFormProps {
    onMfaStateChange?: (showingMfa: boolean) => void;
}

export function LoginForm({ onMfaStateChange }: LoginFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showMfaInput, setShowMfaInput] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginInput) => {
        setIsLoading(true);
        setCredentials(data);

        try {
            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            });
            
            console.log(data, result);
            
            if (result?.error) {
                if (result.error === 'MFA_REQUIRED') {
                    // Show MFA input
                    setShowMfaInput(true);
                    if (onMfaStateChange) onMfaStateChange(true);
                    setIsLoading(false);
                    return;
                }
                
                toast({
                    title: 'Error',
                    description: 'Invalid email or password',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Logged in successfully',
                });
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            console.log(error);
            toast({
                title: 'Error',
                description: 'Something went wrong',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const onMfaSubmit = async () => {
        if (!credentials || !mfaCode || (mfaCode.length !== 6 && mfaCode.length !== 9)) {
            toast({
                title: 'Error',
                description: 'Please enter a valid 6-digit code or backup code',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email: credentials.email,
                password: credentials.password,
                mfaCode: mfaCode,
                redirect: false,
            });
            
            if (result?.error) {
                toast({
                    title: 'Error',
                    description: 'Invalid MFA code',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Success',
                    description: 'Logged in successfully',
                });
                router.push('/');
                router.refresh();
            }
        } catch (error) {
            console.log(error);
            toast({
                title: 'Error',
                description: 'Something went wrong',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn('google', { callbackUrl: '/' });
        } catch (error) {
            console.log(error);
            toast({
                title: 'Error',
                description: 'Failed to sign in with Google',
                variant: 'destructive',
            });
            setIsLoading(false);
        }
    };

    // Show MFA verification form if MFA is required
    if (showMfaInput) {
        return (
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code from your authenticator app or use a backup code.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="mfa-code">Authentication Code</Label>
                    <Input
                        id="mfa-code"
                        type="text"
                        placeholder="000000 or XXXX-XXXX"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9A-Za-z-]/g, ''))}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && mfaCode.length >= 6) {
                                onMfaSubmit();
                            }
                        }}
                        disabled={isLoading}
                        autoFocus
                        maxLength={9}
                    />
                    <p className="text-sm text-muted-foreground">
                        Enter code from your authenticator app or a backup code
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={onMfaSubmit}
                        disabled={isLoading || mfaCode.length < 6}
                        className="flex-1"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify & Sign In'
                        )}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            setShowMfaInput(false);
                            if (onMfaStateChange) onMfaStateChange(false);
                            setMfaCode('');
                            setCredentials(null);
                        }}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        {...register('email')}
                        disabled={isLoading}
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a
                            href="/forgot-password"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Forgot password?
                        </a>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register('password')}
                        disabled={isLoading}
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
            >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Google
            </Button>
        </div>
    );
}