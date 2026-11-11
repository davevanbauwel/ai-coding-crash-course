import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

vi.mock("~/db", () => ({
  get db() {
    return testDb;
  },
}));

// Import after mock so the module picks up our test db
import {
  createAnnouncement,
  getCourseAnnouncements,
} from "./announcementService";

describe("announcementService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  describe("createAnnouncement", () => {
    it("stores the announcement with trimmed title and body", () => {
      const result = createAnnouncement({
        courseId: base.course.id,
        authorId: base.instructor.id,
        title: "  Module 3 is live  ",
        body: "\n  Go check out **module 3**.  \n",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.announcement).toMatchObject({
        courseId: base.course.id,
        authorId: base.instructor.id,
        title: "Module 3 is live",
        body: "Go check out **module 3**.",
      });
      expect(result.announcement.id).toEqual(expect.any(Number));
      expect(result.announcement.createdAt).toEqual(expect.any(String));
    });

    it.each([
      ["empty", ""],
      ["whitespace-only", "   \n\t "],
    ])("rejects an %s title or body and stores nothing", (_label, blank) => {
      const result = createAnnouncement({
        courseId: base.course.id,
        authorId: base.instructor.id,
        title: blank,
        body: blank,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errors.title).toBeDefined();
      expect(result.errors.body).toBeDefined();
      expect(getCourseAnnouncements(base.course.id)).toEqual([]);
    });

    it("accepts a title of 200 characters and a body of 10,000", () => {
      const result = createAnnouncement({
        courseId: base.course.id,
        authorId: base.instructor.id,
        title: "t".repeat(200),
        body: "b".repeat(10000),
      });

      expect(result.success).toBe(true);
    });

    it("rejects a title over 200 characters", () => {
      const result = createAnnouncement({
        courseId: base.course.id,
        authorId: base.instructor.id,
        title: "t".repeat(201),
        body: "Body",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errors.title).toBeDefined();
      expect(result.errors.body).toBeUndefined();
      expect(getCourseAnnouncements(base.course.id)).toEqual([]);
    });

    it("rejects a body over 10,000 characters", () => {
      const result = createAnnouncement({
        courseId: base.course.id,
        authorId: base.instructor.id,
        title: "Title",
        body: "b".repeat(10001),
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.errors.body).toBeDefined();
      expect(result.errors.title).toBeUndefined();
      expect(getCourseAnnouncements(base.course.id)).toEqual([]);
    });
  });

  describe("getCourseAnnouncements", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    function postAt(courseId: number, title: string, at: string) {
      vi.setSystemTime(new Date(at));
      const result = createAnnouncement({
        courseId,
        authorId: base.instructor.id,
        title,
        body: "Body",
      });
      if (!result.success) throw new Error("expected success");
      return result.announcement;
    }

    it("returns the course's announcements newest first", () => {
      vi.useFakeTimers();
      postAt(base.course.id, "First", "2026-01-01T10:00:00.000Z");
      postAt(base.course.id, "Third", "2026-03-01T10:00:00.000Z");
      postAt(base.course.id, "Second", "2026-02-01T10:00:00.000Z");

      const titles = getCourseAnnouncements(base.course.id).map(
        (a) => a.title
      );

      expect(titles).toEqual(["Third", "Second", "First"]);
    });

    it("does not include announcements from other courses", () => {
      const otherCourse = testDb
        .insert(schema.courses)
        .values({
          title: "Other Course",
          slug: "other-course",
          description: "Another course",
          salesCopy: "Sales copy",
          instructorId: base.instructor.id,
          categoryId: base.category.id,
          status: schema.CourseStatus.Published,
        })
        .returning()
        .get();

      vi.useFakeTimers();
      postAt(base.course.id, "Ours", "2026-01-01T10:00:00.000Z");
      postAt(otherCourse.id, "Theirs", "2026-01-02T10:00:00.000Z");

      expect(getCourseAnnouncements(base.course.id).map((a) => a.title)).toEqual(
        ["Ours"]
      );
      expect(getCourseAnnouncements(otherCourse.id).map((a) => a.title)).toEqual(
        ["Theirs"]
      );
    });
  });
});
