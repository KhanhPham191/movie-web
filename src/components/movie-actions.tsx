"use client";

import { AUTH_DISABLED } from "@/contexts/auth-context";

interface MovieActionsProps {
  movie: unknown;
  onRatingChange?: () => void;
}

export function MovieActions({ movie, onRatingChange }: MovieActionsProps) {
  if (AUTH_DISABLED) return null;
  return null;
}
