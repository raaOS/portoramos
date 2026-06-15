import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  Settings,
  Plus,
} from 'lucide-react';

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
  setShowCreateForm,
}: ProjectToolbarProps) => {
  return (
    <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      {/* Status Indicators */}
      <div className="flex flex-shrink-0 items-center">
        <div className="flex items-center">
          {connectionStatus === 'connected' ? (
            <div className="flex h-10 select-none items-center whitespace-nowrap rounded-lg border border-green-200 bg-white px-4 text-sm font-medium text-green-700">
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              D1 Connected
            </div>
          ) : connectionStatus === 'checking' ? (
            <div className="flex h-10 select-none items-center whitespace-nowrap rounded-lg border border-yellow-200 bg-white px-4 text-sm text-yellow-600">
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Checking D1...
            </div>
          ) : (
            <div className="flex h-10 select-none items-center whitespace-nowrap rounded-lg border border-red-200 bg-white px-4 text-sm text-red-600">
              <AlertCircle className="mr-2 h-3 w-3" />
              D1 Error
            </div>
          )}
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
        {/* Bulk Actions Toolbar */}
        {selectedProjectIds.size > 0 ? (
          <div className="animate-in fade-in slide-in-from-top-1 flex h-10 flex-1 select-none items-center gap-2 overflow-hidden rounded-lg border border-violet-200 bg-white px-4">
            <span className="mr-2 whitespace-nowrap text-sm font-bold text-violet-600">
              {selectedProjectIds.size} Terpilih
            </span>
            <div className="mx-1 h-4 w-px flex-shrink-0 bg-violet-100" />

            <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => handleBulkUpdate('publish')}
                disabled={isBulkUpdating}
                className="flex items-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 hover:text-green-700"
              >
                <Eye className="mr-1.5 h-4 w-4" />
                Tayangkan
              </button>
              <button
                onClick={() => handleBulkUpdate('draft')}
                disabled={isBulkUpdating}
                className="flex items-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                <EyeOff className="mr-1.5 h-4 w-4" />
                Simpan Draft
              </button>
              <button
                onClick={() => handleBulkUpdate('delete')}
                disabled={isBulkUpdating}
                className="flex items-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Hapus
              </button>
            </div>

            {isBulkUpdating && <Loader2 className="ml-auto h-4 w-4 animate-spin text-violet-600" />}
          </div>
        ) : (
          <div className="flex-1"></div>
        )}

        {/* Action Buttons Group */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={selectAllProjects}
            className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border transition-all focus:outline-none ${
              selectedProjectIds.size > 0 && selectedProjectIds.size === allProjectsLength
                ? 'border-violet-600 bg-violet-600 text-white'
                : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
            }`}
            title="Pilih Semua"
          >
            <CheckCircle2
              className={`h-5 w-5 ${selectedProjectIds.size > 0 && selectedProjectIds.size === allProjectsLength ? 'text-white' : ''}`}
            />
          </button>

          <button
            onClick={() => setShowSecurityModal(true)}
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-400 transition-all hover:border-gray-300 hover:text-gray-600 focus:outline-none"
            title="Pengaturan Moderasi"
          >
            <Shield className="h-5 w-5" />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className={`inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-all focus:outline-none ${
              connectionStatus === 'error'
                ? 'border-amber-200 bg-white text-amber-500 hover:border-amber-300'
                : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
            }`}
            title="Pengaturan Data"
          >
            <Settings
              className={`h-5 w-5 ${connectionStatus === 'error' ? 'animate-pulse' : ''}`}
            />
          </button>

          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex h-10 flex-shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent bg-violet-600 px-6 text-sm font-bold text-white transition-all hover:bg-violet-700 focus:outline-none"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Tambah Project
          </button>
        </div>
      </div>
    </div>
  );
};
