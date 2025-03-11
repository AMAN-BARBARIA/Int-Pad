import { IntervieweeStatus } from "./prisma";

export interface Interviewee {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string | null;
  resumeLink: string | null;
  currentCompany: string | null;
  yearsOfExperience: number | null;
  skills: string | null;
  currentCTC: string | null;
  expectedCTC: string | null;
  noticePeriod: string | null;
  currentLocation: string | null;
  status: IntervieweeStatus | string;
  currentRound: number;
  roleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobRole {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface IntervieweeNote {
  id: string;
  content: string;
  intervieweeId: string;
  userId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export type IntervieweeWithDetails = Interviewee & {
  role: JobRole | null;
  notes: IntervieweeNote[];
};

export type IntervieweeFormData = {
  name: string;
  email: string;
  phone?: string;
  resumeLink?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  skills?: string;
  currentCTC?: string;
  expectedCTC?: string;
  noticePeriod?: string;
  currentLocation?: string;
  roleId?: string;
  tenantId: string;
};

export type IntervieweeCSVRow = {
  Date?: string;
  Role?: string;
  "Resume Link"?: string;
  Name: string;
  "Email ID": string;
  "Phone Number"?: string;
  "Current Company"?: string;
  "Years of Experience"?: string;
  Skills?: string;
  "Current CTC"?: string;
  "Expected CTC"?: string;
  "Notice Period"?: string;
  "Current Location"?: string;
};

export type IntervieweeNoteFormData = {
  content: string;
  intervieweeId: string;
  tenantId: string;
}; 