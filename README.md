# MediaHub — Campus Event & Media Management Platform

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)

---

## Overview

MediaHub is a centralized Event & Media Management Platform designed for campus clubs and societies. It allows photographers and organizers to upload event media and manage it efficiently, with social features, AI-powered tagging, facial recognition, and real-time notifications.

---

## Features

### Core Features
- **Club Management** — Create clubs, invite members with secret codes, assign roles
- **Event Organization** — Create events tied to clubs, organize into albums
- **Media Upload** — Drag and drop, bulk upload, preview before upload, auto compression
- **Access Control** — Public/private events and albums, role-based permissions
- **Social Features** — Like, comment, share, download, favourites, tag friends
- **Real-time Notifications** — Instant notifications via Pusher for likes, comments, tags
- **AI Auto-tagging** — AWS Rekognition automatically tags uploaded photos
- **Facial Recognition** — Upload a selfie to find all photos containing your face
- **Advanced Search** — Search by tag, event name, club, album, or username
- **QR Code Sharing** — Generate QR codes for any album or club
- **Watermarking** — Auto watermark on every download (club name + event name)
- **Infinite Scroll** — Smooth infinite scroll gallery on all media pages

### Bonus Features
- User profile pages with media galleries
- Separate tagged photos page
- Edit AI-generated tags manually
- Mobile responsive with hamburger menu
- Dark theme UI

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript |
| Database | MongoDB (Atlas) + Mongoose |
| Auth | NextAuth.js v5 (JWT) |
| Media Storage | Cloudinary |
| AI Tagging | AWS Rekognition |
| Facial Recognition | AWS Rekognition |
| Real-time | Pusher Channels |
| Styling | Tailwind CSS v4 |
| QR Codes | qrcode |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- AWS account (free tier)
- Pusher account (free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/campus-media-hub.git
cd campus-media-hub

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Fill in your credentials in .env

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/"

# NextAuth
AUTH_SECRET="your-random-secret-run-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"

# AWS Rekognition
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_REGION="us-east-1"

# Pusher
PUSHER_APP_ID="your_app_id"
PUSHER_KEY="your_key"
PUSHER_SECRET="your_secret"
PUSHER_CLUSTER="your_cluster"
NEXT_PUBLIC_PUSHER_KEY="your_key"
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster"
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.js
│   │   └── register/page.js
│   ├── (dashboard)/
│   │   ├── albums/[id]/page.js
│   │   ├── clubs/page.js
│   │   ├── clubs/[id]/page.js
│   │   ├── dashboard/page.js
│   │   ├── events/page.js
│   │   ├── events/new/page.js
│   │   ├── events/[id]/page.js
│   │   ├── facial-recognition/page.js
│   │   ├── favourites/page.js
│   │   ├── my-photos/page.js
│   │   ├── profile/[id]/page.js
│   │   ├── search/page.js
│   │   ├── tagged/page.js
│   │   └── upload/page.js
│   ├── api/
│   │   ├── auth/
│   │   ├── albums/
│   │   ├── clubs/
│   │   ├── comments/
│   │   ├── events/
│   │   ├── facial-recognition/
│   │   ├── favourites/
│   │   ├── likes/
│   │   ├── media/
│   │   ├── notifications/
│   │   ├── qr/
│   │   ├── search/
│   │   ├── tags/
│   │   └── users/
│   ├── layout.js
│   └── page.js
├── components/
│   ├── auth/SessionProvider.js
│   └── ui/
│       ├── EditTags.js
│       ├── Navbar.js
│       ├── NotificationBell.js
│       ├── QRModal.js
│       ├── SearchBar.js
│       ├── ShareModal.js
│       └── TagPeople.js
├── hooks/
│   └── useInfiniteScroll.js
├── lib/
│   ├── auth.js
│   ├── cloudinary.js
│   ├── clubAuth.js
│   ├── download.js
│   ├── mongodb.js
│   ├── pusherClient.js
│   ├── pusherServer.js
│   ├── rekognition.js
│   └── utils.js
└── models/
    ├── Album.js
    ├── Club.js
    ├── Comment.js
    ├── Event.js
    ├── Like.js
    ├── Media.js
    ├── Notification.js
    └── User.js
```

---

## Database Schema

### User
```
_id, name, email, password, image, role (USER/SUPER_ADMIN), createdAt, updatedAt
```

### Club
```
_id, name, description, category, logo, isActive, createdBy (ref: User),
memberCode, photographerCode,
members: [{ user (ref: User), role (ADMIN/PHOTOGRAPHER/CLUB_MEMBER), joinedAt }],
createdAt, updatedAt
```

### Event
```
_id, name, description, category, date, isPublic, coverImage,
club (ref: Club), createdBy (ref: User), createdAt, updatedAt
```

### Album
```
_id, name, description, isPublic, event (ref: Event), createdBy (ref: User),
createdAt, updatedAt
```

### Media
```
_id, url, publicId, type (image/video), caption, tags[], taggedUsers (ref: User)[],
isPublic, album (ref: Album), uploadedBy (ref: User), width, height, size,
createdAt, updatedAt
```

### Like
```
_id, user (ref: User), media (ref: Media), createdAt
```

### Comment
```
_id, content, user (ref: User), media (ref: Media), createdAt
```

### Notification
```
_id, type (like/comment/tag), message, read, user (ref: User),
fromUser (ref: User), media (ref: Media), createdAt
```

---

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/callback/credentials` | Login |
| POST | `/api/auth/signout` | Logout |

### Clubs

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/clubs` | Get all clubs | No |
| POST | `/api/clubs` | Create club | Yes |
| GET | `/api/clubs/:id` | Get club details | No |
| DELETE | `/api/clubs/:id` | Delete club | Admin only |
| POST | `/api/clubs/:id/join` | Join club with code | Yes |
| PATCH | `/api/clubs/:id/members` | Update member role | Club Admin |
| DELETE | `/api/clubs/:id/members` | Remove member | Club Admin |

### Events

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/events` | Get all events | No |
| POST | `/api/events` | Create event | Club Member+ |
| GET | `/api/events/:id` | Get event | No |
| PATCH | `/api/events/:id` | Update event | Creator/Admin |
| DELETE | `/api/events/:id` | Delete event | Creator/Admin |

### Albums

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/albums` | Get all albums | No |
| POST | `/api/albums` | Create album | Club Member+ |
| GET | `/api/albums/:id` | Get album | No |
| PATCH | `/api/albums/:id` | Update album | Creator/Admin |
| DELETE | `/api/albums/:id` | Delete album | Creator/Admin |

### Media

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/media` | Get media (by album/user) | No |
| POST | `/api/media/upload` | Upload files | Club Member+ |
| DELETE | `/api/media/:id` | Delete media | Uploader/Admin |
| PATCH | `/api/media/tags` | Edit tags | Uploader only |

### Social

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/likes?mediaId=` | Get like count | No |
| POST | `/api/likes` | Toggle like | Yes |
| GET | `/api/comments?mediaId=` | Get comments | No |
| POST | `/api/comments` | Add comment | Yes |
| DELETE | `/api/comments/:id` | Delete comment | Owner |
| GET | `/api/favourites` | Get favourites | Yes |
| POST | `/api/favourites` | Toggle favourite | Yes |

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | Get notifications | Yes |
| PATCH | `/api/notifications` | Mark all as read | Yes |

### AI/ML

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/search?q=` | Search everything | No |
| POST | `/api/facial-recognition` | Find face in photos | Yes |
| POST | `/api/tags` | Tag a user in photo | Yes |
| DELETE | `/api/tags` | Remove tag | Self/Uploader |
| GET | `/api/tags/search?q=` | Search users to tag | Yes |
| GET | `/api/tags/tagged` | Get tagged photos | Yes |

### Misc

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/qr?url=` | Generate QR code | No |
| GET | `/api/users/:id` | Get user profile | No |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Browser                    │
│         Next.js 16 App Router (React)               │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP / WebSocket
┌──────────────────▼──────────────────────────────────┐
│                  Next.js API Routes                  │
│         /api/* — Server-side handlers               │
└──┬───────────┬──────────────┬───────────┬───────────┘
   │           │              │           │
   ▼           ▼              ▼           ▼
┌──────┐  ┌────────┐  ┌──────────┐  ┌─────────┐
│MongoDB│  │Cloudinary│  │  Pusher  │  │  AWS    │
│Atlas │  │(Media)  │  │(Realtime)│  │Rekognition│
│      │  │         │  │          │  │(AI/ML)  │
└──────┘  └────────┘  └──────────┘  └─────────┘
```

### Request Flow

```
User uploads photo
       │
       ▼
Next.js API Route (/api/media/upload)
       │
       ├──► Cloudinary (store image, compress)
       │         │
       │         └──► Return URL + publicId
       │
       ├──► AWS Rekognition (detect labels)
       │         │
       │         └──► Return tags array
       │
       └──► MongoDB (save Media document with URL + tags)
```

### Auth Flow

```
User submits login form
       │
       ▼
NextAuth Credentials Provider
       │
       ▼
MongoDB — find user, verify bcrypt password
       │
       ▼
JWT token created with { id, email, role }
       │
       ▼
Cookie set — user redirected to /dashboard
```

## Made with ❤️ for campus clubs
