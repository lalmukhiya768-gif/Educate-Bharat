# Educate Bharat — Starter Website

A mobile-friendly bilingual educational blog starter using HTML/CSS/JavaScript and Firebase Authentication + Cloud Firestore.

## Files
- `index.html` — public homepage
- `article.html` / `article.js` — individual article reading page
- `admin.html` — admin login and article editor
- `styles.css` — responsive design
- `firebase-config.js` — Firebase Web App configuration placeholders
- `app.js` — public article listing/search/category/language toggle
- `admin.js` — admin login and create/edit/publish/draft/delete functions
- `firestore.rules` — database security rules

## 1. Add Firebase configuration
Open `firebase-config.js` and replace every `PASTE_...` placeholder with the matching values from Firebase Console → Project settings → Your apps → Web app.

Do not paste private service-account keys, passwords, or other secrets into this file.

## 2. Create the first admin account
1. Firebase Console → Authentication → Users → Add user.
2. Create an email/password account for yourself.
3. Copy that user's **UID**.
4. Firebase Console → Firestore Database → Data → Start collection (if needed).
5. Create a collection named `admins`.
6. Create a document whose document ID is exactly the user's UID.
7. Add a string field: `role` = `admin`.

Important: Do not allow public users to create or edit documents in `admins`. The provided rules deny all client writes to that collection.

## 3. Apply Firestore security rules
Firebase Console → Firestore Database → Rules. Replace the starter rules with the content of `firestore.rules`, then Publish.

The rules allow anyone to read published posts and only verified admin accounts to create, update, delete, or read drafts. Review and test rules before using the site publicly.

## 4. Enable sign-in
Firebase Console → Authentication → Sign-in method → Email/Password → Enable.

## 5. Test locally
The files use Firebase's browser SDK from Google's CDN. For a local test, open the site through a local web server if your browser blocks scripts from `file://`. You can upload files to a GitHub repository and enable GitHub Pages, or use another static hosting provider.

## 6. Publish with GitHub Pages
1. Create a repository such as `educate-bharat`.
2. Upload all files in this folder to the repository root.
3. Repository → Settings → Pages.
4. Choose deployment from the `main` branch and `/ (root)`, then Save.
5. Wait for the published site URL to appear in Pages settings.

GitHub Pages serves static files only; Firebase provides login and database services.

## Current limitations
- Article body is stored as plain text. The individual article page displays the English body and, when provided, the Hindi body.
- Image upload is not included; the admin form accepts an image URL.
- The language switch changes interface labels and selects Hindi/English article fields where available; it does not automatically translate article content.
- Search-engine indexing and ranking are not guaranteed. Add a custom domain, sitemap, canonical URLs, and article-specific metadata as the site grows.
- Do not store sensitive personal information in public posts. Keep dependencies and rules reviewed and updated.

## Troubleshooting
- “Setup incomplete”: check `firebase-config.js` and ensure placeholders are replaced.
- Login fails: confirm Email/Password is enabled and the user exists in Authentication.
- Login says not authorized: ensure Firestore has `admins/{YOUR_AUTH_UID}` with `role` string `admin`.
- Posts do not appear: publish Firestore rules and ensure the post's `status` is exactly `published`.
- Firestore may ask for a composite index for the homepage query. Follow the index-creation link shown in the browser console if prompted.
