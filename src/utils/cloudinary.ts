export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = 'rohm5jjc';
  const apiKey = '456348674973912';
  const apiSecret = 'ZQdKh90MBm9Uhl6_MEk08pUs7bc';

  const timestamp = Math.round(new Date().getTime() / 1000).toString();
  const signatureString = `timestamp=${timestamp}${apiSecret}`;

  // Calculate SHA-1 hash
  const msgBuffer = new TextEncoder().encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
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
