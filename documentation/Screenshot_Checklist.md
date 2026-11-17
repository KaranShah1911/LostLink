# LostLink – Screenshot Checklist for Final Demonstration

Capture these screenshots from the **running app on a real device or emulator** with MongoDB Atlas and Cloudinary configured. Tick each item only after the screenshot has actually been taken. Do not use mock-ups.

**Tips**

- Create 2 student accounts (e.g. "Student A" and "Student B") and the admin account (`npm run seed:admin`).
- Add 4–6 realistic reports (mix of LOST and FOUND, some with photos) before capturing list screens.
- Android screenshot: press **Power + Volume Down**. In the emulator, use the camera icon in the side toolbar.
- Save files as `NN_screen_name.png` (e.g. `01_login.png`) in `documentation/screenshots/`.

## Authentication

- [ ] 01 – Login screen (empty)
- [ ] 01a – Login with the keyboard open: password field visible above the keyboard
- [ ] 02 – Login screen showing a validation or "Invalid email or password" error
- [ ] 03 – Register screen filled in, with a profile photo chosen
- [ ] 04 – Register screen showing "Passwords do not match" / invalid email errors

## Home

- [ ] 05 – Student Home: faded VJTI campus photo, welcome message, Report Lost / Found cards, tabs Home / Browse / Report / My Activity
- [ ] 06 – Home screen: active lost/found counts and recently reported items

## Reporting

- [ ] 07 – Report tab: Report Lost Item / Report Found Item options
- [ ] 08 – Report Lost form with all fields and category selected
- [ ] 09 – Android date picker open on the form
- [ ] 10 – "Choose an Image" sheet (Camera / Gallery), then Report Found form with the photo preview
- [ ] 11 – Form validation errors (submit with empty fields)
- [ ] 12 – "Report submitted" success alert

## Browse & details

- [ ] 13 – Browse screen, filter **ALL**
- [ ] 14 – Browse screen, filter **LOST**
- [ ] 15 – Browse screen, filter **FOUND**
- [ ] 16 – Browse search (e.g. "wallet") and the empty state ("Nothing here yet")
- [ ] 17 – Item details with photo, badges, category, location, date, reporter
- [ ] 18 – Email app opened by **Contact Finder / Contact Owner** (address and subject pre-filled)

## My Reports

- [ ] 19 – My Reports list with Mark Recovered (lost) / Review Claims (found) / Delete buttons
- [ ] 20 – Delete confirmation dialog
- [ ] 21 – Report shown with **RECOVERED** badge
- [ ] 22 – My Reports empty state

## Profile & admin

- [ ] 23 – Student profile with photo (name, email, role STUDENT, Change / Remove photo, Log Out)
- [ ] 24 – Admin Dashboard right after admin login (tabs Dashboard / All Reports / Claims)
- [ ] 25 – Admin dashboard: four statistic cards + All Reports list
- [ ] 26 – Admin dashboard: Pending Claims list (read-only)
- [ ] 26a – Admin delete confirmation

## Claims

- [ ] C1 – Found item details (other student) with **Claim This Item** button
- [ ] C2 – Claim form filled in with identifying details
- [ ] C3 – "Claim submitted" alert
- [ ] C4 – Item details showing "Your claim: PENDING" (item still visible in Browse)
- [ ] C5 – Claims → Claims Received with two pending claims (Approve / Reject)
- [ ] C6 – Reject with a reason typed in
- [ ] C7 – Approve confirmation dialog
- [ ] C8 – Finder's item details after approval: RECOVERED, one APPROVED and one auto-REJECTED claim
- [ ] C9 – Claimant's Claims → My Claims showing APPROVED with "Email" button
- [ ] C10 – Other claimant's My Claims showing REJECTED with the reason

## New features

- [ ] N1 – Home with the notification bell showing an unread count, three stat cards and the help cards
- [ ] N2 – Notifications screen (unread items highlighted)
- [ ] N3 – Browse filter panel with several filters selected
- [ ] N4 – Browse results with the active filter chips
- [ ] N5 – My Claims with the progress tracker (pending), then approved
- [ ] N6 – Profile with the theme list (full-screen campus photo behind)
- [ ] N7 – The same Home screen in two different themes (e.g. VJTI Classic and Sunset)
- [ ] N8 – How LostLink Works and Safety Guidelines screens
- [ ] N9 – Admin Dashboard moderation summary
- [ ] N10 – MongoDB Atlas user document showing `selectedTheme` and the embedded `notifications` array

## Backend & cloud evidence

- [ ] 27 – Terminal showing the backend running (`LostLink API running on http://0.0.0.0:5000`)
- [ ] 28 – Browser showing `/api/health` response with `"database":"connected"`
- [ ] 29 – MongoDB Atlas → Browse Collections showing the `users` collection (password field is a hash)
- [ ] 30 – MongoDB Atlas showing an `items` document with its embedded `claims` array
- [ ] 31 – MongoDB Atlas showing only two collections: `users` and `items`
- [ ] 32 – Cloudinary Media Library showing `lostlink/items` and `lostlink/profiles` folders
- [ ] 33 – Postman showing `403` when a student calls `/api/admin/dashboard/stats`
- [ ] 34 – Postman showing `409` when approving a second claim on an already recovered item
