/// <reference types="@prisma/client" />
import { Prisma, PrismaClient } from '@prisma/client';

// Use the imports in a type alias to prevent unused import warnings
type _PrismaImportCheck = Prisma.PrismaClientOptions & PrismaClient;

// Extend the User model to include the tenants relation
declare global {
  namespace PrismaJson {
    type UserSettingsGoogleData = Record<string, unknown>;
    type UserSettingsZoomData = Record<string, unknown>;
  }

  namespace Prisma {
    // Extend User model to include tenant relationships
    interface User {
      tenants?: TenantUser[];
      userSettings?: UserSettings[];
      availabilities?: Availability[];
      exceptionDates?: ExceptionDate[];
      intervieweeNotes?: IntervieweeNote[];
      bookings?: Booking[];
      interviewerBookings?: Booking[];
    }

    // User include options for relationships
    interface UserInclude {
      tenants?: boolean | TenantUserInclude;
      userSettings?: boolean;
      availabilities?: boolean;
      exceptionDates?: boolean;
      intervieweeNotes?: boolean;
      bookings?: boolean;
      interviewerBookings?: boolean;
    }

    // TenantUser include options
    interface TenantUserInclude {
      include?: {
        tenant?: boolean;
        user?: boolean;
      };
    }

    // Extend Tenant model to include relationships
    interface Tenant {
      users?: TenantUser[];
      interviewees?: Interviewee[];
      jobRoles?: JobRole[];
      intervieweeNotes?: IntervieweeNote[];
      userSettings?: UserSettings[];
      availabilities?: Availability[];
      exceptionDates?: ExceptionDate[];
      bookings?: Booking[];
    }

    // Extend PrismaClient to include all models
    interface PrismaClient {
      tenant: Prisma.TenantDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
      tenantUser: Prisma.TenantUserDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
      interviewee: Prisma.IntervieweeDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
      jobRole: Prisma.JobRoleDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
      intervieweeNote: Prisma.IntervieweeNoteDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
      userSettings: Prisma.UserSettingsDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
      availability: Prisma.AvailabilityDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
      exceptionDate: Prisma.ExceptionDateDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
      booking: Prisma.BookingDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation>;
    }

    // UserSettings model
    interface UserSettings {
      userId: string;
      tenantId: string;
      maxSchedulesPerDay: number;
      advanceBookingDays: number;
      meetingDuration: number;
      bufferBetweenEvents: number;
      zoomConnected: boolean;
      zoomData: string | null;
      googleConnected: boolean;
      googleData: string | null;
      user?: User;
      tenant?: Tenant;
    }

    // Extend all where inputs to include tenantId
    interface AvailabilityWhereInput {
      tenantId?: string;
      userId?: string;
    }

    interface ExceptionDateWhereInput {
      tenantId?: string;
      userId?: string;
    }

    interface BookingWhereInput {
      tenantId?: string;
      interviewerId?: string;
      intervieweeId?: string;
      status?: string;
    }

    interface IntervieweeWhereInput {
      tenantId?: string;
      id?: string;
      email?: string;
      status?: string;
    }

    interface IntervieweeNoteWhereInput {
      tenantId?: string;
      intervieweeId?: string;
      userId?: string;
    }

    interface JobRoleWhereInput {
      tenantId?: string;
      id?: string;
    }

    // Define Booking model
    interface Booking {
      id: string;
      title: string;
      startTime: Date;
      endTime: Date;
      interviewerId: string;
      intervieweeId: string | null;
      intervieweeEmail: string;
      intervieweeName: string;
      tenantId: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      feedback?: string | null;
      interviewer?: User;
      tenant?: Tenant;
    }
  }
} 