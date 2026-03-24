export const formatMember = (member) => ({
  id: member.userCode,
  name: `${member.firstName || ""} ${member.lastName || ""}`.trim(),
  email: member.email,
  phone: member.phoneNumber,
  userType: member.userType,
  title: member.title || [],
  avatar: member.dpURL,
  location: member.location,
  documents: member?.documents || [],
  spouse: member?.spouseDetails?.name || "",
  children: member?.childrenDetails || [],
});