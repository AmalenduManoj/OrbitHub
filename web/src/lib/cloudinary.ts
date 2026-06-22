const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

export interface UploadResult {
  url: string;
  resource_type: string;
  format: string;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Upload failed' } }));
    throw new Error(err.error?.message || 'Upload failed');
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    resource_type: data.resource_type,
    format: data.format,
  };
}
