'use client';

import { useState, useEffect, useCallback } from 'react';
import { AboutData, UpdateAboutData, TrailItem } from '@/types/about';
import { Project } from '@/types/projects';
import TrailSelector from '@/components/admin/TrailSelector';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '@/contexts/ToastContext';
import { Lock, Sparkles, User } from 'lucide-react';
import ProfileMediaEditor from '@/components/admin/ProfileMediaEditor';

export default function LockScreenClient() {
    const [aboutData, setAboutData] = useState<AboutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const { showSuccess, showError } = useToast();

    const loadAboutData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/about');
            const data = await response.json();
            setAboutData(data);
        } catch (err) {
            setError('Failed to load about data');
            showError('Failed to load about content.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const loadProjects = useCallback(async () => {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            setProjects(data.projects || []);
        } catch (err) {
            console.error('Failed to load projects for selector', err);
        }
    }, []);

    useEffect(() => {
        loadAboutData();
        loadProjects();
    }, [loadAboutData, loadProjects]);

    const handleUpdateAbout = async (updateData: UpdateAboutData) => {
        try {
            const response = await fetch('/api/about', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                await loadAboutData();
                setError(null);
                showSuccess('Lock Screen settings updated successfully.');
            } else {
                setError('Failed to update Lock Screen data');
                showError('Failed to update Lock Screen content.');
            }
        } catch (err) {
            setError('Failed to update data');
            showError('Failed to update content.');
        }
    }

    if (loading) {
        return (
            <AdminLayout
                title="Lock Screen Management"
                subtitle="Manage OS Lock Screen appearance"
                breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Lock Screen' }]}
                titleIcon={<Lock className="h-5 w-5" aria-hidden />}
                titleAccent="bg-red-50 text-red-700"
            >
                <div className="flex items-center justify-center py-10 text-sm text-gray-600">
                    Loading data...
                </div>
            </AdminLayout>
        );
    }

    if (!aboutData) {
        return (
            <AdminLayout
                title="Lock Screen Management"
                subtitle="Manage OS Lock Screen appearance"
                breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Lock Screen' }]}
                titleIcon={<Lock className="h-5 w-5" aria-hidden />}
                titleAccent="bg-red-50 text-red-700"
            >
                <div className="flex items-center justify-center py-8">
                    <p className="text-red-600">Failed to load data</p>
                </div>
            </AdminLayout>
        );
    }

    // Initialize with fallback to Hero data if empty (since we are "taking from" Hero)
    // OR just start empty. The user said "ambil dari CRUD about", likely meaning THE CODE structure.
    // But logically, if it's a new feature, data might be empty.
    // Let's ensure we default gracefully.
    const preferences = aboutData.lockScreenPreferences || {
        title: 'Ramos',
        showProfile: true,
        backgroundTrail: [],
        backgroundColor: '',
        textColor: '',
        ballColor: '',
        capColor: '',
        profileUrl: '',
        profileType: 'image' as const,
        profileScale: 1,
        profileX: 0,
        profileY: 0
    };

    return (
        <AdminLayout
            title="Lock Screen Management"
            subtitle="Manage OS Lock Screen appearance"
            breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Lock Screen' }]}
            titleIcon={<Lock className="h-5 w-5" aria-hidden />}
            titleAccent="bg-red-50 text-red-700"
        >
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full p-6 lg:p-8">
                <LockScreenForm
                    data={preferences}
                    projects={projects}
                    onUpdate={(data) => handleUpdateAbout({ lockScreenPreferences: data })}
                />
            </div>
        </AdminLayout>
    );
}

