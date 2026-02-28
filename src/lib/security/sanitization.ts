export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000) // Limit length
}

/**
 * Set of utility functions for sanitizing user input.
 */
export const sanitize = {
    /**
     * Escapes HTML special characters to prevent XSS.
     * 
     * @param input - The string to sanitize.
     * @returns The escaped string.
     */
    html: (input: string): string => {
        if (typeof input !== 'string') return ''
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .substring(0, 10000)
    },

    email: (input: string): string => {
        return input.toLowerCase().trim().substring(0, 254)
    },

    filename: (input: string): string => {
        return input
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .substring(0, 255)
            .replace(/^[._]/, 'file')
    },

    sql: (input: string): string => {
        return input
            .replace(/[';"\\]/g, '')
            .replace(/--/g, '')
            .replace(/\/\*|\*\//g, '')
            .trim()
            .substring(0, 1000)
    },
}
