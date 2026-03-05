/**
 * Helper utilities for Telegram webhook
 */

/**
 * Check if the incoming chat is admin
 * Handles normalization of chat IDs (removes -100 prefix for comparison)
 */
export function checkIsAdmin(
    incomingChatId: string,
    adminChatId: string,
    groupId?: string | null
): boolean {
    const normalizedIncoming = incomingChatId.replace(/^-100/, '');
    const normalizedAdmin = adminChatId.replace(/^-100/, '');
    const normalizedGroup = groupId ? groupId.replace(/^-100/, '') : null;
    
    return Boolean(
        incomingChatId === adminChatId || 
        incomingChatId === normalizedAdmin ||
        normalizedIncoming === adminChatId ||
        normalizedIncoming === normalizedAdmin ||
        (groupId && (
            incomingChatId === groupId || 
            incomingChatId === normalizedGroup ||
            normalizedIncoming === groupId ||
            normalizedIncoming === normalizedGroup
        ))
    );
}

/**
 * Log webhook debug info
 */
export function logWebhookDebug(info: Record<string, unknown>): void {
    console.log('[Webhook Debug]', info);
}
