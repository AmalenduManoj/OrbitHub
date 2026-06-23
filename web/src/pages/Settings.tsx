import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/users';
import { uploadFile } from '../lib/cloudinary';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);

    try {
      let finalAvatar = avatarUrl || undefined;

      if (avatarFile) {
        setUploading(true);
        const result = await uploadFile(avatarFile);
        finalAvatar = result.url;
        setUploading(false);
      }

      await updateProfile({
        bio: bio || undefined,
        avatar_url: finalAvatar,
        gender: gender || undefined,
      });

      setAvatarUrl(finalAvatar || '');
      setAvatarFile(null);
      setAvatarPreview(null);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update profile';
      setError(msg);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const displayUrl = avatarPreview || avatarUrl;

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-4">Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-200 text-sm rounded-xl px-4 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/40 border border-green-500/50 text-green-200 text-sm rounded-xl px-4 py-2">
            Profile updated!
          </div>
        )}

        {/* Avatar upload */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Avatar
          </label>
          <div className="flex items-center gap-4">
            {displayUrl ? (
              <img src={displayUrl} alt="" className="w-16 h-16 rounded-full object-cover ring-1 ring-primary/40" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center text-xl font-semibold text-white">
                {user?.username[0]?.toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-bg-hover border border-gray-700 text-text-secondary text-sm hover:border-primary hover:text-primary transition-all duration-150"
            >
              {displayUrl ? 'Change' : 'Upload'}
            </button>
            {displayUrl && (
              <button
                type="button"
                onClick={() => { setAvatarFile(null); setAvatarPreview(null); setAvatarUrl(''); }}
                className="text-sm text-text-muted hover:text-red-400 transition-all duration-150"
              >
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-text-secondary mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl bg-bg-card border border-gray-700 text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            placeholder="Tell us about yourself"
          />
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-text-secondary mb-1">
            Gender <span className="text-text-muted">(optional)</span>
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-card border border-gray-700 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Upload progress */}
        {uploading && (
          <div className="w-full bg-bg-base rounded-full h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all duration-150 disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-800">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full py-3 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-900/20 font-medium transition-all duration-150"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
