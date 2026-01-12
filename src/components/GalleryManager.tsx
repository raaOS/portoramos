'use client'

import { useState } from 'react'

interface GalleryManagerProps {
  onUploadComplete: (urls: string[]) => void
  pageType?: string
  subfolder?: string
}

export default function GalleryManager({ onUploadComplete, pageType = 'projects', subfolder }: GalleryManagerProps) {
  const [manualLinks, setManualLinks] = useState<string[]>([])
  const [newLink, setNewLink] = useState('')

  const addManualLink = () => {
    if (newLink.trim() && manualLinks.length < 20) {
      const updatedLinks = [...manualLinks, newLink.trim()]
      setManualLinks(updatedLinks)
      setNewLink('')
      onUploadComplete(updatedLinks)
    }
  }

  const removeManualLink = (index: number) => {
    const updatedLinks = manualLinks.filter((_, i) => i !== index)
    setManualLinks(updatedLinks)
    onUploadComplete(updatedLinks)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addManualLink()
    }
  }

  return (
    <div className="space-y-6">
      {/* Manual Link Input */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Tambah Link Gambar Manual
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addManualLink}
            disabled={manualLinks.length >= 20 || !newLink.trim()}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah
          </button>
        </div>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Masukkan URL gambar langsung (misal: raw.githubusercontent.com atau source lain).
        </p>
      </div>

      {/* Manual Links Display */}
      {manualLinks.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Link Tersimpan ({manualLinks.length}/20)
            </label>
            <button
              type="button"
              onClick={() => {
                setManualLinks([])
                onUploadComplete([])
              }}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus Semua
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {manualLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-100">
                <input
                  type="text"
                  value={link}
                  readOnly
                  className="flex-1 px-2 py-1 text-xs bg-white border border-gray-200 rounded font-mono"
                />
                <button
                  type="button"
                  onClick={() => removeManualLink(index)}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors font-medium"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Aksi Cepat:
        </h5>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setManualLinks([])
              onUploadComplete([])
            }}
            className="px-3 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Reset Galeri
          </button>
        </div>
      </div>
    </div>
  )
}