// Domain types shared across the app.

export type StaffStatus = 'working' | 'idle' | 'offline';

export type ViewMode = '2d' | '3d';

export type ThemeMode = 'day' | 'night';

export type TeamId = 'product' | 'engineering' | 'design' | 'growth';

export interface CharacterSpec {
  skinTone: string;
  hairColor: string;
  hairStyle: 'bald' | 'short' | 'cap' | 'long';
  accessory: 'none' | 'glasses' | 'lanyard';
  shirtColor: string;
  pantsColor: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  teamId: TeamId;
  status: StaffStatus;
  jiraUrl: string;
  avatarUrl?: string;
  look: CharacterSpec;
}

export interface Team {
  id: TeamId;
  name: string;
  color: string;
  icon: string;
}
