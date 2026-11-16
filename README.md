# LostLink – Campus Lost & Found

> **Find what matters. Return what belongs.**

LostLink is an Android app (React Native + Expo) with a Node.js/Express backend that helps VJTI students report lost belongings, report found belongings, browse what others have reported, and **claim** found items through a simple ownership-verification workflow. Data is stored in MongoDB Atlas (exactly two collections: `users` and `items`) and photos in Cloudinary.

Final-year Computer Engineering mini-project. The full academic report is in [`documentation/LostLink_Project_Report.md`](documentation/LostLink_Project_Report.md).

---

## Features

- **Separate student and admin interfaces.** The role returned by the backend decides which app the user sees, both after login and when a saved session is restored.
  - **Student tabs:** Home · Browse · Report · My Activity.
  - **Admin tabs:** Dashboard · All Reports · Claims.
  - **Profile** is opened from the round avatar at the top-right of every screen.
- **Accounts:** registration with an optional profile photo, login with JWT, session kept in Expo Secure Store, automatic logout when the token expires, show/hide password button.
- **Keyboard-safe forms:** login, registration, report and claim forms scroll so the field being typed in is never hidden by the keyboard.
- **Camera or Gallery:** every photo (item photos, profile photo) is chosen from a "Choose an Image" sheet with Camera and Gallery options. The photo can be previewed, retaken or removed before it is uploaded.
- **VJTI campus photo:** faded behind the student Home screen, in its natural colours behind the Login and Sign up headers (with only a light shadow behind the white text), and faded behind the "Something went wrong / Try again" screen.
- **Home:** faded VJTI campus photograph, welcome message, coral Report Lost / green Report Found shortcuts, live counts of active lost and found items, recent reports.
- **Report Lost / Report Found:** item name, category (with icons), description, location, date (native picker) and an optional photo. For **lost** items, description and location are optional (the owner may not know where it was lost); for **found** items they are required.
- **Browse:** active items only, All / Lost / Found filter, search by item name or category.
- **Item details:** photo, category, description, location, date, reporter, status, **Claim This Item** (found items) and **Contact** buttons (`mailto:`).
- **Claims:**
  - students claim a FOUND item by describing private identifying details;
  - the finder approves or rejects each claim;
  - approving one claim marks the item **RECOVERED** and closes all other pending claims automatically.
- **My Activity:** My Reports, My Claims and Claims Received in one tab.
- **Admin:**
  - Dashboard with total users, active lost, active found and recovered counts, plus recent reports and pending claims;
  - All Reports with View / Delete;
  - Claims list, read-only (admins **cannot** approve or reject).
- **Design:** one colour system in `mobile/src/constants.ts`.
  - **Navy:** headers and primary buttons.
  - **Teal:** secondary actions.
  - **Coral:** lost.
  - **Green:** found / success.
  - **Purple:** claims.
  - **Amber:** pending.
  - Every status badge uses the same colour on every screen.
- **Server-side security:** JWT on every protected route, ownership checks, admin-only routes, atomic claim updates, no password hashes or private claim text in public responses.

## Tech stack

| Mobile | Backend |
|---|---|
| React Native, Expo SDK 58, TypeScript | Node.js, Express 5, TypeScript |
| Expo Router (stack + bottom tabs) | MongoDB Atlas + Mongoose |
| Axios, Expo Secure Store, Expo Image Picker | JWT, bcryptjs, Multer, Cloudinary, dotenv, cors |

## Project structure

