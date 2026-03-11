<div align="center">
<img width="1200" height="475" alt="GHBanner" src="post1.jpg" />
</div>

# AI Memory Corridor | AI 记忆回廊

[English](#english) | [中文](#chinese)

---

<a id="english"></a>
## 🇬🇧 English

### 1. Project Overview
**AI Memory Corridor** is a full-stack web application that leverages Google's **Gemini AI** to analyze uploaded documents and chat histories. Users can upload or paste conversational fragments (PDFs, Word documents, Markdown files, JSON, or plain text) and the system reconstructs meaning, extracts themes, identifies sentiments, and generates interactive visualizations of the analyzed content.

Built as a graduation project, it features a deeply immersive, cyberpunk-themed UI, bilingual experience (English / Simplified Chinese), deployed on Vercel with a Supabase backend.

### 2. Feature Highlights
- **Document Upload & Text Extraction**: Supports `.pdf`, `.docx`, `.txt`, `.md`, and `.json`. In-browser parsing ensures privacy.
- **AI-Powered Analysis**: Driven by Gemini 2.5 Flash. Structured outputs including summary, key takeaways, metrics, topics, sentiment, and interactive widgets.
- **Interactive Visualizations**: Topic Word Cloud (with `d3-cloud`), Sentiment Ring Chart (with `Recharts`), and various Widgets (Timeline, Checklist, Code Snippets).
- **Corridor Guide (Follow-up Q&A)**: Integrated chatbot interface to dive deeper into the analyzed content.
- **User Authentication & History**: Powered by Supabase. Save, browse, re-enter, and manage your analysis history securely with Row-Level Security.
- **Bilingual & Cyberpunk Design**: Seamless English/Chinese toggling, complete with an animated canvas-based glowing background and glassmorphism UI.

### 3. Environment Requirements
- **Node.js**: v18 or later
- **Package Manager**: npm (or yarn / pnpm)
- **External Services**: 
  - Google Gemini API Key (Gemini 2.5 Flash)
  - Supabase Project (URL and Anon/Public Key)

### 4. Installation Steps
1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   cd AI_memory_corridor_260211
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables**:
   Create a `.env.local` file in the project root and add:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### 5. Usage Method
- **Run local development server**:
  ```bash
  npm run dev
  ```
  Open `http://localhost:5173` (or the port provided) in your browser.
- **Production Build**:
  ```bash
  npm run build
  npm run preview
  ```

### 6. Precautions
- **Security**: The Gemini API key is securely proxy-managed via serverless functions (or local Vite plugins). Never expose `GEMINI_API_KEY` to the client-side directly.
- **Supabase Configuration**: Ensure your Supabase database has an `analysis_history` table properly set up with Row-Level Security (RLS) configured for authenticated users.

### 7. License
This project is licensed under the MIT License.

---

<a id="chinese"></a>
## 🇨🇳 中文

### 1. 项目简介
**AI 记忆回廊 (AI Memory Corridor)** 是一款全栈 Web 应用程序，利用 Google 的 **Gemini AI** 分析上传的文档和聊天记录。用户可以上传或粘贴对话片段（PDF、Word 文档、Markdown 文件、JSON 或纯文本），系统会“穿行于记忆回廊”，重构上下文含义、提取主题、识别情感，并生成包含交互式数据可视化的分析报告。

本项目作为毕业设计构建，拥有深度沉浸式的赛博朋克主题用户界面，提供双语体验（英语/简体中文），并部署在 Vercel 上，以 Supabase 作为后端服务 (BaaS) 来处理身份验证和数据持久化。

### 2. 功能亮点
- **文档上传与文本提取**：支持 `.pdf`, `.docx`, `.txt`, `.md` 及 `.json` 文件。纯浏览器端解析以保证数据隐私与处理速度。
- **AI 智能分析**：基于 Gemini 2.5 Flash 驱动。输出结构化分析内容，包括摘要、核心观点、量化指标、主题词云、情感环形图及互动小组件。
- **动态可视化**：基于 `d3-cloud` 的特定排版主题词云，基于 `Recharts` 的情感甜甜圈环形图，以及时间轴、任务清单和代码片段等互动组件。
- **回廊向导（追问聊天机器人）**：内置聊天机器人界面，允许用户针对已分析的文档内容进行深度追问与交流。
- **用户认证与历史记录**：集成 Supabase Auth 和数据库，支持云端保存、浏览、重新读入或删除历史分析记录，并通过行级安全性 (RLS) 保护数据隐私。
- **双语支持与赛博朋克设计**：实时中英双语切换。采用定制化 Canvas 动画发光背景和玻璃拟物化暗色 UI 风格。

### 3. 环境要求
- **Node.js**: v18 及以上版本
- **包管理器**: npm (或 yarn / pnpm)
- **外部服务依赖**: 
  - Google Gemini API 密钥 (要求支持 Gemini 2.5 Flash)
  - Supabase 项目 (包含 URL 和 anon/public 密钥)

### 4. 安装步骤
1. **克隆代码仓库**：
   ```bash
   git clone <repository_url>
   cd AI_memory_corridor_260211
   ```
2. **安装依赖**：
   ```bash
   npm install
   ```
3. **配置环境变量**：
   在项目根目录创建 `.env.local` 文件并添加以下配置：
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### 5. 使用方法
- **启动本地开发服务器**：
  ```bash
  npm run dev
  ```
  然后在浏览器中打开 `http://localhost:5173` (或控制台提示的端口)。
- **构建生产版本并预览**：
  ```bash
  npm run build
  npm run preview
  ```

### 6. 注意事项
- **安全问题**：Gemini API 密钥已通过 Vercel Serverless Functions（或者本地的 Vite 插件）进行安全代理调用。**切勿**将 `GEMINI_API_KEY` 直接配置在向前端公开的环境变量中，以免密钥泄露。客户端仅可通过 `/api/analyze` 及 `/api/chat` 等服务端接口进行间接访问。
- **Supabase 数据表配置**：请确保你的 Supabase 数据库已正确创建了 `analysis_history` 数据表，并启用了行级安全性 (RLS)。需要正确配置访问策略（Policy），以确保每个用户只能访问和修改他们自己的分析记录数据。

### 7. 许可证
本项目采用 MIT 许可证进行开源。
