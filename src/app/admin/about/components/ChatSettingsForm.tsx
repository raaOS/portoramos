import React, { useState } from 'react';
import { MessageSquare, Phone, Mail, User } from 'lucide-react';

interface ChatSettings {
    autoReplyText: string;
    contactEmail: string;
    contactPhone: string;
    avatarUrl?: string;
}

interface ChatSettingsFormProps {
    data?: ChatSettings;
    onUpdate: (data: ChatSettings) => void;
}

export default function ChatSettingsForm({ data, onUpdate }: ChatSettingsFormProps) {
    const [formData, setFormData] = useState<ChatSettings>({
        autoReplyText: '',
        contactEmail: '',
        contactPhone: '',
        avatarUrl: ''
    });

    // Sync state with props in render
    const [lastData, setLastData] = useState(data);
    if (data && data !== lastData) {
        setFormData({
            autoReplyText: data.autoReplyText || '',
            contactEmail: data.contactEmail || '',
            contactPhone: data.contactPhone || '',
            avatarUrl: data.avatarUrl || ''
        });
        setLastData(data);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chat Bot Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Atur pesan otomatis dan kontak yang muncul di aplikasi WhatsApp OS.
                </p>

                <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-6">

                    <div className="bg-white p-4 rounded border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            Auto Reply
                        </h4>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Pesan Balasan Otomatis</label>
                            <textarea
                                rows={3}
                                className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                                value={formData.autoReplyText}
                                onChange={(e) => setFormData({ ...formData, autoReplyText: e.target.value })}
                                placeholder="Halo! Saya sedang tidak aktif..."
                            />
                            <p className="mt-1 text-xs text-gray-400">Pesan ini muncul setelah pengunjung mengirim chat pertama kali.</p>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            Contact Info (Header)
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <Mail size={12} /> Contact Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                    placeholder="hello@ramos.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    <Phone size={12} /> Contact Phone
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                                    value={formData.contactPhone}
                                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                    placeholder="+62 812..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm"
                        >
                            Save Chat Settings
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
