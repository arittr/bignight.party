# BigNight.Party - Project Overview

## Vision

Transform the annual Oscars prediction game from a Google Sheets experience into a fully-featured, real-time web application that brings the excitement of awards night to life.

## The Problem

Every year, friends gather for an Oscars party and fill out prediction sheets. The current Google Sheets solution works but lacks:
- Real-time scoring as winners are announced
- Engaging user experience on mobile devices
- Live reactions and social interaction
- Professional presentation for the party atmosphere
- Easy setup and management year-over-year

## The Solution

A dedicated web application that handles the entire prediction game lifecycle:

### For Players
- Sign in with magic link (no password required)
- Fill out predictions via guided wizard with progress tracking
- View live leaderboard as winners are revealed during ceremony
- See aggregate prediction stats (who's leading, popular picks)
- Send emoji reactions that appear on shared leaderboard display
- Track individual picks remain private until reveal

### For Admins
- Create events and configure categories/nominees
- Set point values per category
- Control game state (setup → open for picks → live → completed)
- Mark winners during ceremony
- Control reveal timing (category-by-category)
- View admin dashboard with real-time stats

## Key Features

### Phase 1 (MVP)
- ✅ Magic link authentication
- ✅ Admin category/nominee management
- ✅ Wizard-based pick selection with navigation
- ✅ Real-time leaderboard with WebSocket updates
- ✅ Category-by-category winner reveals
- ✅ Access code for game entry

### Phase 2 (Post-MVP)
- 🔄 Import categories/nominees from external APIs
- 🔄 Live emoji reactions on leaderboard
- 🔄 Aggregate prediction statistics view

### Phase 3 (Future)
- 🔮 Event templates for multiple award shows
- 🔮 Historical stats and user profiles across years
- 🔮 Advanced analytics and insights

## Success Criteria

1. **Performance:** Leaderboard updates within 1 second of admin marking winner
2. **Reliability:** Handle 50+ concurrent users without degradation
3. **Usability:** 90% of users complete picks without assistance
4. **Fun:** Emoji reactions and live scoring create party atmosphere

## Technical Constraints

- Must work on mobile devices (most guests use phones)
- Must support offline pick entry (save drafts)
- Must handle real-time updates without page refresh
- Database designed for future multi-event support
- Simple deployment (single Vercel deployment)
