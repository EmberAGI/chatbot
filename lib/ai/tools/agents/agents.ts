interface ChatAgent {
    id: string;
    name: string;
    description: string;
  }
  
  export const chatAgents: Array<ChatAgent> = [
    {
      id: 'ember-lending',
      name: 'Lending',
      description: 'Primary model for all-purpose chat',
    },
    {
      id: 'ember-test',
      name: 'Test',
      description: 'Uses advanced reasoning',
    },
  ];