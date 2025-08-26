import { users, posts, comments, homeworkSubmissions, aiSettings, ratings, practiceQuestions, practiceAttempts, monthlyRankings, likes, type User, type InsertUser, type UpdateUserProfile, type Post, type InsertPost, type Comment, type InsertComment, type HomeworkSubmission, type InsertHomeworkSubmission, type AISettings, type Rating, type InsertRating, type Like, type InsertLike, type PracticeQuestion, type PracticeAttempt, type MonthlyRanking } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, avg } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserProfile(id: string, updates: UpdateUserProfile): Promise<User | undefined>;
  
  // AI Settings
  getAISettings(): Promise<AISettings | undefined>;
  updateAISettings(deepseekEnabled: boolean, gptEnabled: boolean, gemmaEnabled?: boolean, gptOssEnabled?: boolean): Promise<void>;
  
  // Posts
  getPosts(limit: number, offset: number): Promise<Post[]>;
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost & { userId: string }): Promise<Post>;
  deletePost(id: string): Promise<boolean>;
  
  // Comments
  getCommentsByPost(postId: string): Promise<Comment[]>;
  createComment(comment: InsertComment & { userId?: string, isAiResponse?: boolean }): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;
  
  // Homework
  createHomeworkSubmission(submission: InsertHomeworkSubmission & { userId: string }): Promise<HomeworkSubmission>;
  getHomeworkSubmission(id: string): Promise<HomeworkSubmission | undefined>;
  updateHomeworkAnalysis(id: string, analysis: any): Promise<void>;
  
  // Practice
  createPracticeQuestions(submissionId: string, questions: Omit<PracticeQuestion, 'id' | 'submissionId'>[]): Promise<void>;
  getPracticeQuestions(submissionId: string): Promise<PracticeQuestion[]>;
  createPracticeAttempt(attempt: Omit<PracticeAttempt, 'id'>): Promise<PracticeAttempt>;
  updatePracticeAttempt(id: string, updates: Partial<PracticeAttempt>): Promise<void>;
  
  // Ratings
  createRating(rating: InsertRating & { userId: string }): Promise<Rating>;
  getAverageRating(commentId: string): Promise<number>;
  
  // Likes
  createLike(like: InsertLike & { userId: string }): Promise<Like>;
  getLikesCount(postId?: string, commentId?: string): Promise<number>;
  isLikedByUser(userId: string, postId?: string, commentId?: string): Promise<boolean>;
  
  // Rankings
  getMonthlyRankings(type: 'school' | 'province' | 'national', limit?: number): Promise<MonthlyRanking[]>;
  updateMonthlyRankings(): Promise<void>;
  
  sessionStore: connectPg.PGStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: connectPg.PGStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async updateUserProfile(id: string, updates: UpdateUserProfile): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAISettings(): Promise<AISettings | undefined> {
    const [settings] = await db.select().from(aiSettings).limit(1);
    return settings || undefined;
  }

  async updateAISettings(deepseekEnabled: boolean, gptEnabled: boolean, gemmaEnabled?: boolean, gptOssEnabled?: boolean): Promise<void> {
    const existing = await this.getAISettings();
    
    if (existing) {
      await db.update(aiSettings)
        .set({ 
          deepseekEnabled, 
          gptEnabled, 
          gemmaEnabled: gemmaEnabled ?? existing.gemmaEnabled,
          gptOssEnabled: gptOssEnabled ?? existing.gptOssEnabled,
          updatedAt: sql`now()` 
        })
        .where(eq(aiSettings.id, existing.id));
    } else {
      await db.insert(aiSettings).values({ 
        deepseekEnabled, 
        gptEnabled,
        gemmaEnabled: gemmaEnabled ?? true,
        gptOssEnabled: gptOssEnabled ?? true
      });
    }
  }

  async getPosts(limit: number, offset: number): Promise<Post[]> {
    return await db.select().from(posts)
      .where(eq(posts.isExpired, false))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async createPost(post: InsertPost & { userId: string }): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment & { userId?: string, isAiResponse?: boolean }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createHomeworkSubmission(submission: InsertHomeworkSubmission & { userId: string }): Promise<HomeworkSubmission> {
    const [newSubmission] = await db.insert(homeworkSubmissions).values(submission).returning();
    return newSubmission;
  }

  async getHomeworkSubmission(id: string): Promise<HomeworkSubmission | undefined> {
    const [submission] = await db.select().from(homeworkSubmissions).where(eq(homeworkSubmissions.id, id));
    return submission || undefined;
  }

  async updateHomeworkAnalysis(id: string, analysis: any): Promise<void> {
    await db.update(homeworkSubmissions).set({ analysis }).where(eq(homeworkSubmissions.id, id));
  }

  async createPracticeQuestions(submissionId: string, questions: Omit<PracticeQuestion, 'id' | 'submissionId'>[]): Promise<void> {
    const questionsWithSubmission = questions.map(q => ({ ...q, submissionId }));
    await db.insert(practiceQuestions).values(questionsWithSubmission);
  }

  async getPracticeQuestions(submissionId: string): Promise<PracticeQuestion[]> {
    return await db.select().from(practiceQuestions)
      .where(eq(practiceQuestions.submissionId, submissionId))
      .orderBy(practiceQuestions.orderIndex);
  }

  async createPracticeAttempt(attempt: Omit<PracticeAttempt, 'id'>): Promise<PracticeAttempt> {
    const [newAttempt] = await db.insert(practiceAttempts).values(attempt).returning();
    return newAttempt;
  }

  async updatePracticeAttempt(id: string, updates: Partial<PracticeAttempt>): Promise<void> {
    await db.update(practiceAttempts).set(updates).where(eq(practiceAttempts.id, id));
  }

  async createRating(rating: InsertRating & { userId: string }): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getAverageRating(commentId: string): Promise<number> {
    const result = await db.select({ avg: avg(ratings.rating) })
      .from(ratings)
      .where(eq(ratings.commentId, commentId));
    
    return Number(result[0]?.avg) || 0;
  }

  async createLike(like: InsertLike & { userId: string }): Promise<Like> {
    // Check if user already liked this post/comment
    const existingLike = await db.select().from(likes)
      .where(and(
        eq(likes.userId, like.userId),
        like.postId ? eq(likes.postId, like.postId) : sql`${likes.postId} IS NULL`,
        like.commentId ? eq(likes.commentId, like.commentId) : sql`${likes.commentId} IS NULL`
      ))
      .limit(1);
    
    if (existingLike.length > 0) {
      // Unlike if already liked
      await db.delete(likes).where(eq(likes.id, existingLike[0].id));
      return existingLike[0];
    }
    
    // Create new like
    const [newLike] = await db.insert(likes).values(like).returning();
    return newLike;
  }

  async getLikesCount(postId?: string, commentId?: string): Promise<number> {
    const result = await db.select({ count: count() })
      .from(likes)
      .where(and(
        postId ? eq(likes.postId, postId) : sql`${likes.postId} IS NULL`,
        commentId ? eq(likes.commentId, commentId) : sql`${likes.commentId} IS NULL`
      ));
    
    return result[0]?.count || 0;
  }

  async isLikedByUser(userId: string, postId?: string, commentId?: string): Promise<boolean> {
    const result = await db.select().from(likes)
      .where(and(
        eq(likes.userId, userId),
        postId ? eq(likes.postId, postId) : sql`${likes.postId} IS NULL`,
        commentId ? eq(likes.commentId, commentId) : sql`${likes.commentId} IS NULL`
      ))
      .limit(1);
    
    return result.length > 0;
  }

  async getMonthlyRankings(type: 'school' | 'province' | 'national', limit: number = 50): Promise<MonthlyRanking[]> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    let orderBy;
    switch(type) {
      case 'school': orderBy = monthlyRankings.schoolRank; break;
      case 'province': orderBy = monthlyRankings.provinceRank; break;
      case 'national': orderBy = monthlyRankings.nationalRank; break;
    }
    
    return await db.select().from(monthlyRankings)
      .where(and(
        eq(monthlyRankings.month, currentMonth),
        eq(monthlyRankings.year, currentYear)
      ))
      .orderBy(orderBy)
      .limit(limit);
  }

  async updateMonthlyRankings(): Promise<void> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Get all users with their scores
    const usersWithScores = await db.select({
      id: users.id,
      school: users.school,
      province: users.province,
      score: users.totalScore
    }).from(users)
    .where(and(
      sql`${users.school} IS NOT NULL`,
      sql`${users.province} IS NOT NULL`
    ))
    .orderBy(desc(users.totalScore));
    
    // Calculate rankings
    const rankings: any[] = [];
    const schoolRankings: { [key: string]: number } = {};
    const provinceRankings: { [key: string]: number } = {};
    
    usersWithScores.forEach((user, index) => {
      const nationalRank = index + 1;
      
      // School ranking
      const schoolKey = user.school!;
      if (!schoolRankings[schoolKey]) {
        schoolRankings[schoolKey] = 0;
      }
      schoolRankings[schoolKey]++;
      const schoolRank = schoolRankings[schoolKey];
      
      // Province ranking
      const provinceKey = user.province!;
      if (!provinceRankings[provinceKey]) {
        provinceRankings[provinceKey] = 0;
      }
      provinceRankings[provinceKey]++;
      const provinceRank = provinceRankings[provinceKey];
      
      rankings.push({
        userId: user.id,
        school: user.school,
        province: user.province,
        score: user.score,
        schoolRank,
        provinceRank,
        nationalRank,
        month: currentMonth,
        year: currentYear
      });
    });
    
    // Clear existing rankings for this month and insert new ones
    await db.delete(monthlyRankings)
      .where(and(
        eq(monthlyRankings.month, currentMonth),
        eq(monthlyRankings.year, currentYear)
      ));
    
    if (rankings.length > 0) {
      await db.insert(monthlyRankings).values(rankings);
    }
    
    // Reset user scores
    await db.update(users).set({ totalScore: "0" });
  }
}

export const storage = new DatabaseStorage();
