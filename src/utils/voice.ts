export interface VoiceCandidate {
  name: string;
  lang: string;
}

const MALE_VOICE_KEYWORDS = [
  'ardi',
  'budi',
  'andika',
  'male',
  'laki',
  'pria',
  'david',
  'daniel',
  'george',
  'ryan',
  'guy',
  'mark',
  'alex',
  'rishi',
  'aaron',
  'thomas',
  'oliver',
];

const FEMALE_VOICE_KEYWORDS = [
  'gadis',
  'siti',
  'damayanti',
  'female',
  'perempuan',
  'wanita',
  'zira',
  'hazel',
  'susan',
  'samantha',
  'karen',
  'aria',
  'jenny',
  'linda',
  'helena',
];

export function selectMaleVoiceIndex<T extends VoiceCandidate>(voices: T[]): number {
  if (!voices || voices.length === 0) return -1;

  const isMale = (name: string) => {
    const lower = name.toLowerCase();
    return MALE_VOICE_KEYWORDS.some((kw) => lower.includes(kw));
  };

  const isFemale = (name: string) => {
    const lower = name.toLowerCase();
    return FEMALE_VOICE_KEYWORDS.some((kw) => lower.includes(kw));
  };

  // 1. Exact Indonesian male voice
  const idMaleIdx = voices.findIndex(
    (v) => v.lang.toLowerCase().startsWith('id') && isMale(v.name) && !isFemale(v.name)
  );
  if (idMaleIdx >= 0) return idMaleIdx;

  // 2. Indonesian voice that is not explicitly female (will be pitched down to male timbre)
  const idNeutralIdx = voices.findIndex(
    (v) => v.lang.toLowerCase().startsWith('id') && !isFemale(v.name)
  );
  if (idNeutralIdx >= 0) return idNeutralIdx;

  // 3. Any Indonesian voice (with lower pitch applied by caller)
  const anyIdIdx = voices.findIndex((v) => v.lang.toLowerCase().startsWith('id'));
  if (anyIdIdx >= 0) return anyIdIdx;

  // 4. Any explicit male voice
  const anyMaleIdx = voices.findIndex((v) => isMale(v.name) && !isFemale(v.name));
  if (anyMaleIdx >= 0) return anyMaleIdx;

  return 0;
}

export function getMaleSpeechConfig() {
  return {
    lang: 'id-ID',
    pitch: 0.72,
    rate: 0.92,
    volume: 1.0,
  };
}
