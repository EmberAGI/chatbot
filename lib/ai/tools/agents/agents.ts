interface ChatAgent {
    id: string;
    name: string;
    description: string;
  }
  
  export const chatAgents: Array<ChatAgent> = [
    {
      id: 'ember-lending',
      name: 'Lending',
      description: 'Ember lending agent',
    },
    {
      id: 'ember-test',
      name: 'Test',
      description: 'Ember test agent',
    },
  ];