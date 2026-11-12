// Announcement bounds and validation live here rather than in
// announcementService so that client components can import them without
// pulling the database driver into the browser bundle.

export const MAX_ANNOUNCEMENT_TITLE_LENGTH = 200;
export const MAX_ANNOUNCEMENT_BODY_LENGTH = 10000;

export type AnnouncementFieldErrors = { title?: string; body?: string };

/** An announcement as the UI renders it: body already rendered to safe HTML. */
export type AnnouncementListItem = {
  id: number;
  title: string;
  createdAt: string;
  bodyHtml: string;
};

export type AnnouncementValidationResult =
  | { success: true; title: string; body: string }
  | { success: false; errors: AnnouncementFieldErrors };

/**
 * Trims and checks an announcement's title and body. Shared by the service
 * (authoritative) and the compose form (early feedback), so the rules and
 * messages can't drift.
 */
export function validateAnnouncement(input: {
  title: string;
  body: string;
}): AnnouncementValidationResult {
  const title = input.title.trim();
  const body = input.body.trim();

  const errors: AnnouncementFieldErrors = {};
  if (!title) {
    errors.title = "Title is required";
  } else if (title.length > MAX_ANNOUNCEMENT_TITLE_LENGTH) {
    errors.title = `Title must be ${MAX_ANNOUNCEMENT_TITLE_LENGTH} characters or fewer`;
  }
  if (!body) {
    errors.body = "Body is required";
  } else if (body.length > MAX_ANNOUNCEMENT_BODY_LENGTH) {
    errors.body = `Body must be ${MAX_ANNOUNCEMENT_BODY_LENGTH.toLocaleString("en-US")} characters or fewer`;
  }
  if (errors.title || errors.body) return { success: false, errors };

  return { success: true, title, body };
}
