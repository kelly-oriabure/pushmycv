"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSupabaseClient } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';

const OnboardingPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            // Always show onboarding if user is present (server-side check is now in layout)
            if (user) {
                setShowOnboarding(true);
            }
        }
    }, [user]);

    const markOnboarded = async () => {
        if (user?.id) {
            const supabase = getSupabaseClient() as unknown as SupabaseClient<Database>;
            
            const { error } = await (supabase.from("profiles") as any)
                .update({ has_onboarded: true })
                .eq("id", user.id);
            
            if (error) {
                console.error('Error updating profile:', error);
            }
        }
    };

    const handleCreateResume = async () => {
        if (!user?.id) return;

        const supabase = getSupabaseClient() as unknown as SupabaseClient<Database>;
        // Create a new resume for the user
        const { error } = await (supabase.from('resumes') as any).insert({
            user_id: user.id,
            title: 'Untitled Resume',
        });

        if (error) {
            console.error('Error creating resume:', error);
            // Optionally, show a toast notification to the user
            return;
        }

        // Mark user as onboarded and redirect
        await markOnboarded();
        router.push('/resume-gallery');
    };

    const handleUploadResume = async () => {
        await markOnboarded();
        router.push("/resume-gallery"); // Placeholder for upload feature
    };

    if (!showOnboarding) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center py-20 px-4">
                <div className="max-w-4xl mx-auto w-full text-center">
                    {/* <div className="mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to JobEazy!</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Let's get started with creating your professional resume. Choose how you'd like to begin:
                        </p>
                    </div> */}
                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        {/* Create Resume Card */}
                        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-500">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                                    <FileText className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Create Resume</h3>
                                <p className="text-gray-600 mb-6">
                                    Start from scratch with our professional templates and step-by-step builder
                                </p>
                                <Button onClick={handleCreateResume} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold group-hover:bg-blue-700 transition-colors">
                                    Get Started
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </CardContent>
                        </Card>
                        {/* Upload Resume Card */}
                        <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-green-500">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                                    <Upload className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Upload Resume</h3>
                                <p className="text-gray-600 mb-6">
                                    Already have a resume? Upload and manage it in one place (feature coming soon)
                                </p>
                                <Button onClick={handleUploadResume} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold group-hover:bg-green-700 transition-colors">
                                    Upload Resume
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default OnboardingPage; 
