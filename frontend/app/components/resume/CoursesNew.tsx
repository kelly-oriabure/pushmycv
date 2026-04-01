'use client';
import React, { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormWrapper } from './FormWrapper';
import { useFormSync } from '@/hooks/useFormSync';
import { TextField } from '@/components/ui/text-field';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Trash2 } from 'lucide-react';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { AddAnotherButton } from './AddAnotherButton';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import type { ResumeData } from '@/lib/types';

interface Course {
    course: string;
    institution: string;
    startDate: string;
    endDate: string;
}

interface CoursesProps {
    resumeData: ResumeData;
    updateResumeData: <K extends keyof ResumeData>(section: K, data: ResumeData[K]) => void;
    onNext?: () => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
    resumeId: string;
    resumeTitle?: string;
}

type CoursesFormData = {
    courses: Course[];
};

export const CoursesNew: React.FC<CoursesProps> = ({
    resumeData,
    updateResumeData,
    onNext,
    onBack,
    currentStep = 0,
    totalSteps = 0,
    resumeId,
    resumeTitle
}) => {
    const [expanded, setExpanded] = useState<string | undefined>(
        resumeData.courses.length > 0 ? `course-0` : undefined
    );

    // Use the new unified form sync hook
    const { form, syncState, handleSubmit } = useFormSync<CoursesFormData>(
        { courses: resumeData.courses.length > 0 ? resumeData.courses : [{ course: '', institution: '', startDate: '', endDate: '' }] },
        resumeId,
        resumeData,
        updateResumeData,
        'courses'
    );

    const { fields, append, remove } = useFieldArray<CoursesFormData, 'courses'>({
        control: form.control as any,
        name: 'courses',
    });

    const onSubmit = async (data: any) => {
        await handleSubmit(data as CoursesFormData);
        onNext?.();
    };

    return (
        <FormWrapper
            title="Courses"
            description="List any relevant courses."
            resumeScore={Math.min(42 + Math.floor(resumeData.courses.length * 2), 85)}
            scoreBonus={Math.min(resumeData.courses.length * 2, 10)}
            scoreText="Add courses to boost your score"
            currentStep={currentStep || 1}
            totalSteps={totalSteps || 1}
            onBack={onBack}
            nextButtonText="Continue"
            resumeId={resumeId}
            resumeTitle={resumeTitle}
        >
            <div className="space-y-6">
                {/* Sync Status Indicator */}
                <div className="flex justify-end">
                    <SyncStatusIndicator syncState={syncState} />
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Accordion type="single" collapsible value={expanded} onValueChange={setExpanded}>
                            {fields.map((field, index) => (
                                <AccordionItem key={field.id} value={`course-${index}`}>
                                    <AccordionTrigger className="text-left">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <span className="font-medium">
                                                {form.watch(`courses.${index}.course`) || `Course ${index + 1}`}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    remove(index);
                                                    if (expanded === `course-${index}`) {
                                                        setExpanded(undefined);
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 pt-4">
                                            <FormField
                                                control={form.control as any}
                                                name={`courses.${index}.course`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Course Name</FormLabel>
                                                        <FormControl>
                                                            <TextField
                                                                placeholder="e.g., Advanced React Development"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control as any}
                                                name={`courses.${index}.institution`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Institution</FormLabel>
                                                        <FormControl>
                                                            <TextField
                                                                placeholder="e.g., Coursera, Udemy, University"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control as any}
                                                    name={`courses.${index}.startDate`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Start Date</FormLabel>
                                                            <FormControl>
                                                                <MonthYearPicker
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    placeholder="Start date"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control as any}
                                                    name={`courses.${index}.endDate`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>End Date</FormLabel>
                                                            <FormControl>
                                                                <MonthYearPicker
                                                                    value={field.value}
                                                                    onChange={field.onChange}
                                                                    placeholder="End date"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        <AddAnotherButton
                            append={append}
                            setExpanded={setExpanded}
                            fields={fields}
                            defaultValues={{ course: '', institution: '', startDate: '', endDate: '' }}
                            buttonText="Add Another Course"
                            entityName="course"
                        />

                        <div className="flex justify-between pt-6">
                            <Button type="button" variant="outline" onClick={onBack}>
                                Back
                            </Button>
                            <Button type="submit">
                                Continue
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </FormWrapper>
    );
};
