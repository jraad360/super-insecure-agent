import axios from "axios";

// Use port 3000
const API_URL = "http://localhost:3000/api/agent";

/**
 * Validates and sanitizes AI model output to prevent manipulation
 * @param output The raw output from the AI model
 * @returns Sanitized output string
 */
function validateAndSanitizeOutput(output: any): string {
  // Check if output is present and is a string
  if (!output || typeof output !== 'string') {
    throw new Error('Invalid AI model output format');
  }

  // Sanitize the output
  // 1. Remove any potentially harmful script tags
  let sanitized = output.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 2. Remove potential command injection patterns
  sanitized = sanitized.replace(/[;&|`()\$]/g, '');
  
  // 3. Limit the output length to prevent DoS
  const MAX_LENGTH = 10000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + '... (output truncated for security)';
  }

  return sanitized;
}

export const agentService = {
  async generateResponse(message: string): Promise<string> {
    try {
      const response = await axios.post(`${API_URL}/generate`, {
        input: message,
        model: "gpt-3.5-turbo",
      });
      
      // Validate and sanitize before returning
      return validateAndSanitizeOutput(response.data.output);
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  },

  async streamResponse(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    try {
      const response = await axios.post(
        `${API_URL}/stream`,
        {
          input: message,
          model: "gpt-3.5-turbo",
        },
        {
          responseType: "stream",
        }
      );

      const reader = response.data.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Validate and sanitize each chunk before passing to callback
        onChunk(validateAndSanitizeOutput(chunk));
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      throw error;
    }
  },
};