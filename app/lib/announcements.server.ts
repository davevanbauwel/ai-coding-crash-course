import { renderComment } from "~/lib/comment-markdown.server";
import type { AnnouncementListItem } from "~/lib/announcements";

/**
 * Shapes announcements for the UI. Bodies are untrusted Markdown, so they go
 * through the comment renderer rather than the trusted lesson renderer.
 */
export function toAnnouncementListItems(
  announcements: Array<{
    id: number;
    title: string;
    createdAt: string;
    body: string;
  }>
): Promise<AnnouncementListItem[]> {
  return Promise.all(
    announcements.map(async (announcement) => ({
      id: announcement.id,
      title: announcement.title,
      createdAt: announcement.createdAt,
      bodyHtml: await renderComment(announcement.body),
    }))
  );
}
