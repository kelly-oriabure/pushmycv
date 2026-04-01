'use client';
import React from 'react';
import type { ResumeData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Plus } from 'lucide-react';
import { FormWrapper } from './FormWrapper';

interface ProfessionalSummaryProps {
  resumeData: ResumeData;
  updateResumeData: (section: keyof ResumeData, data: any) => void;
  onNext?: () => void;
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
  resumeId: string;
  resumeTitle?: string;
}

export const ProfessionalSummary: React.FC<ProfessionalSummaryProps> = ({
  resumeData,
  updateResumeData,
  onNext,
  onBack,
  currentStep,
  totalSteps,
  resumeId,
  resumeTitle
}) => {
  const [showPreWritten, setShowPreWritten] = React.useState(false);
  const [characterCount, setCharacterCount] = React.useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: 'list-disc pl-6' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-6' } },
      }),
      TiptapLink.configure({ openOnClick: false, autolink: true }),
    ],
    content: resumeData.professionalSummary,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      updateResumeData('professionalSummary', editor.getHTML());
      setCharacterCount(editor.getText().length);
    },
    editorProps: {
        attributes: {
            class: 'prose dark:prose-invert min-h-[250px] w-full p-3 focus:outline-none',
        },
    },
  });

  React.useEffect(() => {
    if (editor) {
        setCharacterCount(editor.getText().length);
    }
  }, [editor]);

  const preWrittenPhrases = [
    "Curious science teacher with 8+ years of experience and a track record of...",
    "Results-driven professional with expertise in...",
    "Dedicated team player with strong communication skills...",
    "Innovative problem-solver with a passion for..."
  ];

  const insertPreWritten = (phrase: string) => {
    if (editor) {
      const contentToInsert = editor.getText().length > 0 ? ` ${phrase}` : phrase;
      editor.chain().focus().insertContent(contentToInsert).run();
      setShowPreWritten(false);
    }
  };

  const resumeScore = Math.min(42 + Math.floor(characterCount / 20), 85);

  return (
    <div>
      <FormWrapper
        title="Professional Summary"
        description="Write 2-4 short, energetic sentences about how great you are. Mention the role and what you did. What were the big achievements? Describe your motivation and list your skills."
        resumeScore={resumeScore}
        scoreBonus={15}
        scoreText="Add profile summary"
        currentStep={currentStep ?? 0}
        totalSteps={totalSteps ?? 0}
        onBack={onBack}
        onNext={onNext}
        nextButtonText="Next: Education"
        resumeId={resumeId}
        resumeTitle={resumeTitle}
      >
        <div className="mb-6">
            <div className="flex justify-end mb-2 relative">

                  {showPreWritten && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="p-4">
                        <h3 className="font-medium mb-3">Choose a pre-written phrase:</h3>
                        <div className="space-y-2">
                          {preWrittenPhrases.map((phrase, index) => (
                            <button
                              key={index}
                              onClick={() => insertPreWritten(phrase)}
                              className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm text-gray-700"
                            >
                              {phrase}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
            </div>
          <RichTextEditor editor={editor} showAiButton={true} />
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Recruiter tip: write 400-600 characters to increase interview chances</span>
          <span>{characterCount} / 400+</span>
        </div>
      </FormWrapper>
    </div>
  );
};

export default ProfessionalSummary;
