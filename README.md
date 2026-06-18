# Vedyam Learning Mode

A comprehensive spiritual and historical AI teacher platform. This project features a Python Flask backend for serving AI explanations, quizzes, Q&A, and a React (Vite) frontend for an interactive learning experience.

## Features

- **AI Explanations**: Generates structured explanations using Groq and Llama 3.
- **Interactive Quizzes**: Auto-generates Multiple Choice, True/False, and Fill-in-the-blank questions based on the topic.
- **Q&A System**: RAG-based question answering using FAISS and Sentence Transformers.
- **Spiritual Teacher Mode**: Engaging and encouraging open-ended dialogues.
- **Frontend**: A modern UI built with React, Vite, Framer Motion, and Tailwind/Vanilla CSS.

## Prerequisites

- Node.js (v18+)
- Python (3.8+)
- A Groq API Key

## Setup Instructions

### 1. Backend Setup

Navigate to the root directory and install the Python dependencies:

```bash
# Optional: Create a virtual environment
python -m venv venv
# Activate virtual environment (Windows)
venv\Scripts\activate
# Activate virtual environment (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the root directory (or update if exists) and add your Groq API Key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Run the backend server:

```bash
python backend.py
```

The backend will run at `http://localhost:5001`.

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:

```bash
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Architecture

- **Backend**: Flask server (`backend.py`) interacting with a custom `Chatbot` class (`chatbot_logic.py`). It uses FAISS for vector search and Groq's API for LLM inference.
- **Frontend**: Vite + React single page application.

## Troubleshooting

- **Vectorstore not found**: The backend will automatically try to generate or download the vectorstore cache if it's missing on initial startup.
- **Missing API Keys**: Ensure `.env` contains a valid `GROQ_API_KEY`.
