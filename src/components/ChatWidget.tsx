'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, CheckCircle } from 'lucide-react';

export default function ChatWidget() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({ name: '', contact: '', message: '' });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // Hide if specifically on contact page
    const isContactPage = pathname === '/contact';

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-chat', handleOpen);
        return () => window.removeEventListener('open-chat', handleOpen);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                setStatus('success');
                setForm({ name: '', contact: '', message: '' });
                // Auto close after 3 seconds
                setTimeout(() => {
                    setStatus('idle');
                    setIsOpen(false);
                }, 3000);
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
    };

    return (
        <div className="fixed bottom-40 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 md:bottom-6 z-50 flex flex-col items-center md:items-end w-full max-w-[calc(100vw-2rem)] md:w-auto">
            {/* Chat Box */}
            {isOpen && (
                <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 ease-in-out">
                    {/* Header */}
                    <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                        <div>
                            <h3 className="font-bold text-lg">Chat with Admin</h3>
                            <p className="text-blue-100 text-xs text-opacity-80">Biasanya membalas dalam 5 menit</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-blue-700 p-1 rounded-full transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-4 bg-gray-50">
                        {status === 'success' ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                                <h4 className="font-bold text-gray-800">Pesan Terkirim!</h4>
                                <p className="text-gray-500 text-sm mt-1">Kami akan menghubungi Anda di kontak yang diberikan.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nama</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Nama Anda"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none transition text-sm text-gray-900 bg-white"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">WhatsApp / Email</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="0812..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none transition text-sm text-gray-900 bg-white"
                                        value={form.contact}
                                        onChange={(e) => setForm({ ...form, contact: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pesan</label>
                                    <textarea
                                        required
                                        rows={3}
                                        placeholder="Tulis pesan..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none transition text-sm text-gray-900 bg-white resize-none"
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    />
                                </div>

                                {status === 'error' && (
                                    <p className="text-red-500 text-xs text-center">Gagal mengirim. Coba lagi.</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {status === 'loading' ? (
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <>
                                            <span>Kirim Pesan</span>
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Floating Toggle Button - Hidden on Contact Page */}
            {!isContactPage && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`${isOpen ? 'bg-gray-700 rotate-90' : 'bg-blue-600'} hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 group`}
                >
                    {isOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <MessageCircle className="w-8 h-8 group-hover:animate-pulse" />
                    )}
                </button>
            )}
        </div>
    );
}
