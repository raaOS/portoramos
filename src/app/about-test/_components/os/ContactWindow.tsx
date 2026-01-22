import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

export default function ContactWindow() {
    const [formData, setFormData] = useState({
        subject: '',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href = `mailto:hello@ramos.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.message)}`;
    };

    return (
        <div className="w-full h-full bg-[#f5f5f7] flex flex-col font-sans">
            <div className="bg-[#e5e5e7] px-4 py-2 flex items-center justify-between border-b border-gray-300">
                <div className="text-sm font-medium text-gray-500">New Message</div>
                <div className="text-xs text-gray-400">To: Me</div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 bg-white">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Subject"
                        className="w-full border-b border-gray-200 py-2 outline-none text-gray-800 placeholder-gray-400"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        required
                    />
                </div>

                <div className="flex-1 mb-4">
                    <textarea
                        placeholder="Type your message here..."
                        className="w-full h-full resize-none outline-none text-gray-800 placeholder-gray-400 font-light"
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        required
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-sm"
                    >
                        <Send size={14} />
                        Send Email
                    </button>
                </div>
            </form>
        </div>
    );
}
