'use client';

import { useState, useEffect } from 'react';
import { Save, Sparkles } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ContactFormData {
    email: string;
    whatsapp: string;
    linkedin: string;
}

export function PrivateContactForm() {
    const { csrfToken } = useAdminAuth();
    const [formData, setFormData] = useState<ContactFormData>({
        email: '',
        whatsapp: '',
        linkedin: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchAboutData = async () => {
        try {
            const res = await fetch('/api/about');
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    email: data.professional?.contacts?.email || '',
                    whatsapp: data.professional?.contacts?.whatsapp || '',
                    linkedin: data.professional?.contacts?.linkedin || ''
                });
            }
        } catch (_error) {
            console.error('Failed to load contact info', _error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        Promise.resolve().then(() => {
            fetchAboutData();
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const currentRes = await fetch('/api/about');
            const currentData = await currentRes.json();

            const updateData = {
                professional: {
                    ...currentData.professional,
                    contacts: {
                        email: formData.email,
                        whatsapp: formData.whatsapp,
                        linkedin: formData.linkedin
                    }
                }
            };

            const res = await fetch('/api/about', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                alert('Contact info updated successfully!');
            } else {
                alert('Failed to update contact info');
            }
        } catch {
            alert('Error updating contact info');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-center text-gray-500">Loading contact info...</div>;

    return (
        <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 rounded-lg">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Private Contact Info</h3>
                    <p className="text-sm text-gray-500">Contact details used by AI Resume to generate responses.</p>
                </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                        placeholder="email@example.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                        placeholder="+62..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                    <input
                        type="text"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                        placeholder="username"
                    />
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition shadow-sm w-full justify-center sm:w-auto"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Contact Info'}
                </button>
            </div>
        </section>
    );
}
