import axios from "axios";

// Use port 3000
const API_URL = "http://localhost:3000/api/agent";

export const agentService = {
  async generateResponse(message: string): Promise<string> {
    try {
      const response = await axios.post(`${API_URL}/generate`, {
        input: message,
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
        onChunk(chunk);
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      throw error;
    }
  },
};
