'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContactData, UpdateContactData } from '@/types/contact';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '@/contexts/ToastContext';
import { PhoneCall } from 'lucide-react';

export default function AdminContactClient() {
  const [contactData, setContactData] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'form'>('info');
  const { showSuccess, showError } = useToast();

  const loadContactData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contact');
      const data = await response.json();
      setContactData(data);
    } catch (err) {
      setError('Failed to load contact data');
      showError('Failed to load contact data.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Load contact data on mount
  useEffect(() => {
    loadContactData();
  }, [loadContactData]);

  const handleUpdateContact = async (updateData: UpdateContactData) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadContactData();
        setError(null);
        showSuccess('Contact data updated successfully.');
      } else {
        setError('Failed to update contact data');
        showError('Failed to update contact data.');
      }
    } catch (err) {
      setError('Failed to update contact data');
      showError('Failed to update contact data.');
    }
  };

  if (loading) {
    return (
      <AdminLayout
        title="Contact Management"
        subtitle="Manage contact information and form settings"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Contact' }]}
        titleIcon={<PhoneCall className="h-5 w-5" aria-hidden />}
        titleAccent="bg-amber-50 text-amber-700"
      >
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Loading contact data...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!contactData) {
    return (
      <AdminLayout
        title="Contact Management"
        subtitle="Manage contact information and form settings"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Contact' }]}
        titleIcon={<PhoneCall className="h-5 w-5" aria-hidden />}
        titleAccent="bg-amber-50 text-amber-700"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-red-600">Failed to load contact data</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Contact Management"
      subtitle="Manage contact information and form settings"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Contact' }]}
      titleIcon={<PhoneCall className="h-5 w-5" aria-hidden />}
      titleAccent="bg-amber-50 text-amber-700"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Contact Overview</h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(contactData.lastUpdated).toLocaleString()}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'info', name: 'Contact Information' },
              { id: 'form', name: 'Form Settings' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <ContactInfoForm 
              data={contactData.info} 
              onUpdate={(data) => handleUpdateContact({ info: data })} 
            />
          )}
          {activeTab === 'form' && (
            <ContactFormSettingsForm 
              data={contactData.formSettings} 
              onUpdate={(data) => handleUpdateContact({ formSettings: data })} 
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


// Contact Info Form
function ContactInfoForm({ 
  data, 
  onUpdate 
}: { 
  data: any;
  onUpdate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    linkedin: data.socialMedia?.linkedin || '',
    instagram: data.socialMedia?.instagram || '',
    twitter: data.socialMedia?.twitter || '',
    github: data.socialMedia?.github || '',
    behance: data.socialMedia?.behance || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      socialMedia: {
        linkedin: formData.linkedin,
        instagram: formData.instagram,
        twitter: formData.twitter,
        github: formData.github,
        behance: formData.behance
      }
    };

    onUpdate(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input
          type="text"
          required
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Social Media Links</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
            <input
              type="url"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.linkedin}
              onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Instagram</label>
            <input
              type="url"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Twitter</label>
            <input
              type="url"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.twitter}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GitHub</label>
            <input
              type="url"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.github}
              onChange={(e) => setFormData({ ...formData, github: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Behance</label>
            <input
              type="url"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={formData.behance}
              onChange={(e) => setFormData({ ...formData, behance: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Update Contact Info
        </button>
      </div>
    </form>
  );
}

// Contact Form Settings Form
function ContactFormSettingsForm({ 
  data, 
  onUpdate 
}: { 
  data: any;
  onUpdate: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    enabled: data.enabled || false,
    submitButtonText: data.submitButtonText || '',
    successMessage: data.successMessage || '',
    errorMessage: data.errorMessage || '',
    fields: data.fields || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      enabled: formData.enabled,
      fields: formData.fields,
      submitButtonText: formData.submitButtonText,
      successMessage: formData.successMessage,
      errorMessage: formData.errorMessage
    };

    onUpdate(submitData);
  };

  const updateField = (fieldName: string, property: string, value: any) => {
    setFormData({
      ...formData,
      fields: {
        ...formData.fields,
        [fieldName]: {
          ...formData.fields[fieldName],
          [property]: value
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Contact Form Settings</h3>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="enabled"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          checked={formData.enabled}
          onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
        />
        <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
          Enable contact form
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Submit Button Text</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={formData.submitButtonText}
            onChange={(e) => setFormData({ ...formData, submitButtonText: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Success Message</label>
          <input
            type="text"
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={formData.successMessage}
            onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Error Message</label>
        <input
          type="text"
          required
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={formData.errorMessage}
          onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
        />
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Form Fields Configuration</h4>
        <div className="space-y-4">
          {Object.entries(formData.fields).map(([fieldName, fieldConfig]: [string, any]) => (
            <div key={fieldName} className="border rounded-lg p-4">
              <h5 className="font-medium text-gray-900 capitalize mb-3">{fieldName}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Label</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={fieldConfig.label || ''}
                    onChange={(e) => updateField(fieldName, 'label', e.target.value)}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${fieldName}-required`}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={fieldConfig.required || false}
                    onChange={(e) => updateField(fieldName, 'required', e.target.checked)}
                  />
                  <label htmlFor={`${fieldName}-required`} className="ml-2 block text-sm text-gray-900">
                    Required field
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Update Form Settings
        </button>
      </div>
    </form>
  );
}
