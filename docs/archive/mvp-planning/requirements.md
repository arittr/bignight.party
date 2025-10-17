# Requirements & User Stories

## User Roles

### Player (Regular User)
A party guest who makes predictions and competes on the leaderboard.

### Admin
The host who manages the event, categories, and controls the game flow.

---

## User Stories

### Authentication

**US-1: Sign In with Magic Link**
- As a player
- I want to sign in with just my email
- So that I don't need to remember a password

**Acceptance Criteria:**
- Enter email on sign-in page
- Receive magic link email within 30 seconds
- Click link to be automatically signed in
- Session persists across browser sessions

**US-2: Access Code Entry**
- As a player
- I want to enter a game access code
- So that I can join the specific event

**Acceptance Criteria:**
- Access code field on initial landing
- Invalid codes show clear error message
- Valid code grants access to game
- Access code can be shared as URL parameter

---

### Making Picks

**US-3: Wizard-Based Pick Selection**
- As a player
- I want to go through categories one at a time
- So that the experience feels guided and not overwhelming

**Acceptance Criteria:**
- One category per screen
- Next/Previous navigation buttons
- Progress indicator (e.g., "5 of 23")
- Can't submit until all categories filled

**US-4: Jump Between Categories**
- As a player
- I want to see a table of contents and jump to any category
- So that I can review or change picks without clicking through everything

**Acceptance Criteria:**
- Table of contents / category list always accessible
- Shows completion status per category (filled vs empty)
- Click to jump directly to any category
- Return to where I left off

**US-5: Auto-Save Draft Picks**
- As a player
- I want my picks saved as I go
- So that I don't lose progress if I close the browser

**Acceptance Criteria:**
- Picks saved immediately on selection
- No manual "Save Draft" button needed
- Can leave and return to complete later
- Clear indication of draft vs submitted state

**US-6: Submit Final Picks**
- As a player
- I want to review all my picks before submitting
- So that I can confirm everything is correct

**Acceptance Criteria:**
- Review screen showing all picks
- Can edit individual picks from review
- Explicit "Submit" button
- Confirmation that picks are locked

**US-7: Picks Lock at Ceremony Start**
- As a player
- I want picks to lock when the ceremony begins
- So that no one can change predictions after it starts

**Acceptance Criteria:**
- Admin sets "picks lock" timestamp
- Picks become read-only at that time
- Clear messaging that picks are locked
- Can still view own picks after lock

---

### Viewing Leaderboard

**US-8: Real-Time Leaderboard Updates**
- As a player
- I want to see scores update instantly as winners are revealed
- So that I can track my ranking during the ceremony

**Acceptance Criteria:**
- Leaderboard updates within 1 second of admin action
- No page refresh required
- Smooth animations for rank changes
- Shows current points and rank

**US-9: Aggregate Prediction Stats**
- As a player
- I want to see what percentage picked each nominee
- So that I can see popular vs unpopular picks

**Acceptance Criteria:**
- Shows percentage breakdown per category
- Updates as winners are revealed
- Doesn't show individual user picks
- Available after I've submitted my picks

**US-10: Hidden Individual Picks**
- As a player
- I don't want to see other users' specific picks
- So that the competition feels fair and suspenseful

**Acceptance Criteria:**
- Can't view other users' picks before reveal
- Can't view other users' picks during ceremony
- Only aggregate percentages visible
- Admin can optionally show picks post-event

---

### Live Reactions (Phase 2)

**US-11: Send Emoji Reactions**
- As a player
- I want to send emoji reactions during the ceremony
- So that I can express emotions as winners are announced

**Acceptance Criteria:**
- Emoji picker accessible on mobile
- Reactions appear on shared leaderboard display
- Reactions show briefly (3-5 seconds)
- Username shown with reaction

---

### Admin Dashboard

**US-12: Create Event and Set Access Code**
- As an admin
- I want to create a new event with a unique access code
- So that players can join my specific game

**Acceptance Criteria:**
- Form to create event with name and date
- Generate or set custom access code
- Set picks lock timestamp
- Event starts in SETUP status

**US-13: Manage Categories and Nominees**
- As an admin
- I want to add categories with nominees and point values
- So that players can make picks

**Acceptance Criteria:**
- Add/edit/delete categories
- Set display order for categories
- Add multiple nominees per category
- Set point value per category
- Reorder categories via drag-and-drop

**US-14: Mark Winners During Ceremony**
- As an admin
- I want to mark the winner as each category is announced
- So that scores update in real-time

**Acceptance Criteria:**
- Quick action to mark winner
- Confirm before marking (prevent mistakes)
- Ability to undo/change winner
- Timestamp of when marked

**US-15: Control Category Reveals**
- As an admin
- I want to control when each category's results are revealed
- So that I can build suspense

**Acceptance Criteria:**
- Toggle "revealed" status per category
- Revealed categories update leaderboard immediately
- Unrevealed categories don't affect scores
- Bulk reveal option

**US-16: View Admin Dashboard**
- As an admin
- I want to see real-time stats about picks and scores
- So that I can monitor the game

**Acceptance Criteria:**
- Total users registered
- Picks completion rate
- Current leaderboard
- Category reveal status
- Prediction percentages per category

---

## Non-Functional Requirements

### Performance
- Leaderboard updates < 1 second after admin action
- Pick wizard loads < 2 seconds
- Support 50+ concurrent WebSocket connections

### Security
- Magic links expire after 10 minutes
- Session tokens expire after 30 days
- Admin role required for management actions
- CSRF protection on all mutations

### Usability
- Mobile-first design
- Works on iOS Safari, Android Chrome
- Keyboard navigation support
- Clear error messages

### Scalability
- Database schema supports multiple events
- WebSocket architecture handles 100+ users
- Ready for horizontal scaling

### Data Integrity
- One pick per user per category (database constraint)
- Atomic score updates
- Event state transitions validated