```
LostLink/
├── backend/                     Express API
│   ├── server.ts                Entry point (listens on 0.0.0.0)
│   ├── app.ts                   Express app, routers, error handler
│   ├── config/                  database.ts, cloudinary.ts (upload/delete helpers)
│   ├── models/                  User.ts, Item.ts (claims embedded in Item)
│   ├── middleware/              authMiddleware.ts (requireAuth, requireAdmin), uploadMiddleware.ts
│   ├── routes/                  authRoutes, userRoutes, itemRoutes, claimRoutes, adminRoutes
│   ├── utils/validation.ts      Shared input helpers
│   ├── scripts/seedAdmin.ts     Creates/updates the admin account
│   └── .env.example
├── mobile/                      Expo app
│   ├── assets/images/           vjti-campus.jpg (Home background) + its credits
│   ├── src/app/                 Screens (Expo Router)
│   │   ├── _layout.tsx          Role-based route guards (Stack.Protected)
│   │   ├── index.tsx            Sends each user to Login, Student Home or Admin Dashboard
│   │   ├── (student)/           Tabs: home, browse, report, activity
│   │   ├── (admin)/             Tabs: dashboard, all-reports, claims
│   │   ├── report/[type].tsx    Report Lost / Found form (students only)
│   │   ├── claim/[id].tsx       Claim submission form (students only)
│   │   ├── item/[id].tsx        Item details (+ claim review for the finder)
│   │   ├── profile.tsx          Profile (opened from the top-right avatar)
│   │   └── login.tsx, register.tsx
│   ├── src/components/          Button, TextField, ItemCard, ClaimCard, ImagePickerSheet,
│   │                            PhotoField, KeyboardAvoider, HeaderAvatar, CategoryIcon, ...
│   ├── src/context/             AuthContext (session)
│   ├── src/lib/                 api.ts (Axios client), pickImage, useClaimReview, ...
│   └── .env.example
└── documentation/               Project report + screenshot checklist
```

---

## Setup (Ubuntu)

### Requirements

- Node.js 20+ and npm
- MongoDB Atlas account (free cluster)
- Cloudinary account (free plan). Optional: everything except photos works without it.
- Android phone with **Expo Go**, or the Android Studio emulator

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```ini
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/LostLink?retryWrites=true&w=majority
JWT_SECRET=<long random string>
PORT=5000

CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>

ADMIN_NAME=Campus Admin
ADMIN_EMAIL=admin@yourcollege.edu
ADMIN_PASSWORD=<at least 6 characters>
```

The part after `.mongodb.net/` is the database name. Database names are case-sensitive: `LostLink` and `lostlink` are two different databases.

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

In MongoDB Atlas, **Network Access** must include your computer's IP address.

Create the admin account and start the server:

```bash
npm run seed:admin
npm run dev
```

You should see `MongoDB connected` and `LostLink API running on http://0.0.0.0:5000`. Check <http://localhost:5000/api/health>.

`npm run seed:admin` is safe to run more than once. If the admin email already exists it updates that account (name, password, `ADMIN` role) instead of creating a duplicate. It also upgrades accounts created by the first version of LostLink (`passwordHash` → `password`, lowercase → uppercase roles).

| Script | Purpose |
|---|---|
| `npm run dev` | Start with auto-reload (development) |
| `npm run build` then `npm start` | Compile to `dist/` and run the compiled server |
| `npm run seed:admin` | Create or update the admin account from `ADMIN_*` values |
| `npm run typecheck` | TypeScript check |

### 2. Mobile app

```bash
cd mobile
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` (no trailing slash, no `/api`):

| Running on | Value |
|---|---|
| Android emulator | `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000` |
| Your Android phone (same Wi-Fi as the computer) | `EXPO_PUBLIC_API_URL=http://<computer LAN IP>:5000` |

Find your Ubuntu computer's LAN IP with `hostname -I` (first address, e.g. `192.168.1.25`). The IP can change when you reconnect to Wi-Fi, so check it before a demo.

Start Expo:

```bash
npx expo start --clear
```

**Android emulator:** start an emulator in Android Studio (Device Manager), then press `a` in the Expo terminal.

**Personal Android phone:**

1. Install **Expo Go** from the Play Store.
2. Connect the phone to the **same Wi-Fi** as the computer.
3. Open `http://<LAN IP>:5000/api/health` in the phone's browser to confirm it reaches the backend.
4. Scan the QR code from the Expo terminal using Expo Go.

**Camera on the emulator:** the Android emulator's camera shows a virtual scene; on a real phone the normal camera opens. The first time Camera is chosen, Android asks for camera permission.

**Troubleshooting**

- *"Cannot reach the server at …"*: the backend is not running, or `EXPO_PUBLIC_API_URL` is wrong. Restart Expo with `--clear` after editing `.env`.
- Ubuntu firewall: `sudo ufw allow 5000/tcp` and `sudo ufw allow 8081/tcp`.
- College Wi-Fi often blocks device-to-device traffic. Use a mobile hotspot instead.
- *"Photo uploads are not configured on the server"*: fill in the three `CLOUDINARY_*` values and restart the backend.

