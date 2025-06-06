import { tool, type CoreTool } from 'ai';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { cookies } from 'next/headers';
import type { ChatAgentId } from './agents/agents';

/*export const getEmberLending = tool({
  description: 'Get the current weather at a location',
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  execute: async ({ latitude, longitude }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
    );

    const weatherData = await response.json();
    return weatherData;
  },
}); */

const DEFAULT_SERVER_URLS = new Map<ChatAgentId, string>([

  ['ember-aave', 'http://173.230.139.151:3010/sse'],
  ['ember-camelot', 'http://173.230.139.151:3011/sse'],
  ['ember-lp', 'http://173.230.139.151:3012/sse'],
  ['ember-pendle', 'http://173.230.139.151:3013/sse'],

]);
const URL_CHAT_IDS = new Map<string, ChatAgentId>();
DEFAULT_SERVER_URLS.forEach((value, key) => URL_CHAT_IDS.set(value, key));

const convertToZodSchema = (schema: any): z.ZodSchema => {
  if (!schema) return z.object({});

  // If it's already a Zod schema, return it
  if (schema._def !== undefined) return schema;

  // For an object schema, convert properties
  if (schema.type === 'object' && schema.properties) {
    const zodProperties: { [key: string]: z.ZodTypeAny } = {};
    Object.entries(schema.properties).forEach(
      ([key, propSchema]: [string, any]) => {
        switch (propSchema.type) {
          case 'string':
            zodProperties[key] = z.string();
            break;
          case 'number':
            zodProperties[key] = z.number();
            break;
          case 'boolean':
            zodProperties[key] = z.boolean();
            break;
          default:
            // Default to any for complex types
            zodProperties[key] = z.any();
        }
      },
    );
    return z.object(zodProperties);
  }

  // Default fallback
  return z.object({});
};

async function getTool(serverUrl: string) {
  let mcpClient = null;

  // Create MCP Client
  mcpClient = new Client(
    { name: 'TestClient', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );

  // Create SSE transport
  let transport = null;
  if (serverUrl) {
    transport = new SSEClientTransport(new URL(serverUrl));
  }

  // Connect to the server
  if (transport) {
    await mcpClient.connect(transport);
    console.log('MCP client initialized successfully!');
  }

  // Try to discover tools
  console.log('Attempting to discover tools via MCP client...');
  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let toolsResponse;
  try {
    toolsResponse = await mcpClient.listTools();
    console.log(toolsResponse);
  } catch (error) {
    console.error('Error discovering tools:', error);
    toolsResponse = { tools: [] }; // Fallback to empty tools array
  }

  // Use reduce to create an object mapping tool names to AI tools
  const toolObject = toolsResponse.tools.reduce(
    (acc, mcptool) => {
      // Convert MCP tool schema to Zod schema
      const aiTool = tool({
        description: mcptool.description,
        parameters: convertToZodSchema(mcptool.inputSchema),
        execute: async (args) => {
          console.log('Executing tool:', mcptool.name);
          console.log('Arguments:', args);
          console.log('MCP Client:', mcpClient);
          const result = await mcpClient.callTool({
            name: mcptool.name,
            arguments: args,
          });
          //const result = 'chat lending USDC successfully';
          console.log('RUNNING TOOL:', mcptool.name);
          console.log(result);
          const toolResult = { status: 'completed', result: result };
          return toolResult;
        },
      });
      // Add the tool to the accumulator object, using its name as the key
      acc[mcptool.name] = aiTool;
      return acc;
    },
    {} as { [key: string]: CoreTool },
  ); // Initialize with the correct type

  // Return the object of tools
  console.log('toolObject =', toolObject);
  return toolObject;
}

export const getTools = async (): Promise<{ [key: string]: CoreTool }> => {
  console.log('Initializing MCP client...');

  // Helper function to convert MCP tool schema to Zod schema
  //POC: Change avaliable tools based on  cookie agent
  const cookieStore = await cookies();
  const agentIdFromCookie = cookieStore.get('agent');
  console.log(agentIdFromCookie);
  let serverUrl = '';

  if (agentIdFromCookie && agentIdFromCookie.value === 'ember-aave') {
    serverUrl =
      (process.env.MCP_SERVER_URL || DEFAULT_SERVER_URLS.get('ember-aave')) ??
      '';
  }

  if (agentIdFromCookie && agentIdFromCookie.value === 'ember-camelot') {
    serverUrl =
      (process.env.MCP_SERVER_URL ||
        DEFAULT_SERVER_URLS.get('ember-camelot')) ??
      '';
  }

  if (agentIdFromCookie && agentIdFromCookie.value === 'ember-lp') {
    serverUrl =
      (process.env.MCP_SERVER_URL || DEFAULT_SERVER_URLS.get('ember-lp')) ?? '';
  }

  if (agentIdFromCookie && agentIdFromCookie.value === 'ember-pendle') {
    serverUrl =
      (process.env.MCP_SERVER_URL || DEFAULT_SERVER_URLS.get('ember-pendle')) ??
      '';
  }

  if (!agentIdFromCookie || agentIdFromCookie.value !== 'all') {
    return await getTool(serverUrl);
  }

  const serverUrls = [
    DEFAULT_SERVER_URLS.get('ember-aave') ?? '',
    DEFAULT_SERVER_URLS.get('ember-camelot') ?? '',
    DEFAULT_SERVER_URLS.get('ember-lp') ?? '',
    DEFAULT_SERVER_URLS.get('ember-pendle') ?? '',
  ];
  const tools = await Promise.all(serverUrls.map((url) => getTool(url)));
  const allTools: { [key: string]: CoreTool } = {};
  for (let i = 0; i < tools.length; i++) {
    const agentName = URL_CHAT_IDS.get(serverUrls[i]) ?? 'default';
    for (const [toolKey, toolValue] of Object.entries(tools[i])) {
      allTools[`${agentName}${toolKey}`] = toolValue;
    }
  }
  return allTools;
};
