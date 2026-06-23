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
      setUploadProgress(30);
      const result = await uploadFile(file);
      setUploadProgress(80);

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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-elevated/80 backdrop-blur-2xl w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-base font-semibold text-white">New Story</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-hover transition-all duration-150 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-20 sm:pb-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 text-red-200 text-sm rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* File picker / preview */}
          <div>
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden bg-bg-base group">
                {file?.type.startsWith('video/') ? (
                  <video src={preview} className="w-full max-h-64 object-contain" controls />
                ) : (
                  <img src={preview} alt="" className="w-full max-h-64 object-contain" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-150" />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 hover:bg-red-500/80"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-[#2C2C2E] bg-bg-base/50 hover:bg-bg-base hover:border-primary/50 transition-all duration-150 flex flex-col items-center justify-center gap-3 py-10 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-150">
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-text-primary">Choose photo or video</p>
                  <p className="text-xs text-text-muted mt-0.5">Tap to browse files</p>
                </div>
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
            <input
              id="caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-0 py-2 bg-transparent border-0 border-b border-[#2C2C2E] text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-primary transition-all duration-150"
              placeholder="Add a caption…"
              maxLength={500}
            />
          </div>

          {/* Expiry */}
          <div>
            <label htmlFor="expires_at" className="label block mb-2 text-text-muted">
              Expires at
            </label>
            <input
              id="expires_at"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-bg-base border border-[#2C2C2E] text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150"
            />
          </div>

          {/* Circle picker */}
          <CirclePicker circles={circles} selected={selectedCircles} onChange={setSelectedCircles} />

          {/* Progress bar */}
          {uploading && (
            <div className="w-full bg-bg-base rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent-lavender rounded-full transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
                Post Story
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
