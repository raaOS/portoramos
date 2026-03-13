import React, { useRef, useEffect } from 'react';
import { AdminNoteToolbar } from './AdminNoteToolbar';

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
            if (currentDOM !== value) {
                editorRef.current.innerHTML = value || '';
                innerContentRef.current = value;
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
        onChange(innerContentRef.current);
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
        const html = '<div style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><input type="checkbox" style="margin-top: 6px; accent-color: black; width: 16px; height: 16px;" /> <span>&nbsp;</span></div>';
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
                className="w-full min-h-[160px] max-h-[400px] p-4 text-gray-800 text-lg leading-snug whitespace-pre-wrap overflow-y-auto focus:outline-none"
                style={{
                    fontFamily: 'var(--font-handwritten, "Comic Sans MS", "Chalkboard SE", cursive)',
                    fontSize: `${fontSize}px`,
                }}
            />
        </div>
    );
};
