'use client';

import { useMemo } from 'react';
import { TestimonialData } from '@/types/testimonial';
import { buildChatContactsFromTestimonials } from '../utils/chatUtils';

export function useChatContacts(initialTestimonials?: TestimonialData | null) {
  return useMemo(
    () => buildChatContactsFromTestimonials(initialTestimonials),
    [initialTestimonials]
  );
}
