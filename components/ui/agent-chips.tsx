'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';
//import { saveChatAgentAsCookie } from '@/app/(chat)/actions';
import { Button } from '@/components/ui/button';
import { chatAgents } from '@/lib/ai/tools/agents/agents';
import { ChipToggle } from './chips';
import { saveChatAgentAsCookie } from '@/app/(chat)/actions';

export function AgentSelector({
  selectedAgentId,
  className,
}: {
  selectedAgentId: string;
} & React.ComponentProps<typeof Button>) {

  const [optimisticAgentId, setOptimisticAgentId] =
    useOptimistic(selectedAgentId);

  const selectedChatAgent = useMemo(
    () => chatAgents.find((chatAgent) => chatAgent.id === optimisticAgentId),
    [optimisticAgentId],
  );

  const options = useMemo(
    () =>
      chatAgents.map((chatAgent) => ({
        value: chatAgent.id,
        label: chatAgent.name,
      })),
    [],
  );

  return (
    <ChipToggle options={options} defaultValue={optimisticAgentId} onValueChange={(value) => {
      startTransition(() => {
        setOptimisticAgentId(value);
        saveChatAgentAsCookie(value);
      });
    }}
    />    
  );
}
