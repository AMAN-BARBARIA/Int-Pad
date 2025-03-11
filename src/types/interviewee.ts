import { Interviewee, IntervieweeNote, IntervieweeStatus, JobRole } from "@prisma/client";

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
}; 