# AI Memory Corridor (AI 记忆回廊) — Project Introduction

## 1. Project Overview

**AI Memory Corridor** (Chinese: **AI 记忆回廊**) is a full-stack web application that leverages Google's **Gemini AI** to analyze uploaded documents and chat histories. Users upload or paste conversational fragments — such as PDFs, Word documents, Markdown files, JSON, or plain text — and the system "walks the memory corridor" to reconstruct meaning, extract themes, identify sentiments, and generate interactive visualizations of the analyzed content.

The application is built as a **graduation project** and features a deeply immersive, cyberpunk-themed user interface with a bilingual experience (English / Simplified Chinese). It is designed to be deployed on **Vercel** with **Supabase** as its backend-as-a-service for authentication and data persistence.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Core UI rendering and state management |
| **Build Tool** | Vite 6 | Fast HMR development server and production bundling |
| **Styling** | Tailwind CSS (CDN) + Custom CSS | Utility-first responsive styling with custom aura animations |
| **AI / LLM** | Gemini 1.5 Flash, GPT-4o, Deepseek, Kimi, Grok | Multi-provider document analysis and conversational follow-up |
| **Authentication** | Supabase Auth | Email/password sign-up, sign-in, and password reset |
| **Database** | Supabase (PostgreSQL + RLS) | Persistent storage of analysis history and user AI configurations |
| **Deployment** | Vercel (Serverless Functions) | Hosting + API routes for secure multi-provider AI calls |
| **Visualization** | Recharts + d3-cloud | Sentiment pie charts and word cloud topic visualizations |
| **File Parsing** | pdfjs-dist, mammoth | Client-side extraction of text from PDF and DOCX files |
| **Icons** | Lucide React | Consistent, modern iconography throughout the UI |

---

## 3. Project Architecture

### 3.1 Directory Structure

```
AI_memory_corridor_260211/
├── api/                        # Vercel Serverless Functions (backend)
│   ├── analyze.ts              # POST /api/analyze — Gemini document analysis
│   └── chat.ts                 # POST /api/chat   — Gemini follow-up Q&A
├── components/                 # React UI components
│   ├── AccountSettings.tsx     # User profile, password reset, sign-out
│   ├── AuraBackground.tsx      # Canvas-based animated cyberpunk background
│   ├── AuthPage.tsx            # Login / registration page
│   ├── HistoryPage.tsx         # Browsing & managing past analyses
│   ├── InteractiveWidget.tsx   # Checklist, code-snippet, timeline widgets
│   └── Visualization.tsx       # Word cloud (TopicCloud) and sentiment ring (SentimentRing)
├── contexts/
│   ├── AuthContext.tsx         # React Context provider for Supabase auth state
│   └── AIConfigContext.tsx     # React Context for multi-provider AI node settings
├── services/
│   ├── geminiService.ts        # Client-side fetch wrapper for /api/analyze
│   ├── historyService.ts       # CRUD operations on Supabase `analysis_history` table
│   └── supabaseClient.ts       # Supabase client initialization
├── styles/
│   └── aura.css                # Keyframe animations for expanding halo rings
├── App.tsx                     # Root application component (main page logic)
├── index.tsx                   # React DOM entry point with AuthProvider
├── index.html                  # HTML shell
├── types.ts                    # TypeScript interfaces and type definitions
├── vite.config.ts              # Vite configuration with local API proxy plugin
├── vercel.json                 # Vercel rewrite rules for SPA + API routing
├── tsconfig.json               # TypeScript compiler options
├── package.json                # Dependencies and npm scripts
└── metadata.json               # App metadata (name, description)
```

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ AuthPage │  │  App.tsx  │  │ History  │  │ AccountSettings│  │
│  │ (Login/  │  │ (Upload, │  │  Page    │  │ (Profile,     │  │
│  │ Register)│  │ Analyze, │  │ (Browse, │  │ Password      │  │
│  │          │  │ Results, │  │ Search,  │  │ Reset, Logout)│  │
│  │          │  │ Chat)    │  │ Delete)  │  │               │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
│         │              │             │               │          │
│         ▼              ▼             ▼               ▼          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Supabase Client (supabaseClient.ts)        │   │
│  │     Auth · Database (analysis_history table)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
┌──────────────┐  ┌────────────┐  ┌──────────────┐
│ Supabase     │  │  Vercel    │  │  Vercel      │
│ (Auth +      │  │ /api/      │  │ /api/chat    │
│  PostgreSQL) │  │ analyze    │  │              │
└──────────────┘  └──────┬─────┘  └──────┬───────┘
                         │               │
                         ▼               ▼
                  ┌──────────────────────────┐
                  │    Google Gemini API      │
                  │  (gemini-1.5-flash)       │
                  └──────────────────────────┘
