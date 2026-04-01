'use client';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import ThemeProvider from '@/components/ThemeProvider';

export default function GlobalUIProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <TooltipProvider>
                {children}
                <Toaster />
                <Sonner />
            </TooltipProvider>
        </ThemeProvider>
    );
} 
