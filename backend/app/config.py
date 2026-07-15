import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-default-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-super-secret-key")
    
    # Supabase Postgres connection string
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    # Fix for Supabase postgres:// -> postgresql://
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # API endpoints
    HF_CHATBOT_URL = os.getenv("HF_CHATBOT_URL", "https://vijayyh-vedyamchatbot1-0-0.hf.space")
    FRONTEND_DIR = os.getenv("FRONTEND_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../website/frontend")))
    
    # App variables
    APP_NAME = "Vedyam Backend"
    PORT = int(os.getenv("PORT", 5000))
    HOST = "0.0.0.0"
