# StudyVerse AI

Smart AI Academic Command Center for Students

## Features

- AI Tutor Chat
- Document Upload & RAG-based Q&A
- Flashcard Generation
- Quiz Generation
- Mind Map Creation
- Image Analysis with AI Vision
- Study Poster Generator
- AI Agent Task Execution

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
API_KEY=api_key_here
API_BASE_URL=https://apidev.navigatelabsai.com
PORT=3000
```

3. Run the server:
```bash
npm start
```

4. Open http://localhost:3000

## Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `API_KEY`: API key
   - `API_BASE_URL`: URL_LINK
   - `NODE_ENV`: production
4. Deploy!

## Tech Stack

- Node.js + Express
- NavigateLabs Nexus AI (OpenAI-compatible)
- TF-IDF Vector Search for RAG
- PDF & DOCX parsing
- Vanilla JavaScript frontend
