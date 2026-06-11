import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import type { Assessment } from "@/lib/assessment-data";
import { useAuth } from "@/lib/auth-context";
import { workspaceGateContext } from "@/lib/workspace-gate";

export function useAddToWorkspaceGate() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const openAddToWorkspace = useCallback(
    (
      assessment: Assessment,
      unitId: string,
      from: "detail" | "index" = "detail",
      onAuthenticated?: () => void,
    ) => {
      if (isAuthenticated) {
        onAuthenticated?.();
        return;
      }

      const context = workspaceGateContext(assessment, unitId, from);
      void navigate({
        to: "/auth/sign-in",
        search: {
          returnTo: context.returnTo,
          assessmentTitle: context.assessmentTitle,
          unitId: context.unitId,
          assessmentId: context.assessmentId,
        },
      });
    },
    [isAuthenticated, navigate],
  );

  return {
    isAuthenticated,
    openAddToWorkspace,
  };
}
