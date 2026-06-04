import { useState } from "react";
import { AlertTriangle, Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Assessment } from "@/lib/assessment-data";
import { MOCK_WORKSPACES } from "@/lib/assessment-data";
import { getWorkspaceAttachItems, isWorkspaceReady } from "@/lib/assessment-helpers";
import { addToWorkspace, goToWorkspaceStub } from "@/lib/library-actions";

interface Props {
  assessment: Assessment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToWorkspaceDialog({ assessment, open, onOpenChange }: Props) {
  const [destination, setDestination] = useState<string>(MOCK_WORKSPACES[0].id);
  const [step, setStep] = useState<"configure" | "confirm">("configure");

  if (!assessment) return null;

  const workspaceReady = isWorkspaceReady(assessment);
  const attachItems = getWorkspaceAttachItems(assessment);
  const destinationLabel = MOCK_WORKSPACES.find((w) => w.id === destination)?.label ?? destination;

  const handleClose = (next: boolean) => {
    if (!next) {
      setStep("configure");
    }
    onOpenChange(next);
  };

  const handleConfirm = () => {
    addToWorkspace(assessment, destinationLabel);
    setStep("configure");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {step === "configure" ? (
          <>
            <DialogHeader>
              <DialogTitle>Add to Workspace</DialogTitle>
              <DialogDescription>{assessment.title}</DialogDescription>
            </DialogHeader>

            {!workspaceReady && (
              <div
                className="flex gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm"
                role="alert"
              >
                <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">Not yet digitized for Workspace</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    This assessment is missing a Google Form or scoring materials. You can still
                    export the Doc package.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="workspace-select" className="text-sm font-medium">
                Destination
              </label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger id="workspace-select" aria-label="Select workspace">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_WORKSPACES.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Will attach</p>
              {attachItems.length > 0 ? (
                <ul className="space-y-1.5">
                  {attachItems.map((item) => (
                    <li key={item.kind} className="flex items-center gap-2 text-sm">
                      <Check className="size-4 text-primary shrink-0" aria-hidden />
                      {item.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No scoring materials available yet.</p>
              )}
              <p className="text-xs text-muted-foreground">
                Customize scoring in Eddo Workspace after adding.
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!workspaceReady}
                title={workspaceReady ? undefined : "Requires Google Form and answer key or rubric"}
                onClick={() => setStep("confirm")}
              >
                <Plus className="size-4" aria-hidden />
                Add to Workspace
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Added successfully</DialogTitle>
              <DialogDescription>
                Review what was attached before opening Workspace.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Assessment
                </p>
                <p className="font-medium">{assessment.title}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Destination
                </p>
                <p>{destinationLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Attached
                </p>
                <ul className="mt-1 space-y-1">
                  {attachItems.map((item) => (
                    <li key={item.kind} className="flex items-center gap-2">
                      <Check className="size-3.5 text-primary" aria-hidden />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleConfirm}>
                Done
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleConfirm();
                  goToWorkspaceStub();
                }}
              >
                Go to Workspace
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
