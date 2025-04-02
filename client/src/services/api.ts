import axios from "axios";

// Use port 3000
const API_URL = "http://localhost:3000/api/agent";

/**
 * Sanitizes output from AI models to prevent harmful content
 * @param content - The raw content from the AI model
 * @returns The sanitized content
 */
function sanitizeModelOutput(content: string): string {
  if (!content) return '';
  
  // Basic sanitization to prevent XSS and other injection attacks
  const sanitized = content
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove event handlers
    .replace(/on\w+="[^"]*"/gi, '')
    // Remove other potentially dangerous tags
    .replace(/<\s*\b(object|embed|applet)\b[^>]*>(.*?)<\s*\/\s*\1\s*>/gi, '');

  return sanitized;
}

export const agentService = {
  async generateResponse(message: string): Promise<string> {
    try {
      const response = await axios.post(`${API_URL}/generate`, {
        input: message,
        model: "gpt-3.5-turbo",
      });
      // Sanitize the output before returning
      return sanitizeModelOutput(response.data.output);
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
        // Sanitize each chunk before passing to the callback
        const sanitizedChunk = sanitizeModelOutput(chunk);
        onChunk(sanitizedChunk);
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      throw error;
    }
  },
};