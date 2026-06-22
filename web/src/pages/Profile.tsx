import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfile, follow, unfollow } from '../api/users';
import { useAuth } from '../context/AuthContext';
import type { UserResponse } from '../types';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = me && profile && me.id === profile.id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    getProfile(id)
      .then(setProfile)
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (isFollowing) {
        await unfollow(profile.id);
        setIsFollowing(false);
        setProfile((p) => p ? { ...p, follower_count: p.follower_count - 1 } : p);
      } else {
        await follow(profile.id);
        setIsFollowing(true);
        setProfile((p) => p ? { ...p, follower_count: p.follower_count + 1 } : p);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-text-muted">{error || 'User not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition"
        >
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      {!isOwnProfile && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {/* Profile card */}
      <div className="bg-bg-card rounded-xl p-6 border border-gray-800 text-center">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 ring-2 ring-primary/60" />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-primary/30 ring-2 ring-primary/60 flex items-center justify-center text-2xl font-bold text-white">
            {profile.username[0]?.toUpperCase()}
          </div>
        )}

        <h1 className="text-xl font-bold text-white">{profile.username}</h1>
        {profile.bio && <p className="text-sm text-text-secondary mt-1">{profile.bio}</p>}

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div>
            <p className="text-lg font-bold text-white">{profile.follower_count}</p>
            <p className="text-xs text-text-muted">Followers</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{profile.following_count}</p>
            <p className="text-xs text-text-muted">Following</p>
          </div>
        </div>

        {/* Follow / Edit */}
        {!isOwnProfile ? (
          <button
            onClick={handleFollow}
            className={`mt-4 px-6 py-2 rounded-lg text-sm font-medium transition ${
              isFollowing
                ? 'bg-bg-hover text-text-secondary border border-gray-700 hover:border-red-500 hover:text-red-400'
                : 'bg-primary hover:bg-primary-hover text-white'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/settings')}
            className="mt-4 px-6 py-2 rounded-lg bg-bg-hover text-text-secondary border border-gray-700 text-sm font-medium hover:border-primary hover:text-primary transition"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
