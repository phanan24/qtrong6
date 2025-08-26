import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, json, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  theme: text("theme").default("default"),
  school: text("school"),
  province: text("province"),
  isAdmin: boolean("is_admin").default(false),
  isVerified: boolean("is_verified").default(false),
  totalScore: decimal("total_score", { precision: 10, scale: 2 }).default("0"),
  weeklyOpportunities: integer("weekly_opportunities").default(2),
  lastOpportunityReset: timestamp("last_opportunity_reset").default(sql`now()`),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const aiSettings = pgTable("ai_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activeModel: text("active_model"),
  deepseekEnabled: boolean("deepseek_enabled").default(true),
  gptEnabled: boolean("gpt_enabled").default(false),
  gemmaEnabled: boolean("gemma_enabled").default(true),
  gptOssEnabled: boolean("gpt_oss_enabled").default(true),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isExpired: boolean("is_expired").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
  expiresAt: timestamp("expires_at").default(sql`now() + interval '7 days'`),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  parentId: varchar("parent_id").references(() => comments.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isAiResponse: boolean("is_ai_response").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const homeworkSubmissions = pgTable("homework_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subject: text("subject").notNull(),
  content: text("content"),
  imageUrl: text("image_url"),
  analysis: json("analysis"),
  score: decimal("score", { precision: 3, scale: 1 }),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const practiceQuestions = pgTable("practice_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").references(() => homeworkSubmissions.id).notNull(),
  question: text("question").notNull(),
  options: json("options").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: text("difficulty").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const practiceAttempts = pgTable("practice_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  submissionId: varchar("submission_id").references(() => homeworkSubmissions.id).notNull(),
  questionsCorrect: integer("questions_correct").default(0),
  totalQuestions: integer("total_questions").default(12),
  attempts: json("attempts"),
  scoreAwarded: decimal("score_awarded", { precision: 3, scale: 1 }).default("0"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id),
  commentId: varchar("comment_id").references(() => comments.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const monthlyRankings = pgTable("monthly_rankings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  school: text("school").notNull(),
  province: text("province").notNull(),
  score: decimal("score", { precision: 10, scale: 2 }).notNull(),
  schoolRank: integer("school_rank"),
  provinceRank: integer("province_rank"),
  nationalRank: integer("national_rank"),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").references(() => posts.id),
  commentId: varchar("comment_id").references(() => comments.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  homeworkSubmissions: many(homeworkSubmissions),
  ratings: many(ratings),
  monthlyRankings: many(monthlyRankings),
  practiceAttempts: many(practiceAttempts),
  likes: many(likes),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  comments: many(comments),
  ratings: many(ratings),
  likes: many(likes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "parent" }),
  replies: many(comments, { relationName: "parent" }),
  ratings: many(ratings),
  likes: many(likes),
}));

export const homeworkSubmissionsRelations = relations(homeworkSubmissions, ({ one, many }) => ({
  user: one(users, { fields: [homeworkSubmissions.userId], references: [users.id] }),
  practiceQuestions: many(practiceQuestions),
  practiceAttempts: many(practiceAttempts),
}));

export const practiceQuestionsRelations = relations(practiceQuestions, ({ one }) => ({
  submission: one(homeworkSubmissions, { fields: [practiceQuestions.submissionId], references: [homeworkSubmissions.id] }),
}));

export const practiceAttemptsRelations = relations(practiceAttempts, ({ one }) => ({
  user: one(users, { fields: [practiceAttempts.userId], references: [users.id] }),
  submission: one(homeworkSubmissions, { fields: [practiceAttempts.submissionId], references: [homeworkSubmissions.id] }),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  post: one(posts, { fields: [ratings.postId], references: [posts.id] }),
  comment: one(comments, { fields: [ratings.commentId], references: [comments.id] }),
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
}));

export const monthlyRankingsRelations = relations(monthlyRankings, ({ one }) => ({
  user: one(users, { fields: [monthlyRankings.userId], references: [users.id] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
  comment: one(comments, { fields: [likes.commentId], references: [comments.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  name: true,
  school: true,
  province: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  name: true,
  avatar: true,
  bio: true,
  theme: true,
  school: true,
  province: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  imageUrl: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  postId: true,
  parentId: true,
  content: true,
  imageUrl: true,
  userId: true,
  isAiResponse: true,
});

export const insertHomeworkSubmissionSchema = createInsertSchema(homeworkSubmissions).pick({
  subject: true,
  content: true,
  imageUrl: true,
});

export const insertRatingSchema = createInsertSchema(ratings).pick({
  postId: true,
  commentId: true,
  rating: true,
}).refine(data => data.postId || data.commentId, {
  message: "Phải có ít nhất postId hoặc commentId"
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  postId: true,
  commentId: true,
}).refine(data => data.postId || data.commentId, {
  message: "Phải có ít nhất postId hoặc commentId"
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type User = typeof users.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertHomeworkSubmission = z.infer<typeof insertHomeworkSubmissionSchema>;
export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

export type AISettings = typeof aiSettings.$inferSelect;
export type PracticeQuestion = typeof practiceQuestions.$inferSelect;
export type PracticeAttempt = typeof practiceAttempts.$inferSelect;
export type MonthlyRanking = typeof monthlyRankings.$inferSelect;
