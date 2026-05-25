import { Testimonial, TestimonialData } from '@/types/testimonial';
import { ContactProfile, ChatMessage } from '../data/mockChats';
import { getAvatarUrl } from '@/lib/avatar';

export const convertTestimonialToContact = (testimonial: Testimonial): ContactProfile => {
  // 1. Use real messages if available, otherwise generate legacy fallback
  const conversation: ChatMessage[] =
    Array.isArray(testimonial.messages) && testimonial.messages.length > 0
      ? testimonial.messages.map((m) => ({
          id: m.id,
          text: m.text,
          isMe: m.isMe,
          time: m.time,
          status: 'read',
          type: m.type || 'text',
          imageSrc: m.imageSrc,
          projectId: m.projectId,
        }))
      : [
          {
            id: 1,
            text: `Halo Mas, ${testimonial.role ? `saya dari ${testimonial.company || 'perusahaan'}` : 'apa kabar?'}`,
            isMe: false,
            time: '09:00',
            status: 'read',
          },
          {
            id: 2,
            text: `Halo ${testimonial.name}, terima kasih sudah menghubungi. Ada yang bisa dibantu?`,
            isMe: true,
            time: '09:05',
            status: 'read',
          },
          {
            id: 3,
            text: testimonial.content || 'Halo!',
            isMe: false,
            time: '09:10',
            status: 'read',
          },
        ];

  return {
    id: `testimonial-${testimonial.id}`,
    name: testimonial.name,
    // Automatic Letter Avatar Generation:
    // Uses ui-avatars.com to create a clean single letter (e.g., "B" for Budi).
    // Background is a soft pastel green/gray (WhatsApp style), Bold font enabled.
    avatar: getAvatarUrl(testimonial.name),
    status:
      testimonial.notificationText ||
      (testimonial.role
        ? testimonial.company
          ? `${testimonial.role} @ ${testimonial.company}`
          : testimonial.role
        : 'Client'),
    conversation,
  };
};

export const mergeContacts = (
  mockContacts: Record<string, ContactProfile>,
  testimonials: Testimonial[]
): Record<string, ContactProfile> => {
  const newContacts = { ...mockContacts };

  if (Array.isArray(testimonials)) {
    testimonials.forEach((t) => {
      if (t.isActive !== false) {
        // Only active testimonials
        const contact = convertTestimonialToContact(t);
        // Use name as key to match existing logic/lookup
        newContacts[contact.name] = contact;
      }
    });
  }

  return newContacts;
};

export const buildChatContactsFromTestimonials = (
  testimonialData?: TestimonialData | null
): {
  dynamicContacts: Record<string, ContactProfile>;
  testimonialContacts: ContactProfile[];
  allContactsList: ContactProfile[];
} => {
  const testimonials = testimonialData?.testimonials || [];
  const activeTestimonials = testimonials.filter((testimonial) => testimonial.isActive !== false);
  const testimonialContacts = activeTestimonials.map(convertTestimonialToContact);
  const dynamicContacts = mergeContacts({}, testimonials);

  return {
    dynamicContacts,
    testimonialContacts,
    allContactsList: Object.values(dynamicContacts),
  };
};
