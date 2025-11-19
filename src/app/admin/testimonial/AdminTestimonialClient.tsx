'use client';

import { useState, useEffect } from 'react';
import { Testimonial, TestimonialData } from '@/types/testimonial';
import AdminTable from '../components/AdminTable';
import AdminButton from '../components/AdminButton';
import AdminFileUpload from '../components/AdminFileUpload';
import AdminLayout from '../components/AdminLayout';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { useToast } from '@/contexts/ToastContext';

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
    avatar: ''
  });
  const { showSuccess, showError } = useToast();

  // Load testimonials
  const loadTestimonials = async () => {
    try {
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
  };

  const { lastUpdated, refresh } = useAutoUpdate(loadTestimonials);

  useEffect(() => {
    loadTestimonials();
  }, [lastUpdated]);

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
        setFormData({ name: '', company: '', role: '', content: '', avatar: '' });
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
        setFormData({ name: '', company: '', role: '', content: '', avatar: '' });
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
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', company: '', role: '', content: '', avatar: '' });
  };

  // Handle file upload
  const handleFileUpload = (url: string) => {
    setFormData(prev => ({ ...prev, avatar: url }));
  };

  if (loading && testimonials.length === 0) {
    return (
      <AdminLayout
        title="Testimonials Management"
        subtitle="Manage client testimonials"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Testimonial' }]}
      >
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading testimonials...</p>
        </div>
      </AdminLayout>
    );
  }

  const columns = [
    { key: 'id', label: 'ID', width: 'w-16' },
    { key: 'name', label: 'Name', width: 'w-32' },
    { key: 'company', label: 'Company', width: 'w-32' },
    { key: 'role', label: 'Role', width: 'w-32' },
    { key: 'content', label: 'Content', width: 'w-64' },
    { key: 'avatar', label: 'Avatar', width: 'w-32' }
  ];

  return (
    <AdminLayout
      title="Testimonials Management"
      subtitle="Manage client testimonials"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Testimonial' }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Testimonials</h1>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
          </h2>
          
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

        <div className="mt-4">
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

        <div className="mt-4">
          <AdminFileUpload
            onUpload={(urls) => handleFileUpload(urls[0])}
            accept="image/*"
            multiple={false}
            maxFiles={1}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <AdminButton
            onClick={editingId ? () => handleUpdate(editingId) : handleCreate}
            disabled={!formData.name || !formData.content}
            variant="primary"
          >
            {editingId ? 'Update' : 'Create'}
          </AdminButton>
          
          {editingId && (
            <AdminButton onClick={handleCancel} variant="secondary">
              Cancel
            </AdminButton>
          )}
        </div>
      </div>

      {/* Table */}
      <AdminTable
        data={testimonials}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
