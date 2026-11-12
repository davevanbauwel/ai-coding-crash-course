import { Card, CardContent, CardHeader } from "~/components/ui/card";
import type { AnnouncementListItem } from "~/lib/announcements";

/**
 * A single posted announcement. `bodyHtml` must come from the comment renderer
 * (untrusted Markdown) — it is injected as-is.
 */
export function AnnouncementCard({
  announcement,
}: {
  announcement: AnnouncementListItem;
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">{announcement.title}</h3>
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          {new Date(announcement.createdAt).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div
          className="prose prose-sm prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: announcement.bodyHtml }}
        />
      </CardContent>
    </Card>
  );
}
