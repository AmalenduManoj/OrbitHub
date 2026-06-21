# Orbit 🌌

> Share stories with the right people, without revealing the audience.

Orbit is a privacy-first social platform focused entirely on stories. Unlike traditional social media, Orbit lets users create invisible audience groups and share stories only with selected people. Viewers can see the story, but they never know who else received it or which group they belong to.

## ✨ The Idea

Current social platforms force users to choose between:
- Public sharing
- Close Friends lists
- Private accounts

Orbit introduces **Invisible Circles**.

When you share a story:
- Only you know who can see it.
- Viewers don't know who else received the story.
- Viewers don't know whether they are part of a group.
- No public follower pressure.
- No audience lists.

It feels personal for every viewer.

---

## 🚀 Features (MVP)

### Stories
- Upload photos and videos
- 24-hour expiration
- Story views
- Story reactions

### Invisible Circles
- Create custom audience groups
- Add and remove members
- Share stories to one or multiple circles
- Members cannot see circle names or members

### Privacy First
- Hidden audience lists
- No visible follower counts
- No public likes
- Optional screenshot detection

### Profile
- Username
- Bio
- Profile picture
- Private/Public account options

---

## 🎯 Problem

People behave differently with:
- Friends
- Family
- College classmates
- Coworkers

Existing social media makes audience management visible and complicated.

Orbit allows users to share naturally with different groups while keeping audience segmentation completely private.

---

## 💡 Example

You create three circles:

- Family
- College Friends
- Work

You post a story to "College Friends".

A viewer sees:
- The story
- Reactions

A viewer does **not** see:
- Circle name
- Circle members
- Number of recipients
- Other viewers

---

## 🏗️ Tech Stack

### Frontend
- React / Next.js
- Tailwind CSS

### Backend
- Rust
- Actix Web

### Database
- MongoDB

### Cache
- Redis

### Storage
- AWS S3 / Cloudflare R2

### Authentication
- JWT
- OAuth (Google)

---

## 📐 High-Level Architecture

```text
Client
   │
   ▼
API Gateway
   │
   ▼
Actix Web Backend
   │
   ├── MongoDB
   ├── Redis
   ├── Object Storage
   └── Notification Service
```

---

## 🔒 Privacy Principles

Orbit is built around a simple rule:

> The creator controls the audience. The audience doesn't know the audience.

This creates a safer and more personal sharing experience.

---

## 📅 Roadmap

### Phase 1
- [ ] Authentication
- [ ] User Profiles
- [ ] Story Upload
- [ ] Story Viewing
- [ ] Invisible Circles

### Phase 2
- [ ] Story Reactions
- [ ] Push Notifications
- [ ] Video Stories
- [ ] Story Analytics

### Phase 3
- [ ] AI Circle Suggestions
- [ ] Collaborative Stories
- [ ] Event-Based Circles
- [ ] Web Application

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

## 📜 License

MIT License

---

Built with ❤️ for private social sharing.
