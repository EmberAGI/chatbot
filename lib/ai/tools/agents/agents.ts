interface ChatAgent {
    id: string;
    name: string;
    description: string;
  }
  
  export const chatAgents: Array<ChatAgent> = [
      {
      id: 'ember-aave',
      name: 'Ember AAVE',
      description: 'AAVE lending agent',
    },
    {
      id: 'ember-camelot',
      name: 'Ember Camelot',
      description: 'Camelot Swapping agent',
    },
    
  ];