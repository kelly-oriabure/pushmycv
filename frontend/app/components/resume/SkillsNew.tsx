'use client';
import React, { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormWrapper } from './FormWrapper';
import { useFormSync } from '@/hooks/useFormSync';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Trash2 } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { AddAnotherButton } from './AddAnotherButton';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { Slider } from '@/components/ui/slider';
import type { ResumeData } from '@/lib/types';

interface Skill {
    name: string;
    level: number;
}

interface SkillsProps {
    resumeData: ResumeData;
    updateResumeData: <K extends keyof ResumeData>(section: K, data: ResumeData[K]) => void;
    onNext?: () => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
    resumeId: string;
    resumeTitle?: string;
}

type SkillsFormData = {
    skills: Skill[];
};

export const SkillsNew: React.FC<SkillsProps> = ({
    resumeData,
    updateResumeData,
    onNext,
    onBack,
    currentStep,
    totalSteps,
    resumeId,
    resumeTitle
}) => {
    const [showLevel, setShowLevel] = useState(false);
    const [expanded, setExpanded] = useState<string | undefined>(
        resumeData.skills.length > 0 ? `skill-0` : undefined
    );

    // Use the new unified form sync hook
    const { form, syncState, handleSubmit } = useFormSync<SkillsFormData>(
        { skills: resumeData.skills.length > 0 ? resumeData.skills : [{ name: '', level: 100 }] },
        resumeId,
        resumeData,
        updateResumeData,
        'skills'
    );

    const { fields, append, remove } = useFieldArray<SkillsFormData, 'skills'>({
        control: form.control as any,
        name: 'skills',
    });

    const onSubmit = async (data: any) => {
        await handleSubmit(data as SkillsFormData);
        onNext?.();
    };

    const handleSuggestedSkill = (skill: string) => {
        const currentSkills = form.getValues('skills');
        if (currentSkills.length < 5 && !currentSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
            append({ name: skill, level: 100 });
        }
    };

    const suggestedSkills = [
        'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL', 'Git', 'AWS', 'Docker', 'Kubernetes'
    ];

    return (
        <FormWrapper
            title="Skills"
            description="List your technical and soft skills."
            resumeScore={Math.min(42 + Math.floor(resumeData.skills.length * 3), 85)}
            scoreBonus={Math.min(resumeData.skills.length * 3, 15)}
            scoreText="Add skills to boost your score"
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
                                <AccordionItem key={field.id} value={`skill-${index}`}>
                                    <AccordionTrigger className="text-left">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <span className="font-medium">
                                                {form.watch(`skills.${index}.name`) || `Skill ${index + 1}`}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    remove(index);
                                                    if (expanded === `skill-${index}`) {
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
                                                name={`skills.${index}.name`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Skill Name</FormLabel>
                                                        <FormControl>
                                                            <TextField
                                                                placeholder="e.g., JavaScript, Project Management"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel>Proficiency Level</FormLabel>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowLevel(!showLevel)}
                                                    >
                                                        {showLevel ? 'Hide' : 'Show'} Level
                                                    </Button>
                                                </div>

                                                {showLevel && (
                                                    <FormField
                                                        control={form.control as any}
                                                        name={`skills.${index}.level`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <div className="space-y-2">
                                                                        <Slider
                                                                            value={[field.value]}
                                                                            onValueChange={(value) => field.onChange(value[0])}
                                                                            max={100}
                                                                            step={10}
                                                                            className="w-full"
                                                                        />
                                                                        <div className="flex justify-between text-sm text-gray-500">
                                                                            <span>Beginner</span>
                                                                            <span className="font-medium">{field.value}%</span>
                                                                            <span>Expert</span>
                                                                        </div>
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>

                        {/* Suggested Skills */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-700">Suggested Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {suggestedSkills.map((skill) => (
                                    <Button
                                        key={skill}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSuggestedSkill(skill)}
                                        className="text-xs"
                                    >
                                        + {skill}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <AddAnotherButton
                            append={append}
                            setExpanded={setExpanded}
                            fields={fields}
                            defaultValues={{ name: '', level: 100 }}
                            buttonText="Add Another Skill"
                            entityName="skill"
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
