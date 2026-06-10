export function assessmentDetailPath(unitId: string, assessmentId: string): string {
  return `/units/${unitId}/assessments/${assessmentId}`;
}

export function libraryPath(unitId?: string): string {
  if (!unitId) return "/";
  return `/?unit=${encodeURIComponent(unitId)}`;
}
