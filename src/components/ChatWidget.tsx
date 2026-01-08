'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, CheckCircle } from 'lucide-react';

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
        <div className="fixed bottom-24 right-6 md:bottom-6 md:right-6 z-50 flex flex-col items-end w-full max-w-[calc(100vw-2rem)] md:w-auto font-sans print:hidden">
            {/* Chat Box */}
            {isOpen && (
                <div className="mb-4 w-80 rounded-2xl overflow-hidden transform transition-all duration-300 ease-in-out font-sans border border-gray-200">
                    {/* WA Header */}
                    <div className="bg-[#075E54] p-3 flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                                <img src="/profile.jpg" alt="Admin" className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Fallback if no profile image
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00czLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
                                    }}
                                />
                            </div>
                            <div>
                                <h3 className="font-bold text-base leading-tight">Ramos</h3>
                                <p className="text-green-100 text-[10px] opacity-90">Online</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:bg-[#064e46] p-1 rounded-full transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* WA Body (Beige Background) */}
                    <div className="p-4 bg-[#E5DDD5] min-h-[300px] relative">
                        {/* Background Pattern Hint (Optional, CSS only) */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4a4a4a 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                        {status === 'success' ? (
                            <div className="bg-[#DCF8C6] p-4 rounded-lg shadow-sm border border-green-200 animate-fade-in-up">
                                <div className="text-center py-4">
                                    <CheckCircle className="w-12 h-12 text-[#25D366] mx-auto mb-2" />
                                    <h4 className="font-bold text-gray-800">Terkirim!</h4>
                                    <p className="text-gray-600 text-xs mt-1">Kami akan segera membalas ke WhatsApp Anda.</p>
                                </div>
                                <div className="text-[10px] text-right text-gray-500 mt-2">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 relative z-10">
                                {/* Admin Bubble */}
                                <div className="self-start bg-white rounded-tr-lg rounded-bl-lg rounded-br-lg p-3 shadow-sm max-w-[85%] text-sm text-gray-800 border border-gray-200">
                                    <p>Halo! Ada yang bisa saya bantu?</p>
                                    <div className="text-[10px] text-right text-gray-400 mt-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>

                                {/* Form as "User Input" */}
                                <form onSubmit={handleSubmit} className="mt-2 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                    <div className="space-y-2">
                                        <input
                                            required
                                            type="text"
                                            placeholder="Nama Anda..."
                                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-1 focus:ring-[#25D366] outline-none"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Nomor WhatsApp..."
                                            className="w-full px-3 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-1 focus:ring-[#25D366] outline-none"
                                            value={form.contact}
                                            onChange={(e) => setForm({ ...form, contact: e.target.value })}
                                        />
                                        <div className="flex gap-1">
                                            <textarea
                                                required
                                                rows={1}
                                                placeholder="Ketik pesan..."
                                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-1 focus:ring-[#25D366] outline-none resize-none"
                                                value={form.message}
                                                onChange={(e) => setForm({ ...form, message: e.target.value })}
                                            />
                                            <button
                                                type="submit"
                                                disabled={status === 'loading'}
                                                className="bg-[#075E54] hover:bg-[#064b43] text-white p-2 rounded-full transition flex-shrink-0 flex items-center justify-center disabled:opacity-50"
                                            >
                                                {status === 'loading' ? (
                                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    {status === 'error' && (
                                        <p className="text-red-500 text-[10px] text-center mt-1">Gagal kirim. Cek koneksi.</p>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* WA Floating Button */}
            {!isContactPage && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`${isOpen ? 'bg-gray-600 rotate-90' : 'bg-[#25D366] hover:bg-[#20bd5a]'} text-white p-3.5 rounded-full transition-all duration-300 hover:scale-110 focus:outline-none group flex items-center justify-center`}
                >
                    {isOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        // WhatsApp SVG Icon
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white group-hover:animate-pulse" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
}
