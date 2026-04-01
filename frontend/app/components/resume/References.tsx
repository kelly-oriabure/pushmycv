'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deepEqual } from '@/lib/utils/deepEqual';
import { FormWrapper } from './FormWrapper';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Trash2 } from 'lucide-react';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { referencesSchema, type ReferencesFormData } from '@/lib/validation/resumeValidation';
import type { ResumeData, ReferencesData } from '@/lib/types';
import { AddAnotherButton } from './AddAnotherButton';

interface ReferencesProps {
    resumeData: ResumeData;
    updateResumeData: (section: keyof ResumeData, data: any) => void;
    onNext?: () => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
    resumeId: string;
    resumeTitle?: string;
}

export const References: React.FC<ReferencesProps> = ({
    resumeData,
    updateResumeData,
    onNext,
    onBack,
    currentStep,
    totalSteps,
    resumeId,
    resumeTitle
}) => {
    const [expanded, setExpanded] = useState<string | undefined>('reference-0');

    // Refs for controlling form reset behavior
    const lastExternalDataRef = useRef<string>('');

    const form = useForm<ReferencesFormData>({
        resolver: zodResolver(referencesSchema),
        defaultValues: {
            hideReferences: resumeData.references?.hideReferences ?? false,
            references: resumeData.references?.references?.length > 0
                ? resumeData.references.references.map(ref => ({
                    name: ref.name ?? '',
                    company: ref.company ?? '',
                    phone: ref.phone ?? '',
                    email: ref.email ?? ''
                  }))
                : [{ name: '', company: '', phone: '', email: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "references"
    });

    // Controlled form reset - only when data actually changes from external source
    useEffect(() => {
        const incomingReferences = resumeData.references?.references?.length > 0
            ? resumeData.references.references.map(ref => ({
                name: ref.name ?? '',
                company: ref.company ?? '',
                phone: ref.phone ?? '',
                email: ref.email ?? ''
              }))
            : [{ name: '', company: '', phone: '', email: '' }];
        
        const incomingDataString = JSON.stringify(incomingReferences);
        
        // Only reset if this is genuinely new external data (not from our own updates)
        if (incomingDataString !== lastExternalDataRef.current) {
            const currentData = form.getValues('references');
            
            // Only reset if form data is significantly different
            if (!deepEqual(currentData, incomingReferences)) {
                form.reset({ 
                    hideReferences: resumeData.references?.hideReferences ?? false,
                    references: incomingReferences 
                });
            }
            
            lastExternalDataRef.current = incomingDataString;
        }
    }, [resumeData.references, form]);

    // Update store immediately when form changes - debouncing handled by useResumeSectionSyncs hook
    useEffect(() => {
        const subscription = form.watch((value) => {
            if (value.references && value.hideReferences !== undefined) {
                const processedData = {
                    hideReferences: value.hideReferences ?? false,
                    references: (value.references || []).map(ref => ({
                        name: ref?.name ?? '',
                        company: ref?.company ?? '',
                        phone: ref?.phone ?? '',
                        email: ref?.email ?? ''
                    }))
                };

                // Update store immediately - sync hook will handle debouncing
                if (!deepEqual(resumeData.references, processedData)) {
                    updateResumeData('references', processedData);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [form, updateResumeData, resumeData.references]);

    const onSubmit = (data: ReferencesFormData) => {
        updateResumeData('references', data);
        if (onNext) onNext();
    };

    const addReference = () => {
        append({ name: '', company: '', phone: '', email: '' });
        setExpanded(`reference-${fields.length}`);
    };

    return (
        <FormWrapper
            title="References"
            description="Add references if required."
            resumeScore={90}
            scoreBonus={5}
            scoreText="Add references"
            currentStep={currentStep ?? 0}
            totalSteps={totalSteps ?? 0}
            onBack={onBack}
            onNext={onNext}
            nextButtonText="Next: Courses"
            resumeId={resumeId}
            resumeTitle={resumeTitle}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Removed the checkbox for 'I'll provide references upon request' */}

                    {/* Always render the reference form by default */}
                    <>
                        <Accordion type="single" collapsible value={expanded} onValueChange={setExpanded} className="space-y-4">
                            {fields.map((field, index) => (
                                <AccordionItem value={`reference-${index}`} key={field.id}>
                                    <div className="flex items-center">
                                        <AccordionTrigger className="flex-1 py-2">
                                            <span className="font-semibold text-gray-800">
                                                {form.watch(`references.${index}.name`) || 'Form Title'}
                                            </span>
                                        </AccordionTrigger>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                remove(index);
                                            }}
                                            className="text-gray-400 hover:text-red-500 ml-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <AccordionContent className="">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <FormField
                                                control={form.control}
                                                name={`references.${index}.name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='font-normal'>Full Name *</FormLabel>
                                                        <FormControl>
                                                            <TextField placeholder="e.g. Jane Doe" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`references.${index}.company`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='font-normal'>Company & Job Title</FormLabel>
                                                        <FormControl>
                                                            <TextField placeholder="e.g. CEO at Example Corp" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <FormField
                                                control={form.control}
                                                name={`references.${index}.email`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='font-normal'>Email</FormLabel>
                                                        <FormControl>
                                                            <TextField type="email" placeholder="e.g. jane.doe@example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`references.${index}.phone`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='font-normal'>Phone</FormLabel>
                                                        <FormControl>
                                                            <TextField placeholder="e.g. +234 090-123-4567" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        {/* <Button variant="link" type="button" onClick={addReference} className="mt-4">
                            + Add another reference
                        </Button> */}
                        <AddAnotherButton
                            append={append}
                            setExpanded={setExpanded}
                            fields={fields}
                            defaultValues={{ name: '', company: '', phone: '', email: '' }}
                            buttonText="Add one more reference"
                            entityName="reference"
                        />
                    </>

                    {/* Add skip link at the bottom */}
                    <div className="mt-4">
                        <Button variant="link" type="button" className="text-gray-90 font-medium" onClick={onNext}>
                            Skip &rarr;
                        </Button>
                    </div>
                </form>
            </Form>
        </FormWrapper>
    );
};
