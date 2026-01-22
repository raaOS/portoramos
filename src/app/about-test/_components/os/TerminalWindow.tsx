import React, { useState, useRef, useEffect } from 'react';

export default function TerminalWindow() {
    const [history, setHistory] = useState<string[]>([
        'Welcome to Ramos OS v1.0',
        'Type "help" for available commands.',
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Focus input on click
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const cmd = input.trim();
            handleCommand(cmd);
            setInput('');
        }
    };

    const handleCommand = (cmd: string) => {
        if (!cmd) {
            setHistory(prev => [...prev, '> ']);
            return;
        }

        const cleanCmd = cmd.toLowerCase();

        if (cleanCmd === 'clear') {
            setHistory([]);
            return;
        }

        let response = '';
        switch (cleanCmd) {
            case 'help':
                response = 'Available commands: about, projects, contact, whoami, ls, date, clear, exit';
                break;
            case 'whoami':
                response = 'guest@ramos-portfolio';
                break;
            case 'ls':
                response = 'About.me  Projects/  Contact.txt  Trash/';
                break;
            case 'date':
                response = new Date().toString();
                break;
            case 'about':
                response = 'Opening About window... (GUI)';
                break;
            case 'projects':
                response = 'Listing projects... (GUI)';
                break;
            case 'exit':
                response = 'Session terminated.';
                break;
            default:
                response = `Command not found: ${cmd}`;
        }

        setHistory(prev => [...prev, `> ${cmd}`, response]);
    };

    return (
        <div
            className="w-full h-full bg-[#1e1e1e]/95 text-green-400 font-mono text-sm p-4 overflow-y-auto"
            onClick={() => inputRef.current?.focus()}
        >
            <div className="space-y-1">
                {history.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap">{line}</div>
                ))}
            </div>
            <div className="flex items-center mt-1">
                <span className="mr-2 text-blue-400">➜</span>
                <span className="mr-2 text-pink-400">~</span>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none text-green-400 border-none p-0 focus:ring-0"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                />
            </div>
            <div ref={bottomRef} />
        </div>
    );
}
