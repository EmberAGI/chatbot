interface ChatAgent {
    id: string;
    name: string;
    description: string;
  }
  
export const chatAgents: Array<ChatAgent> = [
    {
      id: 'ember-aave',
      name: 'AAVE',
      description: 'AAVE lending agent',
    },
    {
      id: 'ember-camelot',
      name: 'Camelot',
      description: 'Camelot Swapping agent',
  },
  {
    id: 'all',
    name: 'Default Agent',
    description: 'All agents',
    }
    
  ];