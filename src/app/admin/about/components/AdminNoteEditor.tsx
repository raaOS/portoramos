import React, { useRef, useEffect } from 'react';
import { AdminNoteToolbar } from './AdminNoteToolbar';
import { sanitize } from '@/lib/security/sanitization';

interface AdminNoteEditorProps {
    value: string;
    onChange: (value: string) => void;
    fontSize: number;
    onFontSizeChange: (newSize: number) => void;
}

export const AdminNoteEditor = ({ value, onChange, fontSize, onFontSizeChange }: AdminNoteEditorProps) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const innerContentRef = useRef(value);

    // Sync only when value changes externally
    useEffect(() => {
        if (editorRef.current) {
            const currentDOM = editorRef.current.innerHTML;
            const sanitizedValue = sanitize.richText(value || '');
            if (currentDOM !== sanitizedValue) {
                editorRef.current.innerHTML = sanitizedValue;
                innerContentRef.current = sanitizedValue;
            }
        }
    }, [value]);

    interface EditorElement {
        currentTarget: HTMLDivElement;
    }

    const handleContentChange = (e: React.FormEvent<HTMLDivElement> | EditorElement) => {
        const newHtml = e.currentTarget.innerHTML;
        innerContentRef.current = newHtml;
    };

    const handleBlur = () => {
        const sanitizedValue = sanitize.richText(innerContentRef.current);
        innerContentRef.current = sanitizedValue;
        if (editorRef.current) {
            editorRef.current.innerHTML = sanitizedValue;
        }
        onChange(sanitizedValue);
    };

    const execFormat = (command: string, val?: string) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(command, false, val);
            handleContentChange({ currentTarget: editorRef.current });
            onChange(editorRef.current.innerHTML);
        }
    };

    const insertChecklist = () => {
        const html = '<div data-note-checklist="true"><input type="checkbox" disabled data-note-checklist-item="true" /><span data-note-checklist-label="true">&nbsp;</span></div>';
        execFormat('insertHTML', html);
    };

    return (
        <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white">
            <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                <AdminNoteToolbar
                    onFormat={execFormat}
                    onInsertChecklist={insertChecklist}
                    fontSize={fontSize}
                    onFontSizeChange={onFontSizeChange}
                />
            </div>
            <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleContentChange}
                onBlur={handleBlur}
                onPaste={(event) => {
                    event.preventDefault();
                    const text = event.clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                }}
                className="w-full min-h-[160px] max-h-[400px] p-4 text-gray-800 text-lg leading-snug whitespace-pre-wrap overflow-y-auto focus:outline-none"
                style={{
                    fontFamily: 'var(--font-handwritten, "Comic Sans MS", "Chalkboard SE", cursive)',
                    fontSize: `${fontSize}px`,
                }}
            />
        </div>
    );
};
