# Super Insecure Agent

A Node.js and TypeScript-based AI agent using OpenAI's latest APIs, designed to demonstrate AI agent security vulnerabilities.

## About This Project

This project was created to demonstrate AI Agent security vulnerabilities such as memory injection for the OWASP Gen AI Security Project's NYC Insecure Agents Hackathon (April 1, 2025). The purpose is to showcase potential security threats in agentic AI systems and contribute to the OWASP Agentic Security Initiative's efforts to educate the community about top agentic threats.

The hackathon was supported by several organizations including Pensar, Pydantic, SpIxAI, and Mastra, with teams from security vendors like Pensar helping participants identify vulnerabilities in their agent implementations.

The repository serves as an educational tool to understand how vulnerabilities in AI agents can be exploited, helping developers build more secure AI systems in the future.

## Security Vulnerabilities Demonstrated

This project intentionally includes vulnerabilities for educational purposes:

### Memory Injection

The agent implementation demonstrates how an attacker can manipulate the agent's memory, potentially causing it to:

- Remember false information about users
- Make decisions based on injected memories
- Leak sensitive information stored in memory

These vulnerabilities are aligned with the threats identified in the OWASP Agentic Security Initiative's Threats and Mitigations Guide.

## Project Structure

The project is divided into two parts:

- `client` - A TypeScript client for interacting with the server (to be implemented)
- `server` - A Node.js/Express server that provides an API for the AI agent

## Features

- AI Agent powered by OpenAI's latest models
- RESTful API for agent interaction
- Support for streaming responses
- Function calling capabilities
- Modular architecture

## Server API Endpoints

- `POST /api/agent/generate` - Generate a response from the agent
- `POST /api/agent/stream` - Stream a response from the agent
- `POST /api/agent/function-call` - Make a function call through the agent

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- An OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/super-insecure-agent.git
cd super-insecure-agent
```

2. Install dependencies for the server:

```bash
cd server
npm install
```

3. Create a `.env` file in the server directory:

```
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
LOG_LEVEL=info
```

4. Start the server in development mode:

```bash
npm run dev
```

## Using the API

### Generate a Response

```bash
curl -X POST http://localhost:3000/api/agent/generate \
  -H "Content-Type: application/json" \
  -d '{"input": "Tell me about AI agents", "instructions": "You are a helpful assistant specializing in AI", "model": "gpt-4o"}'
```

### Stream a Response

```bash
curl -X POST http://localhost:3000/api/agent/stream \
  -H "Content-Type: application/json" \
  -d '{"input": "Write a short story about AI", "instructions": "You are a creative storyteller", "model": "gpt-4o"}'
```

### Function Call

```bash
curl -X POST http://localhost:3000/api/agent/function-call \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What is the weather in New York?",
    "functions": [
      {
        "name": "get_weather",
        "description": "Get the current weather in a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. San Francisco, CA"
            }
          },
          "required": ["location"]
        }
      }
    ]
  }'
```

## Disclaimer

This project contains intentionally vulnerable code for educational purposes only. Do not use this code in production environments. The vulnerabilities demonstrated here are meant to raise awareness about security issues in AI agent implementations.

## References

- [OWASP Agentic Security Initiative](https://owasp.org/www-project-agentic-security/)
- [OWASP Gen AI Security Project](https://owasp.org/www-project-gen-ai-security/)
- [OWASP Agentic Security Threats and Mitigations Guide](https://owasp.org/www-project-agentic-security/resources)

## License

MIT
