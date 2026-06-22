# Orbit — Server

Privacy-first social platform. Share stories with the right people, without revealing the audience.

## Tech Stack

- **Runtime:** Rust + Actix Web
- **Database:** PostgreSQL (via sqlx, session pooler)
- **Cache:** Redis
- **Auth:** JWT (HS256, access + refresh token rotation)
- **Password Hashing:** Argon2

## Setup

1. **Prerequisites** — Rust, PostgreSQL (session pool), Redis

2. **Configure environment**
   ```bash
   cp .env.example .env   # edit database URL, Redis URL, JWT secret
   ```

3. **Run**
   ```bash
   cargo run
   ```

   Server starts on `http://0.0.0.0:8081`.

## API

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create account with username, email, password + optional bio/avatar_url/gender |
| POST | `/auth/login` | No | Login with email or username |
| POST | `/auth/refresh` | No | Rotate refresh token |

**Register:**
```bash
curl -X POST http://localhost:8081/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","password":"pass123"}'
```

**Login:**
```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"credential":"alice@test.com","password":"pass123"}'
```

**Refresh:**
```bash
curl -X POST http://localhost:8081/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<token>"}'
```

### User

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/user/{id}` | No | Public profile with follower/following counts |
| PATCH | `/user/profile` | ✅ | Update bio, avatar_url, gender |
| POST | `/user/{id}/follow` | ✅ | Follow a user |
| DELETE | `/user/{id}/follow` | ✅ | Unfollow a user |

**Get profile:**
```bash
curl http://localhost:8081/user/<user_id>
```

**Update profile:**
```bash
curl -X PATCH http://localhost:8081/user/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"bio":"Hello world","gender":"other"}'
```

**Follow:**
```bash
curl -X POST http://localhost:8081/user/<target_id>/follow \
  -H "Authorization: Bearer <access_token>"
```

**Unfollow:**
```bash
curl -X DELETE http://localhost:8081/user/<target_id>/follow \
  -H "Authorization: Bearer <access_token>"
```

### Circles

All circles endpoints require authentication. Owner-only operations return 404 if the user is not the owner. Members can only be added if they follow the circle owner.

| Method | Path | Auth | Owner Only | Description |
|---|---|---|---|---|
| POST | `/circles` | ✅ | — | Create a circle |
| GET | `/circles` | ✅ | — | List your circles |
| GET | `/circles/{id}` | ✅ | ✅ | Circle detail + member count |
| PATCH | `/circles/{id}` | ✅ | ✅ | Rename circle |
| DELETE | `/circles/{id}` | ✅ | ✅ | Delete circle |
| POST | `/circles/{id}/members` | ✅ | ✅ | Add members (must follow you) |
| GET | `/circles/{id}/members` | ✅ | ✅ | List members |
| DELETE | `/circles/{id}/members/{user_id}` | ✅ | ✅ | Remove member |

**Create a circle:**
```bash
curl -X POST http://localhost:8081/circles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"College Friends"}'
```

**List your circles:**
```bash
curl http://localhost:8081/circles \
  -H "Authorization: Bearer <access_token>"
```

**Get circle details:**
```bash
curl http://localhost:8081/circles/<circle_id> \
  -H "Authorization: Bearer <access_token>"
```

**Rename circle:**
```bash
curl -X PATCH http://localhost:8081/circles/<circle_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"New Name"}'
```

**Delete circle:**
```bash
curl -X DELETE http://localhost:8081/circles/<circle_id> \
  -H "Authorization: Bearer <access_token>"
```

**Add members (only users who follow you can be added):**
```bash
curl -X POST http://localhost:8081/circles/<circle_id>/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"user_ids": ["<user_uuid_1>", "<user_uuid_2>"]}'
```

**List members:**
```bash
curl http://localhost:8081/circles/<circle_id>/members \
  -H "Authorization: Bearer <access_token>"
```

**Remove member:**
```bash
curl -X DELETE http://localhost:8081/circles/<circle_id>/members/<user_id> \
  -H "Authorization: Bearer <access_token>"
