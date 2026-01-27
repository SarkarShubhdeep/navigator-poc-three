/**
 * Mock data for Project Navigator
 * This will be replaced with actual Supabase data later
 */

export type TicketStatus = "open" | "close" | "active";
export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface ProjectMember {
  userId: string;
  fullName?: string;
  email: string;
  isOnline: boolean;
}

export interface WorkLog {
  id: string;
  ticketId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  description?: string;
}

export interface Ticket {
  id: string;
  projectId: string;
  title: string;
  status: TicketStatus;
  description: string;
  assignedToUserId: string;
  lastWorkedOn?: Date;
  totalDuration: number; // in seconds
  workLogs: WorkLog[];
  priority: TicketPriority;
}

export interface Project {
  id: string;
  name: string;
  members: ProjectMember[];
  tickets: Ticket[];
}

// Mock current user ID
export const CURRENT_USER_ID = "user-1";

// Mock project data
export const mockProject: Project = {
  id: "project-1",
  name: "Project Navigator",
  members: [
    {
      userId: "user-1",
      fullName: "Shubh Five",
      email: "shubh5x@email.com",
      isOnline: true,
    },
    {
      userId: "user-2",
      fullName: "Sarah Thompson",
      email: "sarah@email.com",
      isOnline: true,
    },
    {
      userId: "user-3",
      fullName: "Mike Johnson",
      email: "mike@email.com",
      isOnline: false,
    },
    {
      userId: "user-4",
      fullName: "Emily Davis",
      email: "emily@email.com",
      isOnline: true,
    },
    {
      userId: "user-5",
      fullName: "Tom Wilson",
      email: "tom@email.com",
      isOnline: false,
    },
  ],
  tickets: [
    {
      id: "ticket-1",
      projectId: "project-1",
      title: "Move to local-first architecture",
      status: "open",
      description: "Eliminate the backend sync problem for good.",
      assignedToUserId: "user-1",
      lastWorkedOn: new Date("2026-01-24T12:13:00"),
      totalDuration: 3195, // 53 minutes 15 seconds
      priority: "high",
      workLogs: [
        {
          id: "work-1",
          ticketId: "ticket-1",
          userId: "user-1",
          startTime: new Date("2026-01-22T14:49:00"),
          endTime: new Date("2026-01-22T15:22:00"),
          duration: 1980, // 33 minutes
          description: "Initial research on local-first architecture patterns",
        },
        {
          id: "work-2",
          ticketId: "ticket-1",
          userId: "user-1",
          startTime: new Date("2026-01-24T12:13:00"),
          endTime: new Date("2026-01-24T12:46:15"),
          duration: 1995, // 33 minutes 15 seconds
          description: "Started implementing local storage layer",
        },
      ],
    },
    {
      id: "ticket-2",
      projectId: "project-1",
      title: "Optimizations",
      status: "open",
      description: "Dev build.",
      assignedToUserId: "user-1",
      lastWorkedOn: new Date("2026-01-24T11:52:00"),
      totalDuration: 755, // 12 minutes 35 seconds
      priority: "medium",
      workLogs: [
        {
          id: "work-3",
          ticketId: "ticket-2",
          userId: "user-1",
          startTime: new Date("2026-01-24T11:52:00"),
          endTime: new Date("2026-01-24T12:04:35"),
          duration: 755,
          description: "Performance optimization for build process",
        },
      ],
    },
    {
      id: "ticket-3",
      projectId: "project-1",
      title: "Fix/update minor UIs before the final demo build",
      status: "open",
      description: "UI polish and bug fixes.",
      assignedToUserId: "user-1",
      lastWorkedOn: new Date("2026-01-23T17:00:00"),
      totalDuration: 1036, // 17 minutes 16 seconds
      priority: "low",
      workLogs: [
        {
          id: "work-4",
          ticketId: "ticket-3",
          userId: "user-1",
          startTime: new Date("2026-01-23T17:00:00"),
          endTime: new Date("2026-01-23T17:17:16"),
          duration: 1036,
          description: "Fixed button alignment and spacing issues",
        },
      ],
    },
    {
      id: "ticket-4",
      projectId: "project-1",
      title: "Implement the Work Session wrapper logic",
      status: "open",
      description: "Create wrapper for managing work sessions.",
      assignedToUserId: "user-1",
      lastWorkedOn: new Date("2026-01-22T10:00:00"),
      totalDuration: 2400, // 40 minutes
      priority: "high",
      workLogs: [
        {
          id: "work-5",
          ticketId: "ticket-4",
          userId: "user-1",
          startTime: new Date("2026-01-22T10:00:00"),
          endTime: new Date("2026-01-22T10:40:00"),
          duration: 2400,
          description: "Implemented core work session state management",
        },
      ],
    },
  ],
};
