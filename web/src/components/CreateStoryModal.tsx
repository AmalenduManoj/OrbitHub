import { useState, useEffect, useRef } from 'react';
import { listCircles } from '../api/circles';
import { createStory } from '../api/stories';
import { uploadFile } from '../lib/cloudinary';
import type { CircleResponse } from '../types';
import CirclePicker from './CirclePicker';

interface CreateStoryModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateStoryModal({ open, onClose, onCreated }: CreateStoryModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [circles, setCircles] = useState<CircleResponse[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      listCircles().then(setCircles).catch(() => {});
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setExpiresAt(tomorrow.toISOString().slice(0, 16));
      setFile(null);
      setPreview(null);
      setUploadProgress(0);
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Select a photo or video');
      return;
    }
    if (selectedCircles.length === 0) {
      setError('Select at least one circle');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Step 1: upload to Cloudinary
      setUploadProgress(30);
      const result = await uploadFile(file);
      setUploadProgress(80);

      // Step 2: create story with returned URL
      await createStory({
        media_url: result.url,
        media_type: result.resource_type === 'video' ? 'video' : 'image',
        caption: caption.trim() || undefined,
        expires_at: new Date(expiresAt).toISOString(),
        circle_ids: selectedCircles,
      });

      setUploadProgress(100);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response: { data: { error?: string } } }).response?.data?.error || 'Failed to create story'
          : err instanceof Error
            ? err.message
            : 'Failed to create story';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-elevated w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[#2C2C2E]">
          <button onClick={onClose} disabled={uploading} className="text-text-secondary hover:text-text-primary transition-all duration-150 text-sm disabled:opacity-50">
            Cancel
          </button>
          <h2 className="font-semibold text-white">New Story</h2>
          <div className="w-12" />
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {/* File picker / preview */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Photo or Video
            </label>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden bg-bg-base mb-2">
                {file?.type.startsWith('video/') ? (
                  <video src={preview} className="w-full max-h-60 object-contain" controls />
                ) : (
                  <img src={preview} alt="" className="w-full max-h-60 object-contain" />
                )}
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-40 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary transition-all duration-150"
              >
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Tap to select</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Caption */}
          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-text-secondary mb-1">
              Caption <span className="text-text-muted">(optional)</span>
            </label>
            <input
              id="caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-bg-base border border-gray-700 text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="What's on your mind?"
              maxLength={500}
            />
          </div>

          {/* Expiry */}
          <div>
            <label htmlFor="expires_at" className="block text-sm font-medium text-text-secondary mb-1">
              Expires at
            </label>
            <input
              id="expires_at"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-bg-base border border-gray-700 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Circle picker */}
          <CirclePicker circles={circles} selected={selectedCircles} onChange={setSelectedCircles} />

          {/* Progress bar */}
          {uploading && (
            <div className="w-full bg-bg-base rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-150 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : 'Post Story'}
          </button>
        </form>
      </div>
    </div>
  );
}
