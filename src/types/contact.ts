export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  socialMedia: {
    linkedin?: string;
    instagram?: string;
    twitter?: string;
    github?: string;
    behance?: string;
    whatsapp?: string;
  };
}

export interface ContactContent {
  headline: string;
  subtext: string;
}

export interface ContactFormSettings {
  enabled: boolean;
  fields: {
    name: { required: boolean; label: string };
    email: { required: boolean; label: string };
    phone: { required: boolean; label: string };
    company: { required: boolean; label: string };
    subject: { required: boolean; label: string };
    message: { required: boolean; label: string };
  };
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
}

export interface ContactData {
  content?: ContactContent;
  info: ContactInfo;
  formSettings: ContactFormSettings;
  labels?: {
    chatButtonText?: string;
  };
  lastUpdated: string;
}

export interface UpdateContactData {
  content?: ContactContent;
  info?: Partial<ContactInfo>;
  formSettings?: Partial<ContactFormSettings>;
  labels?: Partial<{
    chatButtonText: string;
  }>;
}
