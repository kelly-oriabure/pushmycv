'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Undo,
  Redo,
  Sparkles,
} from 'lucide-react';
import { useCallback } from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

const Toolbar = ({ editor, showAiButton }: { editor: Editor | null; showAiButton?: boolean; }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex items-center justify-between p-2 border-b border-gray-200">
      <div className="flex items-center space-x-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn('p-2 rounded hover:bg-gray-100', { 'bg-gray-200': editor.isActive('bold') })}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn('p-2 rounded hover:bg-gray-100', { 'bg-gray-200': editor.isActive('italic') })}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn('p-2 rounded hover:bg-gray-100', { 'bg-gray-200': editor.isActive('underline') })}
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn('p-2 rounded hover:bg-gray-100', { 'bg-gray-200': editor.isActive('strike') })}
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={setLink}
          className={cn('p-2 rounded hover:bg-gray-100', { 'bg-gray-200': editor.isActive('link') })}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-6 bg-gray-300 mx-2"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('p-2 rounded hover:bg-gray-100', { 'bg-gray-200': editor.isActive('bulletList') })}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('p-2 rounded hover:bg-gray-100', { 'bg-gray-200': editor.isActive('orderedList') })}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-6 bg-gray-300 mx-2"></div>
        <button onClick={() => editor.chain().focus().undo().run()} className="p-2 rounded hover:bg-gray-100">
          <Undo className="w-4 h-4" />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} className="p-2 rounded hover:bg-gray-100">
          <Redo className="w-4 h-4" />
        </button>
      </div>
      <div>
        {showAiButton && (
          <Button variant="outline" size="sm" className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        )}
      </div>
    </div>
  );
};

interface RichTextEditorProps {
  editor: Editor | null;
  placeholder?: string;
  showAiButton?: boolean;
}

export const RichTextEditor = ({ editor, placeholder, showAiButton = false }: RichTextEditorProps) => {

  return (
    <div className="rounded-md border border-[#ebf1f4] bg-[#f7f9fc]">
      <Toolbar editor={editor} showAiButton={showAiButton} />
      <EditorContent editor={editor} />
    </div>
  );
};
