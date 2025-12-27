'use client';

import { useState, useEffect } from 'react';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import { ContactData } from '@/types/contact';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'framer-motion';
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Send,
  Linkedin,
  Instagram,
  Twitter,
  Github,
  ArrowUpRight
} from 'lucide-react';
import BlurTextLoop from '@/components/effects/BlurTextLoop';

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default function ContactClientWithAutoUpdate({ initialData: serverData }: { initialData?: ContactData | null }) {
  const [initialData, setInitialData] = useState<ContactData | null>(serverData || null);
  const [loading, setLoading] = useState(!serverData);

  // Load initial data ONLY if not provided by server
  useEffect(() => {
    if (serverData) return;

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
  }, [serverData]);

  const { data: updatedData } = useAutoUpdate<ContactData>(
    async () => {
      const response = await fetch('/api/contact');
      if (!response.ok) throw new Error('Failed to fetch contact data');
      return response.json();
    },
    { interval: 60000, enabled: false }
  );

  const contactData = updatedData || initialData;

  if (loading) {
    // Loading skeleton to prevent CLS
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-24 md:py-32 lg:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            {/* Left skeleton */}
            <div className="lg:col-span-5 space-y-16 animate-pulse">
              <div className="space-y-4">
                <div className="h-24 bg-gray-200 rounded w-3/4" />
                <div className="h-24 bg-gray-200 rounded w-2/3" />
                <div className="h-24 bg-gray-200 rounded w-full" />
                <div className="h-6 bg-gray-200 rounded w-5/6 mt-8" />
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-12 bg-gray-200 rounded w-full" />
                <div className="h-12 bg-gray-200 rounded w-full" />
                <div className="h-12 bg-gray-200 rounded w-full" />
              </div>
            </div>
            {/* Right skeleton */}
            <div className="lg:col-span-7 animate-pulse">
              <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100">
                <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="h-12 bg-gray-200 rounded" />
                    <div className="h-12 bg-gray-200 rounded" />
                  </div>
                  <div className="h-32 bg-gray-200 rounded" />
                  <div className="h-12 bg-gray-200 rounded w-48" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-gray-100 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-gray-50 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-24 md:py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">

          {/* Header & Info Section (Centered) */}
          <div className="lg:col-span-12 max-w-4xl mx-auto space-y-16">


            <Reveal>
              <div className="flex flex-col items-start leading-[0.85] font-bold font-display tracking-normal select-none mb-8">
                <BlurTextLoop
                  text="LET'S"
                  className="text-[20vw] lg:text-[8rem] text-black"
                  initialDelay={0.1}
                  animateBy="letters"
                  direction="top"
                  totalSegmentCount={8}
                />
                <BlurTextLoop
                  text="WORK"
                  className="text-[20vw] lg:text-[8rem] text-black"
                  initialDelay={0.3}
                  animateBy="letters"
                  direction="top"
                  totalSegmentCount={8}
                />
                <BlurTextLoop
                  text="TOGETHER"
                  className="text-[20vw] lg:text-[8rem] text-black"
                  initialDelay={0.5}
                  animateBy="letters"
                  direction="top"
                  totalSegmentCount={8}
                />
              </div>
              <p className="text-xl text-gray-600 font-sans italic max-w-2xl leading-relaxed">
                Have a project in mind? Let's combine our creativity and build something extraordinary.
              </p>

              {/* Availability Badge */}
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 mt-6">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Available for new projects</span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mt-8">
                <a
                  href="mailto:ra.920710@gmail.com?subject=Project Inquiry"
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
                >
                  Start a Project
                </a>
                <a
                  href="https://calendly.com/ramos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-black text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Schedule a Call
                </a>
              </div>
            </Reveal>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
              <Reveal delay={0.2}>
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Contact Details</h3>
                  <div className="space-y-4">
                    <a href={`mailto:${contactData.info.email}`} className="group flex items-center gap-4 text-2xl font-medium hover:text-gray-600 transition-colors">
                      <span className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-300">
                        <Mail className="w-5 h-5" />
                      </span>
                      {contactData.info.email}
                    </a>
                    <a href={`tel:${contactData.info.phone}`} className="group flex items-center gap-4 text-2xl font-medium hover:text-gray-600 transition-colors">
                      <span className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-black group-hover:border-black group-hover:text-white transition-all duration-300">
                        <Phone className="w-5 h-5" />
                      </span>
                      {contactData.info.phone}
                    </a>
                    <div className="flex items-center gap-4 text-lg text-gray-500">
                      <span className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5" />
                      </span>
                      {contactData.info.address}
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Socials</h3>
                  <div className="flex flex-wrap gap-4">
                    <SocialLink href={contactData.info.socialMedia?.linkedin} label="LinkedIn" icon={<Linkedin className="w-5 h-5" />} />
                    <SocialLink href={contactData.info.socialMedia?.instagram} label="Instagram" icon={<Instagram className="w-5 h-5" />} />
                    <SocialLink href={contactData.info.socialMedia?.github} label="GitHub" icon={<Github className="w-5 h-5" />} />
                    <SocialLink href={contactData.info.socialMedia?.twitter} label="Twitter" icon={<Twitter className="w-5 h-5" />} />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>



        </div>
      </div>


    </div>
  );
}

