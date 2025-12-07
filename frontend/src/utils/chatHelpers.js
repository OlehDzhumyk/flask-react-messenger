/**
 * Helper to find the "other" user in a chat.
 * @param {Object} chat - The chat object (normalized).
 * @param {Object} currentUser - The currently logged-in user.
 * @returns {Object} The partner user object or a placeholder.
 */
export const getChatPartner = (chat, currentUser) => {
    if (!chat || !chat.participants) {
        return { id: 0, username: 'Unknown User' };
    }

    const partner = chat.participants.find(p => p.id !== currentUser?.id);

    return partner || chat.participants[0] || { id: 0, username: 'Unknown' };
};