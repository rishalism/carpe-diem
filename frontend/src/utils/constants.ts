import type { Mood, ReactionType, SpaceType } from "../types";

export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const ACCESS_TOKEN_KEY = "cd_access_token";
export const REFRESH_TOKEN_KEY = "cd_refresh_token";

export interface MoodOption {
  value: Mood;
  label: string;
  emoji: string;
}

export const MOODS: MoodOption[] = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "grateful", label: "Grateful", emoji: "🙏" },
  { value: "excited", label: "Excited", emoji: "🤩" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
  { value: "sad", label: "Sad", emoji: "😢" },
  { value: "angry", label: "Angry", emoji: "😠" },
];

export const MOOD_MAP: Record<Mood, MoodOption> = MOODS.reduce(
  (acc, m) => ({ ...acc, [m.value]: m }),
  {} as Record<Mood, MoodOption>
);

export interface SpaceTypeOption {
  value: SpaceType;
  label: string;
  emoji: string;
  description: string;
}

export const SPACE_TYPES: SpaceTypeOption[] = [
  { value: "personal", label: "Personal", emoji: "📔", description: "Just for you" },
  { value: "couple", label: "Couple", emoji: "💞", description: "You and your partner" },
  { value: "family", label: "Family", emoji: "🏡", description: "Your whole family" },
  { value: "friends", label: "Friends", emoji: "🎈", description: "Your friend group" },
  { value: "custom", label: "Custom", emoji: "✨", description: "Anything you like" },
];

export const SPACE_TYPE_MAP: Record<SpaceType, SpaceTypeOption> =
  SPACE_TYPES.reduce(
    (acc, t) => ({ ...acc, [t.value]: t }),
    {} as Record<SpaceType, SpaceTypeOption>
  );

export interface ReactionOption {
  value: ReactionType;
  emoji: string;
  label: string;
}

export const REACTIONS: ReactionOption[] = [
  { value: "heart", emoji: "❤️", label: "Love" },
  { value: "thumbs_up", emoji: "👍", label: "Like" },
  { value: "smile", emoji: "😊", label: "Smile" },
  { value: "party", emoji: "🎉", label: "Celebrate" },
  { value: "sad", emoji: "😢", label: "Sad" },
];
