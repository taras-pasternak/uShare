import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose }) => {
    const [visible, setVisible] = useState(isVisible);

    useEffect(() => {
        setVisible(isVisible);
        if (isVisible) {
            const timer = setTimeout(() => {
                setVisible(false);
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!visible) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-lg z-50 transition-opacity duration-300 animate-in fade-in slide-in-from-top-2">
            <p className="font-['Inter_Tight',sans-serif] font-medium text-sm">
                {message}
            </p>
        </div>
    );
};
