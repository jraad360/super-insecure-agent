# Super Insecure Agent

A Node.js and TypeScript-based AI agent using OpenAI's latest APIs, designed to demonstrate AI agent security vulnerabilities.

## About This Project

This project was created to demonstrate AI Agent security vulnerabilities for the OWASP Gen AI Security Project's NYC Insecure Agents Hackathon, hosted by Pensar. The purpose is to showcase potential security threats in agentic AI systems and contribute to the OWASP Agentic Security Initiative's efforts to educate the community about top agentic threats.

The repository serves as an educational tool to understand how vulnerabilities in AI agents can be exploited, helping developers build more secure AI systems in the future.

## Security Vulnerabilities Demonstrated

This project intentionally includes vulnerabilities for educational purposes:

### Memory Injection

The agent implementation demonstrates how an attacker can manipulate the agent's memory, potentially causing it to:

- Remember false information about users
- Make decisions based on injected memories
- Leak sensitive information stored in memory