```

---

## 4. Core Features

### 4.1 Document Upload & Text Extraction

Users can provide content to the system in two ways:

- **File Upload (Drag & Drop or Click)**: Supports `.pdf`, `.docx`, `.txt`, `.md`, and `.json` files.
  - **PDF** files are parsed client-side using `pdfjs-dist` — each page's text content is extracted sequentially.
  - **DOCX** files are parsed client-side using `mammoth` — raw text is extracted from the Word document.
  - **TXT / MD / JSON** files are read directly as text.
- **Text Paste**: Users can paste raw conversation text or any document content directly into a textarea.

Both methods can be combined — file content is appended to existing text.

### 4.2 Multi-Provider AI Analysis

When the user clicks **"Enter the Corridor"** (进入回廊), the content is sent to the selected AI provider (Gemini, OpenAI, Deepseek, Kimi, or Grok) via a secure server-side endpoint.

**Key features include:**
- **Custom AI Nodes**: Users can deploy their own API keys for various providers.
- **Connection Testing**: Integrated "Neural Link" testing to verify node connectivity.
- **System Redundancy**: Automatic fallback to the system-default Gemini (1.5 Flash) if personal nodes fail or are exhausted.
- **Bilingual Output Generation**: A single AI request now generates parallel **English and Chinese** data objects, allowing for instantaneous language switching without re-analyzing.

The AI generates a structured JSON response containing:

| Field | Description |
|---|---|
| `theme` | Category classification (e.g., `technical`, `creative`, `analytical`) |
| `en` | Full analysis object in English (title, summary, topics, sentiment, etc.) |
| `zh` | Full analysis object in Simplified Chinese |

The English/Chinese objects contain:
- `title`, `summary`, `rawContextSnippet`
- `keyTakeaways`, `metrics`, `topics` (for word cloud)
- `sentiment` (for ring chart), `aiRecommendation`
- `interactiveWidgets` (checklist, timeline)

### 4.3 Interactive Visualizations

After analysis, the results are presented through rich, interactive visualizations:

- **Topic Word Cloud** (`TopicCloud`): Built with `d3-cloud`, this component renders keywords with font sizes proportional to their frequency. It uses a seeded pseudo-random number generator for deterministic layouts, dynamic padding, and smart rotation rules (short words may rotate 90°, long words stay horizontal). Hover effects highlight individual words with neon glow.

- **Sentiment Ring Chart** (`SentimentRing`): Uses `Recharts` (`PieChart` with inner/outer radius) to display sentiment distribution as a donut chart with tooltips and legends.

- **Interactive Widgets** (`InteractiveWidget`): Three widget types are supported:
  - **Checklist**: Checkbox list of action items with custom styled checkmarks.
  - **Timeline**: Vertical timeline with neon dot markers showing chronological events.
  - **Code Snippet**: Formatted code display (filtered out from results to avoid sensitive info).

### 4.4 Follow-up Q&A Chatbot ("Corridor Guide")

After an analysis is complete, users can ask follow-up questions about the analyzed content through an integrated chatbot interface. The chatbot:

- Uses the analysis summary and the first 2000 characters of original content as context.
- Sends queries to `/api/chat` which calls Gemini's `generateContent` API with a system instruction framing the AI as the "guardian of the AI Memory Corridor."
- Provides a real-time chat experience with user/AI message bubbles, typing indicators, and smooth scroll.

### 4.5 User Authentication

The application includes a full authentication system powered by **Supabase Auth**:

- **Registration**: Email and password sign-up with email verification.
- **Login**: Email and password sign-in.
- **Password Recovery**: Email-based password reset flow — sends a reset link to the user's registered email. Upon clicking the link, the user is redirected to the app in "recovery mode" where they can directly set a new password.
- **Sign Out**: Session termination.

All auth state is managed via React Context (`AuthContext.tsx`) and propagated through the component tree via `AuthProvider`.

### 4.6 Analysis History

Authenticated users' analyses are automatically persisted to a Supabase `analysis_history` table:

- **Save**: After each successful analysis, the result (title, theme, summary, content snippet, full JSON result) is stored in the database.
- **Browse**: The History Page displays all past analyses with search functionality, theme badges, and timestamps.
- **Re-enter**: Users can reload any past analysis and view its full results and visualizations.
- **Delete**: Individual records can be permanently deleted with confirmation.

The database uses **Row-Level Security (RLS)** policies to ensure users can only access their own data.

### 4.7 Bilingual Support (i18n)

The entire application supports **English** and **Simplified Chinese** (中文简体). A language toggle is available in the header across all pages. Translation objects (`TRANSLATIONS`, `AUTH_TRANSLATIONS`, `HISTORY_TRANSLATIONS`, `SETTINGS_TRANSLATIONS`) provide localized strings for all UI elements. The AI analysis output language also switches based on the selected language.

### 4.8 Cyberpunk Visual Design

The application features a meticulously crafted **cyberpunk / digital consciousness** aesthetic:

- **AuraBackground**: A canvas-based animated background rendering expanding halo rings with organic wave deformations, conic gradient colors (Cyan, Neon Purple, Deep Blue, Cyber Pink), and additive screen blending for a glowing effect. Rings spawn periodically, fade in/out, and expand across the viewport.
- **Custom CSS Animations**: `aura.css` defines `expand-and-fade` and `fluid-shape` keyframe animations for organic morphing ring effects.
- **Dark Theme**: Base `bg-zinc-950` with glassmorphism effects (`backdrop-blur`, translucent backgrounds), neon accent colors (indigo, violet, emerald), and deep shadows.
- **Rounded Design Language**: Cards use extreme border-radius values (`rounded-[3rem]`, `rounded-[3.5rem]`), creating a soft, futuristic look.

---

## 5. API Endpoints

### 5.1 `POST /api/analyze` (Vercel Serverless Function)

**Purpose**: Analyzes uploaded document/chat content using Gemini AI.

| Parameter | Type | Description |
|---|---|---|
| `content` | `string` | The text content to analyze |
| `language` | `'en' \| 'zh'` | Output language preference |
| `userConfig` | `object` | Optional custom node config (provider, apiKey) |

**Returns**: A JSON object containing a global `theme` and two localized analysis objects (`en` and `zh`).

**Security**: AI API keys are either stored as server-side environment variables or provided by the user and transmitted securely via HTTPS. In local development, a custom Vite plugin handles the secure proxying.

### 5.2 `POST /api/chat` (Vercel Serverless Function)

**Purpose**: Handles follow-up Q&A about analyzed content.

| Parameter | Type | Description |
|---|---|---|
| `message` | `string` | The user's question |
| `systemInstruction` | `string` | Context instruction for the AI (includes summary + source content) |

**Returns**: `{ text: string }` — the AI's response.

---

## 6. Database Schema

### `analysis_history` Table (Supabase / PostgreSQL)

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` (PK) | Auto-generated unique identifier |
| `user_id` | `uuid` (FK → auth.users) | References the authenticated user |
| `title` | `text` | AI-generated title of the analysis |
| `theme` | `text` | Classification theme (technical, creative, etc.) |
| `summary` | `text` | AI-generated summary |
| `content_snippet` | `text` | First 500 characters of the original input |
| `full_result` | `jsonb` | Complete `AnalysisResult` JSON object |
| `created_at` | `timestamptz` | Auto-generated creation timestamp |

