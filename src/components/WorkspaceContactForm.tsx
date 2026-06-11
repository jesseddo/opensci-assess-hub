import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  saveWorkspaceContactRequest,
  type WorkspaceContactRequest,
} from "@/lib/workspace-contact-requests";

interface Props {
  assessmentTitle?: string;
  unitId?: string;
  assessmentId?: string;
}

function defaultMessage(assessmentTitle?: string): string {
  return assessmentTitle
    ? `I'd like to add "${assessmentTitle}" to Eddo Workspace for my class.`
    : "I'd like access to Eddo Workspace for OpenSciEd assessments.";
}

export function WorkspaceContactForm({ assessmentTitle, unitId, assessmentId }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [message, setMessage] = useState(() => defaultMessage(assessmentTitle));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<WorkspaceContactRequest | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const payload: WorkspaceContactRequest = {
      name: name.trim(),
      email: email.trim(),
      school: school.trim(),
      message: message.trim(),
      assessmentTitle,
      unitId,
      assessmentId,
      submittedAt: new Date().toISOString(),
    };

    saveWorkspaceContactRequest(payload);
    setSubmitted(payload);

    toast.success("Message saved", {
      description: "We'll reach out shortly to help you get set up with Eddo Workspace.",
    });

    setSubmitting(false);
  };

  const handleSendAnother = () => {
    setSubmitted(null);
    setName("");
    setEmail("");
    setSchool("");
    setMessage(defaultMessage(assessmentTitle));
  };

  if (submitted) {
    return (
      <div className="space-y-4 font-ui">
        <div className="rounded-md border border-eddo-green/30 bg-white/80 p-4 space-y-2">
          <p className="text-sm font-medium text-eddo-navy">Thanks — we got your message.</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Someone from Eddo will follow up at{" "}
            <span className="font-medium text-foreground">{submitted.email}</span>. You can keep
            browsing and exporting materials while you wait.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleSendAnother}>
          Send another message
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Prototype: request saved in this browser&apos;s local storage (
          <code className="font-mono">eddo-workspace-contact-requests</code>).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-ui">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@school.edu"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-school">School or district</Label>
        <Input
          id="contact-school"
          name="school"
          autoComplete="organization"
          value={school}
          onChange={(event) => setSchool(event.target.value)}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">How can we help?</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell us about your classroom and what you're hoping to do in Workspace."
        />
      </div>

      {assessmentTitle && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Assessment context: {assessmentTitle}
          {unitId ? ` · Unit ${unitId}` : ""}
        </p>
      )}

      <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? "Sending…" : "Contact us"}
      </Button>
    </form>
  );
}