```

### Stories

All stories endpoints require authentication. Comments are private — owner sees all, others see only their own.

| Method | Path | Auth | Owner Only | Description |
|---|---|---|---|---|
| POST | `/stories` | ✅ | — | Create story `{ media_url, media_type, caption?, expires_at, circle_ids[] }` |
| GET | `/stories/feed` | ✅ | — | View active stories from circles you're in |
| GET | `/stories/{id}` | ✅ | — | View a single story |
| DELETE | `/stories/{id}` | ✅ | ✅ | Delete own story |
| POST | `/stories/{id}/view` | ✅ | — | Register a view (idempotent) |
| GET | `/stories/{id}/views` | ✅ | ✅ | Who viewed |
| POST | `/stories/{id}/like` | ✅ | — | Toggle like |
| GET | `/stories/{id}/likes` | ✅ | ✅ | Who liked |
| POST | `/stories/{id}/comments` | ✅ | — | Add comment |
| GET | `/stories/{id}/comments` | ✅ | — | Owner sees all; others see own |
| DELETE | `/stories/{id}/comments/{comment_id}` | ✅ | ✅ | Owner or comment author |

**Create story:**
```bash
curl -X POST http://localhost:8081/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"media_url":"https://example.com/photo.jpg","media_type":"image","caption":"My day","expires_at":"2026-06-25T00:00:00Z","circle_ids":["<circle_id>"]}'
```

**View feed:**
```bash
curl http://localhost:8081/stories/feed \
  -H "Authorization: Bearer <access_token>"
```

**View story:**
```bash
curl http://localhost:8081/stories/<story_id> \
  -H "Authorization: Bearer <access_token>"
```

**Register view:**
```bash
curl -X POST http://localhost:8081/stories/<story_id>/view \
  -H "Authorization: Bearer <access_token>"
```

**Toggle like:**
```bash
curl -X POST http://localhost:8081/stories/<story_id>/like \
  -H "Authorization: Bearer <access_token>"
```

**Add comment:**
```bash
curl -X POST http://localhost:8081/stories/<story_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"content":"Nice photo!"}'
```

**Get comments:**
```bash
curl http://localhost:8081/stories/<story_id>/comments \
  -H "Authorization: Bearer <access_token>"
```

### Highlights

| Method | Path | Auth | Owner Only | Description |
|---|---|---|---|---|
| POST | `/highlights` | ✅ | — | Create collection `{ name, cover_story_id? }` |
| GET | `/highlights` | ✅ | — | List your highlights |
| GET | `/highlights/{id}` | ✅ | — | Get highlight with stories |
| DELETE | `/highlights/{id}` | ✅ | ✅ | Delete highlight |
| POST | `/highlights/{id}/stories` | ✅ | ✅ | Add story to highlight |
| DELETE | `/highlights/{id}/stories/{story_id}` | ✅ | ✅ | Remove from highlight |

**Create highlight:**
```bash
curl -X POST http://localhost:8081/highlights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"Best of 2026","cover_story_id":"<story_id>"}'
```

**Add story to highlight:**
```bash
curl -X POST http://localhost:8081/highlights/<highlight_id>/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"story_id":"<story_id>"}'
```

**Get highlight with stories:**
```bash
curl http://localhost:8081/highlights/<highlight_id> \
  -H "Authorization: Bearer <access_token>"
```

## Project Structure

```
src/
├── main.rs           # App bootstrap, server start
├── config.rs         # Environment-based config
├── error.rs          # AppError enum → HTTP responses
├── db/
│   └── db.rs         # Pool init + sqlx migrations
├── auth/
│   ├── handler.rs    # Auth endpoint handlers
│   ├── service.rs    # Password hashing, JWT operations
│   ├── middleware.rs  # JWT extraction / guard
│   └── models.rs     # Request/response types, Claims
├── user/
│   ├── handler.rs    # User endpoint handlers
│   ├── service.rs    # Profile CRUD, follow/unfollow
│   └── models.rs     # UserResponse, ProfileUpdateRequest
├── circles/
│   ├── handler.rs    # Circle endpoint handlers
│   ├── service.rs    # Circle CRUD, member management
│   └── models.rs     # Circle request/response types
└── stories/
    ├── handler.rs    # Story & highlight endpoint handlers
    ├── service.rs    # Story CRUD, visibility, likes, comments, highlights
    └── models.rs     # Story, comment, highlight request/response types
```

## Design Decisions

- **PostgreSQL over MongoDB** — relational data model (users ↔ circles ↔ stories ↔ views), ACID transactions
- **Separate `users` and `profiles` tables** — auth reads stay lean, profile is optional/updateable
- **Refresh token rotation** — stored in Redis, old token invalidated on each refresh
- **Login via email or username** — single `credential` field, query matches `email OR username`
- **Session pooler (port 5432)** — avoids PgBouncer prepared statement conflicts from transaction pooler
- **Follow-gated circles** — can only add users who follow you, preventing spam
- **Private comments** — story owner sees all comments, viewers only see their own
- **Highlights override expiry** — stories added to highlights persist regardless of `expires_at`
- **Custom expiry** — stories accept a custom `expires_at` timestamp (not just presets)
