# 🔍 Image Detective AI

An AI-powered image recognition app that identifies **movies, songs, websites, people, products & places** from any uploaded image. Built with React + Vite + Tailwind CSS, powered by OpenAI's GPT-4 Vision.

![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38BDF8)

## ✨ Features

- 📸 **Multi-input upload** — click, drag & drop, or paste (`Ctrl+V`) any image
- 🎬 **Movie / TV show recognition** — get title, year, director, cast, and streaming links (IMDB, Netflix, etc.)
- 🎵 **Song identification** — from album covers → artist, album, Spotify / YouTube links
- 🌐 **Website / App detection** — from screenshots → name, description, direct URL
- 👤 **People, Products, Places** — flexible identification for any subject
- 📚 **Search history** — everything saved in `localStorage` with quick re-access
- 🎨 **Beautiful UI** — playful colored badges, hairline borders, smooth motion
- 🌗 **Fast** — lightweight bundle, instant feedback, no backend required

## 🚀 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/showab/image-detective-ai.git
cd image-detective-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your OpenAI API key

Copy `.env.example` to `.env` and add your key:

```bash
cp .env.example .env
```

Then edit `.env`:

```
VITE_OPENAI_API_KEY=sk-your-key-here
```

> Get an API key at https://platform.openai.com/api-keys

### 4. Run the dev server

```bash
npm run dev
```

Open http://localhost:5173

### 5. Build for production

```bash
npm run build
npm run preview
```

## 🛠 Tech Stack

- **React 18** — UI framework
- **Vite 5** — blazing-fast build tool
- **Tailwind CSS 3** — utility-first styling
- **Lucide React** — beautiful icons
- **OpenAI GPT-4o Vision** — image analysis

## 📸 How It Works

1. User uploads/pastes/drags an image
2. Image is converted to base64 and sent to OpenAI GPT-4o with a structured prompt
3. Model returns a JSON payload — `type`, `title`, `description`, `details[]`, `sources[]`, `confidence`
4. UI renders the result with colored type badges, detail grid, and clickable source links
5. Result is saved to `localStorage` for the history tab

## ⚠️ Security Note

This app calls the OpenAI API directly from the browser using `dangerouslyAllowBrowser: true`. **Do NOT deploy the raw code publicly with your key** — for production, proxy the calls through a backend server so the key stays private.

## 📜 License

MIT © [Showab Ahammad](https://github.com/showab)

## 🙌 Credits

Developed by **Showab Ahammad** — [Novixa AI](https://novixaai.page.gd)
