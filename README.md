# 🏛️ MuseoAI – AI-Powered Museum Explorer

MuseoAI is a modern full-stack web application that helps users discover museums from around the world through the power of Artificial Intelligence. The platform allows visitors to explore museum information, receive personalized museum recommendations, interact with an AI museum guide, and create AI-assisted museum guides for the community.

Designed with a warm museum-inspired interface, MuseoAI combines cultural exploration with intelligent AI features to provide an engaging and personalized user experience.

---

## 🌐 Live Website

**Live Site:** https://museo-ai-client.vercel.app

---

## 💻 GitHub Repositories

**Client Repository:** https://github.com/jumana-rahman/MuseoAI-Client

**Server Repository:** https://github.com/jumana-rahman/MuseoAI-Server

---

## ✨ Key Features

- 🔐 Secure authentication using Better Auth with Google Sign-In and email/password login.
- 🏛️ Explore museums with advanced search, filtering, sorting, and pagination.
- 🤖 AI Museum Guide that answers museum-related questions with context-aware conversations.
- 🎯 AI Smart Recommendation Engine that suggests museums based on user interests and preferences.
- ✍️ AI Guide Writer that generates personalized museum visit guides with editable content.
- ❤️ Save favorite museums for quick access.
- 📝 Create, manage, and publish personal museum guides.
- 📊 Interactive statistics and visualizations using Recharts.
- ⭐ Responsive design optimized for mobile, tablet, and desktop devices.
- 🎨 Elegant museum-inspired UI featuring sandstone and rust color themes with smooth animations.

---

## 🛠️ Technologies Used

### Frontend

- React.js
- TypeScript
- Tailwind CSS
- React Router DOM
- TanStack Query
- Framer Motion
- Recharts
- React Icons

### Backend

- Node.js
- Express.js
- TypeScript

### Database

- MongoDB

### Authentication

- Better Auth
- Google Authentication

### Artificial Intelligence

- Google Gemini API

---

## 🚀 AI Features

### 🧠 AI Museum Guide
Ask questions about any museum and receive context-aware answers with conversation history.

### 🎯 AI Smart Recommendation Engine
Receive personalized museum recommendations based on your interests, travel preferences, and visit duration.

### ✍️ AI Guide Writer
Generate well-structured museum visit guides with AI assistance and customize them before publishing.

---

## 📂 Main Pages

- Home
- Explore Museums
- Museum Details
- Favorites
- Dashboard
- Add Guide
- Manage Guides
- About
- Contact
- Login & Register

---

## 🔒 Authentication Features

- Email & Password Login
- Google Sign-In
- Protected Routes
- Persistent User Session

---

## 📱 Responsive Design

MuseoAI is fully responsive and optimized for:

- Mobile Devices
- Tablets
- Laptops
- Desktop Screens

---

## 📦 Installation

### Clone the Client

```bash
git clone https://github.com/jumana-rahman/MuseoAI-Client
```

### Clone the Server

```bash
git clone https://github.com/jumana-rahman/MuseoAI-Server
```

### Install Dependencies

```bash
npm install
```

### Create Environment Variables

#### For Server:

Create a `.env` file and configure the required environment variables.

```env
PORT=5000

NODE_ENV=production

MONGODB_URI=your_mongodb_uri

DB_NAME=db_name

BETTER_AUTH_SECRET=your_secret

BETTER_AUTH_URL=http://localhost:5000

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

GOOGLE_GENAI_API_KEY=your_gemini_api_key

CLIENT_URL=http://localhost:5173
```

#### For Client:

Create a `.env` file and configure the required environment variables.

```env
VITE_API_URL=http://localhost:5000/api

VITE_AUTH_URL=http://localhost:5000
```


### Run the Development Server

```bash
npm run dev
```

---

## 📄 License

This project was developed for educational purposes as a full-stack Agentic AI application.