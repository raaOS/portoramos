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
  const [uploading, setUploading] = useState(false)

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

  // File upload functionality removed - using link input only

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
          Tambah Link Cloudinary Manual
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://res.cloudinary.com/dcb3dslfw/image/upload/..."
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
          Copy link dari Cloudinary Console → Share → Copy URL
        </p>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Link tersimpan: {manualLinks.length}/20
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
              Link Manual ({manualLinks.length}/20)
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

      {/* File Upload Disabled - Using Link Input Only */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h4 className="text-sm font-medium text-yellow-800">Upload File Dinonaktifkan</h4>
        </div>
        <p className="text-sm text-yellow-700">
          Fitur upload file langsung telah dinonaktifkan sementara. Silakan gunakan input link manual di atas atau upload melalui Cloudinary Console.
        </p>
      </div>

      {/* Cloudinary Console Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 5.477 5.754 5 7.5 5s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.523 18.246 19 16.5 19c-1.746 0-3.332-.477-4.5-1.253" />
            </svg>
          </div>
          <h4 className="text-lg font-semibold text-blue-900">
            Cara Upload ke Cloudinary Console
          </h4>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Langkah Upload:
            </h5>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
              <li>Buka <a href="https://cloudinary.com/console" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-900">Cloudinary Console</a></li>
              <li>Login dan pilih cloud: <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">dcb3dslfw</code></li>
              <li>Klik &quot;Upload&quot; di sidebar kiri</li>
              <li>Drag &amp; drop foto atau klik &quot;Browse&quot;</li>
              <li>Di field &quot;Folder&quot;, ketik: <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">portfolio</code></li>
              <li>Klik &quot;Upload&quot;</li>
              <li>Foto otomatis muncul di galeri! ✨</li>
            </ol>
          </div>

          <div>
            <h5 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Tips &amp; Trik:
            </h5>
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Gunakan folder &quot;portfolio&quot; untuk organisasi yang rapi</li>
              <li>• Format yang didukung: JPG, PNG, GIF, WebP</li>
              <li>• Ukuran maksimal: 10MB per foto</li>
              <li>• Foto otomatis dioptimasi oleh Cloudinary</li>
              <li>• Bisa akses dari mana saja, kapan saja</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
          <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong>Keuntungan:</strong> Foto yang diupload ke Cloudinary Console akan otomatis muncul di galeri website tanpa perlu input manual!
          </p>
        </div>
      </div>

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
          <button
            type="button"
            onClick={() => window.open('https://cloudinary.com/console', '_blank')}
            className="px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Buka Cloudinary
          </button>
          <button
            type="button"
            onClick={() => {
              const testLinks = [
                'https://res.cloudinary.com/dcb3dslfw/image/upload/v1756671305/Gemini_Generated_Image_q3k7ceq3k7ceq3k7_vmhpej.png',
                'https://res.cloudinary.com/dcb3dslfw/image/upload/v1756670459/ttd_yncqjq.png'
              ]
              setManualLinks(testLinks)
              onUploadComplete(testLinks)
            }}
            className="px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Test Data
          </button>
        </div>
      </div>
    </div>
  )
}