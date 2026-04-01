'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { deepEqual } from '@/lib/utils/deepEqual';
import { FormWrapper } from './FormWrapper';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Trash2, Plus } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { TextField } from '@/components/ui/text-field';
import { CollapsibleSection, CollapsibleSectionTrigger, CollapsibleSectionContent } from '@/app/components/ui/collapsible-section';
import { AddAnotherButton } from './AddAnotherButton';
import type { ResumeData, EducationEntry } from '@/lib/types';
// Removed ExtractionLoadingSkeleton - using old resume upload module

// Zod validation schema for Education form
const educationEntrySchema = z.object({
  school: z.string().min(1, 'School name is required'),
  degree: z.string().min(1, 'Degree is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  description: z.string().optional(),
});

const educationFormSchema = z.object({
  education: z.array(educationEntrySchema),
});

interface EducationProps {
  resumeData: ResumeData;
  updateResumeData: (section: keyof ResumeData, data: EducationEntry[]) => void;
  onNext?: () => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
  resumeId: string;
  resumeTitle?: string;
  isExtracting?: boolean;
}

type EducationFormData = z.infer<typeof educationFormSchema>;

const RteFieldControl = ({ field }: { field: any }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: 'list-disc pl-6' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-6' } },
      }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
    ],
    content: field.value || '',
    onUpdate: ({ editor }) => {
      field.onChange(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert min-h-[150px] w-full p-3 focus:outline-none',
      },
    },
  });

  return <RichTextEditor editor={editor} />;
};

export const Education: React.FC<EducationProps> = ({
  resumeData,
  updateResumeData,
  onNext,
  onBack,
  currentStep = 0,
  totalSteps = 0,
  resumeId,
  resumeTitle,
  isExtracting = false
}) => {
  const form = useForm<EducationFormData>({
    resolver: zodResolver(educationFormSchema),
    defaultValues: {
      education:
        resumeData.education.length > 0
          ? resumeData.education.map((entry) => ({
            school: entry.school ?? '',
            degree: entry.degree ?? '',
            startDate: entry.startDate ?? '',
            endDate: entry.endDate ?? '',
            location: entry.location ?? '',
            description: entry.description ?? '',
          }))
          : [{ school: '', degree: '', startDate: '', endDate: '', location: '', description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'education',
  });

  const [expanded, setExpanded] = React.useState<string | undefined>(fields.length > 0 ? `education-0` : undefined);

  useEffect(() => {
    if (fields.length > 0 && !expanded) {
      setExpanded(`education-0`);
    }
  }, [fields, expanded]);

  // Controlled form reset - only when data actually changes from external source
  const lastExternalDataRef = useRef<string>('');

  useEffect(() => {
    const incomingEducation = resumeData.education.length > 0
      ? resumeData.education.map((entry) => ({
        school: entry.school ?? '',
        degree: entry.degree ?? '',
        startDate: entry.startDate ?? '',
        endDate: entry.endDate ?? '',
        location: entry.location ?? '',
        description: entry.description ?? '',
      }))
      : [{ school: '', degree: '', startDate: '', endDate: '', location: '', description: '' }];

    const incomingDataString = JSON.stringify(incomingEducation);

    // Only reset if this is genuinely new external data (not from our own updates)
    if (incomingDataString !== lastExternalDataRef.current) {
      const currentData = form.getValues('education');

      // Only reset if form data is significantly different
      if (!deepEqual(currentData, incomingEducation)) {
        form.reset({ education: incomingEducation });
      }

      lastExternalDataRef.current = incomingDataString;
    }
  }, [resumeData.education, form]);

  // Update store immediately when form changes - debouncing handled by useResumeSectionSyncs hook
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.education) {
        const processedEducation = value.education.map((entry, i) => ({
          id: i + 1, // Use index-based ID for frontend consistency
          school: entry?.school ?? '',
          degree: entry?.degree ?? '',
          startDate: entry?.startDate ?? '',
          endDate: entry?.endDate ?? '',
          location: entry?.location ?? '',
          description: entry?.description ?? '',
        }));

        // Update store immediately - sync hook will handle debouncing
        if (!deepEqual(resumeData.education, processedEducation)) {
          updateResumeData('education', processedEducation);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, updateResumeData, resumeData.education]);

  return (
    <FormWrapper
      title="Education"
      description="List your degrees, schools, and graduation years."
      resumeScore={30}
      scoreBonus={10}
      scoreText="Add education"
      currentStep={currentStep ?? 0}
      totalSteps={totalSteps ?? 0}
      onBack={onBack}
      onNext={onNext}
      nextButtonText="Next: Employment History"
      resumeId={resumeId}
      resumeTitle={resumeTitle}
    >
      {false ? (
        <div>Loading...</div>
      ) : (
        <Form {...form}>
          <Accordion type="single" collapsible value={expanded || ''} onValueChange={setExpanded} className="space-y-4">
            {fields.map((field, index) => (
              <AccordionItem value={`education-${index}`} key={field.id}>
                <div className="flex items-center w-full">
                  <AccordionTrigger className="flex-grow px-4 py-3 text-left">
                    <span className="font-semibold text-gray-800">{form.getValues(`education.${index}.school`) || 'Form Title'}</span>
                  </AccordionTrigger>
                  <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500 mr-4">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <AccordionContent className="p-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name={`education.${index}.school`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel>School</FormLabel>
                          <FormControl>
                            <TextField {...field} placeholder="e.g. University of Example" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.degree`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel>Degree</FormLabel>
                          <FormControl>
                            <TextField {...field} placeholder="e.g. B.S. in Computer Science" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name={`education.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <MonthYearPicker {...field} placeholder="Select start date" onChange={(value: string) => field.onChange(value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`education.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <MonthYearPicker {...field} placeholder="Select end date or Present" onChange={(value: string) => field.onChange(value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name={`education.${index}.location`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <TextField {...field} placeholder="e.g. New York, United States" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="my-4">
                    <FormField
                      control={form.control}
                      name={`education.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <RteFieldControl field={field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <CollapsibleSection defaultOpen={false}>
                    <CollapsibleSectionTrigger>
                      Additional Information
                    </CollapsibleSectionTrigger>
                    <CollapsibleSectionContent>
                      <div className="text-sm text-gray-500 p-4">
                        No additional fields available at this time.
                      </div>
                    </CollapsibleSectionContent>
                  </CollapsibleSection>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <AddAnotherButton
            append={append}
            setExpanded={setExpanded}
            fields={fields}
            defaultValues={{ school: '', degree: '', startDate: '', endDate: '', location: '', description: '' }}
            buttonText="Add another degree"
            entityName="education"
          />
        </Form>
      )}
    </FormWrapper>
  );
};