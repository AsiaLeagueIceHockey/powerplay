export interface TamagotchiScreenReaction {
  title: string;
  body: string;
  tone: "normal" | "special" | "encouraging";
}

export interface TamagotchiScreenState {
  displayName: string;
  dateKey: string;
  stageLabel: string;
  pet: {
    energy: number;
    condition: number;
  };
  status: {
    decayed: boolean;
    message: string;
    visitMode: "active" | "read_only";
  };
  training: {
    key: string;
    title: string;
    description: string;
    completed: boolean;
  };
  meal: {
    key: string;
    title: string;
    completed: boolean;
    special: boolean;
  };
  actions: {
    canFeed: boolean;
    canTrain: boolean;
    bothCompleted: boolean;
  };
  reminder: {
    pushEnabled: boolean;
    queuedFor: string | null;
    hint: string;
  };
  reaction: TamagotchiScreenReaction | null;
}