// Dummy 4:5 images for testing

function SocialLink({ href, label, icon }: { href?: string; label: string; icon: React.ReactNode }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 hover:border-black hover:bg-black hover:text-white transition-all duration-300"
    >
      {icon}
      <span className="font-medium">{label}</span>
      <ArrowUpRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
    </a>
  );
}

// Minimalist Form Component
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setFormData({
        name: '', email: '', phone: '', company: '', subject: '', message: ''
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        <Input
          name="name"
          label={formSettings.fields.name.label}
          required={formSettings.fields.name.required}
          value={formData.name}
          onChange={handleChange}
          placeholder="John Doe"
        />
        <Input
          name="email"
          type="email"
          label={formSettings.fields.email.label}
          required={formSettings.fields.email.required}
          value={formData.email}
          onChange={handleChange}
          placeholder="john@example.com"
        />
        <Input
          name="phone"
          type="tel"
          label={formSettings.fields.phone.label}
          required={formSettings.fields.phone.required}
          value={formData.phone}
          onChange={handleChange}
          placeholder="+62..."
        />
        <Input
          name="company"
          label={formSettings.fields.company.label}
          required={formSettings.fields.company.required}
          value={formData.company}
          onChange={handleChange}
          placeholder="Company Ltd."
        />
      </div>

      <Input
        name="subject"
        label={formSettings.fields.subject.label}
        required={formSettings.fields.subject.required}
        value={formData.subject}
        onChange={handleChange}
        placeholder="Project Inquiry"
      />

      <div className="relative group">
        <label htmlFor="message" className="block text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-black transition-colors">
          {formSettings.fields.message.label}
          {formSettings.fields.message.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required={formSettings.fields.message.required}
          className="w-full bg-transparent border-b-2 border-gray-200 py-3 text-lg focus:outline-none focus:border-black transition-colors resize-none placeholder-gray-300"
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell me about your project..."
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="group w-full md:w-auto inline-flex items-center justify-center gap-3 bg-black text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          {isSubmitting ? (
            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {formSettings.submitButtonText}
              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        <AnimatePresence>
          {submitStatus === 'success' && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-emerald-50 text-emerald-900 px-6 py-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {formSettings.successMessage}
              </div>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-red-50 text-red-900 px-6 py-4 rounded-xl border border-red-100 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {formSettings.errorMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

function Input({
  name,
  label,
  required,
  value,
  onChange,
  type = 'text',
  placeholder
}: {
  name: string;
  label: string;
  required: boolean;
  value: string;
  onChange: any;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative group">
      <label htmlFor={name} className="block text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2 group-focus-within:text-black transition-colors">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        required={required}
        className="w-full bg-transparent border-b-2 border-gray-200 py-3 text-lg focus:outline-none focus:border-black transition-colors placeholder-gray-300"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}



