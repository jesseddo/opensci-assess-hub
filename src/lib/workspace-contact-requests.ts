export const WORKSPACE_CONTACT_STORAGE_KEY = "eddo-workspace-contact-requests";

export interface WorkspaceContactRequest {
  name: string;
  email: string;
  school: string;
  message: string;
  assessmentTitle?: string;
  unitId?: string;
  assessmentId?: string;
  submittedAt: string;
}

const MAX_STORED_REQUESTS = 20;

export function saveWorkspaceContactRequest(request: WorkspaceContactRequest): void {
  const existing = readWorkspaceContactRequests();
  window.localStorage.setItem(
    WORKSPACE_CONTACT_STORAGE_KEY,
    JSON.stringify([request, ...existing].slice(0, MAX_STORED_REQUESTS)),
  );
}

export function readWorkspaceContactRequests(): WorkspaceContactRequest[] {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_CONTACT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WorkspaceContactRequest[];
  } catch {
    return [];
  }
}
