'use client';

import { useState, useEffect } from 'react';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { ContactData } from '@/types/contact';

export default function ContactClientWithAutoUpdate() {
  const [initialData, setInitialData] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('/api/contact');
        const data: ContactData = await response.json();
        setInitialData(data);
      } catch (error) {
        console.error('Failed to load initial contact data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Auto-update data (lebih jarang, dan nonaktif secara default)
  const { data: updatedData } = useAutoUpdate<ContactData>(
    async () => {
      const response = await fetch('/api/contact');
      if (!response.ok) throw new Error('Failed to fetch contact data');
      return response.json();
    },
    { interval: 60000, enabled: false } // Aktifkan jika data contact sering berubah
  );

  const contactData = updatedData || initialData;

  if (loading) {
    return null;
  }

  if (!contactData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load contact content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-8 md:mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            Get In Touch
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Ready to work together? Let&apos;s discuss your project and bring your ideas to life.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`mailto:${contactData.info.email}`}
              className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Email langsung
            </a>
            <a
              href={`https://wa.me/${contactData.info.phone?.replace(/\\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-5 py-3 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:border-black hover:text-black transition-colors"
            >
              Chat via WhatsApp
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 text-blue-600 mt-1">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <a href={`mailto:${contactData.info.email}`} className="text-blue-600 hover:text-blue-800">
                    {contactData.info.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 text-blue-600 mt-1">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <a href={`tel:${contactData.info.phone}`} className="text-blue-600 hover:text-blue-800">
                    {contactData.info.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 text-blue-600 mt-1">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Location</h3>
                  <p className="text-gray-600">{contactData.info.address}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          {contactData.formSettings.enabled && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Send Message</h2>
              <ContactForm formSettings={contactData.formSettings} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Contact Form Component
function ContactForm({ formSettings }: { formSettings: any }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            {formSettings.fields.name.label}
            {formSettings.fields.name.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required={formSettings.fields.name.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {formSettings.fields.email.label}
            {formSettings.fields.email.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required={formSettings.fields.email.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            {formSettings.fields.phone.label}
            {formSettings.fields.phone.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required={formSettings.fields.phone.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
            {formSettings.fields.company.label}
            {formSettings.fields.company.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            id="company"
            name="company"
            required={formSettings.fields.company.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.company}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          {formSettings.fields.subject.label}
          {formSettings.fields.subject.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required={formSettings.fields.subject.required}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={formData.subject}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          {formSettings.fields.message.label}
          {formSettings.fields.message.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required={formSettings.fields.message.required}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={formData.message}
          onChange={handleChange}
        />
      </div>

      {submitStatus === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {formSettings.successMessage}
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {formSettings.errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Sending...' : formSettings.submitButtonText}
      </button>
    </form>
  );
}



