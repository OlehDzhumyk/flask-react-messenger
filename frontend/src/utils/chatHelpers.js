/**
 * Helper to identify the chat partner (the user who is NOT the current user).
 * @param {Object} chat - The chat object from the API.
 * @param {Object} currentUser - The current authenticated user.
 * @returns {Object} The partner user object or a fallback.
 */
export const getChatPartner = (chat, currentUser) => {
    if (!chat || !chat.participants || !currentUser) {
        return { id: 0, username: 'Unknown User', email: '' };
    }

    // Convert to String to avoid type mismatch (1 vs "1")
    const currentUserIdStr = String(currentUser.id);

    const partner = chat.participants.find(
        (p) => String(p.id) !== currentUserIdStr
    );

    return partner || { ...currentUser, username: 'Me (Saved Messages)' };
};