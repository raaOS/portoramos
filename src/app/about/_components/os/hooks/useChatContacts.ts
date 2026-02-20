"use client";

import { useState, useEffect } from "react";
import { ContactProfile, mockChats } from "../data/mockChats";
import { TestimonialData } from "@/types/testimonial";
import { convertTestimonialToContact, mergeContacts } from "../utils/chatUtils";

export function useChatContacts() {
    const [dynamicContacts, setDynamicContacts] = useState<Record<string, ContactProfile>>(mockChats);
    const [allContactsList, setAllContactsList] = useState<ContactProfile[]>([]);
    const [testimonialContacts, setTestimonialContacts] = useState<ContactProfile[]>([]);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await fetch('/api/testimonial');
                if (res.ok) {
                    const data: TestimonialData = await res.json();

                    // 1. Convert only active testimonials to contacts for notifications
                    const converted = (data.testimonials || [])
                        .filter(t => t.isActive !== false)
                        .map(convertTestimonialToContact);
                    setTestimonialContacts(converted);

                    // 2. Merge all contacts for the chat window
                    const merged = mergeContacts(mockChats, data.testimonials);
                    setDynamicContacts(merged);
                    setAllContactsList(Object.values(merged));
                }
            } catch (error) {
                console.error("Failed to fetch testimonials for chat", error);
            }
        };

        fetchTestimonials();
    }, []);

    return {
        dynamicContacts,
        allContactsList,
        testimonialContacts
    };
}
