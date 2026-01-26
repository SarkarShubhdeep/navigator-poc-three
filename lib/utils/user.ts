/**
 * Get user initials from full name
 * @param fullName - Full name string (e.g., "John Doe")
 * @returns Two-letter initials (e.g., "JD")
 */
export function getUserInitials(fullName: string | null | undefined): string {
  if (!fullName || !fullName.trim()) {
    return "";
  }

  const parts = fullName.trim().split(/\s+/);
  
  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    // Only one name, use first two letters
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Multiple names, use first letter of first and last name
  const firstInitial = parts[0][0]?.toUpperCase() || "";
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || "";
  
  return (firstInitial + lastInitial).substring(0, 2);
}

/**
 * Get display name from user data
 * @param fullName - Full name from user metadata
 * @param email - User email
 * @returns Display name (full name if available, otherwise email)
 */
export function getDisplayName(
  fullName: string | null | undefined,
  email: string | null | undefined
): string {
  if (fullName && fullName.trim()) {
    return fullName.trim();
  }
  if (email) {
    return email;
  }
  return "User";
}