**Row-Level Security Policies** ensure each user can only SELECT, INSERT, UPDATE, and DELETE their own records.

---

## 7. TypeScript Type Definitions

The `types.ts` file defines the core data structures used throughout the application:

```typescript
AnalysisStatus  // Enum: IDLE, LOADING, SUCCESS, ERROR
Language         // Type: 'en' | 'zh'
ChatMetric       // { label, value, unit }
TopicData        // { name, count }
SentimentData    // { name, value }
AnalysisSource   // { title, uri }
AnalysisResult   // Full analysis result (title, theme, summary, metrics, topics, etc.)
AppState         // Application state (content, status, error, result, language)
```

---

## 8. Key Design Decisions

### 8.1 Server-Side API Key Management
The Gemini API key is **never sent to the browser**. Both analysis and chat requests are proxied through Vercel Serverless Functions (or a local Vite middleware in development), which inject the API key server-side. This prevents the `"An API Key must be set when running in a browser"` error and protects the key from exposure.

### 8.2 Client-Side File Parsing
PDF and DOCX file parsing is performed **entirely in the browser** using `pdfjs-dist` and `mammoth`. This design:
- Avoids uploading potentially large files to a server.
- Reduces server costs and latency.
- Keeps sensitive document content out of server logs.

### 8.3 Deterministic Word Cloud Layout
The `TopicCloud` component uses a **seeded pseudo-random number generator** (`seededRandom(42)`) with `d3-cloud` to produce consistent, deterministic word cloud layouts. This means the same data will always render the same visual arrangement, avoiding jarring layout shifts on re-renders.

