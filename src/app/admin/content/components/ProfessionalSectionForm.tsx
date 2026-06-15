'use client';

import React, { useState } from 'react';
import type { AboutHero } from '@/types/about';
import { ChevronDown } from 'lucide-react';

interface MottoData {
  badge?: string;
  quote?: string;
}

interface BioData {
  content?: string;
}

interface AvailabilityData {
  status?: NonNullable<AboutHero['availability']>['status'];
  text?: string;
}

interface HeroData {
  availability?: AvailabilityData;
}

interface ProfessionalData {
  motto?: MottoData;
  bio?: BioData;
}

interface ProfessionalSectionFormProps {
  data: ProfessionalData;
  heroData: HeroData;
  projects?: unknown[]; // Kept for API compatibility but not used
  onUpdate: (data: ProfessionalSectionUpdatePayload) => void | Promise<void>;
}

interface ProfessionalSectionUpdatePayload {
  professional: {
    motto: {
      badge: string;
      quote: string;
    };
    bio: {
      content: string;
    };
  };
  hero: {
    availability: {
      status: NonNullable<AboutHero['availability']>['status'];
      text: string;
    };
  };
}

type AvailabilityStatus = NonNullable<AboutHero['availability']>['status'];

export default function ProfessionalSectionForm({
  data,
  heroData,
  projects: _projects,
  onUpdate,
}: ProfessionalSectionFormProps) {
  const [formData, setFormData] = useState<{
    mottoBadge: string;
    mottoQuote: string;
    bioContent: string;
    availStatus: AvailabilityStatus;
    availText: string;
  }>({
    mottoBadge: data?.motto?.badge || '',
    mottoQuote: data?.motto?.quote || '',
    bioContent: data?.bio?.content || '',
    // Availability
    availStatus: heroData?.availability?.status || 'available',
    availText: heroData?.availability?.text || 'Available for new projects',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      professional: {
        motto: {
          badge: formData.mottoBadge,
          quote: formData.mottoQuote,
        },
        bio: {
          content: formData.bioContent,
        },
      },
      hero: {
        availability: {
          status: formData.availStatus,
          text: formData.availText,
        },
      },
    };

    onUpdate(submitData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-medium text-gray-900">Tentang Saya & Status Header</h3>
        <p className="mb-4 text-sm text-gray-600">
          Konten ini muncul di window &quot;Finder: About Me&quot; pada halaman About OS.
        </p>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          {/* Availability Status Section */}
          <div className="rounded border border-gray-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-700">
              Status Ketersediaan
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="relative mt-1">
                  <select
                    value={formData.availStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        availStatus: e.target.value as AvailabilityStatus,
                      })
                    }
                    className="block w-full cursor-pointer appearance-none rounded-md border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="available">Available (Green)</option>
                    <option value="booked">Booked (Red)</option>
                    <option value="limited">Limited (Red)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Teks Status</label>
                <input
                  type="text"
                  value={formData.availText}
                  onChange={(e) => setFormData({ ...formData, availText: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Badge Motto</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formData.mottoBadge}
                onChange={(e) => setFormData({ ...formData, mottoBadge: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kutipan Motto</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formData.mottoQuote}
                onChange={(e) => setFormData({ ...formData, mottoQuote: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Konten Bio</label>
            <textarea
              rows={4}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={formData.bioContent}
              onChange={(e) => setFormData({ ...formData, bioContent: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Perbarui Info & Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
