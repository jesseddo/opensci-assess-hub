import { AssessmentBreadcrumb } from "@/components/AssessmentBreadcrumb";
import { LibraryBrandMark } from "@/components/LibraryBrandMark";
import type { Assessment, GradeLevel, Unit } from "@/lib/assessment-data";

interface Props {
  grade: GradeLevel;
  unit: Unit;
  assessment: Assessment;
}

/** Sticky detail-page chrome: brand row + assessment breadcrumb. */
export function AssessmentDetailHeader({ grade, unit, assessment }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 font-ui backdrop-blur-md">
      <div className="mx-auto max-w-3xl space-y-3.5 px-6 pb-3.5 pt-5">
        <LibraryBrandMark />

        <AssessmentBreadcrumb grade={grade} unit={unit} assessment={assessment} />
      </div>
    </header>
  );
}
