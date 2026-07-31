# Planned Enhancements & Feature Roadmap

This document records feature requests, UI/UX enhancements, and technical proposals planned for future releases.

## 🚀 Upcoming Feature Roadmap

### 1. Custom Profile Avatars & Photo Uploads
- **Goal**: Allow users to upload or select custom photos/avatars for each family member profile (e.g. photos of parents).
- **Rationale**: Enhances accessibility for elderly parents and caretakers by providing instant visual recognition when switching between user profiles.
- **Proposed Implementation**:
  - Add an optional `avatarUrl` / `avatarBase64` property to the `UserProfile` type in `src/types/index.ts`.
  - Add an image file picker input in `ProfileModal.tsx` allowing photo uploads.
  - Store photos in Supabase Storage buckets or compressed Base64 strings in PostgreSQL `profiles` table.
  - Render profile avatar images next to profile names in the top header selector dropdown and Multi-User Management modal cards.
