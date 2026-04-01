'use client';
import React, { useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Plus, Trash2 } from 'lucide-react';
import { FormWrapper } from './FormWrapper';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { TextField } from '@/components/ui/text-field';
import { CollapsibleSection } from '@/app/components/ui/collapsible-section';
import { AddAnotherButton } from './AddAnotherButton';
import type { ResumeData, EmploymentEntry } from '@/lib/types';
import { deepEqual } from '@/lib/utils/deepEqual';
// Removed ExtractionLoadingSkeleton - using old resume upload module

interface EmploymentHistoryProps {
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

type EmploymentFormData = {
  employmentHistory: EmploymentEntry[];
};

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

export const EmploymentHistory: React.FC<EmploymentHistoryProps> = ({
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
  const form = useForm<EmploymentFormData>({
    defaultValues: {
      employmentHistory:
        resumeData.employmentHistory.length > 0
          ? resumeData.employmentHistory.map((entry, i) => ({ ...entry, id: entry.id ? entry.id : i + 1 }))
          : [{ id: 1, jobTitle: '', employer: '', startDate: '', endDate: '', location: '', description: '' }],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'employmentHistory',
  });

  const [expanded, setExpanded] = React.useState<string | undefined>(fields.length > 0 ? `employment-0` : undefined);

  useEffect(() => {
    if (fields.length > 0 && !expanded) {
      setExpanded(`employment-0`);
    }
  }, [fields.length, expanded]);

  // Controlled form reset - only when data actually changes from external source
  const lastExternalDataRef = useRef<string>('');

  useEffect(() => {
    const incomingHistory = resumeData.employmentHistory.length > 0
      ? resumeData.employmentHistory.map((entry, i) => ({
        id: entry.id ?? i + 1,
        jobTitle: entry.jobTitle ?? '',
        employer: entry.employer ?? '',
        startDate: entry.startDate ?? '',
        endDate: entry.endDate ?? '',
        location: entry.location ?? '', // Use location field
        description: entry.description ?? '',
      }))
      : [{ id: 1, jobTitle: '', employer: '', startDate: '', endDate: '', location: '', description: '' }];

    const incomingDataString = JSON.stringify(incomingHistory);

    // Only reset if this is genuinely new external data (not from our own updates)
    if (incomingDataString !== lastExternalDataRef.current) {
      const currentData = form.getValues('employmentHistory');

      // Only reset if form data is significantly different
      if (!deepEqual(currentData, incomingHistory)) {
        form.reset({ employmentHistory: incomingHistory });
      }

      lastExternalDataRef.current = incomingDataString;
    }
  }, [resumeData.employmentHistory, form]);

  // Update store immediately when form changes - debouncing handled by useResumeSectionSyncs hook
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.employmentHistory) {
        const processedHistory = value.employmentHistory.map((entry, i) => ({
          id: entry?.id ?? i + 1,
          jobTitle: entry?.jobTitle ?? '',
          employer: entry?.employer ?? '',
          startDate: entry?.startDate ?? '',
          endDate: entry?.endDate ?? '',
          location: entry?.location ?? '', // Use location field
          description: entry?.description ?? '',
        }));

        // Update store immediately - sync hook will handle debouncing
        if (!deepEqual(resumeData.employmentHistory, processedHistory)) {
          updateResumeData('employmentHistory', processedHistory);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, updateResumeData, resumeData.employmentHistory]);

  return (
    <FormWrapper
      title="Employment History"
      description="Include your last 10 years of relevant experience."
      resumeScore={60}
      scoreBonus={15}
      scoreText="Add work experience"
      currentStep={currentStep ?? 0}
      totalSteps={totalSteps ?? 0}
      onBack={onBack}
      onNext={onNext}
      nextButtonText="Next: Skills"
      resumeId={resumeId}
      resumeTitle={resumeTitle}
    >
      {false ? (
        <div>Loading...</div>
      ) : (
        <Form {...form}>
          <Accordion type="single" collapsible value={expanded || ''} onValueChange={setExpanded} className="space-y-4">
            {fields.map((field, index) => (
              <AccordionItem value={`employment-${index}`} key={field.id}>
                <div className="flex items-center w-full">
                  <AccordionTrigger className="flex-grow px-4 py-3 text-left">
                    <span className="font-semibold text-gray-800">{form.getValues(`employmentHistory.${index}.jobTitle`) || '(Not specified)'}</span>
                  </AccordionTrigger>
                  <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500 mr-4">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <AccordionContent className="p-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`employmentHistory.${index}.jobTitle`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Job Title</FormLabel>
                          <FormControl>
                            <TextField {...field} placeholder="e.g. Software Developer" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`employmentHistory.${index}.employer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Employer</FormLabel>
                          <FormControl>
                            <TextField {...field} placeholder="e.g. Google" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`employmentHistory.${index}.startDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Start Date</FormLabel>
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
                      name={`employmentHistory.${index}.endDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">End Date</FormLabel>
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
                    <CollapsibleSection title="Add description & location">
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
                        {/* <FormField
                      control={form.control}
                      name={`employmentHistory.${index}.city`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">City</FormLabel>
                          <FormControl>
                            <TextField {...field} placeholder="e.g. San Francisco" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    /> */}
                        <div className="md:col-span-2"></div>

                      </div>
                    </CollapsibleSection>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name={`employmentHistory.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="font-medium">Description</FormLabel>
                          <FormControl>
                            <RteFieldControl field={field} />
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
          <AddAnotherButton
            append={append}
            setExpanded={setExpanded}
            fields={fields}
            defaultValues={{ jobTitle: '', employer: '', startDate: '', endDate: '', location: '', description: '' }}
            buttonText="Add another position"
            entityName="employment"
          />
        </Form>
      )}
    </FormWrapper>
  );
}; 