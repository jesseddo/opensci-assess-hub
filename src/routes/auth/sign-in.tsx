import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, LogIn } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { LibraryBrandMark } from "@/components/LibraryBrandMark";
import { WorkspaceContactForm } from "@/components/WorkspaceContactForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { parseReturnTo, browseReturnTo } from "@/lib/workspace-gate";

function returnToHref(returnTo: string | undefined): string {
  return parseReturnTo(returnTo);
}

function browseHref(returnTo: string | undefined): string {
  return browseReturnTo(returnTo);
}

export const Route = createFileRoute("/auth/sign-in")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: typeof search.returnTo === "string" ? search.returnTo : undefined,
    assessmentTitle:
      typeof search.assessmentTitle === "string" ? search.assessmentTitle : undefined,
    unitId: typeof search.unitId === "string" ? search.unitId : undefined,
    assessmentId: typeof search.assessmentId === "string" ? search.assessmentId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Eddo Workspace" },
      {
        name: "description",
        content:
          "Sign in to add OpenSciEd assessments to Eddo Workspace, or contact us to request access.",
      },
    ],
  }),
  component: WorkspaceSignInPage,
});

function WorkspaceSignInPage() {
  const { isAuthenticated, signIn } = useAuth();
  const { returnTo, assessmentTitle, unitId, assessmentId } = Route.useSearch();
  const destination = returnToHref(returnTo);
  const libraryHref = browseHref(returnTo);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      window.location.assign(destination);
    }
  }, [destination, isAuthenticated]);

  const handleSignIn = (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    signIn(trimmedEmail, displayName.trim() || trimmedEmail.split("@")[0] || "Teacher");
    window.location.assign(destination);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-ui">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <LibraryBrandMark />
          <a
            href={libraryHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to library
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Eddo Workspace
          </p>
          <h1 className="text-2xl font-semibold text-eddo-green">Add assessments to your workspace</h1>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
            Sign in to collect student responses and get AI-assisted evaluation. Browse and export
            materials without an account — only Workspace requires sign-in.
          </p>
          {assessmentTitle && (
            <p className="mt-5 pt-1 text-sm italic leading-relaxed text-muted-foreground max-w-2xl">
              You were adding {assessmentTitle}
              {unitId ? ` from Unit ${unitId}` : ""}.
            </p>
          )}
        </div>

        <section className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-eddo-navy">Already have an Eddo account?</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to continue adding this assessment to your workspace.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="sign-in-email">Email</Label>
              <Input
                id="sign-in-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@school.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sign-in-name">Display name</Label>
              <Input
                id="sign-in-name"
                name="displayName"
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <LogIn className="size-4" aria-hidden />
              Sign in
            </Button>
          </form>
        </section>

        <section className="rounded-lg border border-eddo-green/25 bg-eddo-green/5 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-eddo-green">Don&apos;t have sign-in yet?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;re onboarding teachers to Eddo Workspace in phases. Tell us about your
              classroom and we&apos;ll help you get access — or export handouts from the library
              while you wait.
            </p>
          </div>

          <WorkspaceContactForm
            assessmentTitle={assessmentTitle}
            unitId={unitId}
            assessmentId={assessmentId}
          />
        </section>

        <p className="text-sm text-muted-foreground">
          Prefer to keep browsing?{" "}
          <a href={libraryHref} className="text-eddo-accent underline underline-offset-2">
            Return to the assessment library
          </a>{" "}
          — export and Quick look stay available without an account.
        </p>
      </main>
    </div>
  );
}
