'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Testimonial, TestimonialData } from '@/types/testimonial';
import AdminButton from '../components/AdminButton';
import AdminFileUpload from '../components/AdminFileUpload';
import AdminLayout from '../components/AdminLayout';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { useToast } from '@/contexts/ToastContext';
import { Quote, Pencil, Trash2 } from 'lucide-react';
import StatusToggle from '../components/StatusToggle';

const FALLBACK_AVATAR = 'https://ui-avatars.com/api/?background=random&color=fff&name=';

export default function AdminTestimonialClient() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Testimonial>>({
    name: '',
    company: '',
    role: '',
    content: '',
    avatar: '',
    isActive: true
  });
  const { showSuccess, showError } = useToast();

  // Load testimonials
  const loadTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/testimonial');
      const data: TestimonialData = await response.json();
      setTestimonials(data.testimonials);
      setError(null);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      setError('Failed to load testimonials');
      showError('Failed to load testimonials.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const { lastUpdated, refresh } = useAutoUpdate(loadTestimonials);

  useEffect(() => {
    loadTestimonials();
  }, [lastUpdated, loadTestimonials]);

  // Create testimonial
  const handleCreate = async () => {
    if (!formData.name || !formData.content) return;

    try {
      const response = await fetch('/api/testimonial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setFormData({ name: '', company: '', role: '', content: '', avatar: '', isActive: true });
        refresh();
        showSuccess('Testimonial created successfully.');
      } else {
        showError('Failed to create testimonial.');
      }
    } catch (error) {
      console.error('Error creating testimonial:', error);
      showError('Failed to create testimonial.');
    }
  };

  // Update testimonial
  const handleUpdate = async (id: number) => {
    try {
      const response = await fetch('/api/testimonial', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...formData })
      });

      if (response.ok) {
        setEditingId(null);
        setFormData({ name: '', company: '', role: '', content: '', avatar: '', isActive: true });
        refresh();
        showSuccess('Testimonial updated successfully.');
      } else {
        showError('Failed to update testimonial.');
      }
    } catch (error) {
      console.error('Error updating testimonial:', error);
      showError('Failed to update testimonial.');
    }
  };

  // Delete testimonial
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const response = await fetch('/api/testimonial', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        refresh();
        showSuccess('Testimonial deleted successfully.');
      } else {
        showError('Failed to delete testimonial.');
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      showError('Failed to delete testimonial.');
    }
  };

  // Edit testimonial
  const handleEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setFormData(testimonial);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', company: '', role: '', content: '', avatar: '', isActive: true });
  };

  // Handle file upload
  const handleFileUpload = (url: string) => {
    setFormData(prev => ({ ...prev, avatar: url }));
  };

  return (
    <AdminLayout
      title="Testimonials Management"
      subtitle="Manage client testimonials"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Testimonial' }]}
      titleIcon={<Quote className="h-5 w-5" aria-hidden />}
      titleAccent="bg-rose-50 text-rose-700"
    >
      <div className="space-y-8">
        {/* Header Summary */}
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            Displaying {testimonials.length} testimonials
          </p>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Form Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h2>
            {editingId && (
              <button
                onClick={handleCancel}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel Editing
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Client name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={formData.role || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Job title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Avatar image URL"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Testimonial content"
              />
            </div>

            {/* Avatar Preview & Upload */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 w-full sm:w-auto">
                <AdminFileUpload
                  onUpload={(urls) => handleFileUpload(urls[0])}
                  accept="image/*"
                  multiple={false}
                  maxFiles={1}
                />
              </div>
              {formData.avatar && (
                <div className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={formData.avatar}
                      alt="Avatar preview"
                      fill
                      className="object-cover"
                      sizes="40px"
                      unoptimized
                    />
                  </div>
                  <span className="text-xs text-gray-500 max-w-[200px] truncate">{formData.avatar}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              {editingId && (
                <AdminButton onClick={handleCancel} variant="secondary">
                  Cancel
                </AdminButton>
              )}
              <AdminButton
                onClick={editingId ? () => handleUpdate(editingId) : handleCreate}
                disabled={!formData.name || !formData.content}
                variant="primary"
              >
                {editingId ? 'Update Testimonial' : 'Create Testimonial'}
              </AdminButton>
            </div>
          </div>
        </div>

        {/* Testimonials List (Cards) */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Existing Testimonials</h3>

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No testimonials found. Add one above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={testimonial.avatar || `${FALLBACK_AVATAR}${testimonial.name}`}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{testimonial.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500">{testimonial.role} {testimonial.company && `@ ${testimonial.company}`}</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <Quote className="w-4 h-4 text-violet-200 mb-2 fill-current" />
                    <p className="text-sm text-gray-600 italic line-clamp-4 leading-relaxed">
                      {testimonial.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                    <StatusToggle
                      isActive={testimonial.isActive !== false}
                      onClick={() => {
                        fetch('/api/testimonial', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: testimonial.id, isActive: testimonial.isActive === false ? true : false })
                        }).then(res => {
                          if (res.ok) {
                            refresh();
                            showSuccess('Status updated.');
                          } else {
                            showError('Failed to update status.');
                          }
                        });
                      }}
                      className="mr-auto"
                    />
                    <button
                      onClick={() => handleEdit(testimonial)}
                      className="p-2 text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(testimonial.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
