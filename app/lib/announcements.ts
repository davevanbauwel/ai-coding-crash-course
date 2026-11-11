// Announcement bounds live here rather than in announcementService so that
// client components can import them without pulling the database driver into
// the browser bundle.

export const MAX_ANNOUNCEMENT_TITLE_LENGTH = 200;
export const MAX_ANNOUNCEMENT_BODY_LENGTH = 10000;
