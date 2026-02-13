try:
    import google.generativeai as genai
    AI_AVAILABLE = True
    print("Google Generative AI imported successfully")
except ImportError as e:
    genai = None
    AI_AVAILABLE = False
    print(f"Failed to import Google Generative AI: {e}")

from django.conf import settings
import asyncio
import time
import logging

logger = logging.getLogger(__name__)

# Cache for AI availability check
_ai_status_cache = {
    'last_check': 0,
    'available': False,
    'message': 'AI status not checked yet'
}
CACHE_DURATION = 300  # 5 minutes

def is_gemini_available() -> tuple[bool, str]:
    """
    Check if Gemini API is available and working.
    
    Returns:
        tuple: (available: bool, message: str)
        
    Caches result for 5 minutes to avoid repeated API calls.
    """
    current_time = time.time()
    
    # Return cached result if still valid
    if current_time - _ai_status_cache['last_check'] < CACHE_DURATION:
        return _ai_status_cache['available'], _ai_status_cache['message']
    
    # Check if API key is configured
    if not settings.GEMINI_API_KEY or not AI_AVAILABLE:
        # Demo mode: simulate AI being available for science fair demo
        _ai_status_cache.update({
            'last_check': current_time,
            'available': True,  # Changed to True for demo
            'message': 'Demo mode: AI features enabled (using simulated responses)'
        })
        return True, 'Demo mode: AI features enabled (using simulated responses)'
    
    try:
        # Try to configure and test the API
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Simple test call to verify API works
        test_response = model.generate_content("Test connection - respond with 'OK'")
        
        if test_response and test_response.text:
            _ai_status_cache.update({
                'last_check': current_time,
                'available': True,
                'message': 'Gemini API ready'
            })
            logger.info("Gemini API status: available")
            return True, 'Gemini API ready'
        else:
            _ai_status_cache.update({
                'last_check': current_time,
                'available': False,
                'message': 'Gemini API returned empty response'
            })
            return False, 'Gemini API returned empty response'
            
    except Exception as e:
        if AI_AVAILABLE:
            try:
                # Try to catch specific genai exceptions
                if hasattr(genai, 'types') and hasattr(genai.types, 'generation_types'):
                    if isinstance(e, genai.types.generation_types.BlockedPromptException):
                        _ai_status_cache.update({
                            'last_check': current_time,
                            'available': False,
                            'message': f'Gemini API blocked: {str(e)}'
                        })
                        return False, f'Gemini API blocked: {str(e)}'
                    elif isinstance(e, genai.types.generation_types.StopCandidateException):
                        _ai_status_cache.update({
                            'last_check': current_time,
                            'available': False,
                            'message': f'Gemini API stopped: {str(e)}'
                        })
                        return False, f'Gemini API stopped: {str(e)}'
            except:
                pass
        
        error_msg = str(e).lower()
        if 'api_key' in error_msg or 'invalid' in error_msg:
            message = 'Invalid Gemini API key'
        elif 'quota' in error_msg or 'rate' in error_msg:
            message = 'Gemini API quota exceeded'
        elif 'network' in error_msg or 'connection' in error_msg:
            message = 'Network connection error'
        else:
            message = f'Gemini API error: {str(e)}'
            
        _ai_status_cache.update({
            'last_check': current_time,
            'available': False,
            'message': message
        })
        logger.warning(f"Gemini API status: unavailable - {message}")
        return False, message

async def get_ai_suggestion(prompt: str, model: str = "gemini-1.5-flash") -> str:
    """
    Get AI suggestion.
    
    Always tries to use real API if key is configured, falls back to demo if API fails.
    """
    # Check if we have an API key
    if not settings.GEMINI_API_KEY:
        # Demo mode: provide simulated AI responses
        return get_demo_ai_response(prompt)
    
    try:
        if not AI_AVAILABLE:
            raise Exception("AI library not available")
        
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
        logger.error(f"AI suggestion error: {e}")
        # Return error message instead of demo response
        return f"AI service temporarily unavailable. Error: {str(e)}. Please contact support if this persists."


