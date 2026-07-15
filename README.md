<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <h1>Zalo Mini App - Backend Platform</h1>
  <p><em>A robust, scalable backend and admin dashboard for Zalo Mini App integration.</em></p>
</div>

---

## 📖 Overview

This repository contains the backend infrastructure and integrated web application for the Zalo Mini App. It is built to provide all the necessary APIs and services to run the application seamlessly, along with a modern admin interface.

🔗 **View your app in AI Studio:** [AI Studio App Link](https://ai.studio/apps/c14fd656-5c3e-43c1-bcec-c6d02175f12d)

## ✨ Key Features

- **Robust API Server:** Built on Express and Node.js for high performance.
- **AI Integration:** Seamlessly powered by Google Gemini (`@google/genai`).
- **Flexible Data Storage:** Utilizes NeDB for local file-based storage and Mongoose for MongoDB integration.
- **Integrated Admin Panel:** A rich, responsive UI built with React, Vite, and Tailwind CSS.
- **Data Visualization & Rich Text:** Includes Recharts for analytics and React-Quill for rich text editing.

## 🛠️ Tech Stack

- **Core:** Node.js, TypeScript (`tsx`)
- **Backend Framework:** Express.js, Multer (File Uploads)
- **Frontend/Admin:** React, Vite, Tailwind CSS, Framer Motion, Lucide React
- **Database Layer:** NeDB (`nedb-promises`), Mongoose
- **AI Capabilities:** Google GenAI

## 🚀 Getting Started

Follow these instructions to set up and run the project locally on your machine.

### Prerequisites

- **Node.js** (v18.x or higher recommended)
- **npm** or **yarn**

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   You need to set up your environment variables before running the app. Copy the provided example to create your own `.env` file:
   ```bash
   cp .env.example .env
   ```
   **Important:** Open the `.env` file and set your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running the Application

To start the development server, run the following command:

```bash
npm run dev
```

This will spin up the backend server along with the integrated frontend environment.

## 📜 Available Scripts

- `npm run dev`: Starts the application in development mode using `tsx`.
- `npm run build`: Compiles the Vite frontend for production.
- `npm run preview`: Previews the production build locally.
- `npm run clean`: Clears the compiled `dist` directory.
- `npm run lint`: Runs TypeScript compiler for type checking (`tsc --noEmit`).

---
<div align="center">
  <i>Built for Zalo Mini App</i>
</div>
