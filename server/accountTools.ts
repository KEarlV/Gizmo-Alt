export function isOwnedByUser(ownerUserId: number, actorUserId: number) {
  return ownerUserId === actorUserId;
}

export function buildRoleAuditEvent(actorUserId: number, targetUserId: number, role: "user" | "admin") {
  return {
    actorUserId,
    targetUserId,
    action: "role_changed",
    metadata: { role },
  } as const;
}
