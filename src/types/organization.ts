import { Organization, User, UserRole } from "@prisma/client";

export type OrganizationWithMembers = Organization & {
  members: User[];
};

export type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
};

export type OrganizationFormData = {
  name: string;
  description?: string;
}; 