import React, { useState, useRef } from "react";
import ReactCrop from "react-image-crop";

function CropModal({
  isOpen,
  imageSrc,
  onCancel,
  onCropComplete,
  originalName,
}) {
  const [crop, setCrop] = useState({ aspect: 1 });
  const imgRef = useRef(null);

  const getCroppedImage = () => {
    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    canvas.toBlob((blob) => {
      const croppedFile = new File([blob], originalName, {
        type: "image/jpeg",
      });
      onCropComplete(croppedFile);
    }, "image/jpeg");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div
        className="bg-white p-4 rounded-xl shadow-xl"
        style={{
          width: "auto",
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflow: "hidden",
          padding: "20px",
        }}
      >
        <ReactCrop
          crop={crop}
          onChange={setCrop}
          style={{ width: "100%", display: "flex", justifyContent: "center" }}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="crop"
            style={{
              maxWidth: "100%",
              maxHeight: "75vh",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
            }}
          />
        </ReactCrop>

        <div className="flex justify-end gap-4 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition duration-300 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={getCroppedImage}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition  duration-300 cursor-pointer"
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default CropModal;
