import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Unit } from "@/lib/assessment-data";
import { getLessonMeta } from "@/lib/unit-table-rows";
import { openIngestedDocument } from "@/lib/library-actions";

interface Props {
  unit: Unit;
  lessonNum: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeacherEditionDialog({ unit, lessonNum, open, onOpenChange }: Props) {
  if (lessonNum == null) return null;

  const padded = String(lessonNum).padStart(2, "0");
  const { shortTitle, drivingQuestion, teacherEditionPath } = getLessonMeta(unit, lessonNum);
  const fileName = teacherEditionPath?.split(/[/\\]/).pop();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-ui text-eddo-green">
            Lesson {padded}: {shortTitle}
          </DialogTitle>
          <DialogDescription className="font-body text-left text-foreground/90 leading-relaxed pt-2">
            {drivingQuestion}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 space-y-2">
          <p className="text-sm font-ui font-medium text-eddo-navy">Assessment guidance in Teacher Edition</p>
          <p className="text-sm font-body text-muted-foreground leading-relaxed">
            This lesson has no formal assessment in the library yet. OpenSciEd embeds assessment
            opportunities in the lesson plan — use the Teacher Edition for timing, facilitation, and
            scoring guidance.
          </p>
          {fileName && (
            <p className="text-xs font-ui text-muted-foreground truncate" title={fileName}>
              {fileName}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            disabled={!teacherEditionPath}
            onClick={() => {
              if (teacherEditionPath) {
                openIngestedDocument(teacherEditionPath, fileName ?? "Teacher Edition");
              }
            }}
          >
            Open Teacher Edition
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
