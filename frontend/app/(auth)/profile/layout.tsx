'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, FileText, Home, LayoutDashboard, LogOut, Menu, PanelsTopLeft, Settings, User } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseClient } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
};

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/profile/resumes')) return 'Resume Library';
  if (pathname.startsWith('/profile/dashboard')) return 'Dashboard';
  return 'Profile';
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
              'hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl border transition-colors',
                isActive ? 'border-border bg-background' : 'border-border bg-background group-hover:bg-accent'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-5">{item.label}</span>
              {item.description ? (
                <span className="mt-0.5 block text-xs text-muted-foreground truncate">{item.description}</span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user?.id) return;
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('profiles')
        .select('has_onboarded')
        .eq('id', user.id)
        .maybeSingle<{ has_onboarded: boolean }>();

      if (data && data.has_onboarded === false) {
        router.push('/onboarding');
      }
    };
    checkOnboarding();
  }, [router, user?.id]);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        href: '/profile/dashboard',
        label: 'Overview',
        icon: LayoutDashboard,
        description: 'Your progress and next steps',
      },
      {
        href: '/profile/resumes',
        label: 'Resumes',
        icon: FileText,
        description: 'Edit, duplicate, export PDFs',
      },
      {
        href: '/resume-gallery',
        label: 'Templates',
        icon: PanelsTopLeft,
        description: 'Browse designs',
      },
      {
        href: '/resume-score',
        label: 'Resume Score',
        icon: BarChart3,
        description: 'Analyze and improve',
      },
    ],
    []
  );

  const title = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[304px_1fr]">
          <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen">
            <div className="h-full px-4 py-5">
              <div className="h-full rounded-2xl border border-border bg-card shadow-sm">
                <div className="px-5 pt-5">
                  <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 border border-indigo-400/20">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" />
                      </span>
                      <div className="leading-tight">
                        <div className="text-sm font-semibold">PushMyCV</div>
                        <div className="text-xs text-muted-foreground">Workspace</div>
                      </div>
                    </Link>
                    <div className="h-10 w-10 rounded-2xl border border-border bg-muted" />
                  </div>
                </div>

                <div className="px-5 pt-5">
                  <div className="rounded-2xl border border-border bg-muted/40 p-4">
                    <div className="text-xs text-muted-foreground">Signed in as</div>
                    <div className="mt-1 text-sm font-medium truncate">{user?.email || '—'}</div>
                  </div>
                </div>

                <div className="px-5 py-5">
                  <NavList items={navItems} pathname={pathname} />
                </div>

                <div className="mt-auto px-5 pb-5">
                  <Separator />
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => router.push('/pricing')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                    <Button
                      variant="outline"
                      className="shrink-0"
                      size="icon"
                      onClick={() => signOut?.()}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4 text-[11px] text-muted-foreground">
                    <div>© {new Date().getFullYear()} PushMyCV</div>
                    <div className="mt-0.5">Build faster. Apply smarter.</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <header className="sticky top-0 z-40">
              <div className="px-4 pt-4 lg:px-8">
                <div className="rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
                    <div className="flex items-center gap-3">
                      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild className="lg:hidden">
                          <Button variant="outline" size="icon">
                            <Menu className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0">
                          <SheetHeader className="sr-only">
                            <SheetTitle>Navigation</SheetTitle>
                          </SheetHeader>
                          <div className="h-full px-4 py-5">
                            <div className="h-full rounded-2xl border border-border bg-card">
                              <div className="px-5 pt-5">
                                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 border border-indigo-400/20">
                                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" />
                                  </span>
                                  <div className="leading-tight">
                                    <div className="text-sm font-semibold">PushMyCV</div>
                                    <div className="text-xs text-muted-foreground">Workspace</div>
                                  </div>
                                </Link>
                              </div>

                              <div className="px-5 pt-5">
                                <div className="rounded-2xl border border-border bg-muted/40 p-4">
                                  <div className="text-xs text-muted-foreground">Signed in as</div>
                                  <div className="mt-1 text-sm font-medium truncate">{user?.email || '—'}</div>
                                </div>
                              </div>

                              <div className="px-5 py-5">
                                <NavList items={navItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                              </div>

                              <div className="mt-auto px-5 pb-5">
                                <Separator />
                                <div className="mt-4 flex items-center justify-between gap-2">
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => {
                                      setMobileOpen(false);
                                      router.push('/pricing');
                                    }}
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Upgrade
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="shrink-0"
                                    size="icon"
                                    onClick={() => signOut?.()}
                                  >
                                    <LogOut className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="mt-4 text-[11px] text-muted-foreground">
                                  <div>© {new Date().getFullYear()} PushMyCV</div>
                                  <div className="mt-0.5">Build faster. Apply smarter.</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>

                      <div className="leading-tight">
                        <div className="text-xs text-muted-foreground">Workspace</div>
                        <div className="text-base font-semibold">{title}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <Link href="/" className="hidden sm:inline-flex">
                        <Button variant="outline">
                          <Home className="h-4 w-4 mr-2" />
                          Home
                        </Button>
                      </Link>
                      <Link href="/" className="sm:hidden">
                        <Button variant="outline" size="icon" aria-label="Home">
                          <Home className="h-4 w-4" />
                        </Button>
                      </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <User className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">{user?.email || 'Account'}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => router.push('/profile/dashboard')}>Dashboard</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push('/profile/resumes')}>Resumes</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut?.()}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="px-4 pb-10 pt-6 lg:px-8">
              <div className="rounded-2xl border border-border bg-card shadow-sm">
                {children}
              </div>
            </div>

            <footer className="px-4 pb-10 lg:px-8">
              <div className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">Keep shipping. Keep applying.</div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <Link href="/pricing" className="hover:text-foreground transition-colors">
                      Pricing
                    </Link>
                    <Link href="/docs" className="hover:text-foreground transition-colors">
                      Docs
                    </Link>
                    <Link href="/" className="hover:text-foreground transition-colors">
                      Home
                    </Link>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
