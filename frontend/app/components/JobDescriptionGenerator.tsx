"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

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

const JobDescriptionGenerator = () => {
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

    const handleGenerate = () => {
        if (validateForm()) {
            console.log('Generating job description with data:', formData);
            // Here you would typically send the data to your API
        }
    };

    const requiredFields = [
        { key: 'companyUrl', label: 'URL of Company', placeholder: 'https://company.com' },
        { key: 'jobTitle', label: 'Job Title', placeholder: 'Senior Software Engineer' },
    ];

    const optionalFields = [
        { key: 'employmentType', label: 'Type Of Employment', placeholder: 'Full-time, Part-time, Contract...' },
        { key: 'duration', label: 'Duration Of Job', placeholder: 'Permanent, 6 months, 1 year...' },
        { key: 'compensation', label: 'Compensation', placeholder: '$80,000 - $120,000' },
        { key: 'location', label: 'Job Location', placeholder: 'New York, NY / Remote' },
        { key: 'jobType', label: 'Job Type', placeholder: 'On-site, Remote, Hybrid' },
        { key: 'workingHours', label: 'Working Hours', placeholder: '40 hours/week, Flexible...' },
        { key: 'yearsExperience', label: 'Years Of Experience', placeholder: '3-5 years' },
    ];

    return (
            <div className="container mx-auto px-4 py-4 max-w-4xl">
                {/* Header Section */}
                <h1 className="text-3xl mt-4 font-bold text-center font-heading text-black">
                    AI Job Description Generator
                </h1>

                {/* Main Form Card */}
                <Card className="p-8 shadow-elegant border-0 bg-card/50 backdrop-blur-sm">
                    <form className="space-y-8">
                        {/* Required Fields */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {requiredFields.map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <Label htmlFor={field.key} className="text-sm font-semibold">
                                            {field.label} <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id={field.key}
                                            type="text"
                                            placeholder={field.placeholder}
                                            value={formData[field.key as keyof FormData]}
                                            onChange={(e) => handleInputChange(field.key as keyof FormData, e.target.value)}
                                            className={cn(
                                                "h-12 border-2 transition-smooth",
                                                errors[field.key]
                                                    ? "border-destructive focus-visible:ring-destructive"
                                                    : "border-border focus-visible:border-primary"
                                            )}
                                        />
                                        {errors[field.key] && (
                                            <p className="text-sm text-destructive font-medium">
                                                {errors[field.key]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Optional Fields */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {optionalFields.map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <Label htmlFor={field.key} className="text-sm font-medium">
                                            {field.label}
                                        </Label>
                                        <Input
                                            id={field.key}
                                            type="text"
                                            placeholder={field.placeholder}
                                            value={formData[field.key as keyof FormData]}
                                            onChange={(e) => handleInputChange(field.key as keyof FormData, e.target.value)}
                                            className="h-12 border-2 transition-smooth focus-visible:border-primary"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="pt-6">
                            <Button
                                type="button"
                                variant="secondary"
                                size="lg"
                                className="w-full h-12 text-base text-white font-medium !bg-[#0F52BA]"
                                onClick={handleGenerate}
                            >
                                Generate Job Description
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
    );
};

export default JobDescriptionGenerator;