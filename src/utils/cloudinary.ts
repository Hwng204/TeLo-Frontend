import { api } from '../services/api';

export const uploadToCloudinary = async (file: File): Promise<string> => {
  // Get signature from backend
  const signatureData = await api.media.signature();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.apiKey);
  formData.append('timestamp', signatureData.timestamp);
  formData.append('signature', signatureData.signature);

  // Upload directly to Cloudinary
  const response = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Lỗi khi upload ảnh');
  }

  const data = await response.json();
  return data.secure_url;
};
