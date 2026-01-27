/**
 * Type definitions and transformation utilities for Supabase data
 */

import type { Ticket, WorkLog, ProjectMember, WorkSession } from "@/lib/mock-data/project";

// Supabase database types (snake_case)
export interface SupabaseWorkLog {
    id: string;
    ticket_id: string;
    user_id: string;
    work_session_id: string;
    start_time: string;
    end_time: string | null; // NULL when work is active, set when paused
    duration: number | null; // NULL when work is active, calculated when paused
    description?: string | null;
    created_at: string;
    updated_at: string;
}

export interface SupabaseTicket {
    id: string;
    project_id: string;
    title: string;
    description?: string | null;
    status: "open" | "active" | "close";
    priority: "low" | "medium" | "high" | "critical";
    assigned_to_user_id: string;
    last_worked_on?: string | null;
    total_duration: number;
    created_at: string;
    updated_at: string;
    work_logs?: SupabaseWorkLog[];
}

export interface SupabaseProjectMember {
    id: string;
    project_id: string;
    user_id: string;
    role: "owner" | "member" | "viewer";
    is_online: boolean;
    joined_at: string;
    full_name?: string | null;
    email: string;
}

export interface SupabaseWorkSession {
    id: string;
    user_id: string;
    project_id?: string | null;
    clock_in_time: string;
    clock_out_time?: string | null;
    total_duration?: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Transform Supabase work log to app work log
 */
export function transformWorkLog(workLog: SupabaseWorkLog): WorkLog {
    return {
        id: workLog.id,
        ticketId: workLog.ticket_id,
        userId: workLog.user_id,
        startTime: new Date(workLog.start_time),
        endTime: workLog.end_time ? new Date(workLog.end_time) : new Date(), // Use current time as fallback if null
        duration: workLog.duration || 0, // Use 0 as fallback if null
        description: workLog.description || undefined,
    };
}

/**
 * Transform Supabase ticket to app ticket
 */
export function transformTicket(ticket: SupabaseTicket): Ticket {
    return {
        id: ticket.id,
        projectId: ticket.project_id,
        title: ticket.title,
        description: ticket.description || "",
        status: ticket.status,
        priority: ticket.priority,
        assignedToUserId: ticket.assigned_to_user_id,
        lastWorkedOn: ticket.last_worked_on
            ? new Date(ticket.last_worked_on)
            : undefined,
        totalDuration: ticket.total_duration,
        workLogs: (ticket.work_logs || []).map(transformWorkLog),
    };
}

/**
 * Transform Supabase project member to app project member
 */
export function transformProjectMember(
    member: SupabaseProjectMember,
): ProjectMember {
    return {
        userId: member.user_id,
        fullName: member.full_name || undefined,
        email: member.email,
        isOnline: member.is_online,
    };
}

/**
 * Transform Supabase work session to app work session
 */
export function transformWorkSession(session: any): WorkSession {
    return {
        id: session.id,
        userId: session.user_id,
        projectId: session.project_id || undefined,
        clockInTime: new Date(session.clock_in_time),
        clockOutTime: session.clock_out_time
            ? new Date(session.clock_out_time)
            : undefined,
        totalDuration: session.total_duration || undefined,
        isActive: session.is_active,
        workLogs: (session.work_logs || []).map((log: any) => {
            // Handle nested tickets data (could be object or array)
            let ticketTitle: string | undefined;
            if (log.tickets) {
                if (Array.isArray(log.tickets) && log.tickets.length > 0) {
                    ticketTitle = log.tickets[0].title;
                } else if (typeof log.tickets === "object" && "title" in log.tickets) {
                    ticketTitle = log.tickets.title;
                }
            }

            return {
                id: log.id,
                ticketId: log.ticket_id,
                userId: log.user_id,
                startTime: new Date(log.start_time),
                endTime: log.end_time ? new Date(log.end_time) : new Date(),
                duration: log.duration || 0,
                description: log.description || undefined,
                ticketTitle,
            };
        }),
    };
}
