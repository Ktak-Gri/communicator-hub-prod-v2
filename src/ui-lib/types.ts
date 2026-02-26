export type ActivePage =
  | 'home'
  | 'roleplay'
  | 'learning'
  | 'history'
  | 'center-summary'
  | 'center-registration'
  | 'one-on-one';

export interface Scenario {
  id?: string;
  title?: string;
  initialInquiry: string;
}

export interface TranscriptItem {
  speaker: 'user' | 'model';
  text: string;
}