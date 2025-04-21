export interface Shot {
  id: string
  timestamp?: string
  scene: string
  shot: string
  reference?: string
  description: string
  shotSize: string
  people: string
  action: string
  dialogue: string
  location: string
  setDressing?: string
  props?: string
  specialEffects?: string
  notes?: string
  directorsNotes?: string
}

export interface Subject {
  id: string
  name: string
  category: "People" | "Places" | "Props"
  description: string
  alias: string
  active: boolean
  loraTrigger?: string // Added LORA trigger word field
}

export interface Style {
  id: string
  name: string
  prefix: string
  suffix: string
  genre: string
  descriptors: string
}

export interface DirectorStyle {
  id: string
  name: string
  visualStyle: string
  narrativeApproach: string
  camerawork: string
  lighting: string
  editing: string
  color: string
  sound: string
  performance: string
}

export interface GeneratedPrompt {
  id: string
  shotId: string
  concise: string
  normal: string
  detailed: string
  timestamp: string
}

export interface Project {
  name: string
  lastModified: string
  script: string
  shotList: Shot[]
  subjects: Subject[]
  generatedPrompts: GeneratedPrompt[]
}

export interface CameraSettings {
  shot: string
  move: string
  size: string
  framing: string
  depthOfField: string
  type: string
  name: string
  lensType: string
}

export interface MusicLabFormData {
  artistName: string
  songTitle: string
  genre: string
  lyrics: string
  concept: string
  visualDescriptors: string
  wardrobeCount: string
  wardrobeDetails: string
}
