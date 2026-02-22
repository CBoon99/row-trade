# Cursor Prompt: Rebrand Trader Bay to Row-Trader + Add Game Matching & Negotiation

## Context & Mission

You are rebranding the existing Trader Bay project (trader-bay.netlify.app) to become **"Row-Trader"** — a safe, educational trading hub focused on Rowblocks gaming items (blocks, fish, gems) with cross-game trading capabilities. 

**What we're doing:** This is a foundation pass — we're getting the house in order by:
1. Rebranding all text/logos/names from "Trader Bay" to "Row-Trader"
2. Adding game matching (users match by shared games)
3. Adding negotiable offers/bartering system (teaches kids negotiation skills)

**Why:** To create a simple, trustworthy platform where gamers (especially kids/teens) can:
- Match based on shared games (even if just one — trade fish for fish)
- If multiple shared games — trade across titles (fish for bullets, etc.)
- Make offers and negotiate (teaches bartering/negotiation skills safely)
- Learn safe online trading practices (keep existing safety rules)

**How:** Go through EVERY file systematically (HTML, JS, TS, CSS, config, JSON, etc.), search/replace names/logos/text, then add minimal new features without breaking existing functionality. Keep it lightweight — no new heavy dependencies, reuse existing structure.

---

## Step-by-Step Tasks

### Task 1: Full Rebrand Pass (Go Through Every File)

**Search and replace in ALL files:**
- "Trader Bay" → "Row-Trader"
- "trader-bay" → "row-trader" (in URLs, IDs, class names, variables)
- Update any logo references (if image, keep placeholder; if text, use "Row-Trader" with blue/purple abyssal theme colors)

**Files to check (be thorough — scan entire codebase):**
- `index.html` / `index-3d.html` / all HTML files
- All `.js`, `.ts`, `.tsx` files
- All `.css`, `.scss` files
- `package.json`, `vite.config.ts`, `tsconfig.json`
- `README.md`, any docs
- Environment files, config files
- Component files, store files, utility files

**Specific updates needed:**

1. **Landing Page Hero:**
   - Change to: "Safe Trading Hub for Rowblocks & Gamers — Swap Blocks, Trade Fish, Gift Gems!"
   - Subtitle: "Learn negotiation skills while trading your favorite game items safely"

2. **Three Core Actions (Swap/Trade/Gift):**
   - **Swap It (↔️):** "Swap your Abyssal Block for a Friend's Block"
   - **Trade It (⇄):** "Trade Rowblocks Fish for Animal Crossing Glam or Fortnite Bullets"
   - **Gift It (🎁):** "Gift a Gem or Rare Fish to a Buddy"

3. **Education/Safety Section:**
   - Add gaming-specific tips:
     - "Teach Bartering: Start with 'What do you offer?' in chats"
     - "Negotiation Fun: Learn to haggle safely — it's like trading at a market!"
     - "Cross-Game Trading: Match with players who share your favorite games"

4. **Meta Tags & Titles:**
   - Update `<title>`, `<meta name="description">`, Open Graph tags
   - Change to: "Row-Trader — Safe Game Item Trading Hub"

5. **Variables/Constants:**
   - Find any `appName`, `APP_NAME`, `siteName` variables → change to "Row-Trader"
   - Update any API endpoints or config references

6. **Logo/Branding:**
   - If logo is text-based: Use "Row-Trader" with styling (blue/purple gradient, abyssal theme)
   - If logo is image: Keep placeholder, add comment "TODO: Add Row-Trader logo image"
   - Favicon: Update if exists

**Output for this task:** List every file changed + what was changed (e.g., "index.html: Changed title tag, hero text, meta tags")

---

### Task 2: Add Game Matching System

**Goal:** Users can select favorite games, and the system matches them with others who share games.

**Implementation:**

1. **Profile/User Model:**
   - Add `favoriteGames: string[]` field (array of game names)
   - Games list: `["Rowblocks", "Animal Crossing", "Fortnite", "Roblox", "Minecraft", "Call of Duty", "Among Us", "Genshin Impact", "Pokemon GO", "Stardew Valley"]` (at least 10 common games)

2. **Profile Page/Form:**
   - Add "Favorite Games" multi-select dropdown (users can pick multiple)
   - Save to user profile/localStorage/state

3. **Matching Logic:**
   - Function: `getSharedGames(user1, user2)` → returns array of shared games
   - Function: `getMatchScore(user1, user2)` → returns number of shared games

4. **Display Matching:**
   - On browse page: Show "Shared Games" badge next to each listing/user
     - Example: "You both play Rowblocks! (1 shared)" or "3 shared games: Rowblocks, Animal Crossing, Fortnite"
   - In messages/chat: Show shared games at top of conversation
   - On profile view: Display "Games in common" section

5. **Smart Suggestions:**
   - If 1 shared game (e.g., both play Rowblocks): Suggest "Trade fish for fish" or "Swap blocks"
   - If multiple shared: Suggest cross-trades like "Trade your Rowblocks Fish for their Fortnite Bullets?"
   - Auto-fill offer templates in chat: "My Rowblocks Fish for your Fortnite Bullets?"

**Files to modify/create:**
- User profile component/form
- Browse listings component (add matching display)
- Messages/chat component (show shared games)
- Matching utility function (new file: `utils/matching.ts` or similar)
- State management (if using Zustand/Redux, add games to user state)

**Keep it simple:** Use localStorage or in-memory state if no backend yet. Matching can be client-side for MVP.

---

### Task 3: Add Negotiable Offers & Bartering System

**Goal:** Users can make offers, counter-offer, and negotiate — teaching kids negotiation/bartering skills.

