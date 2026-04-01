'use client';
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import templatesData from '@/data/templates';
import { useAuth } from '@/contexts/AuthContext';
import { useResumeStore } from '@/app/store/resumeStore';
import LoadingScreen from '@/app/components/LoadingScreen';
import { toast } from 'sonner';
import { RESUME_IDS } from '@/constants/resume';

const ResumeGallery = () => {
    // Use local static data for templates
    const templates = templatesData;
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const setCurrentResumeId = useResumeStore(state => state.setCurrentResumeId);
    const resetResumeData = useResumeStore(state => state.resetResumeData);
    const [isLoading, setIsLoading] = useState(false);

    // Updated categories as per user request
    const categories = ["All Templates", "Simple", "Modern", "One column", "With photo", "Professional", "ATS"];
    const [selectedCategory, setSelectedCategory] = useState("All Templates");

    // Filter templates based on selected category
    const filteredTemplates = selectedCategory === "All Templates"
        ? templates
        : templates.filter(t => (t.categories || []).includes(selectedCategory));

    // Handler to navigate to resume-options page with template info
    const handleUseTemplate = async (template: any) => {
        // Show a different message while auth is loading
        if (authLoading) {
            toast.info('Checking authentication status...');
            return;
        }

        // Check if user is logged in
        if (!user) {
            toast.error('You must be logged in to create a resume.');
            return;
        }

        setIsLoading(true);
        try {
            setCurrentResumeId(RESUME_IDS.TEMP);
            resetResumeData();
            setTimeout(() => {
                router.push(
                    `/resume-options?templateId=${template.uuid}&templateName=${encodeURIComponent(template.name)}&color=${encodeURIComponent('#000000')}`
                );
            }, 350);
        } catch (error: any) {
            toast.error(error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {isLoading && <LoadingScreen title="Creating your resume..." />}
            <Navbar />

            <div className="container mx-auto px-4 py-12">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Perfect Resume Template</h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Select from our professionally designed templates to create a resume that stands out.
                    </p>
                </div>

                {/* Category Filter Buttons */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            onClick={() => setSelectedCategory(category)}
                            className="rounded-full px-6"
                        >
                            {category}
                        </Button>
                    ))}
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredTemplates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer relative"
                        >
                            {/* Template Preview */}
                            <div className="relative h-100 bg-gray-100 overflow-hidden">
                                <img
                                    src={template.image}
                                    alt={template.name}
                                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                />

                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center ">
                                </div>
                            </div>

                            {/* Template Info*/}
                            <div className='p-6 absolute bottom-0 left-0 right-0 bg-white border-t opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 '>
                                <div className="">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                                                {template.name}
                                            </h3>
                                        </div>
                                    </div>
                                    {/* Optionally show description */}
                                    {template.description && (
                                        <div className="mb-2 text-sm text-gray-600">{template.description}</div>
                                    )}
                                </div>

                                {/* Sliding Action Box - Hidden by default, slides up on hover */}
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1 bg-primary hover:bg-secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUseTemplate(template);
                                        }}
                                        disabled={authLoading || isLoading}
                                    >
                                        Use Template
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="hover:bg-blue-50"
                                    >
                                        👁️
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Load More Button */}
                <div className="text-center mt-12">
                    <Button size="lg" variant="outline" className="border-2 border-gray-300">
                        Load More Templates
                    </Button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ResumeGallery;