def get_demo_ai_response(prompt: str) -> str:
    """
    Provide simulated AI responses for demo purposes when no API key is configured or API fails.
    """
    prompt_lower = prompt.lower()
    
    # Check if this is a chat prompt (contains medical knowledge assistant)
    if "medical knowledge assistant" in prompt_lower:
        # Extract the last user message
        if "User: " in prompt:
            # Get the last user message
            user_part = prompt.split("User: ")[-1]
            last_message = user_part.split("\n")[0].lower().strip()
            
            if "hello" in last_message or "hi" in last_message:
                return "Hello! I'm your AI Medical Assistant. I can help with general medical information, symptom analysis, and healthcare guidance. Please remember that I'm not a substitute for professional medical advice. How can I assist you today?"
            elif "how are you" in last_message or "how are u" in last_message:
                return "I'm functioning optimally, thank you for asking! As an AI assistant, I'm always ready to help with medical information and guidance. What medical questions can I help you with today?"
            elif "name" in last_message or "what's your name" in last_message or "whats ur name" in last_message or "what is your name" in last_message:
                return "I'm your AI Medical Assistant, designed to provide general medical information and support for healthcare professionals. I don't have a personal name, but I'm here to help with medical knowledge and guidance."
            elif "symptom" in last_message or "pain" in last_message:
                return "I understand you're asking about symptoms. While I can provide general information, please remember that I'm not a substitute for professional medical advice. For any health concerns, please consult with a qualified healthcare professional. Can you tell me more about what you're experiencing?"
            else:
                return "Thank you for your question. As an AI medical assistant, I can provide general information about medical topics, but please remember that this is not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare professionals for medical concerns. How else can I help you?"
        else:
            return "Hello! I'm your AI Medical Assistant. I can help with general medical information, symptom analysis, and healthcare guidance. Please remember that I'm not a substitute for professional medical advice. How can I assist you today?"
    
    # Triage responses based on symptoms
    if "chest pain" in prompt_lower or "difficulty breathing" in prompt_lower:
        return """Based on the symptoms described (chest pain, difficulty breathing), I recommend:

**Priority Level: Critical**
**Reasoning:** These symptoms suggest a potential cardiac or respiratory emergency requiring immediate attention.

**Recommended Actions:**
- Immediate triage to emergency department
- ECG monitoring
- Oxygen saturation assessment
- Blood pressure monitoring

**Disclaimer:** This is a simulated AI response for demonstration purposes. In a real medical setting, consult qualified healthcare professionals for proper diagnosis and treatment."""
    
    elif "fever" in prompt_lower and ("headache" in prompt_lower or "vomiting" in prompt_lower):
        return """Based on the symptoms described (high fever, severe headache, vomiting), I recommend:

**Priority Level: High**
**Reasoning:** These symptoms could indicate meningitis, dehydration, or other serious conditions requiring prompt medical evaluation.

**Recommended Actions:**
- Vital signs monitoring
- Neurological assessment
- Hydration status evaluation
- Possible lumbar puncture if meningitis suspected

**Disclaimer:** This is a simulated AI response for demonstration purposes. In a real medical setting, consult qualified healthcare professionals for proper diagnosis and treatment."""
    
    elif "broken" in prompt_lower or "fracture" in prompt_lower:
        return """Based on the symptoms described (suspected fracture), I recommend:

**Priority Level: Medium**
**Reasoning:** Fractures require proper immobilization and pain management, but are typically not immediately life-threatening.

**Recommended Actions:**
- X-ray imaging
- Pain assessment and management
- Splinting/immobilization
- Neurovascular assessment

**Disclaimer:** This is a simulated AI response for demonstration purposes. In a real medical setting, consult qualified healthcare professionals for proper diagnosis and treatment."""
    
    else:
        return """Based on the symptoms described, I recommend:

**Priority Level: Low**
**Reasoning:** Symptoms appear stable and non-urgent at this time.

**Recommended Actions:**
- Routine vital signs assessment
- Symptom monitoring
- Basic triage evaluation
- Follow-up as needed

**Disclaimer:** This is a simulated AI response for demonstration purposes. In a real medical setting, consult qualified healthcare professionals for proper diagnosis and treatment."""