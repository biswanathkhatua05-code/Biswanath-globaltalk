# GlobaTalk Lite - A Next.js Project

This is a Next.js starter project for GlobaTalk Lite, an application built with Firebase, Next.js, and Genkit.

## Getting Started

To get the application running locally, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9003`.

---

## 🚀 Pre-Deployment & Testing Checklist

Before you deploy your application or start extensive testing, it's crucial to ensure your Firebase backend is correctly configured. Follow this checklist carefully.

### Step 1: Set Up Firebase API Keys

Your application needs to connect to your Firebase project. This is done via environment variables.

-   **Action:** Create a `.env` file in the root of your project by copying the `.env.example` file. Then, go to your **Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet > Config** and copy your project's credentials into the corresponding `NEXT_PUBLIC_FIREBASE_...` variables in your `.env` file.
-   **Why:** Without these keys, the app cannot communicate with Firebase, and you will see an `(auth/invalid-api-key)` error.

### Step 2: Publish Firestore Security Rules

Security rules protect your database from unauthorized access.

-   **Action:** Go to your **Firebase Console > Cloud Firestore > Rules** tab. Copy the entire content of the `firestore.rules` file from this project and paste it into the editor, overwriting any existing rules. Click **Publish**.
-   **Why:** Incorrect or default rules will cause "Missing or insufficient permissions" errors, preventing the app from reading or writing data.

### Step 3: Create a "Creator" User Account

Certain features, like uploading videos, are restricted to users with a `creator` role.

-   **Action:**
    1.  Run the app and log in anonymously.
    2.  Go to the **Firebase Console > Cloud Firestore > Data** tab.
    3.  Open the `users` collection and find the document with your User ID.
    4.  Add a new field:
        -   **Field:** `isCreator`
        -   **Type:** `boolean`
        -   **Value:** `true`
-   **Why:** This grants your user account the necessary privileges to access creator-only features.

### Step 4: Add a Sample Video

To test the video gallery and watch pages, you need at least one video document in your database.

-   **Action:** In the **Cloud Firestore > Data** tab, create a new collection named `videos`. Add a new document with an auto-generated ID and include the following fields: `title` (string), `description` (string), `creatorId` (string, your UID), `creatorName` (string, your name), `thumbnailUrl` (string, e.g., `https://placehold.co/320x180.png`), `videoUrl` (string, e.g., a public video URL), `views` (number), `likes` (number), and `createdAt` (timestamp).
-   **Why:** This populates the video section of your app, allowing you to test the UI and playback functionality.

### Step 5: Configure a TURN Server (Recommended for Production)

For reliable video and voice calls across all types of networks, a TURN server is highly recommended.

-   **Action:** Obtain TURN server credentials from a service like Twilio. Add the URL, username, and password to the `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USERNAME`, and `NEXT_PUBLIC_TURN_PASSWORD` variables in your `.env` file.
-   **Why:** While the app can work without this on some networks using free STUN servers, a TURN server ensures that calls connect even through restrictive firewalls, which is critical for a public-facing application.
