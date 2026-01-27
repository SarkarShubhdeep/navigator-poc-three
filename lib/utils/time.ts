/**
 * Utility functions for time formatting and calculations
 */

/**
 * Format seconds into HH:MM:SS format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Format seconds into human-readable format (e.g., "32 min 56 sec")
 */
export function formatDurationHuman(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours} hr ${minutes} min ${secs} sec`;
  }
  if (minutes > 0) {
    return `${minutes} min ${secs} sec`;
  }
  return `${secs} sec`;
}

/**
 * Format date to MM/DD/YYYY format
 */
export function formatDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format date and time range (e.g., "Jan 22 2:49 PM - 3:22 PM")
 */
export function formatDateTimeRange(startTime: Date, endTime: Date): string {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const startMonth = monthNames[startTime.getMonth()];
  const startDay = startTime.getDate();
  const startHour = startTime.getHours();
  const startMin = startTime.getMinutes();
  const startAmPm = startHour >= 12 ? "PM" : "AM";
  const startHour12 = startHour % 12 || 12;
  const startTimeStr = `${startHour12}:${startMin
    .toString()
    .padStart(2, "0")} ${startAmPm}`;

  const endHour = endTime.getHours();
  const endMin = endTime.getMinutes();
  const endAmPm = endHour >= 12 ? "PM" : "AM";
  const endHour12 = endHour % 12 || 12;
  const endTimeStr = `${endHour12}:${endMin.toString().padStart(2, "0")} ${endAmPm}`;

  return `${startMonth} ${startDay} ${startTimeStr} - ${endTimeStr}`;
}

/**
 * Format time to 12-hour format (e.g., "2:49 PM")
 */
export function formatTime(date: Date): string {
  const hour = date.getHours();
  const min = date.getMinutes();
  const amPm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${min.toString().padStart(2, "0")} ${amPm}`;
}

/**
 * Format time to 24-hour format HH:MM:SS (e.g., "14:49:30")
 */
export function formatTime24Hour(date: Date): string {
  const hour = date.getHours().toString().padStart(2, "0");
  const min = date.getMinutes().toString().padStart(2, "0");
  const sec = date.getSeconds().toString().padStart(2, "0");
  return `${hour}:${min}:${sec}`;
}

/**
 * Format time to 12-hour format with seconds HH:MM:SS AM/PM (e.g., "2:49:30 PM")
 */
export function formatTimeWithSeconds(date: Date): string {
  const hour = date.getHours();
  const min = date.getMinutes();
  const sec = date.getSeconds();
  const amPm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")} ${amPm}`;
}

/**
 * Format date to "Monday, Jan 26" format
 */
export function formatDateLong(date: Date): string {
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = dayNames[date.getDay()];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();

  return `${dayName}, ${month} ${day}`;
}
