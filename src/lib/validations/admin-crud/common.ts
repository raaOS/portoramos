import { z } from 'zod';

export const shortText = (max: number) => z.string().trim().max(max);
export const requiredText = (max: number) => z.string().trim().min(1).max(max);
export const entityId = (max: number = 120) => z.coerce.string().trim().min(1).max(max);
