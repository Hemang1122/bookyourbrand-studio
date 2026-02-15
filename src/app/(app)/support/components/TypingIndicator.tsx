
'use client';
import React from 'react';
import { useData } from '../../data-provider';

type TypingIndicatorProps = {
  typingUserIds: string[];
};

export function TypingIndicator({ typingUserIds }: TypingIndicatorProps) {
  const { users } = useData();

  if (typingUserIds.length === 0) {
    return <div className="h-6" />;
  }

  const typingNames = typingUserIds
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter(Boolean);

  if (typingNames.length === 0) {
    return <div className="h-6" />;
  }

  const text =
    typingNames.length === 1
      ? `${typingNames[0]} is typing`
      : `${typingNames.slice(0, 2).join(' and ')} are typing`;

  return (
    <div className="h-6 px-4 pb-2 text-sm flex items-center gap-2 text-primary">
      <span>{text}</span>
       <div className="flex gap-1 items-center">
          <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></span>
       </div>
    </div>
  );
}