### 8.4 Dual Development/Production API Strategy
- **Local Development**: A custom Vite plugin (`localApiPlugin` in `vite.config.ts`) intercepts `/api/analyze` requests and calls the Gemini API directly, mirroring the production API logic.
- **Production (Vercel)**: The `api/` directory is automatically deployed as Vercel Serverless Functions. `vercel.json` rewrites ensure `/api/*` routes hit these functions while all other routes serve the SPA.

---

## 9. Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Server-side (`.env.local` / Vercel env) | API key for Google Gemini API |
| `VITE_SUPABASE_URL` | Client-side (`.env.local`) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client-side (`.env.local`) | Supabase anonymous/public key |

---

## 10. Running the Project

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables in .env.local
# GEMINI_API_KEY=your-gemini-api-key
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# 3. Start development server (port 3000)
npm run dev
```

### Production Build

```bash
npm run build    # Outputs to /dist
npm run preview  # Preview the production build locally
```

### Deployment (Vercel)

1. Connect the GitHub repository to Vercel.
2. Set environment variables (`GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel dashboard.
3. Vercel automatically deploys the frontend and serverless API routes.

---

## 11. Component Reference

| Component | File | Description |
|---|---|---|
| `App` | `App.tsx` | Root component — handles view routing (app/history/settings), file upload, analysis trigger, results display, chatbot, and language toggle |
| `AuthPage` | `components/AuthPage.tsx` | Login and registration forms with validation, error/success feedback, and password visibility toggle |
| `AccountSettings` | `components/AccountSettings.tsx` | User profile display, email-based password reset, direct password update (recovery mode), and sign-out |
| `HistoryPage` | `components/HistoryPage.tsx` | Paginated list of past analyses with search, theme badges, timestamps, re-entry, and deletion |
| `AuraBackground` | `components/AuraBackground.tsx` | Full-screen canvas-rendered animated background with cyberpunk neon ring effects |
| `Visualization` | `components/Visualization.tsx` | `TopicCloud` (d3-cloud word cloud) and `SentimentRing` (Recharts donut chart) |
| `InteractiveWidget` | `components/InteractiveWidget.tsx` | Renders checklist, code-snippet, or timeline widgets based on AI analysis output |
| `AuthProvider` | `contexts/AuthContext.tsx` | React Context wrapping the app with Supabase auth state and action methods |

---

## 12. Summary

**AI Memory Corridor** transforms raw conversational and document data into structured, visually rich insights using the power of Google Gemini AI. It combines a stunning cyberpunk aesthetic with practical NLP analysis features — including topic extraction, sentiment analysis, interactive widgets, and conversational follow-up — all wrapped in a secure, authenticated, bilingual web application deployed on modern cloud infrastructure (Vercel + Supabase).
