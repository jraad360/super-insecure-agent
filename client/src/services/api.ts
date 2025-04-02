import axios from "axios";

// Use port 3000
const API_URL = "http://localhost:3000/api/agent";

// Function to validate and sanitize input
function validateAndSanitize(input: string): string {
  // Check if input is a string
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }
  
  // Check for reasonable length
  if (input.length > 5000) { // Adjust this limit based on expected usage
    throw new Error('Input exceeds maximum allowed length');
  }
  
  // Trim whitespace
  return input.trim();
}

export const agentService = {
  async generateResponse(message: string): Promise<string> {
    try {
      // Validate and sanitize input
      const sanitizedMessage = validateAndSanitize(message);
      
      const response = await axios.post(`${API_URL}/generate`, {
        input: sanitizedMessage,
        model: "gpt-3.5-turbo",
      });
      return response.data.output;
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
      // Validate and sanitize input
      const sanitizedMessage = validateAndSanitize(message);
      
      const response = await axios.post(
        `${API_URL}/stream`,
        {
          input: sanitizedMessage,
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
        onChunk(chunk);
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      throw error;
    }
  },
};