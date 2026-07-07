# AI Resume Checker & Mock Interview simulation Agent

**Live Production Link**: [https://ai-resume-checker-delta.vercel.app](https://ai-resume-checker-delta.vercel.app)

A premium, modern web application designed to help job seekers optimize their resumes for Applicant Tracking Systems (ATS) and conduct realistic, voice-enabled mock interviews with an AI technical recruiter.

## 🚀 Key Features

* **ATS Resume Analysis**: Upload resumes to parse content and evaluate match ratings, keyword analysis, formatting checks, and structural insights.
* **Interactive Mock Interviews**: Engage in real-time, professional technical interviews tailored to your target company, job description, and resume history.
* **Zoom-Style Video Meeting Layout**:
  * **Alex (AI Recruiter)**: Displays a pulsing voice waveform ring that synchronizes dynamically with Alex's speech, including subtitles overlay.
  * **Candidate Live Feed**: Mirrors your camera locally in real-time with an active live indicator.
* **Hands-Free Speech Integration**:
  * **Text-to-Speech (TTS)**: Alex reads interview questions aloud automatically using high-quality natural voices.
  * **Speech-to-Text (STT)**: Dictate responses directly through your microphone using built-in speech recognition.
  * **Auto-Mute Control**: Audio output automatically pauses when candidate dictation is active to prevent sound loops.
* **Persistent Preferences**: Remembers your volume/mute preferences across interview sessions and page reloads.
* **Detailed Evaluation Report**: Receive detailed question-by-question critiques, strength breakdowns, improvement indicators, and an overall assessment score out of 100.

## 🛠️ Tech Stack

* **Frontend**: React, Vite, TailwindCSS, Lucide Icons, Axios, TanStack React Query
* **Backend**: Node.js, Express.js, MongoDB (Mongoose), Zod validation
* **AI Orchestration**: Google Gemini 1.5/2.5 Flash, Web Speech API (SpeechSynthesis & webkitSpeechRecognition)

## 📦 Getting Started

### 1. Prerequisites
* Node.js (v18+)
* MongoDB (Local instance or Atlas URI)
* Gemini API Key (Get one from [Google AI Studio](https://aistudio.google.com/))

### 2. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `Backend` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27917/resume_checker
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd Frontend/AIResumeChecker/AIResumeChecker
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🔒 License
Distributed under the MIT License. See `LICENSE` for more information.
