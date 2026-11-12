import { and, eq, desc, gte } from "drizzle-orm";
import { db } from "~/db";
import { announcements, enrollments } from "~/db/schema";
import {
  MAX_ANNOUNCEMENT_TITLE_LENGTH,
  MAX_ANNOUNCEMENT_BODY_LENGTH,
} from "~/lib/announcements";

// ─── Announcement Service ───
// Course announcements: one-way broadcasts from a course's staff to its
// enrolled students. Immutable once posted. Authorization lives in routes.

export type Announcement = typeof announcements.$inferSelect;

export type AnnouncementErrors = { title?: string; body?: string };

export type CreateAnnouncementResult =
  | { success: true; announcement: Announcement }
  | { success: false; errors: AnnouncementErrors };

export function createAnnouncement(input: {
  courseId: number;
  authorId: number;
  title: string;
  body: string;
}): CreateAnnouncementResult {
  const title = input.title.trim();
  const body = input.body.trim();

  const errors: AnnouncementErrors = {};
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

  const announcement = db
    .insert(announcements)
    .values({ courseId: input.courseId, authorId: input.authorId, title, body })
    .returning()
    .get();

  return { success: true, announcement };
}

/**
 * Every announcement for a course, newest first — the staff view.
 */
export function getCourseAnnouncements(courseId: number): Announcement[] {
  return db
    .select()
    .from(announcements)
    .where(eq(announcements.courseId, courseId))
    .orderBy(desc(announcements.createdAt), desc(announcements.id))
    .all();
}

/**
 * Announcements a student can see: those posted at or after their enrollment,
 * newest first. Empty when the user isn't enrolled in the course.
 */
export function getStudentAnnouncements(
  courseId: number,
  userId: number
): Announcement[] {
  return db
    .select({ announcement: announcements })
    .from(announcements)
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.courseId, announcements.courseId),
        eq(enrollments.userId, userId)
      )
    )
    .where(
      and(
        eq(announcements.courseId, courseId),
        gte(announcements.createdAt, enrollments.enrolledAt)
      )
    )
    .orderBy(desc(announcements.createdAt), desc(announcements.id))
    .all()
    .map((row) => row.announcement);
}
