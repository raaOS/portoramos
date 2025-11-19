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
  };
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
  info: ContactInfo;
  formSettings: ContactFormSettings;
  lastUpdated: string;
}

export interface UpdateContactData {
  info?: Partial<ContactInfo>;
  formSettings?: Partial<ContactFormSettings>;
}
