import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { IntervieweeCSVRow } from '@/types/interviewee';
import { prisma } from '@/lib/prisma';
import { IntervieweeStatus } from '@/types/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the current user with their tenant information
    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email 
      },
      include: {
        tenants: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user belongs to a tenant
    if (!user.tenants || user.tenants.length === 0) {
      return NextResponse.json(
        { message: 'User does not belong to any tenant' },
        { status: 400 }
      );
    }
    
    // Get the primary tenant and role
    const primaryTenantUser = user.tenants[0];
    const role = primaryTenantUser.role;
    const tenantId = primaryTenantUser.tenantId;
    
    // Check if user has permission (ADMIN or HR)
    if (role !== "ADMIN" && role !== "HR") {
      return NextResponse.json(
        { message: 'Permission denied' },
        { status: 403 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Read the file content
    const fileContent = await file.text();
    
    // Parse CSV
    const rows = parseCSV(fileContent);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'CSV file is empty or invalid' },
        { status: 400 }
      );
    }
    
    // Process each row and create interviewees
    const createdInterviewees = [];
    const errors = [];
    
    for (const row of rows) {
      try {
        // Skip rows without required fields
        if (!row.Name || !row['Email ID']) {
          errors.push(`Skipped row: Missing required fields (Name or Email ID)`);
          continue;
        }
        
        // Check if a role with this title exists in this tenant, create if not
        let roleId = null;
        if (row.Role) {
          const existingRole = await prisma.jobRole.findFirst({
            where: {
              title: row.Role,
              tenantId: tenantId
            },
          });
          
          if (existingRole) {
            roleId = existingRole.id;
          } else {
            const newRole = await prisma.jobRole.create({
              data: {
                title: row.Role,
                tenantId: tenantId,
                isActive: true
              },
            });
            roleId = newRole.id;
          }
        }
        
        // Check if interviewee with this email already exists in this tenant
        const existingInterviewee = await prisma.interviewee.findFirst({
          where: {
            email: row['Email ID'],
            tenantId: tenantId
          },
        });
        
        if (existingInterviewee) {
          errors.push(`Skipped row: Interviewee with email ${row['Email ID']} already exists in this tenant`);
          continue;
        }
        
        // Create the interviewee
        const interviewee = await prisma.interviewee.create({
          data: {
            name: row.Name,
            email: row['Email ID'],
            phone: row['Phone Number'],
            resumeLink: row['Resume Link'],
            currentCompany: row['Current Company'],
            yearsOfExperience: row['Years of Experience'] ? parseInt(row['Years of Experience']) : null,
            skills: row.Skills,
            currentCTC: row['Current CTC'],
            expectedCTC: row['Expected CTC'],
            noticePeriod: row['Notice Period'],
            currentLocation: row['Current Location'],
            status: IntervieweeStatus.NEW,
            currentRound: 0,
            roleId: roleId,
            tenantId: tenantId,
          },
        });
        
        createdInterviewees.push(interviewee);
      } catch (error) {
        console.error('Error processing row:', error);
        errors.push(`Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return NextResponse.json({
      message: 'CSV processed successfully',
      count: createdInterviewees.length,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV
function parseCSV(csvText: string): IntervieweeCSVRow[] {
  const lines = csvText.split('\n');
  
  if (lines.length < 2) {
    return [];
  }
  
  // Parse header row
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Parse data rows
  const rows: IntervieweeCSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle quoted values with commas inside
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    
    // Create an object from headers and values
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      if (j < values.length) {
        row[headers[j]] = values[j];
      }
    }
    
    rows.push(row as IntervieweeCSVRow);
  }
  
  return rows;
} 