// ── Auth ──
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  bio?: string;
  avatar_url?: string;
  gender?: string;
}

export interface LoginRequest {
  credential: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface AuthUserResponse {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  gender: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUserResponse;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

// ── User ──
export interface UserResponse {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  gender: string | null;
  created_at: string;
  follower_count: number;
  following_count: number;
}

export interface ProfileUpdateRequest {
  bio?: string;
  avatar_url?: string;
  gender?: string;
}

// ── Circles ──
export interface CreateCircleRequest {
  name: string;
}

export interface UpdateCircleRequest {
  name: string;
}

export interface AddMembersRequest {
  user_ids: string[];
}

export interface CircleResponse {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  member_count: number;
}

export interface CircleMemberResponse {
  id: string;
  username: string;
  avatar_url: string | null;
  added_at: string;
}

// ── Stories ──
export interface CreateStoryRequest {
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  expires_at: string;
  circle_ids: string[];
}

export interface StoryResponse {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  media_url: string;
  media_type: string;
  caption: string | null;
  expires_at: string;
  is_highlight: boolean;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  viewed: boolean;
  liked: boolean;
}

export interface StoryDetailResponse {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  media_url: string;
  media_type: string;
  caption: string | null;
  expires_at: string;
  is_highlight: boolean;
  created_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

export interface ViewerResponse {
  id: string;
  username: string;
  avatar_url: string | null;
  viewed_at: string;
}

export interface LikeUserResponse {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface AddCommentRequest {
  content: string;
}

export interface CommentResponse {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  content: string;
  created_at: string;
}

// ── Highlights ──
export interface CreateHighlightRequest {
  name: string;
  cover_story_id?: string;
}

export interface AddStoryToHighlightRequest {
  story_id: string;
}

export interface HighlightResponse {
  id: string;
  name: string;
  cover_story_id: string | null;
  story_count: number;
  created_at: string;
}

export interface HighlightDetailResponse {
  id: string;
  name: string;
  cover_story_id: string | null;
  created_at: string;
}

export interface HighlightStoryRow {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
}

export interface HighlightWithStories {
  highlight: HighlightDetailResponse;
  stories: HighlightStoryRow[];
}

// ── Notifications ──
export interface NotificationResponse {
  id: string;
  actor_id: string | null;
  actor_username: string | null;
  notification_type: 'follow' | 'like' | 'comment';
  story_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

// ── User Search ──
export interface UserSearchResult {
  id: string;
  username: string;
  avatar_url: string | null;
}

// ── Generic ──
export interface MessageResponse {
  message: string;
}

export interface LikedResponse {
  liked: boolean;
}

export interface ErrorResponse {
  error: string;
}
