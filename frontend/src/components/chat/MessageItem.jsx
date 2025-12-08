import { useState } from 'react';
import PropTypes from 'prop-types';

const MessageItem = ({ message, isOwn, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(message.content);
    const [showMenu, setShowMenu] = useState(false);

    const handleSave = () => {
        if (editedContent.trim() !== message.content) {
            onEdit(message.id, editedContent);
        }
        setIsEditing(false);
        setShowMenu(false);
    };

    const handleCancel = () => {
        setEditedContent(message.content);
        setIsEditing(false);
        setShowMenu(false);
    };

    const handleDelete = () => {
        // Simple confirm for MVP
        if (window.confirm('Are you sure you want to delete this message?')) {
            onDelete(message.id);
        }
    };

    return (
        <div
            className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => setShowMenu(false)}
        >
            <div className={`relative max-w-[70%] group flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>

                {/* Actions Menu (Visible only on hover for own messages) */}
                {isOwn && !isEditing && (
                    <div className={`flex gap-1 transition-opacity duration-200 ${showMenu ? 'opacity-100' : 'opacity-0'}`}>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 text-gray-400 hover:text-blue-600 bg-gray-100 rounded-full"
                            title="Edit"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1 text-gray-400 hover:text-red-600 bg-gray-100 rounded-full"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                )}

                {/* Message Bubble */}
                <div className={`
                    p-3 rounded-2xl shadow-sm text-sm relative break-words
                    ${isOwn
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}
                `}>
                    {isEditing ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full p-2 text-gray-800 bg-white rounded border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-sm"
                                rows="2"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={handleCancel} className="text-xs text-blue-100 hover:text-white underline">Cancel</button>
                                <button onClick={handleSave} className="text-xs bg-white text-blue-600 px-2 py-1 rounded font-bold hover:bg-gray-100">Save</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                            <div className={`text-[10px] mt-1 text-right ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {/* Add (edited) label if needed, assuming backend sends an edited_at flag */}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

MessageItem.propTypes = {
    message: PropTypes.object.isRequired,
    isOwn: PropTypes.bool.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default MessageItem;