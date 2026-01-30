import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
    selectedImage: string | null;
    onClose: () => void;
}

const ImageModal = ({ selectedImage, onClose }: ImageModalProps) => {
    // Close modal on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!selectedImage) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <button 
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                onClick={onClose}
            >
                <X size={24} />
            </button>
            <img 
                src={selectedImage} 
                alt="Full screen preview" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
            />
        </div>
    );
};

export default ImageModal;
