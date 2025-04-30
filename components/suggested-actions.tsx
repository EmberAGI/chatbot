"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { memo } from "react";
import { UseChatHelpers } from "@ai-sdk/react";
import { cookies } from "next/headers";

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers["append"];
}

async function PureSuggestedActions({ chatId, append }: SuggestedActionsProps) {
  let suggestedActions = [];

  //get active agent from localstorage
  const cookieStore = await cookies();
  const agentIdFromCookie = cookieStore.get("agent");

  switch (agentIdFromCookie?.value) {
    case "ember-aave":
      suggestedActions = [
        {
          title: "Provide Liquidity",
          label: "with A and B",
          action: "Provide liquidity with A and B",
        },
        {
          title: "Check",
          label: "Liquidity positions",
          action: "Check liquidity positions",
        },
      ];
      break;
    case "ember-camelot":
      suggestedActions = [
        {
          title: "Swap A for B",
          label: "on X Network.",
          action: "Swap A for B tokens on X Network.",
        },
        {
          title: "Buy X",
          label: "",
          action: "Buy X token.",
        },
      ];
      break;
    default:
      break;
  }

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, "", `/chat/${chatId}`);

              append({
                role: "user",
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
