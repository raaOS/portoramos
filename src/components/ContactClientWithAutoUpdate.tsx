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

            {/* Social Media Links */}
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Follow Me</h3>
              <div className="flex space-x-4">
                {contactData.info.socialMedia.linkedin && (
                  <a
                    href={contactData.info.socialMedia.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
                {contactData.info.socialMedia.instagram && (
                  <a
                    href={contactData.info.socialMedia.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781H7.721v6.48h8.558v-6.48zm1.418-1.418H6.303v9.316h11.394V5.789z"/>
                    </svg>
                  </a>
                )}
                {contactData.info.socialMedia.github && (
                  <a
                    href={contactData.info.socialMedia.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                )}
                {contactData.info.socialMedia.behance && (
                  <a
                    href={contactData.info.socialMedia.behance}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.922 1.355-3.922.554-.317-.254-.395-.68-.353-1.06.124-1.205.546-2.220 1.105-3.102.178-.28.372-.556.578-.82.652-.84 1.484-1.54 2.494-2.04.317-.16.65-.295.994-.4.688-.21 1.4-.315 2.122-.315v1.5c-.48 0-.95.06-1.41.18-.46.12-.89.29-1.29.51-.8.44-1.43 1.05-1.89 1.83-.46.78-.69 1.63-.69 2.55 0 .92.23 1.77.69 2.55.46.78 1.09 1.39 1.89 1.83.4.22.83.39 1.29.51.46.12.93.18 1.41.18v1.5c-.72 0-1.43-.105-2.12-.315-.344-.105-.677-.24-.994-.4-1.01-.5-1.842-1.2-2.494-2.04-.206-.264-.4-.54-.578-.82-.559-.882-.981-1.897-1.105-3.102-.042-.38.036-.806.353-1.06.999-.801 3.48-.743 3.922.554zM8.5 6C3.253 6 0 9.253 0 14.5S3.253 23 8.5 23s8.5-3.253 8.5-8.5S13.747 6 8.5 6zm0 15c-3.59 0-6.5-2.91-6.5-6.5S4.91 8 8.5 8s6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z"/>
                    </svg>
                  </a>
                )}
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
