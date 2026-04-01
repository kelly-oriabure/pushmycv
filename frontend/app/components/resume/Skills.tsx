'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FormWrapper } from './FormWrapper';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2 } from 'lucide-react';
import type { ResumeData, SkillsData, Skill } from '@/lib/types';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { AddAnotherButton } from './AddAnotherButton';
import { deepEqual } from '@/lib/utils/deepEqual';
// Removed ExtractionLoadingSkeleton - using old resume upload module

interface SkillsProps {
    resumeData: ResumeData;
    updateResumeData: (section: keyof ResumeData, data: any) => void;
    onNext?: () => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
    resumeId: string;
    resumeTitle?: string;
    isExtracting?: boolean;
}

const SUGGESTED_SKILLS = [
    'Git', 'Python', 'JavaScript', 'Java', 'Kubernetes', 'SQL', 'MySQL', 'Linux', 'PHP', 'Jenkins'
];

const LEVEL_LABELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

type SkillsFormData = {
    skills: Skill[];
};

export const Skills: React.FC<SkillsProps> = ({
    resumeData,
    updateResumeData,
    onNext,
    onBack,
    currentStep,
    totalSteps,
    resumeId,
    resumeTitle,
    isExtracting = false
}) => {
    const form = useForm<SkillsFormData>({
        defaultValues: {
            skills: resumeData.skills.length > 0 ? resumeData.skills : [{ name: '', level: 100 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'skills',
    });

    const [showLevel, setShowLevel] = useState(false);
    const [expanded, setExpanded] = useState<string | undefined>(fields.length > 0 ? `skill-0` : undefined);

    useEffect(() => {
        if (fields.length > 0 && !expanded) {
            setExpanded(`skill-0`);
        }
    }, [fields, expanded]);

    // Controlled form reset - only when data actually changes from external source
    const lastExternalDataRef = useRef<string>('');

    useEffect(() => {
        const incomingSkills = resumeData.skills.length > 0 ? resumeData.skills : [{ name: '', level: 100 }];
        const incomingDataString = JSON.stringify(incomingSkills);

        // Only reset if this is genuinely new external data (not from our own updates)
        if (incomingDataString !== lastExternalDataRef.current) {
            const currentData = form.getValues('skills');

            // Only reset if form data is significantly different
            if (!deepEqual(currentData, incomingSkills)) {
                form.reset({ skills: incomingSkills });
            }

            lastExternalDataRef.current = incomingDataString;
        }
    }, [resumeData.skills, form]);

    // Update store immediately when form changes - debouncing handled by useResumeSectionSyncs hook
    useEffect(() => {
        const subscription = form.watch((value) => {
            if (value.skills) {
                const processedSkills = Array.isArray(value.skills)
                    ? value.skills.map(skill => ({
                        name: skill?.name ?? '',
                        level: skill?.level ?? 100,
                    }))
                    : [];

                // Update store immediately - sync hook will handle debouncing
                if (!deepEqual(resumeData.skills, processedSkills)) {
                    updateResumeData('skills', processedSkills);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [form, updateResumeData, resumeData.skills]);

    const handleSuggestedSkill = (skill: string) => {
        const currentSkills = form.getValues('skills');
        if (currentSkills.length < 5 && !currentSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
            append({ name: skill, level: 100 });
        }
    };

    return (
        <div>
            <h2 className="text-lg font-bold mb-4">Skills</h2>
            <FormWrapper
                title="Skills"
                description="List your key skills."
                resumeScore={70}
                scoreBonus={10}
                scoreText="Add skills"
                currentStep={currentStep ?? 0}
                totalSteps={totalSteps ?? 1}
                onBack={onBack}
                onNext={onNext}
                nextButtonText="Next: Languages"
                resumeId={resumeId}
                resumeTitle={resumeTitle}
            >
                {false ? (
                    <div>Loading...</div>
                ) : (
                    <Form {...form}>
                        <div className="mb-4 flex items-center gap-2">
                            <Switch
                                checked={!showLevel}
                                onCheckedChange={() => setShowLevel(v => !v)}
                                className="data-[state=checked]:!bg-green-500"
                            />
                            <span className="text-sm text-gray-700">Don't show experience level</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {SUGGESTED_SKILLS.map(skill => (
                                <Badge
                                    key={skill}
                                    className="cursor-pointer bg-gray-100 text-gray-700 hover:bg-blue-100"
                                    onClick={() => handleSuggestedSkill(skill)}
                                >
                                    {skill} <Plus className="inline w-3 h-3 ml-1" />
                                </Badge>
                            ))}
                        </div>
                        <Accordion type="single" collapsible value={expanded || ''} onValueChange={setExpanded} className="mb-4">
                            {fields.map((field, idx) => (
                                <AccordionItem key={field.id} value={`skill-${idx}`}>
                                    <div className="flex items-center">
                                        <AccordionTrigger className="flex-1 px-4 py-2">
                                            <div className="flex flex-row items-center w-full justify-between">
                                                <div className="flex flex-col items-start">
                                                    <span className="font-semibold text-base text-gray-900">{form.getValues(`skills.${idx}.name`) || '(Not specified)'}</span>
                                                    {showLevel && <span className="text-xs text-gray-500">{LEVEL_LABELS[3]}</span>}
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={e => { e.stopPropagation(); remove(idx); }}
                                            className="ml-2 text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <AccordionContent className="px-4 pb-4">
                                        <div className="flex flex-col md:flex-row gap-4 items-start">
                                            <FormField
                                                control={form.control}
                                                name={`skills.${idx}.name`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1 w-full">
                                                        <FormLabel>Skill</FormLabel>
                                                        <FormControl>
                                                            <TextField {...field} placeholder="e.g. JavaScript" required />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {showLevel && (
                                                <FormField
                                                    control={form.control}
                                                    name={`skills.${idx}.level`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1 w-full">
                                                            <FormLabel>Level — <span className="text-blue-700 font-semibold">{LEVEL_LABELS[Math.floor(field.value / 33.34)]}</span></FormLabel>
                                                            <FormControl>
                                                                <Slider
                                                                    min={0}
                                                                    max={100}
                                                                    step={33.33}
                                                                    value={[field.value]}
                                                                    onValueChange={([val]) => field.onChange(val)}
                                                                    className="w-full pt-2"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                        <AddAnotherButton
                            append={append}
                            setExpanded={setExpanded}
                            fields={fields}
                            defaultValues={{ name: '' }}
                            buttonText="Add one more skill"
                            entityName="skill"
                        />
                        <div className="mt-4">
                            <Button variant="link" className="text-blue-700 font-medium" onClick={onNext}>
                                Skip &rarr;
                            </Button>
                        </div>
                    </Form>
                )}
            </FormWrapper>
        </div>
    );
}; 