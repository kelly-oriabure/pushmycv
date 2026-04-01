'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, FileText, Building, Clock, DollarSign, MapPin, Users, Calendar } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { cn } from '@/lib/utils';

interface FormData {
    companyUrl: string;
    jobTitle: string;
    employmentType: string;
    duration: string;
    compensation: string;
    location: string;
    jobType: string;
    workingHours: string;
    yearsExperience: string;
}

const JDGeneratorPage = () => {
    const [formData, setFormData] = useState<FormData>({
        companyUrl: '',
        jobTitle: '',
        employmentType: '',
        duration: '',
        compensation: '',
        location: '',
        jobType: '',
        workingHours: '',
        yearsExperience: '',
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [jobDescription, setJobDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.companyUrl.trim()) {
            newErrors.companyUrl = 'Company URL is required';
        }

        if (!formData.jobTitle.trim()) {
            newErrors.jobTitle = 'Job Title is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGenerate = async () => {
        if (validateForm()) {
            setIsGenerating(true);
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Mock job description response in the specified format without markdown
                const companyName = formData.companyUrl.trim() || 'Company Name';
                const jobTitle = formData.jobTitle.trim() || 'React Developer';
                const experience = formData.yearsExperience.trim() || '3 - 5 years';
                const compensation = formData.compensation.trim() || 'N750k - 1m';
                const location = formData.location.trim() || 'Lagos, Nigeria';
                const jobType = formData.jobType.trim() || '[Onsite / Remote / Hybrid]';
                const employmentType = formData.employmentType.trim() || '[Full-time / Contract]';

                setJobDescription(`Job Title: ${jobTitle}

Location: ${location}
Job Type: ${jobType}
Employment Type: ${employmentType}

About the Role
We're looking for a ${jobTitle} to join our team and help build clean, scalable, and user-friendly applications. You'll collaborate with designers, backend engineers, and product managers to turn ideas into high-quality web experiences.

What You'll Do
• Build and maintain responsive, modern web applications using React.
• Write clean, reusable, and testable code.
• Work closely with UX/UI designers to bring mockups to life.
• Integrate APIs and optimize performance for speed and scalability.
• Debug and fix issues across browsers and devices.
• Collaborate with the team in code reviews, planning sessions, and product discussions.

What We're Looking For
• Strong experience with React.js and its core principles.
• Solid understanding of JavaScript (ES6+), HTML5, and CSS3.
• Familiarity with state management tools (Redux, Zustand, or similar).
• Experience with REST APIs or GraphQL.
• Ability to write unit tests and use testing frameworks like Jest or React Testing Library.
• Strong problem-solving skills and attention to detail.
• Good communication skills and a collaborative mindset.

Nice to Have
• Experience with TypeScript.
• Knowledge of Next.js or other frameworks.
• Familiarity with CI/CD pipelines and version control (Git).
• Understanding of accessibility best practices.

Benefits
• Flexible working hours
• Health, dental, and vision benefits
• Professional development opportunities
• [Any other company-specific perks]

${formData.duration && formData.duration.trim() ? `Contract length: ${formData.duration}\n` : ''}${formData.compensation && formData.compensation.trim() ? `Pay: ${formData.compensation}\n` : ''}${formData.workingHours && formData.workingHours.trim() ? `Expected hours: ${formData.workingHours}\n` : ''}`);
            } catch (error) {
                console.error('Error generating job description:', error);
                setJobDescription('Failed to generate job description. Please try again.');
            } finally {
                setIsGenerating(false);
            }
        }
    };

    const handleReset = () => {
        setFormData({
            companyUrl: '',
            jobTitle: '',
            employmentType: '',
            duration: '',
            compensation: '',
            location: '',
            jobType: '',
            workingHours: '',
            yearsExperience: '',
        });
        setJobDescription('');
        setErrors({});
    };

    const requiredFields = [
        { key: 'companyUrl', label: 'Company URL', placeholder: 'https://company.com', icon: Building },
        { key: 'jobTitle', label: 'Job Title', placeholder: 'Senior Software Engineer', icon: Users },
    ];

    const optionalFields = [
        { key: 'employmentType', label: 'Employment Type', placeholder: 'Full-time, Part-time, Contract...', icon: Calendar },
        { key: 'duration', label: 'Duration', placeholder: 'Permanent, 6 months, 1 year...', icon: Clock },
        { key: 'compensation', label: 'Compensation', placeholder: '$80,000 - $120,000', icon: DollarSign },
        { key: 'location', label: 'Location', placeholder: 'New York, NY / Remote', icon: MapPin },
        { key: 'jobType', label: 'Job Type', placeholder: 'On-site, Remote, Hybrid', icon: Building },
        { key: 'workingHours', label: 'Working Hours', placeholder: '40 hours/week, Flexible...', icon: Clock },
        { key: 'yearsExperience', label: 'Years of Experience', placeholder: '3-5 years', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50/80 to-orange-50/80">
            <Navbar />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="p-2 bg-primary rounded-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                            AI Job Description Generator
                        </h1>
                    </div>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Create professional job descriptions in seconds with the power of AI
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <FileText className="h-5 w-5" />
                                Job Details
                            </CardTitle>
                            <CardDescription>
                                Fill in the details below to generate a professional job description
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form className="space-y-6">
                                {/* Required Fields */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Required Information</h3>
                                    <div className="space-y-4">
                                        {requiredFields.map((field) => {
                                            const Icon = field.icon;
                                            return (
                                                <div key={field.key} className="space-y-2">
                                                    <Label htmlFor={field.key} className="text-sm font-medium">
                                                        {field.label} <span className="text-red-500">*</span>
                                                    </Label>
                                                    <div className="relative">
                                                        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            id={field.key}
                                                            type="text"
                                                            placeholder={field.placeholder}
                                                            value={formData[field.key as keyof FormData]}
                                                            onChange={(e) => handleInputChange(field.key as keyof FormData, e.target.value)}
                                                            className={cn(
                                                                "h-11 pl-10 border-2 transition-smooth",
                                                                errors[field.key]
                                                                    ? "border-red-500 focus-visible:ring-red-500"
                                                                    : "border-gray-200 focus-visible:border-primary"
                                                            )}
                                                        />
                                                    </div>
                                                    {errors[field.key] && (
                                                        <p className="text-sm text-red-500 font-medium">
                                                            {errors[field.key]}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Optional Fields */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Additional Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {optionalFields.map((field) => {
                                            const Icon = field.icon;
                                            return (
                                                <div key={field.key} className="space-y-2">
                                                    <Label htmlFor={field.key} className="text-sm font-medium">
                                                        {field.label}
                                                    </Label>
                                                    <div className="relative">
                                                        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            id={field.key}
                                                            type="text"
                                                            placeholder={field.placeholder}
                                                            value={formData[field.key as keyof FormData]}
                                                            onChange={(e) => handleInputChange(field.key as keyof FormData, e.target.value)}
                                                            className="h-11 pl-10 border-2 border-gray-200 transition-smooth focus-visible:border-primary"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        type="button"
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                <span className="font-bold">Generate Job Description</span>
                                            </>
                                        )}
                                    </Button>

                                    {(Object.values(formData).some(value => value) || jobDescription) && (
                                        <Button
                                            type="button"
                                            onClick={handleReset}
                                            variant="outline"
                                            className="px-4"
                                        >
                                            Reset
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Output Section */}
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Sparkles className="h-5 w-5" />
                                Generated Job Description
                            </CardTitle>
                            <CardDescription>
                                {jobDescription ? 'Your generated job description' : 'Your job description will appear here'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {jobDescription ? (
                                <div className="space-y-4">
                                    <div className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-6 rounded-lg border max-h-[600px] overflow-y-auto">
                                        {jobDescription}
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => navigator.clipboard.writeText(jobDescription)}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Copy to Clipboard
                                        </Button>
                                        <Button
                                            onClick={() => window.print()}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Print
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No job description yet</h3>
                                    <p className="text-gray-500 text-sm">
                                        Fill in the job details and click generate to create your professional job description
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default JDGeneratorPage;