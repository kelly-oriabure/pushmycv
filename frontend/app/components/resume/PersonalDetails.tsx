'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { User } from 'lucide-react';
import { FormWrapper } from './FormWrapper';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { personalDetailsSchema, type PersonalDetailsFormData } from '@/lib/validation/resumeValidation';
import type { ResumeData, PersonalDetailsData } from '@/lib/types';
// Upload to a server endpoint to avoid bundling admin client in the browser
import { CollapsibleSection, CollapsibleSectionContent, CollapsibleSectionTrigger } from '@/components/ui/collapsible-section';
import { useDebounceFormReset } from '@/hooks/useDebounceFormReset';
import { getResetDebounceTime } from '@/lib/config/formConfig';
import { getTemplateConfig } from '@/lib/config/templateConfig';
import { getTemplateKeyFromUuid } from '@/lib/utils/templateUtils';
// Removed ExtractionLoadingSkeleton - using old resume upload module

interface PersonalDetailsProps {
    onNext: () => void;
    onBack: () => void;
    currentStep: number;
    totalSteps: number;
    resumeData: ResumeData;
    updateResumeData: (section: keyof ResumeData, data: any) => void;
    showHeader?: boolean;
    resumeId: string;
    resumeTitle?: string;
    templateId?: string; // Add templateId prop
    isExtracting?: boolean; // Add extraction loading state
}

