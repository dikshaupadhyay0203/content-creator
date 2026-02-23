# Zentrix

A modern full-stack creator marketplace and real-time chat platform built with MERN + Socket.IO.

## Overview

Zentrix allows users to:

- Sign up and log in with OTP-based verification
- Upload and manage image/video assets
- Browse public assets from other creators
- Start direct messages from the dashboard
- Chat in real time with typing indicators and unread message badges

## Project Structure

This workspace contains two main applications:

- `creators-connect-backend-main/creators-connect-backend-main` — Node.js, Express, MongoDB, Socket.IO backend
- `creators-connect-frontend-main/creators-connect-frontend-main` — React + Vite + Tailwind frontend

## Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO
- JWT Auth via cookies
- Multer + Cloudinary for media handling
- Nodemailer for OTP flow

## Key Features

- Authentication with signup/login/logout
- OTP verification during account creation
- Asset upload with public/private visibility
- Public asset marketplace dashboard
- My Assets management page
- Real-time room and direct messaging
- Typing indicators
- Unread message counters in chat room list
- Professional dark SaaS UI theme (Zentrix)

## Prerequisites

Before running locally, ensure you have:

- Node.js (v18+ recommended)
- npm
- MongoDB connection string
- Cloudinary credentials
- Email credentials for OTP

## Environment Variables (Backend)

Create a `.env` file inside:

`creators-connect-backend-main/creators-connect-backend-main`

Typical variables used by this project:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `NODE_ENV`

## Run Locally

Open two terminals from the workspace root.

### 1) Start backend

```powershell
npm --prefix "c:\Users\archa\OneDrive\Desktop\Full-Stack1\creators-connect-backend-main\creators-connect-backend-main" start
```

Backend runs on `http://localhost:5000`.

### 2) Start frontend

```powershell
npm --prefix "c:\Users\archa\OneDrive\Desktop\Full-Stack1\creators-connect-frontend-main\creators-connect-frontend-main" run dev
```

Frontend runs on `http://localhost:5173`.

## API and Socket Summary

### REST (examples)

- Auth routes under `/api/auth`
- Asset routes under `/api/assets`
- Chat routes under `/api/chat`

### Socket events (high level)

- `join`, `joinRoom`, `leaveRoom`
- `sendMessage`, `sendDirectMessage`
- `typing`, `stopTyping`
- `roomsList`, `roomCreated`, `roomUsers`
- `directMessage`, `directMessageRoomCreated`

## Current UI Theme

Zentrix uses a fintech-inspired dark theme:

- Main background: `#020617`
- Navbar: `#111827` (glassmorphism)
- Cards: `#1F2937`
- Accent: `#10B981`
- Accent hover: `#059669`
- Text: `#E5E7EB`

## Notes

- Room/chat membership and unread counts are handled in real time.
- Typing indicator events are scoped by room.
- Duplicate room-user entries are deduplicated by user ID on the backend.

## Authoring Note

This repository evolved from "CreatorConnect" and is now branded as **Zentrix** in the application UI.
