# Super Insecure Agent

A Node.js and TypeScript-based AI agent using OpenAI's latest APIs.

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

## License

MIT
