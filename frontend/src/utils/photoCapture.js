import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Capture photo from device camera or file input
 * @param {HTMLInputElement} input - File input element
 * @returns {Promise<File>} - Selected file
 */
export const capturePhotoFromInput = (input) => {
  return new Promise((resolve, reject) => {
    if (!input.files || input.files.length === 0) {
      reject(new Error('No file selected'));
      return;
    }
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }
    resolve(file);
  });
};

/**
 * Capture photo from device camera using MediaDevices API
 * Note: This opens a video stream. For actual capture, use file input with capture attribute
 * @returns {Promise<Blob>} - Captured image blob
 */
export const capturePhotoFromCamera = () => {
  return new Promise((resolve, reject) => {
    // For mobile devices, it's better to use file input with capture attribute
    // This function is a fallback that opens camera stream
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      reject(new Error('Camera not available. Please use file upload with camera option.'));
      return;
    }

    // Create a temporary video element
    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        video.srcObject = stream;
        video.play();

        // Wait for video to be ready
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop());

          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to capture image'));
            }
          }, 'image/jpeg', 0.9);
        });

        video.addEventListener('error', (e) => {
          stream.getTracks().forEach((track) => track.stop());
          reject(new Error('Video error: ' + e.message));
        });
      })
      .catch((error) => {
        reject(new Error('Camera access denied or not available: ' + error.message));
      });
  });
};

/**
 * Upload photo to Firebase Storage
 * @param {File|Blob} file - Image file or blob
 * @param {string} path - Storage path (e.g., 'tech-photos/jsa/')
 * @param {string} filename - Filename (optional, will generate if not provided)
 * @returns {Promise<string>} - Download URL
 */
export const uploadPhotoToStorage = async (file, path, filename = null) => {
  try {
    const timestamp = Date.now();
    const name = filename || `photo_${timestamp}.jpg`;
    const storageRef = ref(storage, `${path}${name}`);

    // Convert blob to File if needed
    const fileToUpload = file instanceof File ? file : new File([file], name, { type: 'image/jpeg' });

    await uploadBytes(storageRef, fileToUpload);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

/**
 * Create a preview URL from a file/blob
 * @param {File|Blob} file - Image file or blob
 * @returns {string} - Object URL for preview
 */
export const createPreviewURL = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke preview URL to free memory
 * @param {string} url - Object URL to revoke
 */
export const revokePreviewURL = (url) => {
  URL.revokeObjectURL(url);
};

