import type { Metadata } from "next";
import "./global.css";
import "./App.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ReactQueryProvider from "@/components/ReactQueryProvider";
import GlobalUIProviders from "@/components/GlobalUIProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProgressBar from "@/components/ProgressBar";

export const metadata: Metadata = {
    title: "PushMyCV - Professional Resume Builder and Job Automation Portal",
    description: "Create professional resumes with our easy-to-use builder and job automation portal",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen font-sans antialiased">
                <ProgressBar />
                <ErrorBoundary>
                    <ReactQueryProvider>
                        <AuthProvider>
                            <GlobalUIProviders>
                                {children}
                            </GlobalUIProviders>
                        </AuthProvider>
                    </ReactQueryProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}