**Implementation:**

1. **Offer Form (on listing page or messages):**
   - Fields:
     - "What I'm Offering" (text input, e.g., "My Rowblocks Abyssal Gem")
     - "What I Want" (text input, e.g., "Your Animal Crossing Star Fragment")
     - "Initial Offer" (optional: "I'll add a fish if you add a gem")
   - Button: "Make Offer" or "Send Offer"

2. **Negotiation in Messages:**
   - Display offers in chat thread
   - Buttons on each offer:
     - "Accept" (finalize trade)
     - "Counter-Offer" (edit and send new proposal)
     - "Decline" (reject offer)
   - Counter-offer opens edit form (pre-filled with original offer, user can modify)

3. **Educational Tooltips/Popups:**
   - On offer form: Tooltip "Bartering Tip: Start with a fair offer, then negotiate! It's like haggling at a market."
   - On counter-offer: "Negotiation Fun: Try 'I'll add X if you add Y' — it's how real traders do it!"
   - Safety reminder: "All negotiations stay in-app — no external links or info sharing."

4. **Offer History:**
   - Track offer → counter → counter → accept/decline
   - Show in chat: "Offer 1: Your fish for my gem" → "Counter: Add a block?" → "Counter: Deal!" → "Accepted!"

5. **Integration with Safety:**
   - All offers logged for reports (if user reports, include offer history)
   - No personal info in offers (validate: no emails, phone numbers, addresses)

**Files to modify/create:**
- Offer form component (new or add to existing listing/message components)
- Message/chat component (add offer display + buttons)
- Offer state management (add to store or local state)
- Validation utility (check for personal info in offers)

**Keep it simple:** Store offers in messages array or separate offers array. No complex backend needed for MVP.

---

### Task 4: Add Rowblocks Flavor (Theming)

**Goal:** Make it feel Rowblocks-themed without breaking existing design.

**Implementation:**

1. **Default Examples:**
   - Pre-fill listing examples with Rowblocks items:
     - "Abyssal Gem" (rare, glowing)
     - "Glowing Block" (special puzzle block)
     - "Rare Fish" (from Marinepedia)
     - "Depth Meter Upgrade" (customization item)
   - Add these as placeholder text in create listing form

2. **Icons/Emojis:**
   - Use Rowblocks-themed emojis in UI:
     - Blocks: 🧱 or custom block icon
     - Fish: 🐟
     - Gems: 💎
     - Depth: 📊
   - Add to buttons, listings, messages

3. **Color Theme:**
   - Update primary colors to match Rowblocks abyssal theme:
     - Deep blue (#001133), purple (#6B46C1), cyan (#06B6D4)
     - Keep existing safety/error colors (red for warnings, green for success)

4. **Terminology:**
   - Use "Abyssal Trade Reef" or "Trade Depths" for marketplace sections (optional, keep it subtle)
   - Keep main navigation clear ("Browse", "Create", "Messages", "Profile")

**Files to modify:**
- CSS/theme files (update colors)
- Component files (add emojis/icons)
- Form placeholders (add Rowblocks examples)

**Keep it subtle:** Don't overwhelm — just add flavor while keeping the clean, safe trading hub feel.

---

## Output Requirements

### 1. Code Changes
- Apply all changes to codebase
- Ensure no broken references (test that all "Trader Bay" → "Row-Trader" replacements are complete)
- Verify no console errors (check for undefined variables, broken imports)

### 2. Report Document
Create `ROW_TRADER_REBRAND_REPORT.md` with:

**Section A: Files Changed (Complete List)**
- List every file modified
- For each file, note:
  - What changed (e.g., "Changed title tag from 'Trader Bay' to 'Row-Trader'")
  - Why (e.g., "Rebrand foundation")
  - How (e.g., "Search/replace in index.html line 5")

**Section B: New Features Added**
- Game matching: Files created/modified, how it works
- Negotiable offers: Files created/modified, how it works
- Rowblocks theming: What was added

**Section C: Testing Checklist**
- Local preview steps:
  1. `npm install` (if needed)
  2. `npm run dev` or `npm run preview`
  3. Check landing page: Should show "Row-Trader" everywhere
  4. Test profile: Add favorite games, save
  5. Test browse: Should show "Shared Games" badges
  6. Test offer: Make offer on listing, counter-offer in messages
  7. Check console: No errors
- Expected results:
  - All "Trader Bay" text replaced with "Row-Trader"
  - Game matching displays shared games
  - Offers can be made, countered, accepted/declined
  - Rowblocks examples appear in forms

**Section D: Known Limitations / Future Work**
- What's not implemented yet (e.g., backend persistence, real-time matching)
- What could be improved (e.g., more games, better UI for negotiations)

---

## Important Notes

- **Don't break existing functionality:** Safety rules, reporting, messaging should all still work
- **Keep it simple:** This is foundation — no complex backend, use localStorage/client-side state if needed
- **Maintain safety:** All existing safety features (no personal info, reports, supervised accounts) must remain intact
- **Test as you go:** After each major change, verify the app still loads and core features work

---

## Success Criteria

After this prompt, Row-Trader should:
✅ Be fully rebranded (no "Trader Bay" references remain)
✅ Show game matching (shared games displayed)
✅ Support negotiable offers (make, counter, accept/decline)
✅ Have Rowblocks flavor (examples, emojis, colors)
✅ Maintain all safety features
✅ Load without errors
✅ Be ready for deployment to row-trader.netlify.app (or new Netlify site)

---

**Ready to start?** Begin with Task 1 (full rebrand pass), then move through Tasks 2-4. Output the report when complete. Let's get the house in order! 🚀
