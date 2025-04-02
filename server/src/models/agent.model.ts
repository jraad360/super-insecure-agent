/**
 * Agent response generation request
 */
export interface AgentRequest {
  input: string;
  instructions?: string;
  model?: string;
}

/**
 * Agent response
 */
export interface AgentResponse {
  output: string;
  requestId?: string;
}

/**
 * Function call request
 */
export interface FunctionCallRequest extends AgentRequest {
  functions: Array<FunctionDefinition>;
}

/**
 * Function definition
 */
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Tool call response
 */
export interface ToolCallResponse {
  toolCalls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
  messageContent?: string;
  requestId?: string;
}

/**
 * Streaming response event
 */
export interface StreamEvent {
  text?: string;
  error?: string;
  index?: number;
  done?: boolean;
}