export const PersonalDetails: React.FC<PersonalDetailsProps> = ({
    onNext,
    onBack,
    currentStep,
    totalSteps,
    resumeData,
    updateResumeData,
    showHeader = false,
    resumeId,
    resumeTitle,
    templateId, // Add templateId parameter
    isExtracting = false // Add extraction loading state
}) => {
    const personal = resumeData.personalDetails;

    // Get template configuration to determine field visibility
    const templateKey = getTemplateKeyFromUuid(templateId);
    const templateConfig = getTemplateConfig(templateKey);
    const showAvatarField = templateConfig.showAvatar;

    const form = useForm<PersonalDetailsFormData>({
        resolver: zodResolver(personalDetailsSchema),
        defaultValues: {
            jobTitle: personal.jobTitle || '',
            firstName: personal.firstName || '',
            lastName: personal.lastName || '',
            email: personal.email || '',
            phone: personal.phone || '',
            address: personal.address || '',
            cityState: personal.cityState || '',
            country: personal.country || '',
            photoUrl: personal.photoUrl || '',
        },
    });

    // Reset form when personal details data changes (e.g., loaded from database)
    React.useEffect(() => {
        const formData = {
            jobTitle: personal.jobTitle || '',
            firstName: personal.firstName || '',
            lastName: personal.lastName || '',
            email: personal.email || '',
            phone: personal.phone || '',
            address: personal.address || '',
            cityState: personal.cityState || '',
            country: personal.country || '',
            photoUrl: personal.photoUrl || '',
        };

        // Only reset if we have actual data (not all empty)
        const hasData = Object.values(formData).some(val => val && val.trim().length > 0);
        if (hasData) {
            form.reset(formData, { keepDefaultValues: false });
        }
    }, [personal.jobTitle, personal.firstName, personal.lastName, personal.email, personal.phone, personal.address, personal.cityState, personal.country, personal.photoUrl]);

    const onSubmit = (data: PersonalDetailsFormData) => {
        updateResumeData('personalDetails', data);
        onNext();
    };

    const handleFieldChange = (field: keyof PersonalDetailsData, value: string) => {
        // Only update if value has actually changed
        if (personal[field] !== value) {
            const updatedData = { ...personal, [field]: value };
            updateResumeData('personalDetails', updatedData);
            form.setValue(field, value);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const body = new FormData();
            body.append('file', file);
            const res = await fetch('/api/upload-avatar', {
                method: 'POST',
                body
            });
            if (!res.ok) {
                const { error } = await res.json().catch(() => ({ error: 'Upload failed' }));
                throw new Error(error || 'Upload failed');
            }
            const { url } = await res.json();
            handleFieldChange('photoUrl', url);
            form.setValue('photoUrl', url);
        } catch (error) {
            console.error('Failed to upload avatar image', error);
        }
    };

    return (
        <>
            {showHeader && <h2 className="text-lg font-bold mb-4">Personal Details</h2>}
            <FormWrapper
                title="Personal Details"
                description="Let's start with the basics."
                resumeScore={0}
                scoreBonus={5}
                scoreText="Complete this step"
                currentStep={currentStep ?? 0}
                totalSteps={totalSteps ?? 0}
                onBack={onBack}
                onNext={() => form.handleSubmit(onSubmit)()}
                nextButtonText="Next: Professional Summary"
                resumeId={resumeId}
                resumeTitle={resumeTitle}
            >
                {false ? (
                    <div>Loading...</div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className={showAvatarField ? "flex items-start gap-8" : "space-y-4"}>
                                {/* Job Title */}
                                <div className="flex-1 space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="jobTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-medium" required>Job Title</FormLabel>
                                                <FormControl>
                                                    <TextField
                                                        placeholder="The role you want"
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            handleFieldChange('jobTitle', e.target.value);
                                                        }}
                                                        showSuccessIcon={!!field.value && !form.formState.errors.jobTitle}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {/* Conditionally render Photo Upload based on template */}
                                {showAvatarField && (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                            {personal.photoUrl ? (
                                                <img src={personal.photoUrl} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <User className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>
                                        <Button asChild variant="link" className="text-sm p-0 h-auto min-h-0">
                                            <label>
                                                Upload photo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* First Name and Last Name */}
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-medium" required>First Name</FormLabel>
                                            <FormControl>
                                                <TextField
                                                    placeholder="e.g., John"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleFieldChange('firstName', e.target.value);
                                                    }}
                                                    showSuccessIcon={!!field.value && !form.formState.errors.firstName}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-medium" required>Last Name</FormLabel>
                                            <FormControl>
                                                <TextField
                                                    placeholder="e.g., Doe"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleFieldChange('lastName', e.target.value);
                                                    }}
                                                    showSuccessIcon={!!field.value && !form.formState.errors.lastName}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Email and Phone */}
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-medium" required>Email</FormLabel>
                                            <FormControl>
                                                <TextField
                                                    type="email"
                                                    placeholder="e.g., john.doe@email.com"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleFieldChange('email', e.target.value);
                                                    }}
                                                    showSuccessIcon={!!field.value && !form.formState.errors.email}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-medium" required>Phone</FormLabel>
                                            <FormControl>
                                                <TextField
                                                    placeholder="e.g., (+234) 70-7890-7890"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        handleFieldChange('phone', e.target.value);
                                                    }}
                                                    showSuccessIcon={!!field.value && !form.formState.errors.phone}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <CollapsibleSection>
                                <CollapsibleSectionTrigger className="group">
                                    Additional information
                                </CollapsibleSectionTrigger>
                                <CollapsibleSectionContent>
                                    <div className="space-y-4">
                                        {/* Address */}
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Address</FormLabel>
                                                    <FormControl>
                                                        <TextField
                                                            placeholder="e.g., 123 Main Street"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                handleFieldChange('address', e.target.value);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-6">
                                            {/* City/State and Country */}
                                            <FormField
                                                control={form.control}
                                                name="cityState"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">City / State</FormLabel>
                                                        <FormControl>
                                                            <TextField
                                                                placeholder="e.g., Ikeja, Lagos, Nigeria"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e);
                                                                    handleFieldChange('cityState', e.target.value);
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="country"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Country</FormLabel>
                                                        <FormControl>
                                                            <TextField
                                                                placeholder="e.g., Nigeria"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e);
                                                                    handleFieldChange('country', e.target.value);
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSectionContent>
                            </CollapsibleSection>
                        </form>
                    </Form>
                )}
            </FormWrapper>
        </>
    );
};
