import React from 'react';

const ImageModal = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-[90vh] p-4 transform transition-transform duration-300 ease-in-out animate-zoomIn">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-gray-800 bg-opacity-70 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 z-10"
        >
          ✕
        </button>
        <img
          src={imageUrl}
          alt="Document Preview"
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ImageModal;
