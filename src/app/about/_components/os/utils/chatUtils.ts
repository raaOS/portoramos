import { Testimonial } from "@/types/testimonial";
import { ContactProfile, ChatMessage } from "../data/mockChats";

export const convertTestimonialToContact = (testimonial: Testimonial): ContactProfile => {
    // 1. Use real messages if available, otherwise generate legacy fallback
    const conversation: ChatMessage[] = (testimonial.messages && testimonial.messages.length > 0)
        ? testimonial.messages.map(m => ({
            id: m.id,
            text: m.text,
            isMe: m.isMe,
            time: m.time,
            status: 'read'
        }))
        : [
            {
                id: 1,
                text: `Halo Mas, ${testimonial.role ? `saya dari ${testimonial.company || 'perusahaan'}` : 'apa kabar?'}`,
                isMe: false,
                time: "09:00",
                status: 'read'
            },
            {
                id: 2,
                text: `Halo ${testimonial.name}, terima kasih sudah menghubungi. Ada yang bisa dibantu?`,
                isMe: true,
                time: "09:05",
                status: 'read'
            },
            {
                id: 3,
                text: testimonial.content || "Halo!",
                isMe: false,
                time: "09:10",
                status: 'read'
            }
        ];

    return {
        id: `testimonial-${testimonial.id}`,
        name: testimonial.name,
        // Automatic Letter Avatar Generation:
        // Uses ui-avatars.com to create a clean single letter (e.g., "B" for Budi).
        // Background is a soft pastel green/gray (WhatsApp style), Bold font enabled.
        avatar: `https://ui-avatars.com/api/?background=d9fdd3&color=128c7e&name=${encodeURIComponent(testimonial.name.charAt(0))}&size=128&bold=true&length=1`,
        status: testimonial.notificationText || (testimonial.role ? `${testimonial.role} @ ${testimonial.company}` : 'Client'),
        conversation
    };
};

export const mergeContacts = (
    mockContacts: Record<string, ContactProfile>,
    testimonials: Testimonial[]
): Record<string, ContactProfile> => {
    const newContacts = { ...mockContacts };

    testimonials.forEach(t => {
        if (t.isActive !== false) { // Only active testimonials
            const contact = convertTestimonialToContact(t);
            // Use name as key to match existing logic/lookup
            newContacts[contact.name] = contact;
        }
    });

    return newContacts;
};
