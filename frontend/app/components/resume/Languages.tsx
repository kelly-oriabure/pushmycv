'use client';
import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FormWrapper } from './FormWrapper';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { ResumeData } from '@/lib/types';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { TextField } from '@/components/ui/text-field';

interface LanguagesProps {
    resumeData: ResumeData;
    updateResumeData: (section: keyof ResumeData, data: string[]) => void;
    onNext?: () => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
    resumeId: string;
    resumeTitle?: string;
}

type LanguagesFormData = {
    languages: { name: string }[];
};

export const Languages: React.FC<LanguagesProps> = ({
    resumeData,
    updateResumeData,
    onNext,
    onBack,
    currentStep,
    totalSteps,
    resumeId,
    resumeTitle
}) => {
    const form = useForm<LanguagesFormData>({
        defaultValues: {
            languages: resumeData.languages.length > 0 ? resumeData.languages.map(name => ({ name })) : [{ name: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'languages',
    });

    useEffect(() => {
        const current = form.getValues('languages').map(l => l.name);
        const incoming = resumeData.languages;
        if (JSON.stringify(current) !== JSON.stringify(incoming)) {
            form.reset({ languages: incoming.map(name => ({ name })) });
        }
    }, [resumeData.languages, form]);

    useEffect(() => {
        const subscription = form.watch((value) => {
            if (value.languages) {
                updateResumeData('languages', value.languages.map(l => l?.name ?? ''));
            }
        });
        return () => subscription.unsubscribe();
    }, [form, updateResumeData]);

    useEffect(() => {
        if (fields.length === 0) {
            append({ name: '' });
        }
    }, [fields.length, append]);

    return (
        <FormWrapper
            title="Languages"
            description="List the languages you know."
            resumeScore={80}
            scoreBonus={5}
            scoreText="Add languages"
            currentStep={currentStep ?? 0}
            totalSteps={totalSteps ?? 0}
            onBack={onBack}
            onNext={onNext}
            nextButtonText="Next: References"
            resumeId={resumeId}
            resumeTitle={resumeTitle}
        >
            <Form {...form}>
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <FormField
                            key={field.id}
                            control={form.control}
                            name={`languages.${index}.name`}
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                            <TextField 
                                                {...field} 
                                                placeholder="e.g. English (Native), Spanish (Fluent)" 
                                                className="flex-grow bg-gray-50"
                                            />
                                        </FormControl>
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ))}
                </div>
                <Button variant="link" onClick={() => append({ name: '' })} className="mt-4">
                    + Add another language
                </Button>
            </Form>
        </FormWrapper>
    );
};