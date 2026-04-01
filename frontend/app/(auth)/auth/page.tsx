'use client';
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuth();
    const [checkingOnboarding, setCheckingOnboarding] = useState(false);

    useEffect(() => {
        if (!user) return;
        const supabase = getSupabaseClient();
        let isMounted = true;
        const checkOnboarding = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('has_onboarded')
                .eq('id', user.id)
                .single<{ has_onboarded: boolean }>();
            if (!isMounted) return;

            // Check for stored referrer
            let redirectPath = '/profile/dashboard';
            if (typeof window !== 'undefined') {
                const storedReferrer = localStorage.getItem('authReferrer');
                if (storedReferrer) {
                    redirectPath = storedReferrer;
                    localStorage.removeItem('authReferrer'); // Clean up
                }
            }

            // If no profile row, treat as not onboarded
            if (!data || data.has_onboarded === false) {
                router.replace('/onboarding');
            } else {
                router.replace(redirectPath);
            }
            setCheckingOnboarding(false);
        };
        checkOnboarding();
        return () => {
            isMounted = false;
        };
    }, [user, router]);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (isForgotPassword) {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth?mode=reset`,
            });

            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Password reset email sent",
                    description: "Check your email for the reset link",
                });
                setIsForgotPassword(false);
            }
        } else if (isSignUp) {
            if (password !== confirmPassword) {
                toast({
                    title: "Error",
                    description: "Passwords don't match",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                },
            });

            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Account created!",
                    description: "Please check your email to confirm your account",
                });
            }
        } else {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            }
        }

        setIsLoading(false);
    };

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        const supabase = getSupabaseClient();

        // Store referrer for OAuth redirect
        let redirectUrl = `${window.location.origin}/auth`;
        if (typeof window !== 'undefined') {
            const storedReferrer = localStorage.getItem('authReferrer');
            if (storedReferrer) {
                // OAuth will redirect back to /auth, where we'll handle the referrer
                redirectUrl = `${window.location.origin}/auth`;
            }
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
            },
        });

        if (error) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
        setIsLoading(false);
    };

    if (checkingOnboarding) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center text-lg text-gray-500">Checking your account...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="text-2xl font-bold text-primary">
                        PushMyCV
                    </Link>
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>
                            {isForgotPassword
                                ? 'Reset Password'
                                : isSignUp
                                    ? 'Create Account'
                                    : 'Welcome Back'
                            }
                        </CardTitle>
                        <CardDescription>
                            {isForgotPassword
                                ? 'Enter your email to receive a reset link'
                                : isSignUp
                                    ? 'Sign up to get started with PushMyCV'
                                    : 'Sign in to your account'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            <div>
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {!isForgotPassword && (
                                <div>
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {isSignUp && !isForgotPassword && (
                                <div>
                                    <Input
                                        type="password"
                                        placeholder="Confirm Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Loading...' :
                                    isForgotPassword ? 'Send Reset Link' :
                                        isSignUp ? 'Create Account' : 'Sign In'}
                            </Button>
                        </form>

                        {!isForgotPassword && (
                            <>
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
                                    onClick={handleGoogleAuth}
                                    disabled={isLoading}
                                    className="w-full"
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
                                    Continue with Google
                                </Button>
                            </>
                        )}

                        <div className="text-center text-sm">
                            {isForgotPassword ? (
                                <button
                                    onClick={() => setIsForgotPassword(false)}
                                    className="text-primary hover:underline"
                                >
                                    Back to sign in
                                </button>
                            ) : (
                                <>
                                    {!isSignUp && (
                                        <button
                                            onClick={() => setIsForgotPassword(true)}
                                            className="text-primary hover:underline mb-2 block"
                                        >
                                            Forgot your password?
                                        </button>
                                    )}
                                    <span className="text-muted-foreground">
                                        {isSignUp ? "Already have an account?" : "Don't have an account?"}
                                    </span>{' '}
                                    <button
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="text-primary hover:underline"
                                    >
                                        {isSignUp ? 'Sign in' : 'Sign up'}
                                    </button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Auth;