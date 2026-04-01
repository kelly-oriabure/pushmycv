'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { deepEqual } from '@/lib/utils/deepEqual';
import { FormWrapper } from './FormWrapper';
import { TextField } from '@/components/ui/text-field';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Trash2 } from 'lucide-react';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import type { ResumeData } from '@/lib/types';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { AddAnotherButton } from './AddAnotherButton';

interface Course {
    course: string;
    institution: string;
    startDate: string;
    endDate: string;
}

interface CoursesProps {
    resumeData: ResumeData;
    updateResumeData: (section: keyof ResumeData, data: any) => void;
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

export const Courses: React.FC<CoursesProps> = ({
    resumeData, updateResumeData, onNext, onBack, currentStep = 0, totalSteps = 0, resumeId, resumeTitle
}) => {
    const form = useForm<CoursesFormData>({
        defaultValues: {
            courses: resumeData.courses && resumeData.courses.length > 0 ? resumeData.courses : [{ course: '', institution: '', startDate: '', endDate: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'courses',
    });

    const [expanded, setExpanded] = useState<string | undefined>(fields.length > 0 ? `course-0` : undefined);

    // Controlled form reset - only when data actually changes from external source
    const lastExternalDataRef = useRef<string>('');

    useEffect(() => {
        const incomingCourses = resumeData.courses.length > 0
            ? resumeData.courses.map((entry, i) => ({
                course: entry.course ?? '',
                institution: entry.institution ?? '',
                startDate: entry.startDate ?? '',
                endDate: entry.endDate ?? '',
            }))
            : [{ course: '', institution: '', startDate: '', endDate: '' }];

        const incomingDataString = JSON.stringify(incomingCourses);

        // Only reset if this is genuinely new external data (not from our own updates)
        if (incomingDataString !== lastExternalDataRef.current) {
            const currentData = form.getValues('courses');

            // Only reset if form data is significantly different
            if (!deepEqual(currentData, incomingCourses)) {
                form.reset({ courses: incomingCourses });
            }

            lastExternalDataRef.current = incomingDataString;
        }
    }, [resumeData.courses, form]);

    // Update store immediately when form changes - debouncing handled by useResumeSectionSyncs hook
    useEffect(() => {
        const subscription = form.watch((value) => {
            if (value.courses) {
                const processedCourses = value.courses.map(course => ({
                    course: course?.course ?? '',
                    institution: course?.institution ?? '',
                    startDate: course?.startDate ?? '',
                    endDate: course?.endDate ?? '',
                }));

                // Update store immediately - sync hook will handle debouncing
                if (!deepEqual(resumeData.courses, processedCourses)) {
                    updateResumeData('courses', processedCourses);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [form, updateResumeData, resumeData.courses]);

    return (
        <FormWrapper
            title="Courses"
            description="List any relevant courses."
            resumeScore={95}
            scoreBonus={5}
            scoreText="Add courses"
            currentStep={currentStep ?? 0}
            totalSteps={totalSteps ?? 0}
            onBack={onBack}
            onNext={onNext}
            nextButtonText="Next"
            resumeId={resumeId}
            resumeTitle={resumeTitle}
        >
            <h2 className="text-lg font-bold mb-4">Courses</h2>
            <Form {...form}>
                <Accordion type="single" collapsible value={expanded || ''} onValueChange={setExpanded} className="mb-4">
                    {fields.map((field, idx) => (
                        <AccordionItem key={field.id} value={`course-${idx}`}>
                            <div className="flex items-center">
                                <AccordionTrigger className="flex-1 py-2">
                                    <span className="font-semibold text-base text-gray-900">{form.getValues(`courses.${idx}.course`) || '(Not specified)'}</span>
                                </AccordionTrigger>
                                <Button variant="ghost" size="icon" onClick={() => remove(idx)} className="ml-2 text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                            <AccordionContent className="px-4 pb-4">
                                <div className="space-y-4">

                                    <CollapsibleSection title="Add Details (Optional)">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <FormField
                                                control={form.control}
                                                name={`courses.${idx}.course`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Course</FormLabel>
                                                        <FormControl>
                                                            <TextField placeholder="Course name" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`courses.${idx}.institution`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Institution</FormLabel>
                                                        <FormControl>
                                                            <TextField placeholder="Institution" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`courses.${idx}.startDate`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Start Date</FormLabel>
                                                        <FormControl>
                                                            <MonthYearPicker
                                                                {...field}
                                                                placeholder="Select start date"
                                                                onChange={(value: string) => field.onChange(value)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`courses.${idx}.endDate`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>End Date</FormLabel>
                                                        <FormControl>
                                                            <MonthYearPicker
                                                                {...field}
                                                                placeholder="Select end date"
                                                                onChange={(value: string) => field.onChange(value)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                    </CollapsibleSection>
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
                    buttonText="Add one more course"
                    entityName="course"
                />
                <div className="mt-4">
                    <Button variant="link" className="text-blue-700 font-medium" onClick={onNext}>
                        Skip &rarr;
                    </Button>
                </div>
            </Form>
        </FormWrapper>
    );
}; 