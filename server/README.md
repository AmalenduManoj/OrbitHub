# Orbit — Server

Privacy-first social platform. Share stories with the right people, without revealing the audience.

## Tech Stack

- **Runtime:** Rust + Actix Web
- **Database:** PostgreSQL (via sqlx)
- **Cache:** Redis
- **Auth:** JWT (HS256, access + refresh token rotation)
- **Password Hashing:** Argon2

## Setup

1. **Prerequisites** — Rust, PostgreSQL, Redis

2. **Configure environment**
   ```bash
   cp .env .env.local   # edit database URL, Redis URL, JWT secret
   ```

3. **Run**
   ```bash
   cargo run
   ```

   Server starts on `http://0.0.0.0:8080`.

## API

### Auth

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | No | `{ username, email, password, bio?, avatar_url?, gender? }` | `{ access_token, refresh_token, user }` |
| POST | `/auth/login` | No | `{ credential, password }` (email or username) | `{ access_token, refresh_token, user }` |
| POST | `/auth/refresh` | No | `{ refresh_token }` | `{ access_token, refresh_token }` |

### User

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/user/{id}` | No | — | User profile with follower/following counts |
| PATCH | `/user/profile` | Yes | `{ bio?, avatar_url?, gender? }` | Updated user profile |
| POST | `/user/{id}/follow` | Yes | — | — |
| DELETE | `/user/{id}/follow` | Yes | — | — |

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
└── user/
    ├── handler.rs    # User endpoint handlers
    ├── service.rs    # Profile CRUD, follow/unfollow
    └── models.rs     # UserResponse, ProfileUpdateRequest
```

## Design Decisions

- **PostgreSQL over MongoDB** — relational data model (users ↔ circles ↔ stories ↔ views), ACID transactions, Row-Level Security
- **Separate `users` and `profiles` tables** — auth reads stay lean, profile is optional/updateable
- **Refresh token rotation** — stored in Redis, old token invalidated on each refresh
- **Login via email or username** — single `credential` field, query matches `email OR username`
