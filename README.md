# GlobaTalk Lite - A Next.js Project

This is a Next.js starter project for GlobaTalk Lite, an application built with Firebase, Next.js, and Genkit.

## Getting Started (Local Development)

To get the application running locally in your development environment, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up your environment variables:**
    *   Rename the `.env.example` file to `.env`.
    *   Fill in the `NEXT_PUBLIC_FIREBASE_*` variables in the `.env` file with your Firebase project's configuration. You can find these in your **Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet > Config**.

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at the URL provided by your development environment (e.g., `http://localhost:9004`).

---

## 🚀 Deployment Guide (Vercel)

To deploy your application and get a public URL to share with friends, follow these steps carefully.

### Step 1: Push Your Code to GitHub

1.  Create a new repository on [GitHub](https://github.com/new).
2.  Follow the instructions on GitHub to push your local project code to the new repository.

### Step 2: Deploy with Vercel

1.  Go to [Vercel](https://vercel.com/new) and sign up with your GitHub account.
2.  Click **Import Project** and select your new GitHub repository.
3.  Vercel will automatically detect that you're using Next.js and configure the build settings.

### Step 3: Configure Environment Variables

This is the most important step for the deployed app to work.

1.  In the Vercel project dashboard, go to the **Settings** tab.
2.  Click on **Environment Variables** in the side menu.
3.  For each variable in your `.env` file (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`), create a new environment variable in Vercel.
    *   **Name:** `NEXT_PUBLIC_FIREBASE_API_KEY`
    *   **Value:** `your-actual-api-key`
4.  Repeat this process for all `NEXT_PUBLIC_FIREBASE_*` variables.
5.  If you have a TURN server, add those variables as well (`NEXT_PUBLIC_TURN_URL`, etc.).

### Step 4: Deploy

1.  After adding the environment variables, go to the **Deployments** tab.
2.  Trigger a new deployment. Vercel will build and deploy your project.
3.  Once finished, you will get a public URL (e.g., `your-project-name.vercel.app`) that you can share with anyone!

---

## 🔥 Pre-Launch Firebase Checklist 🔥

Before you share your deployed app link, ensure your Firebase backend is correctly configured. **This is critical to avoid permission errors.**

### ✅ 1. Publish Firestore Security Rules

1.  Go to your **Firebase Console > Cloud Firestore > Rules** tab.
2.  Copy the entire content of the `firestore.rules` file from this project and paste it into the editor, overwriting any existing rules.
3.  Click **Publish**.

### ✅ 2. Create a "Creator" User Account (Optional)

Certain features, like uploading videos, are restricted to users with a `creator` role.

1.  Run the deployed app and log in anonymously.
2.  Go to the **Firebase Console > Cloud Firestore > Data** tab.
3.  Open the `users` collection and find the document with your User ID.
4.  Add a new field:
    *   **Field:** `isCreator`
    *   **Type:** `boolean`
    *   **Value:** `true`

### ✅ 3. Configure a TURN Server (Recommended)

For reliable video/voice calls across all networks, a TURN server is highly recommended.

1.  Obtain TURN server credentials from a service like Twilio.
2.  Add the URL, username, and password to the Environment Variables in your Vercel project settings.
