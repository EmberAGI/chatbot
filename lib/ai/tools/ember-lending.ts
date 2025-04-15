import { tool, type CoreTool } from 'ai';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { cookies } from 'next/headers';

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

export const getTools = async (): Promise<{ [key: string]: CoreTool }> => {
  console.log("Initializing MCP client...");
  
  //POC: Change avaliable tools based on  cookie agent
  const cookieStore = await cookies();
  const agentIdFromCookie = cookieStore.get('agent');
  console.log(agentIdFromCookie);
  let serverUrl : string | string[] = '' 

  if (agentIdFromCookie && agentIdFromCookie.value === 'ember-aave') {
    serverUrl = process.env.MCP_SERVER_URL || 'http://173.230.139.151:3010/sse'; 
  }

  if (agentIdFromCookie && agentIdFromCookie.value === 'ember-camelot') {
    serverUrl = process.env.MCP_SERVER_URL || 'http://173.230.139.151:3011/sse';; 
  }

  if (agentIdFromCookie && agentIdFromCookie.value === 'all') {
    serverUrl = [
      process.env.MCP_SERVER_URL || 'http://173.230.139.151:3010/sse',
      process.env.MCP_SERVER_URL || 'http://173.230.139.151:3011/sse'
    ]
  }
  
  let mcpClient :any = null;

  // Create MCP Client
  if (typeof serverUrl === 'string') {
    mcpClient = new Client(
      { name: 'TestClient', version: '1.0.0' },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    );
  } else {
    mcpClient = [];
    serverUrl.forEach((el)=>mcpClient.push(new Client(
      { name: 'TestClient', version: '1.0.0' },
      { capabilities: { tools: {}, resources: {}, prompts: {} } }
    )))
   }
 
  
  // Create SSE transport
  let transport = null
  if (typeof serverUrl === 'string') {
    transport = new SSEClientTransport(new URL(serverUrl));
  } else {
    // If serverUrl is an array, create multiple transports
    transport = serverUrl.map((url) => new SSEClientTransport(new URL(url)));
  }
  
  
  // Connect to the server
  if (transport) {
    if (Array.isArray(transport)) {
      // Connect to multiple transports
      await Promise.all(transport.map((t,i) => mcpClient[i].connect(t)));
    } else {
      await mcpClient.connect(transport);
    }
    console.log("MCP client initialized successfully!");
  }
  
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
  let toolsResponse;
  if (typeof serverUrl === 'string') {
    try {
      toolsResponse = await mcpClient.listTools();
      console.log(toolsResponse);
    } catch (error) {
      console.error("Error discovering tools:", error);
      toolsResponse = { tools: [] }; // Fallback to empty tools array
    }
  } else {
    // If serverUrl is an array, try to discover tools from each client
    toolsResponse = await Promise.all(
      mcpClient.map(async (client:any) => {
        try {
          return await client.listTools();
        } catch (error) {
          console.error("Error discovering tools:", error);
          return { tools: [] }; // Fallback to empty tools array
        }
      })
    );
  }
 
  let toolObject: any;

  // If serverUrl is an array, flatten the tools array
  if (Array.isArray(toolsResponse)) {
    toolsResponse = toolsResponse.reduce((acc, curr) => {
      return acc.concat(curr.tools);
    }, []);
  } else {
    toolsResponse = toolsResponse.tools;
  }
  console.log("Discovered tools:", toolsResponse);
  // Use reduce to create an object mapping tool names to AI tools
  toolObject = toolsResponse.tools.reduce((acc: any, mcptool: any) => {
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
        const toolResult = {status: 'completed', result: result}
        return toolResult;
      },
    });
    // Add the tool to the accumulator object, using its name as the key
    acc[mcptool.name] = aiTool;
    return acc;
  }, {} as { [key: string]: CoreTool }); // Initialize with the correct type

  // Return the object of tools
  return toolObject;
}
