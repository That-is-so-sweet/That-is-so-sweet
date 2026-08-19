export type AvailabilityStatus = 'available' | 'if_needed' | 'unavailable';

export type EventMode = 'date_only' | 'time_slots';

export interface TimeSlot {
  id: string;
  date: string; // YYYY-MM-DD format e.g. "2026-08-15"
  time: string; // e.g. "18:00 - 21:00" or "午餐 12:00-14:00"
  label?: string; // Optional custom title e.g. "居酒屋小酌", "早午餐"
}

export interface ParticipantResponse {
  id: string;
  nickname: string;
  email?: string;
  availability: Record<string, AvailabilityStatus>; // slotId -> status
  comment?: string;
  updatedAt: string;
}

export interface EventData {
  id: string;
  hostToken: string; // Secret key generated for creator
  title: string;
  description?: string;
  hostName?: string;
  hostEmail?: string;
  mode: EventMode;
  responseDeadline: string; // ISO datetime string — voting closes after this
  slots: TimeSlot[];
  responses: ParticipantResponse[];
  status: 'active' | 'finalized';
  finalSlotId?: string;
  finalNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  hostName?: string;
  hostEmail?: string;
  mode: EventMode;
  responseDeadline: string;
  slots: Omit<TimeSlot, 'id'>[];
}

export interface SubmitResponseInput {
  participantId?: string; // If re-editing
  nickname: string;
  email?: string;
  availability: Record<string, AvailabilityStatus>;
  comment?: string;
}

export interface FinalizeEventInput {
  hostToken: string;
  finalSlotId: string;
  finalNote?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface SlotStats {
  slotId: string;
  slot: TimeSlot;
  availableCount: number;
  ifNeededCount: number;
  unavailableCount: number;
  availableNames: string[];
  ifNeededNames: string[];
  unavailableNames: string[];
  score: number; // e.g. available*2 + ifNeeded*1
  percentage: number; // percentage of total participants who are available
}
