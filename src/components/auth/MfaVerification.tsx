'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface MfaVerificationProps {
  email: string;
  password: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MfaVerification({ email, password, onSuccess, onCancel }: MfaVerificationProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!code || (code.length !== 6 && code.length !== 9)) {
      toast({
        title: 'Error',
        description: 'Please enter a 6-digit code or backup code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid MFA code');
      }

      toast({
        title: 'Success',
        description: 'MFA verification successful',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length >= 6) {
      handleVerify();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app or use a backup code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Authentication Code</Label>
          <Input
            id="mfa-code"
            type="text"
            placeholder="000000 or XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9A-Za-z-]/g, ''))}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            autoFocus
            maxLength={9}
          />
          <p className="text-sm text-muted-foreground">
            Enter code from your authenticator app or a backup code (XXXX-XXXX)
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={isLoading || code.length < 6}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
