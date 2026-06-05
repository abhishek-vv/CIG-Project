import Club from "@/models/Club";

// Get user's role in a club — returns null if not a member
export async function getUserClubRole(userId, clubId) {
  const club = await Club.findById(clubId);
  if (!club) return null;

  // Super admin of the club (creator)
  if (club.createdBy.toString() === userId) return "ADMIN";

  const member = club.members.find(
    (m) => m.user.toString() === userId
  );

  return member ? member.role : null;
}

// Check if user is admin of a club
export function isClubAdmin(role) {
  return role === "ADMIN";
}

// Check if user can upload/manage media
export function canManageMedia(role) {
  return ["ADMIN", "PHOTOGRAPHER"].includes(role);
}

// Check if user is at least a club member
export function isClubMember(role) {
  return ["ADMIN", "PHOTOGRAPHER", "CLUB_MEMBER"].includes(role);
}