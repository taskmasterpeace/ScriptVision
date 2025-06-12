export interface Shot {
  id: string;
  timestamp?: string;
  scene: string;
  shot: string;
  reference?: string;
  description: string;
  shotSize: string;
  people: string;
  action: string;
  dialogue: string;
  location: string;
  setDressing?: string;
  props?: string;
  specialEffects?: string;
  notes?: string;
  directorsNotes?: string;
}

export interface Subject {
  id: string;
  name: string;
  category: 'People' | 'Places' | 'Props';
  description: string;
  alias: string;
  active: boolean;
  loraTrigger?: string; // Added LORA trigger word field
}

export interface Style {
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  genre: string;
  descriptors: string;
}

export interface DirectorStyle {
  id: string;
  name: string;
  visualStyle: string;
  narrativeApproach: string;
  camerawork: string;
  lighting: string;
  editing: string;
  color: string;
  sound: string;
  performance: string;
}

export interface GeneratedPrompt {
  id: string;
  shotId: string;
  concise: string;
  normal: string;
  detailed: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  lastModified: string;
  script: string;
  shotList: Shot[];
  subjects: Subject[];
  generatedPrompts: GeneratedPrompt[];
}

// Model type for phase-model mapping
export type Model = {
  id: string;
  model: string;
  provider: string;
  description?: string | null;
  lastUpdated?: string;
  context_window?: number;
  input_tokens_price_per_million?: string;
  output_tokens_price_per_million?: string;
  supports_vision?: boolean;
  supports_computer_use?: boolean;
};

export interface CameraSettings {
  shot: string;
  move: string;
  size: string;
  framing: string;
  depthOfField: string;
  type: string;
  name: string;
  lensType: string;
}

export interface MusicLabFormData {
  artistName: string;
  songTitle: string;
  genre: string;
  lyrics: string;
  concept: string;
  visualDescriptors: string;
  wardrobeCount: string;
  wardrobeDetails: string;
}
