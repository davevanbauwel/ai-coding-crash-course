import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { AlertTriangle, Megaphone, Send } from "lucide-react";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { AnnouncementCard } from "~/components/announcement-card";
import {
  validateAnnouncement,
  type AnnouncementFieldErrors,
  type AnnouncementListItem,
} from "~/lib/announcements";

/**
 * Compose → confirm → post. Announcements can't be edited or deleted, so the
 * confirm step (with the current reach) is the safeguard against mistakes.
 */
export function AnnouncementsTab({
  announcements,
  enrollmentCount,
}: {
  announcements: AnnouncementListItem[];
  enrollmentCount: number;
}) {
  const fetcher = useFetcher<{
    success?: boolean;
    error?: string;
    fieldErrors?: AnnouncementFieldErrors;
  }>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AnnouncementFieldErrors>({});

  const isPosting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.success) {
      setTitle("");
      setBody("");
      setFieldErrors({});
      setConfirming(false);
      toast.success("Announcement posted.");
    } else if (fetcher.data.fieldErrors) {
      setFieldErrors(fetcher.data.fieldErrors);
      setConfirming(false);
    } else if (fetcher.data.error) {
      toast.error(fetcher.data.error);
      setConfirming(false);
    }
  }, [fetcher.state, fetcher.data]);

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    const result = validateAnnouncement({ title, body });
    if (!result.success) {
      setFieldErrors(result.errors);
      return;
    }
    setFieldErrors({});
    setConfirming(true);
  }

  function handleConfirm() {
    fetcher.submit(
      { intent: "post-announcement", title, body },
      { method: "post" }
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">New Announcement</h2>
          <p className="text-sm text-muted-foreground">
            Sent to everyone enrolled in this course. Announcements can't be
            edited or deleted once posted.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReview} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={confirming || isPosting}
                aria-invalid={fieldErrors.title ? true : undefined}
              />
              {fieldErrors.title && (
                <p className="text-sm text-destructive">{fieldErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-body">Body (Markdown)</Label>
              <Textarea
                id="announcement-body"
                name="body"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={confirming || isPosting}
                aria-invalid={fieldErrors.body ? true : undefined}
              />
              {fieldErrors.body && (
                <p className="text-sm text-destructive">{fieldErrors.body}</p>
              )}
            </div>

            {confirming ? (
              <div
                role="alert"
                className={
                  enrollmentCount === 0
                    ? "rounded-md border border-yellow-500/50 bg-yellow-50 p-4 dark:bg-yellow-950/30"
                    : "rounded-md border bg-muted/50 p-4"
                }
              >
                {enrollmentCount === 0 ? (
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="size-4 text-yellow-600" />
                    No students are enrolled in this course, so this
                    announcement will reach 0 students.
                  </p>
                ) : (
                  <p className="text-sm font-medium">
                    This will reach {enrollmentCount}{" "}
                    {enrollmentCount === 1 ? "student" : "students"}.
                  </p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  Once posted, it can't be edited or deleted.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isPosting}
                  >
                    <Send className="mr-1.5 size-4" />
                    {isPosting ? "Posting..." : "Confirm and Post"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConfirming(false)}
                    disabled={isPosting}
                  >
                    Back to Editing
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="submit">
                <Megaphone className="mr-1.5 size-4" />
                Post
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Past Announcements</h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No announcements posted yet.
          </p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
