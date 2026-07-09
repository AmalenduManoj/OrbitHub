import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProfile, follow, unfollow, getFollowers, getFollowing } from '../api/users';
import { useAuth } from '../context/AuthContext';
import type { UserResponse, UserSearchResult } from '../types';
import UserListSheet from '../components/UserListSheet';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  // Followers / Following sheets
  const [showFollowers, setShowFollowers] = useState(false);
  const [followers, setFollowers] = useState<UserSearchResult[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [following, setFollowing] = useState<UserSearchResult[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const isOwnProfile = me && profile && me.id === profile.id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    setFollowers([]);
    setFollowing([]);
    getProfile(id)
      .then((data) => {
        setProfile(data);
        if (me) {
          getFollowers(id)
            .then((list) => setIsFollowing(list.some((u) => u.id === me.id)))
            .catch(() => {});
        }
      })
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false));
  }, [id, me]);

  useEffect(() => {
    if (!me) return;
    getFollowing(me.id)
      .then((list) => setFollowingIds(new Set(list.map((u) => u.id))))
      .catch(() => {});
  }, [me]);

  const syncFollowingIds = useCallback((userId: string, nowFollowing: boolean) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (nowFollowing) next.add(userId);
      else next.delete(userId);
      return next;
    });
  }, []);

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (isFollowing) {
        await unfollow(profile.id);
        setIsFollowing(false);
        syncFollowingIds(profile.id, false);
        setProfile((p) => p ? { ...p, follower_count: p.follower_count - 1 } : p);
      } else {
        await follow(profile.id);
        setIsFollowing(true);
        syncFollowingIds(profile.id, true);
        setProfile((p) => p ? { ...p, follower_count: p.follower_count + 1 } : p);
      }
    } catch {}
  };

  const handleToggleFollowInList = useCallback(async (userId: string) => {
    try {
      if (followingIds.has(userId)) {
        await unfollow(userId);
        syncFollowingIds(userId, false);
      } else {
        await follow(userId);
        syncFollowingIds(userId, true);
      }
    } catch {}
  }, [followingIds, syncFollowingIds]);

  const openFollowers = useCallback(async () => {
    if (followers.length === 0 && id) {
      setFollowersLoading(true);
      try {
        const data = await getFollowers(id);
        setFollowers(data);
      } catch {} finally {
        setFollowersLoading(false);
      }
    }
    setShowFollowers(true);
  }, [followers.length, id]);

  const openFollowing = useCallback(async () => {
    if (following.length === 0 && id) {
      setFollowingLoading(true);
      try {
        const data = await getFollowing(id);
        setFollowing(data);
      } catch {} finally {
        setFollowingLoading(false);
      }
    }
    setShowFollowing(true);
  }, [following.length, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-[1.5px] border-primary border-t-transparent rounded-full" />
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
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition-all duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {/* Profile card */}
      <div className="bg-bg-card rounded-2xl p-7 text-center">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full mx-auto mb-3 ring-1 ring-primary/40" />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-primary/15 ring-1 ring-primary/40 flex items-center justify-center text-2xl font-semibold text-white">
            {profile.username[0]?.toUpperCase()}
          </div>
        )}

        <h1 className="text-xl font-bold text-white">{profile.username}</h1>
        {profile.bio && <p className="text-sm text-text-secondary mt-1">{profile.bio}</p>}
        {profile.link_url && (
          <a
            href={profile.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {profile.link_url}
          </a>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <button onClick={openFollowers} className="text-center hover:opacity-80 transition-all duration-150">
            <p className="text-lg font-semibold text-white">{profile.follower_count}</p>
            <p className="text-xs text-text-muted">Followers</p>
          </button>
          <button onClick={openFollowing} className="text-center hover:opacity-80 transition-all duration-150">
            <p className="text-lg font-semibold text-white">{profile.following_count}</p>
            <p className="text-xs text-text-muted">Following</p>
          </button>
        </div>

        {/* Follow / Edit */}
        {!isOwnProfile ? (
          <button
            onClick={handleFollow}
            className={`mt-4 px-6 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
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
            className="mt-4 px-6 py-2 rounded-xl bg-bg-hover text-text-secondary border border-gray-700 text-sm font-medium hover:border-primary hover:text-primary transition-all duration-150"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Followers sheet */}
      <UserListSheet
        open={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="Followers"
        users={followers}
        renderAction={(u) =>
          me && u.id !== me.id ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleFollowInList(u.id); }}
              className={`shrink-0 ml-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                followingIds.has(u.id)
                  ? 'bg-bg-hover text-text-secondary border border-gray-700 hover:border-red-500 hover:text-red-400'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              {followingIds.has(u.id) ? 'Following' : 'Follow'}
            </button>
          ) : null
        }
      />

      {/* Following sheet */}
      <UserListSheet
        open={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="Following"
        users={following}
        renderAction={(u) =>
          me && u.id !== me.id ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleFollowInList(u.id); }}
              className={`shrink-0 ml-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                followingIds.has(u.id)
                  ? 'bg-bg-hover text-text-secondary border border-gray-700 hover:border-red-500 hover:text-red-400'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              {followingIds.has(u.id) ? 'Following' : 'Follow'}
            </button>
          ) : null
        }
      />
    </div>
  );
}
