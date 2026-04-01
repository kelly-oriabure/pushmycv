'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { deepEqual } from '@/lib/utils/deepEqual';
import { FormWrapper } from './FormWrapper';
import { TextField } from '@/components/ui/text-field';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Trash2 } from 'lucide-react';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import type { ResumeData, Internship } from '@/lib/types';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { AddAnotherButton } from './AddAnotherButton';

interface InternshipsProps {
    resumeData: ResumeData;
    updateResumeData: (section: keyof ResumeData, data: Internship[]) => void;
    onNext?: () => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
    resumeId: string;
    resumeTitle?: string;
}

// Internship validation schema
const internshipSchema = z.object({
    jobTitle: z.string().optional(),
    employer: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    location: z.string().optional(),
});

const internshipsSchema = z.object({
    internships: z.array(internshipSchema),
});

type InternshipsFormData = z.infer<typeof internshipsSchema>;

export const Internships: React.FC<InternshipsProps> = ({
    resumeData,
    updateResumeData,
    onNext,
    onBack,
    currentStep = 0,
    totalSteps = 0,
    resumeId,
    resumeTitle
}) => {
    const form = useForm<InternshipsFormData>({
        resolver: zodResolver(internshipsSchema),
        defaultValues: {
            internships: resumeData.internships && resumeData.internships.length > 0 ? resumeData.internships.map(internship => ({
                jobTitle: internship.jobTitle || '',
                employer: internship.employer || '',
                startDate: internship.startDate || '',
                endDate: internship.endDate || '',
                location: internship.location || '', // Map location to country for compatibility
            })) : [{ jobTitle: '', employer: '', startDate: '', endDate: '', location: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'internships',
    });

    const [expanded, setExpanded] = useState<string | undefined>(fields.length > 0 ? `internship-0` : undefined);

    // Controlled form reset - only when data actually changes from external source
    const lastExternalDataRef = useRef<string>('');
    
    useEffect(() => {
        const incomingInternships = resumeData.internships.length > 0
            ? resumeData.internships.map((entry, i) => ({
                jobTitle: entry.jobTitle ?? '',
                employer: entry.employer ?? '',
                startDate: entry.startDate ?? '',
                endDate: entry.endDate ?? '',
                location: entry.location ?? '', // Use location field
            }))
            : [{ jobTitle: '', employer: '', startDate: '', endDate: '', location: '' }];
        
        const incomingDataString = JSON.stringify(incomingInternships);
        
        // Only reset if this is genuinely new external data (not from our own updates)
        if (incomingDataString !== lastExternalDataRef.current) {
            const currentData = form.getValues('internships');
            
            // Only reset if form data is significantly different
            if (!deepEqual(currentData, incomingInternships)) {
                form.reset({ internships: incomingInternships });
            }
            
            lastExternalDataRef.current = incomingDataString;
        }
    }, [resumeData.internships, form]);

    // Update store immediately when form changes - debouncing handled by useResumeSectionSyncs hook
    useEffect(() => {
        const subscription = form.watch((value) => {
            if (value.internships) {
                const processedInternships = value.internships.map(internship => ({
                    jobTitle: internship?.jobTitle ?? '',
                    employer: internship?.employer ?? '',
                    startDate: internship?.startDate ?? '',
                    endDate: internship?.endDate ?? '',
                    location: internship?.location ?? '', // Use location field
                }));

                // Update store immediately - sync hook will handle debouncing
                if (!deepEqual(resumeData.internships, processedInternships)) {
                    updateResumeData('internships', processedInternships);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [form, updateResumeData, resumeData.internships]);

    return (
        <FormWrapper
            title="Internship"
            description="Detail of any internship you have completed."
            resumeScore={75}
            scoreBonus={10}
            scoreText="Add internship or skip"
            currentStep={currentStep ?? 0}
            totalSteps={totalSteps ?? 0}
            onBack={onBack}
            onNext={onNext}
            nextButtonText="Next: Languages"
            resumeId={resumeId}
            resumeTitle={resumeTitle}
        >
            <Form {...form}>
                <Accordion type="single" collapsible value={expanded || ''} onValueChange={setExpanded} className="space-y-4">
                    {fields.map((field, index) => (
                        <AccordionItem value={`internship-${index}`} key={field.id}>
                            <div className="flex items-center">
                                <AccordionTrigger className="flex-1 py-2">
                                    <span className="font-semibold text-gray-800">{form.getValues(`internships.${index}.jobTitle`) || '(Not specified)'}</span>
                                </AccordionTrigger>
                                <Button variant="ghost" size="icon" onClick={() => remove(index)} className="ml-2 text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-5 h-5" />
                                </Button>
                            </div>
                            <AccordionContent className="p-4 border-t">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name={`internships.${index}.jobTitle`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Job Title</FormLabel>
                                                    <FormControl>
                                                        <TextField placeholder="e.g. Software Engineer Intern" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`internships.${index}.employer`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Employer</FormLabel>
                                                    <FormControl>
                                                        <TextField placeholder="e.g. Tech Company Inc." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <CollapsibleSection title="Add Details (Optional)">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`internships.${index}.startDate`}
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
                                                name={`internships.${index}.endDate`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>End Date</FormLabel>
                                                        <FormControl>
                                                            <MonthYearPicker 
                                                                {...field} 
                                                                placeholder="Select end date or Present" 
                                                                onChange={(value: string) => field.onChange(value)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {/* <FormField
                                                control={form.control}
                                                name={`internships.${index}.country`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Country</FormLabel>
                                                        <FormControl>
                                                            <TextField placeholder="e.g. USA" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            /> */}
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
                    defaultValues={{ jobTitle: '', employer: '', startDate: '', endDate: '', location: '' }}
                    buttonText="Add another internship"
                    entityName="internship"
                />
            </Form>
        </FormWrapper>
    );
}; 