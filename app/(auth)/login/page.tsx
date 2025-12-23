'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useActionState, useEffect, useState, Suspense } from 'react';
import { toast } from '@/components/toast';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { login, type LoginActionState } from '../actions';
import { useSession } from 'next-auth/react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: 'idle',
    },
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === 'failed') {
      toast({
        type: 'error',
        description: 'Invalid credentials!',
      });
    } else if (state.status === 'invalid_data') {
      toast({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    } else if (state.status === 'success') {
      setIsSuccessful(true);

      // Update session and handle navigation
      updateSession().then(async () => {
        // Check if redirect URL is an invite link
        if (redirectUrl?.startsWith('/invite/')) {
          // Extract token from /invite/[token]
          const token = redirectUrl.replace('/invite/', '');

          try {
            // Automatically accept the invitation
            const acceptRes = await fetch(`/api/invitations/${token}/accept`, {
              method: 'POST',
            });

            if (acceptRes.ok) {
              const acceptData = await acceptRes.json();
              toast({
                type: 'success',
                description: `Successfully joined ${acceptData.workspaceName}!`,
              });
              // Redirect to home with the invited workspace ID
              router.push(`/?invitedWorkspace=${acceptData.workspaceId}`);
            } else {
              // If accept fails, still redirect to invite page so user can try again
              const errorData = await acceptRes.json().catch(() => ({}));
              toast({
                type: 'error',
                description:
                  errorData.message ||
                  'Failed to accept invitation. Please try again.',
              });
              router.push(redirectUrl);
            }
          } catch (error) {
            console.error('[Login] Error accepting invitation:', error);
            toast({
              type: 'error',
              description: 'Failed to accept invitation. Please try again.',
            });
            router.push(redirectUrl);
          }
        } else if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push('/');
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, router, redirectUrl]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your email and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href={`/register${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {' for free.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
          <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
            <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
              <h3 className="text-xl font-semibold dark:text-zinc-50">
                Sign In
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Use your email and password to sign in
              </p>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
