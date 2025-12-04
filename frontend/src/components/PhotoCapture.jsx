import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Camera, X, Upload } from 'lucide-react';
import {
  capturePhotoFromInput,
  capturePhotoFromCamera,
  uploadPhotoToStorage,
  createPreviewURL,
  revokePreviewURL,
} from '../utils/photoCapture';

const PhotoCapture = ({
  onPhotoCaptured,
  path = 'tech-photos/',
  maxPhotos = 10,
  required = false,
  label = 'Photos',
  onView,
}) => {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const previewURL = createPreviewURL(file);
      const downloadURL = await uploadPhotoToStorage(file, path);

      const newPhoto = {
        url: downloadURL,
        preview: previewURL,
        file,
      };

      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      onPhotoCaptured?.(updatedPhotos.map((p) => p.url));

      // Clean up preview URL after a delay
      setTimeout(() => revokePreviewURL(previewURL), 1000);
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCameraCapture = async () => {
    // For mobile, trigger file input with camera capture
    // This works better than MediaDevices API on mobile devices
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      // Fallback: try MediaDevices API
      try {
        setUploading(true);
        const blob = await capturePhotoFromCamera();
        const previewURL = createPreviewURL(blob);
        const downloadURL = await uploadPhotoToStorage(blob, path);

        const newPhoto = {
          url: downloadURL,
          preview: previewURL,
          file: blob,
        };

        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        onPhotoCaptured?.(updatedPhotos.map((p) => p.url));

        setTimeout(() => revokePreviewURL(previewURL), 1000);
      } catch (error) {
        console.error('Error capturing from camera:', error);
        alert('Camera not available. Please use file upload instead.');
      } finally {
        setUploading(false);
      }
    }
  };

  const removePhoto = (index) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotoCaptured?.(updatedPhotos.map((p) => p.url));

    // Clean up preview URL
    if (photos[index].preview) {
      revokePreviewURL(photos[index].preview);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
              <img
                src={photo.preview || photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => onView && onView(photo.preview || photo.url)}
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Capture Buttons */}
      {photos.length < maxPhotos && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCameraCapture}
            disabled={uploading}
            className="flex-1"
          >
            <Camera size={16} className="mr-2" />
            {uploading ? 'Uploading...' : 'Camera'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            <Upload size={16} className="mr-2" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {required && photos.length === 0 && (
        <p className="text-xs text-red-600">At least one photo is required</p>
      )}
    </div>
  );
};

export default PhotoCapture;