function LockScreenForm({
    data,
    projects,
    onUpdate
}: {
    data: any;
    projects: Project[];
    onUpdate: (data: any) => void;
}) {
    // Normalize initial data to TrailItem[]
    const initialTrail: TrailItem[] = (data.backgroundTrail || []).map((item: string | TrailItem) => {
        if (typeof item === 'string') {
            return { src: item, isActive: true };
        }
        return item;
    });

    const [formData, setFormData] = useState({
        title: data.title || 'Ramos',
        showProfile: data.showProfile ?? true,
        backgroundTrail: initialTrail,
        backgroundColor: data.backgroundColor || '',
        textColor: data.textColor || '',
        ballColor: data.ballColor || '',
        capColor: data.capColor || '',
        profileUrl: data.profileUrl || '',
        profileType: data.profileType || 'image',
        profileScale: data.profileScale ?? 1,
        profileX: data.profileX ?? 0,
        profileY: data.profileY ?? 0,
    });

    // Update form when server data changes WITHOUT unmounting
    useEffect(() => {
        const trail: TrailItem[] = (data.backgroundTrail || []).map((item: string | TrailItem) => {
            if (typeof item === 'string') return { src: item, isActive: true };
            return item;
        });

        setFormData({
            title: data.title || 'Ramos',
            showProfile: data.showProfile ?? true,
            backgroundTrail: trail,
            backgroundColor: data.backgroundColor || '',
            textColor: data.textColor || '',
            ballColor: data.ballColor || '',
            capColor: data.capColor || '',
            profileUrl: data.profileUrl || '',
            profileType: data.profileType || 'image',
            profileScale: data.profileScale ?? 1,
            profileX: data.profileX ?? 0,
            profileY: data.profileY ?? 0,
        });
    }, [data]);

    const handleTrailChange = (items: TrailItem[]) => {
        setFormData(prev => ({
            ...prev,
            backgroundTrail: items
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate({
            title: formData.title,
            showProfile: formData.showProfile,
            backgroundTrail: formData.backgroundTrail,
            backgroundColor: formData.backgroundColor,
            textColor: formData.textColor,
            ballColor: formData.ballColor,
            capColor: formData.capColor,
            profileUrl: formData.profileUrl,
            profileType: formData.profileType,
            profileScale: formData.profileScale,
            profileX: formData.profileX,
            profileY: formData.profileY,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Lock Screen Configuration</h3>
                <p className="text-sm text-gray-600 mb-4">Customize the text, 3D ball colors, and background trail for the lock screen.</p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Name / Title</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Ramos"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="showProfile"
                            type="checkbox"
                            checked={formData.showProfile}
                            onChange={(e) => setFormData({ ...formData, showProfile: e.target.checked })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="showProfile" className="text-sm font-medium text-gray-700">Show Profile Avatar</label>
                    </div>

                    <div className="bg-white p-4 rounded border border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="text-blue-600" size={18} />
                            <h4 className="text-sm font-medium text-gray-900 block">Profile Media</h4>
                        </div>
                        <ProfileMediaEditor
                            initialUrl={formData.profileUrl}
                            initialType={formData.profileType}
                            initialScale={formData.profileScale}
                            initialX={formData.profileX}
                            initialY={formData.profileY}
                            onSave={(p) => setFormData({
                                ...formData,
                                profileUrl: p.url,
                                profileType: p.type,
                                profileScale: p.scale,
                                profileX: p.x,
                                profileY: p.y
                            })}
                        />
                    </div>

                    <div className="bg-white p-4 rounded border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-4 block">Color Customization</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                            <div className="flex flex-col gap-2 min-w-0">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Background Overlay</label>
                                <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-lg shadow-sm w-full overflow-hidden">
                                    <input
                                        type="color"
                                        value={formData.backgroundColor || '#000000'}
                                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                                        className="h-7 w-7 flex-shrink-0 p-0 border-0 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.backgroundColor}
                                        onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                                        placeholder="Overlay Color"
                                        className="min-w-0 flex-1 text-[10px] border-0 focus:ring-0 p-0 text-gray-400 font-mono"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 min-w-0">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Text Color</label>
                                <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-lg shadow-sm w-full overflow-hidden">
                                    <input
                                        type="color"
                                        value={formData.textColor || '#ffffff'}
                                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                                        className="h-7 w-7 flex-shrink-0 p-0 border-0 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.textColor}
                                        onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                                        placeholder="#ffffff"
                                        className="min-w-0 flex-1 text-[10px] border-0 focus:ring-0 p-0 text-gray-400 font-mono"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 min-w-0">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Ball Color</label>
                                <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-lg shadow-sm w-full overflow-hidden">
                                    <input
                                        type="color"
                                        value={formData.ballColor || '#FEDDD8'}
                                        onChange={(e) => setFormData({ ...formData, ballColor: e.target.value })}
                                        className="h-7 w-7 flex-shrink-0 p-0 border-0 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.ballColor}
                                        onChange={(e) => setFormData({ ...formData, ballColor: e.target.value })}
                                        placeholder="#FEDDD8"
                                        className="min-w-0 flex-1 text-[10px] border-0 focus:ring-0 p-0 text-gray-400 font-mono"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 min-w-0">
                                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none">Cap Color</label>
                                <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-lg shadow-sm w-full overflow-hidden">
                                    <input
                                        type="color"
                                        value={formData.capColor || '#F6A77B'}
                                        onChange={(e) => setFormData({ ...formData, capColor: e.target.value })}
                                        className="h-7 w-7 flex-shrink-0 p-0 border-0 rounded cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.capColor}
                                        onChange={(e) => setFormData({ ...formData, capColor: e.target.value })}
                                        placeholder="#F6A77B"
                                        className="min-w-0 flex-1 text-[10px] border-0 focus:ring-0 p-0 text-gray-400 font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 
                      [NOTE: FEATURE HIDDEN - PRESERVED FOR FUTURE USE]
                      This 'Background Trail Images' section is deliberately hidden because the feature is not yet active in the LockScreen.tsx frontend.
                      DO NOT DELETE THIS CODE. Uncomment this block if you decide to activate the Trail Effect in the future.
                      
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Background Trail Images</label>
                        <p className="text-xs text-gray-500 mb-2">Images that follow the mouse cursor.</p>
                        <TrailSelector
                            projects={projects}
                            selectedItems={formData.backgroundTrail}
                            onChange={handleTrailChange}
                            maxItems={20}
                            allowedTypes={['image']}
                        />
                        <p className="mt-2 text-sm text-gray-500">
                            {formData.backgroundTrail.length} items.
                        </p>
                    </div>
                    */}

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm flex items-center gap-2"
                        >
                            <Lock size={16} />
                            Update Lock Screen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
