import google.generativeai as genai
from django.conf import settings
import asyncio

async def get_ai_suggestion(prompt: str, model: str = "gemini-1.5-flash") -> str:
    if not settings.GEMINI_API_KEY:
        return "AI feature temporarily unavailable — using rule-based priority. IMPORTANT: This is NOT real medical advice. Consult qualified medical professionals."
    
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_instance = genai.GenerativeModel(model)
        system_prompt = (
            "You are an AI assistant for a hospital resource allocation system. "
            "Provide suggestions based on the given data. "
            "IMPORTANT: This is NOT real medical advice. All suggestions are for educational and demonstration purposes only. "
            "Consult qualified medical professionals for any real health decisions. "
            "Do not diagnose or treat patients."
        )
        full_prompt = f"{system_prompt}\n\n{prompt}"
        response = await asyncio.to_thread(model_instance.generate_content, full_prompt)
        return response.text.strip()
    except Exception as e:
        return "AI feature temporarily unavailable — using rule-based priority. IMPORTANT: This is NOT real medical advice. Consult qualified medical professionals."