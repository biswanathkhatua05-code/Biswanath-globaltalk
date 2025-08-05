# GlobaTalk Lite - Ek Next.js Project

Yeh GlobaTalk Lite ka ek Next.js starter project hai, jo Firebase, Next.js, aur Genkit se bana hai.

---

## Apne Computer Par Kaise Chalayein (Local Development)

Application ko apne development environment mein locally chalaane ke liye, yeh steps follow karein:

1.  **Dependencies Install Karein:**
    ```bash
    npm install
    ```

2.  **Apne Environment Variables Set Karein:**
    *   `.env.example` file ka naam badal kar `.env` kar dein.
    *   `.env` file mein `NEXT_PUBLIC_FIREBASE_*` waali saari jaankari apne Firebase project ke configuration se bharein. Yeh aapko **Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet > Config** mein milega.

3.  **Development Server Shuru Karein:**
    ```bash
    npm run dev
    ```

Application aapke development environment dwara diye gaye URL par uplabdh ho jaayega (jaise, `http://localhost:9004`).

---

## 🚀 Deployment Guide (Vercel par live kaise karein)

Apne application ko deploy karke ek public URL paane ke liye jise aap doston ke saath share kar sakein, in steps ko dhyan se follow karein.

### Step 1: Apna Code GitHub Par Daalein

1.  [GitHub](https://github.com/new) par ek nayi repository banayein.
2.  GitHub par diye gaye instructions ko follow karke apne local project code ko us nayi repository mein push karein.

### Step 2: Vercel Se Deploy Karein

1.  [Vercel](https://vercel.com/new) par jaayein aur apne GitHub account se sign up karein.
2.  **Import Project** par click karein aur apni nayi GitHub repository ko select karein.
3.  Vercel apne aap detect kar lega ki aap Next.js istemal kar rahe hain aur build settings ko configure kar dega.

### Step 3: Environment Variables Configure Karein (Sabse Zaroori Step)

Yeh deploy kiye gaye app ke kaam karne ke liye sabse zaroori step hai.

1.  Vercel project dashboard mein, **Settings** tab par jaayein.
2.  Side menu mein **Environment Variables** par click karein.
3.  Aapki `.env.example` file mein jitne bhi variables hain (jaise, `NEXT_PUBLIC_FIREBASE_API_KEY`), un sab ke liye Vercel mein ek naya environment variable banayein.
    *   **Name:** `NEXT_PUBLIC_FIREBASE_API_KEY`
    *   **Value:** `your-actual-api-key` (yahan apni asli key daalein)
4.  Isi tarah se saare `NEXT_PUBLIC_FIREBASE_*` variables ke liye repeat karein.
5.  Agar aapke paas TURN server hai, toh unke variables bhi add karein (`NEXT_PUBLIC_TURN_URL`, etc.).

### Step 4: Deploy Karein

1.  Environment variables add karne ke baad, **Deployments** tab par jaayein.
2.  Ek naya deployment trigger karein. Vercel aapke project ko build aur deploy karega.
3.  Jab yeh poora ho jaayega, aapko ek public URL milega (jaise, `your-project-name.vercel.app`) jise aap kisi ke bhi saath share kar sakte hain!

---

## 🔥 App Live Karne Se Pehle Firebase Checklist 🔥

Apne deployed app ka link share karne se pehle, yeh sunishchit karein ki aapka Firebase backend sahi tarah se configure kiya gaya hai. **Permission errors se bachne ke liye yeh bahut zaroori hai.**

### ✅ 1. Firestore Security Rules Publish Karein

1.  Apne **Firebase Console > Cloud Firestore > Rules** tab par jaayein.
2.  Is project mein di gayi `firestore.rules` file ka poora content copy karein aur use editor mein paste kar dein, pehle se likhe hue rules ko hata kar.
3.  **Publish** par click karein.

### ✅ 2. Ek "Creator" User Account Banayein (Optional)

Kuch features, jaise video upload karna, sirf `creator` role waale users ke liye hain.

1.  Apne deployed app ko chalaayein aur anonymously log in karein.
2.  **Firebase Console > Cloud Firestore > Data** tab par jaayein.
3.  `users` collection ko kholein aur apni User ID waala document dhoondein.
4.  Ek nayi field add karein:
    *   **Field:** `isCreator`
    *   **Type:** `boolean`
    *   **Value:** `true`

### ✅ 3. Ek TURN Server Configure Karein (Recommended)

Sabhi networks par bharosemand video/voice calls ke liye, ek TURN server ka istemal karna zaroori hai.

1.  Twilio jaisi service se TURN server credentials prapt karein.
2.  URL, username, aur password ko apne Vercel project ki settings mein Environment Variables mein add karein.
