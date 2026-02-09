# Partners

**Partners** is a high-reasoning 'Synergy Engine' designed for the 2026 hackathon season. It goes beyond simple skill matching to find long-term co-founders by analyzing technical complementary skills, project histories, and creative vibes.

## Tech Stack

### Frontend
- **React** with **Vite**
- **TypeScript**
- **Tailwind CSS** (for styling)
- **Lucide-React** (for iconography)

### Backend
- **Python** with **FastAPI**
- **Gemini 3 Pro** (via Google GenAI SDK) with High Thinking Level & Grounding
- **Uvicorn** (ASGI server)

## Features
- **Synergy Engine**: Strict co-founder compatibility scoring using advanced AI reasoning.
- **GitHub Bio Generation**: Automated professional bios based on GitHub profile analysis.
- **Hackathon Matching**: Personalized 2026 hackathon recommendations for potential pairs.
- **Secure Authentication**: User registration and login system.

## Setup Instructions

### Backend Setup
1. Navigate to the `backend/` directory.
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file and add your `GOOGLE_API_KEY`:
   ```env
   GOOGLE_API_KEY=your_api_key_here
   ```
4. Start the backend server:
   ```bash
   python main.py
   ```

### Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---
**Author:** Yahya
