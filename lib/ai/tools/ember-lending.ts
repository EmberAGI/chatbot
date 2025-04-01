import { tool } from 'ai';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

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

export const getEmberLending = tool({
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
});


export const getTools = async () => {
  const serverUrl = process.env.MCP_SERVER_URL || 'http://localhost:3010'; 
  let mcpClient = null;

  // Create MCP Client
  mcpClient = new Client(
    { name: 'TestClient', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );
  
  // Create SSE transport
  const transport = new SSEClientTransport(new URL(serverUrl));
  
  // Connect to the server
  await mcpClient.connect(transport);
  console.log("MCP client initialized successfully!");

  // Helper function to convert MCP tool schema to Zod schema
  const convertToZodSchema = (schema: any): z.ZodSchema => {
    if (!schema) return z.object({});
    
    // If it's already a Zod schema, return it
    if (schema._def !== undefined) return schema;
    
    // For an object schema, convert properties
    if (schema.type === 'object' && schema.properties) {
      const zodProperties: { [key: string]: z.ZodTypeAny } = {};
      Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
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
      });
      return z.object(zodProperties);
    }
    
    // Default fallback
    return z.object({});
  };

  // Try to discover tools
  console.log("Attempting to discover tools via MCP client...");
  const toolsResponse = await mcpClient.listTools();
  const toolArray = toolsResponse.tools.map((mcptool) => {
    // Convert MCP tool schema to Zod schema
    return tool({
      description: mcptool.description,
      parameters: convertToZodSchema(mcptool.inputSchema),
      execute: async (args) => {
        const result = await mcpClient.callTool({
          name: mcptool.name,
          arguments: args,
        });
        return result;
      },
    });
  });

  // Return the array of tools, ready to be used by the AI model
  return toolArray;
}
