import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Trash2, Shield, Settings, Plus } from 'lucide-react';

interface ProjectToolbarProps {
    connectionStatus: 'checking' | 'connected' | 'error' | 'disconnected';
    selectedProjectIds: Set<string>;
    isBulkUpdating: boolean;
    allProjectsLength: number;
    handleBulkUpdate: (action: 'publish' | 'draft' | 'delete') => void;
    selectAllProjects: () => void;
    setShowSecurityModal: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    setShowCreateForm: (show: boolean) => void;
}

export const ProjectToolbar = ({
    connectionStatus,
    selectedProjectIds,
    isBulkUpdating,
    allProjectsLength,
    handleBulkUpdate,
    selectAllProjects,
    setShowSecurityModal,
    setShowSettings,
    setShowCreateForm
}: ProjectToolbarProps) => {
    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            {/* Status Indicators */}
            <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center">
                    {connectionStatus === 'connected' ? (
                        <div className="h-10 px-4 flex items-center text-sm text-green-700 bg-white rounded-lg border border-green-200 whitespace-nowrap select-none font-medium">
                            <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                            D1 Connected
                        </div>
                    ) : connectionStatus === 'checking' ? (
                        <div className="h-10 px-4 flex items-center text-sm text-yellow-600 bg-white rounded-lg border border-yellow-200 whitespace-nowrap select-none">
                            <Loader2 className="animate-spin w-3 h-3 mr-2" />
                            Checking D1...
                        </div>
                    ) : (
                        <div className="h-10 px-4 flex items-center text-sm text-red-600 bg-white rounded-lg border border-red-200 whitespace-nowrap select-none">
                            <AlertCircle className="w-3 h-3 mr-2" />
                            D1 Error
                        </div>
                    )}
                </div>
            </div>

            {/* Main Toolbar */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3 min-w-0">
                {/* Bulk Actions Toolbar */}
                {selectedProjectIds.size > 0 ? (
                    <div className="flex-1 h-10 flex items-center gap-2 bg-white px-4 rounded-lg border border-violet-200 animate-in fade-in slide-in-from-top-1 overflow-hidden select-none">
                        <span className="text-sm font-bold text-violet-600 whitespace-nowrap mr-2">
                            {selectedProjectIds.size} Terpilih
                        </span>
                        <div className="h-4 w-px bg-violet-100 mx-1 flex-shrink-0" />

                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => handleBulkUpdate('publish')}
                                disabled={isBulkUpdating}
                                className="flex items-center px-3 py-1 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors whitespace-nowrap"
                            >
                                <Eye className="w-4 h-4 mr-1.5" />
                                Tayangkan
                            </button>
                            <button
                                onClick={() => handleBulkUpdate('draft')}
                                disabled={isBulkUpdating}
                                className="flex items-center px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors whitespace-nowrap"
                            >
                                <EyeOff className="w-4 h-4 mr-1.5" />
                                Simpan Draft
                            </button>
                            <button
                                onClick={() => handleBulkUpdate('delete')}
                                disabled={isBulkUpdating}
                                className="flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap"
                            >
                                <Trash2 className="w-4 h-4 mr-1.5" />
                                Hapus
                            </button>
                        </div>

                        {isBulkUpdating && <Loader2 className="w-4 h-4 animate-spin text-violet-600 ml-auto" />}
                    </div>
                ) : (
                    <div className="flex-1"></div>
                )}

                {/* Action Buttons Group */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={selectAllProjects}
                        className={`h-10 w-10 inline-flex items-center justify-center border rounded-lg focus:outline-none transition-all flex-shrink-0 ${selectedProjectIds.size > 0 && selectedProjectIds.size === allProjectsLength
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                            }`}
                        title="Pilih Semua"
                    >
                        <CheckCircle2 className={`h-5 w-5 ${selectedProjectIds.size > 0 && selectedProjectIds.size === allProjectsLength ? 'text-white' : ''}`} />
                    </button>

                    <button
                        onClick={() => setShowSecurityModal(true)}
                        className="h-10 w-10 inline-flex items-center justify-center border text-sm font-medium rounded-lg focus:outline-none transition-all bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600 flex-shrink-0"
                        title="Pengaturan Moderasi"
                    >
                        <Shield className="h-5 w-5" />
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        className={`h-10 w-10 inline-flex items-center justify-center border text-sm font-medium rounded-lg focus:outline-none transition-all flex-shrink-0 ${connectionStatus === 'error' ? 'bg-white text-amber-500 border-amber-200 hover:border-amber-300' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                            }`}
                        title="Pengaturan Data"
                    >
                        <Settings className={`h-5 w-5 ${connectionStatus === 'error' ? 'animate-pulse' : ''}`} />
                    </button>

                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="h-10 inline-flex items-center justify-center px-6 border border-transparent text-sm font-bold rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none transition-all flex-shrink-0 whitespace-nowrap"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Tambah Project
                    </button>
                </div>
            </div>
        </div>
    );
};
