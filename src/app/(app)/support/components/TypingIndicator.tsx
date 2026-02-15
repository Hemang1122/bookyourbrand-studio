'use client';
import { useData } from '../../data-provider';

type TypingIndicatorProps = {
  typingUserIds: string[];
};

export function TypingIndicator({ typingUserIds }: TypingIndicatorProps) {
  const { users } = useData();

  if (typingUserIds.length === 0) {
    return null;
  }

  const typingNames = typingUserIds
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter(Boolean);

  if (typingNames.length === 0) {
    return null;
  }

  const text =
    typingNames.length === 1
      ? `${typingNames[0]} is typing...`
      : `${typingNames.slice(0, 2).join(' and ')} are typing...`;

  return (
    <div className="h-6 px-4 pb-2 text-sm text-muted-foreground animate-pulse">
      {text}
    </div>
  );
}
