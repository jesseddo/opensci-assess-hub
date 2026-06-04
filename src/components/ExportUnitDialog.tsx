import { Download } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Unit } from "@/lib/assessment-data";
import { buildUnitExportStats, getFormalTypeDisplay } from "@/lib/assessment-helpers";
import { isTeOpportunity, TE_OPPORTUNITY_LABEL } from "@/lib/assessment-source";
import { exportUnitPackages } from "@/lib/library-actions";

interface Props {
  unit: Unit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportUnitDialog({ unit, open, onOpenChange }: Props) {
  if (!unit) return null;

  const rows = buildUnitExportStats(unit);
  const exportableCount = rows.filter((r) => r.exportReady).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Export Unit {unit.id}: {unit.title}
          </DialogTitle>
          <DialogDescription>
            Export all available assessment materials for this unit. Edit copies in Google Drive as
            needed.
          </DialogDescription>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assessment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Materials</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ assessment, availableCount, totalCount, workspaceReady }) => (
              <TableRow key={assessment.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{assessment.title}</p>
                    <p className="text-xs text-muted-foreground">{assessment.lesson}</p>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {isTeOpportunity(assessment)
                    ? TE_OPPORTUNITY_LABEL
                    : (getFormalTypeDisplay(assessment) ?? "—")}
                </TableCell>
                <TableCell className="text-right text-xs font-mono">
                  {availableCount}/{totalCount}
                  {workspaceReady && (
                    <span className="block text-[10px] text-primary font-sans font-medium">
                      Workspace ready
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={exportableCount === 0}
            onClick={() => {
              exportUnitPackages(unit);
              onOpenChange(false);
            }}
          >
            <Download className="size-4" aria-hidden />
            Export all ({exportableCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
