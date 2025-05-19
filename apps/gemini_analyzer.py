# -*- encoding: utf-8 -*-
import google.generativeai as genai
from flask import current_app
import mimetypes

def analyze_image_with_gemini(image_path, custom_prompt=None):
    api_key = current_app.config.get('GEMINI_API_KEY')
    if not api_key:
        current_app.logger.error("GEMINI_API_KEY not configured.")
        return "Error: Gemini API key not configured."

    genai.configure(api_key=api_key)

    # Use custom prompt if provided, otherwise use default from config
    prompt = custom_prompt if custom_prompt else current_app.config.get('GEMINI_DEFAULT_PROMPT')

    try:
        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(image_path)
        if not mime_type or not mime_type.startswith('image'):
            current_app.logger.error(f"Invalid image MIME type: {mime_type} for file {image_path}")
            return "Error: Invalid image file type."

        current_app.logger.info(f"Uploading image {image_path} with MIME type {mime_type} to Gemini.")
        
        model = genai.GenerativeModel(current_app.config.get('GEMINI_MODEL_NAME', 'gemini-pro-vision'))

        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        
        image_parts = [
            {
                "mime_type": mime_type,
                "data": image_bytes
            }
        ]

        current_app.logger.info(f"Sending prompt to Gemini: {prompt}")
        response = model.generate_content([prompt, image_parts[0]]) 

        if response and response.text:
            current_app.logger.info("Successfully received analysis from Gemini.")
            return response.text
        else:
            current_app.logger.error(f"Gemini API returned an empty response or no text. Parts: {response.parts if response else 'N/A'}")

            error_details = "Unknown error from Gemini."
            if response and response.prompt_feedback and response.prompt_feedback.block_reason:
                 error_details = f"Blocked: {response.prompt_feedback.block_reason_message}"
            elif response and not response.text and response.candidates:
                 # Check if there's content in candidates but not directly in .text
                 if response.candidates[0].content and response.candidates[0].content.parts:
                     current_app.logger.warning("Gemini response.text is empty but candidates have content. Check API documentation for model.")
                 if response.candidates[0].finish_reason != 'STOP':
                     error_details = f"Finished with reason: {response.candidates[0].finish_reason}"


            return f"Error: Gemini analysis failed. {error_details}"

    except Exception as e:
        current_app.logger.error(f"Error during Gemini analysis: {e}", exc_info=True)
        return f"Error: An exception occurred during Gemini analysis: {str(e)}"
