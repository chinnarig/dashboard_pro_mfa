"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
    Bold,
    Italic,
    Strikethrough,
    Link2,
    Undo,
    Redo,
    Underline as UnderlineIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCallback } from 'react';

interface BioEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    maxLength?: number;
}

export function BioEditor({
    content,
    onChange,
    placeholder = "Tell us about yourself...",
    disabled = false,
    maxLength = 500,
}: BioEditorProps) {

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // Disable headings for bio
                blockquote: false, // Disable blockquotes
                codeBlock: false, // Disable code blocks
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline',
                },
            }),
            Underline,
            Placeholder.configure({
                placeholder,
            }),
            CharacterCount.configure({
                limit: maxLength,
            }),
        ],
        content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] max-h-[300px] overflow-y-auto p-3',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editable: !disabled,
        immediatelyRender: false,
    });

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Enter URL:', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) {
        return (
            <div className="border rounded-lg overflow-hidden">
                <div className="border-b bg-muted/50 p-2 h-[44px] flex items-center">
                    <div className="flex gap-1">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-8 h-8 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                </div>
                <div className="p-3 min-h-[120px] bg-muted/20 animate-pulse">
                    <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                </div>
            </div>
        );
    }

    const characterCount = editor.storage.characterCount.characters();
    const characterLimit = maxLength;

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
                {/* Text Formatting */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={disabled || !editor.can().chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'bg-muted' : ''}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={disabled || !editor.can().chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'bg-muted' : ''}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    disabled={disabled || !editor.can().chain().focus().toggleUnderline().run()}
                    className={editor.isActive('underline') ? 'bg-muted' : ''}
                    title="Underline (Ctrl+U)"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={disabled || !editor.can().chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'bg-muted' : ''}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8" />

                {/* Link */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={setLink}
                    disabled={disabled}
                    className={editor.isActive('link') ? 'bg-muted' : ''}
                    title="Add Link"
                >
                    <Link2 className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-8" />

                {/* Undo/Redo */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={disabled || !editor.can().chain().focus().undo().run()}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={disabled || !editor.can().chain().focus().redo().run()}
                    title="Redo (Ctrl+Shift+Z)"
                >
                    <Redo className="h-4 w-4" />
                </Button>

                {/* Character Count */}
                <div className="ml-auto text-xs text-muted-foreground">
                    {characterCount} / {characterLimit}
                </div>
            </div>

            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="prose max-w-none [&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:max-h-[300px] [&_.ProseMirror]:overflow-y-auto"
            />
        </div>
    );
}