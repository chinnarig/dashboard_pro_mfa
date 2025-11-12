'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ShieldOff, Copy, Check, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MfaSetup } from './MfaSetup';

interface MfaSettingsProps {
  mfaEnabled: boolean;
  onMfaStatusChange?: (enabled: boolean) => void;
}

export function MfaSettings({ mfaEnabled: initialMfaEnabled, onMfaStatusChange }: MfaSettingsProps) {
  const { toast } = useToast();
  const { update } = useSession();
  const [mfaEnabled, setMfaEnabled] = useState(initialMfaEnabled);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleEnableMfa = () => {
    setShowSetup(true);
  };

  const handleMfaSetupSuccess = () => {
    setMfaEnabled(true);
    setShowSetup(false);
    if (onMfaStatusChange) {
      onMfaStatusChange(true);
    }
    update(); // Refresh session
  };

  const handleDisableMfa = async () => {
    if (!password) {
      toast({
        title: 'Error',
        description: 'Password is required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code: mfaCode || undefined }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disable MFA');
      }

      setMfaEnabled(false);
      setShowDisableDialog(false);
      setPassword('');
      setMfaCode('');
      
      if (onMfaStatusChange) {
        onMfaStatusChange(false);
      }
      
      update(); // Refresh session
      
      toast({
        title: 'Success',
        description: 'MFA has been disabled',
      });
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

  const handleRegenerateBackupCodes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mfa/backup-codes', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate backup codes');
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setShowBackupCodesDialog(true);
      
      toast({
        title: 'Success',
        description: 'New backup codes generated',
      });
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

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAllCodes = () => {
    const allCodes = backupCodes.join('\n');
    navigator.clipboard.writeText(allCodes);
    toast({
      title: 'Copied',
      description: 'All backup codes copied to clipboard',
    });
  };

  if (showSetup) {
    return (
      <MfaSetup
        onSuccess={handleMfaSetupSuccess}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaEnabled ? (
            <>
              <div className="text-sm text-muted-foreground">
                Two-factor authentication is currently enabled on your account.
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRegenerateBackupCodes}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Regenerate Backup Codes'
                  )}
                </Button>

                <Button
                  onClick={() => setShowDisableDialog(true)}
                  variant="destructive"
                >
                  Disable 2FA
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Two-factor authentication is currently disabled. Enable it to add an extra layer of security.
              </div>

              <Button onClick={handleEnableMfa}>
                Enable Two-Factor Authentication
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Disable MFA Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Two-Factor Authentication</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the extra security layer from your account. You'll need to enter your password and optionally a current MFA code to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Password</Label>
              <Input
                id="disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="Enter your password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="disable-mfa-code">MFA Code (Optional)</Label>
              <Input
                id="disable-mfa-code"
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                disabled={isLoading}
                placeholder="000000 or backup code"
                maxLength={9}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableMfa}
              disabled={isLoading || !password}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable MFA'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup Codes Dialog */}
      <AlertDialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Your New Backup Codes</AlertDialogTitle>
            <AlertDialogDescription>
              Save these backup codes in a secure place. Each code can only be used once.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Warning:</strong> These codes replace your previous backup codes. The old codes will no longer work.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg max-h-64 overflow-y-auto">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-background rounded"
                >
                  <code className="font-mono text-sm">{code}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyCode(code, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={handleCopyAllCodes} variant="outline" className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copy All Codes
            </Button>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowBackupCodesDialog(false)}>
              I've Saved My Codes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
