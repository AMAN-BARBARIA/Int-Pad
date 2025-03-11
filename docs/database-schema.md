# Improved Multi-Tenant Calendly Database Schema

## Tenant Architecture

### Tenant
- id: string [PK]
- name: string
- domain: string?
- logo: string?
- active: boolean
- createdAt: datetime
- updatedAt: datetime

## User Management

### User
- id: string [PK]
- name: string?
- email: string @unique
- emailVerified: datetime?
- image: string?
- createdAt: datetime
- updatedAt: datetime

### TenantUser
- id: string [PK]
- tenantId: string [FK → Tenant.id]
- userId: string [FK → User.id]
- role: enum (ADMIN, HR, INTERVIEWER, USER)
- isActive: boolean
- createdAt: datetime
- updatedAt: datetime
- @@unique([userId, tenantId])

## Authentication

### Account
- id: string [PK]
- userId: string [FK → User.id]
- type: string
- provider: string
- providerAccountId: string
- refresh_token: string?
- access_token: string?
- expires_at: int?
- token_type: string?
- scope: string?
- id_token: string?
- session_state: string?
- refresh_token_expires_in: int?
- @@unique([provider, providerAccountId])

### Session
- id: string [PK]
- sessionToken: string @unique
- userId: string [FK → User.id]
- expires: datetime

### VerificationToken
- identifier: string
- token: string @unique
- expires: datetime
- @@unique([identifier, token])

## Interviewee Management

### Interviewee
- id: string [PK]
- tenantId: string [FK → Tenant.id]
- name: string
- email: string
- phone: string?
- resumeLink: string?
- currentCompany: string?
- yearsOfExperience: int?
- skills: string?
- currentCTC: string?
- expectedCTC: string?
- noticePeriod: string?
- currentLocation: string?
- status: enum (NEW, CONTACTED, SCHEDULED, IN_PROGRESS, REJECTED, ACCEPTED, ON_HOLD)
- currentRound: int
- roleId: string? [FK → JobRole.id]
- createdAt: datetime
- updatedAt: datetime
- @@unique([email, tenantId])

### JobRole
- id: string [PK]
- tenantId: string [FK → Tenant.id]
- title: string
- description: string?
- isActive: boolean
- createdAt: datetime
- updatedAt: datetime

### IntervieweeNote
- id: string [PK]
- content: string
- intervieweeId: string [FK → Interviewee.id]
- userId: string [FK → User.id]
- tenantId: string [FK → Tenant.id]
- createdAt: datetime
- updatedAt: datetime

## Calendar & Scheduling

### UserSettings
- id: string [PK]
- userId: string [FK → User.id] @unique
- tenantId: string [FK → Tenant.id]
- maxSchedulesPerDay: int
- advanceBookingDays: int
- meetingDuration: int
- bufferBetweenEvents: int
- zoomConnected: boolean
- zoomData: string?
- googleConnected: boolean
- googleData: string?
- createdAt: datetime
- updatedAt: datetime
- @@unique([userId, tenantId])

### Availability
- id: string [PK]
- userId: string [FK → User.id]
- tenantId: string [FK → Tenant.id]
- dayOfWeek: int (0-6)
- startTime: string (HH:MM)
- endTime: string (HH:MM)
- createdAt: datetime
- updatedAt: datetime
- @@unique([userId, tenantId, dayOfWeek])

### ExceptionDate
- id: string [PK]
- date: datetime
- isBlocked: boolean
- userId: string [FK → User.id]
- tenantId: string [FK → Tenant.id]
- createdAt: datetime
- updatedAt: datetime
- @@unique([userId, tenantId, date])

### Booking
- id: string [PK]
- tenantId: string [FK → Tenant.id]
- title: string
- startTime: datetime
- endTime: datetime
- interviewerId: string [FK → User.id]
- intervieweeEmail: string
- intervieweeName: string
- status: enum (PENDING, CONFIRMED, CANCELLED)
- zoomMeetingId: string?
- zoomJoinUrl: string?
- googleEventId: string?
- candidateId: string? [FK → Interviewee.id]
- feedback: string?
- createdAt: datetime
- updatedAt: datetime 