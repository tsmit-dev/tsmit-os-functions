// src/lib/phone-utils.ts

/**
 * @param phoneNumber The raw phone number string.
 * @returns The formatted phone number or the original string if it's invalid.
 */
export function formatPhoneNumberForDisplay(phoneNumber: string | null | undefined): string {
    if (!phoneNumber) {
        return 'N/A';
    }

    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.length === 13 && cleaned.startsWith('55')) { // Brazilian mobile with country code
        const country = cleaned.substring(0, 2);
        const area = cleaned.substring(2, 4);
        const firstPart = cleaned.substring(4, 9);
        const secondPart = cleaned.substring(9);
        return `+${country} (${area}) ${firstPart}-${secondPart}`;
    }
    
    if (cleaned.length === 11) { // Brazilian mobile without country code
        const area = cleaned.substring(0, 2);
        const firstPart = cleaned.substring(2, 7);
        const secondPart = cleaned.substring(7);
        return `(${area}) ${firstPart}-${secondPart}`;
    }

    // Fallback for other formats or incomplete numbers
    return phoneNumber;
}

/**
 * @param phoneNumber The phone number string to sanitize.
 * @returns The sanitized phone number.
 */
export function sanitizePhoneNumberForStorage(phoneNumber: string): string {
    let cleaned = phoneNumber.replace(/\D/g, '');

    // If it's a typical Brazilian mobile number (e.g., 119... or 349...)
    if (cleaned.length === 11 && (cleaned.startsWith('11') || cleaned.startsWith('34'))) {
        return `55${cleaned}`;
    }
    
    // If it's a mobile number that already has the country code
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
        return cleaned;
    }

    // Add country code if it seems to be missing
    if (cleaned.length > 8 && !cleaned.startsWith('55')) {
       return `55${cleaned}`;
    }

    return cleaned;
}