| Script | Purpose |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint (Expo config) |

---

## Claim workflow

```
Student A finds a wallet and reports it (type FOUND, status ACTIVE).
Student B, the owner, opens it  →  "Claim This Item"  →  describes private details  →  claim PENDING (item stays ACTIVE in Browse)
Student A (the finder) reviews the claim on the item page or in Claims → Claims Received:
   Reject  → claim REJECTED (optional reason), item stays ACTIVE, others can still claim
   Approve → claim APPROVED, item RECOVERED, all other PENDING claims REJECTED automatically,
             item disappears from Browse/Home but stays in MongoDB and in My Reports
Student B sees the result in Claims → My Claims and emails Student A to collect the item.
```

Approval is a **single conditional MongoDB update**. It only succeeds if the item is still `ACTIVE` and the chosen claim is still `PENDING`, so two claims can never be approved for the same item.

## API overview

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | Public |
| POST | `/api/auth/register` (JSON, or multipart with optional `image`) | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Logged in |
| PATCH | `/api/users/profile` | Logged in |
| POST | `/api/users/profile/image` (multipart `image`) | Logged in |
| DELETE | `/api/users/profile/image` | Logged in |
| GET | `/api/items?type=ALL\|LOST\|FOUND` | Logged in |
| GET | `/api/items/my` | Logged in |
| GET | `/api/items/:id` | Logged in |
| POST | `/api/items` (multipart, optional `image`) | Logged in |
| PATCH | `/api/items/:id/status` | Reporter (LOST items) |
| DELETE | `/api/items/:id` | Reporter (ACTIVE items) |
| POST | `/api/items/:id/claims` | Student, not the reporter |
| GET | `/api/items/:id/claims` | Reporter |
| PATCH | `/api/items/:id/claims/:claimId` | Reporter |
| GET | `/api/claims/my` | Logged in |
| GET | `/api/claims/received` | Logged in |
| GET | `/api/admin/dashboard/stats` | Admin |
| GET | `/api/admin/items` | Admin |
| DELETE | `/api/admin/items/:id` | Admin |
| GET | `/api/admin/claims?status=PENDING\|APPROVED\|REJECTED\|ALL` | Admin (read-only) |

Full request/response details and Postman instructions are in the [project report](documentation/LostLink_Project_Report.md#9-api-endpoint-documentation).

## Database

Exactly **two** MongoDB collections. Claims are **embedded** in item documents; there is no claims collection.

- **users**: `name`, `email` (unique), `password` (bcrypt hash, never returned), `role` (`STUDENT` / `ADMIN`), `profileImage`, `profileImagePublicId`, timestamps
- **items**: `title`, `type` (`LOST` / `FOUND`), `category`, `description`, `location`, `date`, `imageUrl`, `imagePublicId`, `reportedBy` (→ users), `status` (`ACTIVE` / `RECOVERED`), `claims[]`, timestamps
  - each claim: `_id`, `claimedBy` (→ users), `description` (private), `status` (`PENDING` / `APPROVED` / `REJECTED`), `rejectionReason`, timestamps

## Role-based navigation

| | Student | Admin |
|---|---|---|
| Lands on after login / app restart | Home | Dashboard |
| Bottom tabs | Home · Browse · Report · My Activity | Dashboard · All Reports · Claims |
| Profile | Top-right avatar | Top-right avatar |

The guards are in `mobile/src/app/_layout.tsx`. Screens in a `Stack.Protected` group whose guard is false do not exist for that user. A student cannot open admin screens, an admin cannot open the report or claim forms, and a logged-out user can only see Login and Register. Anyone who tries is sent to `index.tsx`, which redirects to the right starting screen. The backend still checks the role on every request.

## Credits

Home screen photo: "VJTI College Quadrangle" by Paras2130, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:VJTI_College_Quadrangle.jpg), licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

## Security notes

- `.env` files are git-ignored. Never commit real credentials.
- Cloudinary keys live only on the backend. The app sends images to the API, which uploads them.
- Admin accounts can only be created with `npm run seed:admin`. Registration always creates `STUDENT` accounts.
- `claims` is excluded from item queries by default (`select: false`), so private claim descriptions only reach the claimant and the item's reporter.
