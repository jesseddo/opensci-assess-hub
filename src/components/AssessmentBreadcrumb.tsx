import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Assessment, GradeLevel, Unit } from "@/lib/assessment-data";
import { cn } from "@/lib/utils";

const crumbLink =
  "font-bold text-primary underline-offset-2 transition-colors hover:text-primary/80 hover:underline";

const crumbCurrent = "font-bold text-primary truncate max-w-[min(100%,14rem)] sm:max-w-xs";

interface Props {
  grade: GradeLevel;
  unit: Unit;
  assessment: Assessment;
  className?: string;
}

export function AssessmentBreadcrumb({ grade, unit, assessment, className }: Props) {
  const unitLabel = `Unit ${unit.id}: ${unit.title}`;

  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="flex-nowrap items-center gap-1 text-sm sm:gap-1.5">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link to="/" className={crumbLink} title="OpenSciEd Assessment Library">
              Library
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator className="shrink-0 text-primary/50 [&>svg]:size-3.5">
          <ChevronRight />
        </BreadcrumbSeparator>

        <BreadcrumbItem className="min-w-0 shrink">
          <BreadcrumbLink asChild>
            <Link to="/" search={{ unit: unit.id }} className={cn(crumbLink, "truncate max-w-[8rem] sm:max-w-none")}>
              <span className="sm:hidden">Unit {unit.id}</span>
              <span className="hidden sm:inline">
                {grade.label} · {unitLabel}
              </span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator className="shrink-0 text-primary/50 [&>svg]:size-3.5">
          <ChevronRight />
        </BreadcrumbSeparator>

        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className={crumbCurrent} title={assessment.title}>
            {assessment.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
