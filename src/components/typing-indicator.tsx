'use client';

/**
 * @fileOverview Typing indicator component (Disabled)
 * This component has been removed to reduce database writes and simplify the UI.
 */

export function TypingIndicator() {
  return null;
}

export function useTypingIndicator() {
  return { 
    updateTyping: () => {} 
  };
}
