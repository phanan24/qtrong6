import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPostSchema, insertCommentSchema, insertHomeworkSubmissionSchema, insertRatingSchema, updateUserProfileSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || "sk-or-v1-default-key";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

async function callOpenRouter(model: string, messages: any[], maxTokens: number = 1000) {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://limva.replit.app",
        "X-Title": "LimVA - Vietnamese Educational Platform"
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Xin lỗi, tôi không thể trả lời câu hỏi này.";
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    return "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn.";
  }
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Yêu cầu đăng nhập" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  console.log("requireAdmin check:", {
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    isAdmin: req.user?.isAdmin,
    is_admin: req.user?.is_admin
  });
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Không có quyền truy cập" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // AI Settings routes
  app.get("/api/ai-settings", async (req, res) => {
    try {
      const settings = await storage.getAISettings();
      res.json(settings || { deepseekEnabled: true, gptEnabled: false, gemmaEnabled: true, gptOssEnabled: true });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy cài đặt AI" });
    }
  });

  app.put("/api/ai-settings", requireAdmin, async (req, res) => {
    try {
      const { deepseekEnabled, gptEnabled, gemmaEnabled, gptOssEnabled } = req.body;
      await storage.updateAISettings(deepseekEnabled, gptEnabled, gemmaEnabled, gptOssEnabled);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi cập nhật cài đặt AI" });
    }
  });

  // Posts routes
  app.get("/api/posts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const posts = await storage.getPosts(limit, offset);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách bài đăng" });
    }
  });

  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost({
        ...postData,
        userId: req.user!.id
      });

      // Auto-generate AI response if content is text-only
      if (postData.content && !postData.imageUrl) {
        const aiSettings = await storage.getAISettings();
        if (!aiSettings?.activeModel) {
          // No AI model enabled
          return res.json(post);
        }

        const modelMap = {
          'deepseek': 'deepseek/deepseek-r1:free',
          'gpt': 'openai/gpt-5-chat', 
          'gemma': 'google/gemma-2-9b-it:free',
          'gptOss': 'openai/gpt-oss-20b:free'
        };

        const model = modelMap[aiSettings.activeModel as keyof typeof modelMap] || "deepseek/deepseek-r1:free";

        const aiResponse = await callOpenRouter(model, [
          {
            role: "system",
            content: "Bạn là một trợ lý AI giáo dục thông minh, chuyên hỗ trợ học sinh Việt Nam. Hãy trả lời câu hỏi một cách chi tiết, dễ hiểu và có tính giáo dục cao. Sử dụng tiếng Việt."
          },
          {
            role: "user",
            content: postData.content
          }
        ]);

        await storage.createComment({
          postId: post.id,
          content: aiResponse,
          isAiResponse: true,
          userId: null
        });
      }

      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Lỗi khi tạo bài đăng" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    console.log("DELETE /api/posts/:id called", {
      isAuthenticated: req.isAuthenticated(),
      user: req.user,
      postId: req.params.id
    });
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Yêu cầu đăng nhập" });
    }
    
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Không có quyền truy cập admin" });
    }
    
    try {
      console.log("Deleting post:", req.params.id, "by admin:", req.user?.email);
      const success = await storage.deletePost(req.params.id);
      console.log("Delete result:", success);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Không tìm thấy bài đăng" });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Lỗi khi xóa bài đăng", error: errorMessage });
    }
  });

  // Comments routes
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách bình luận" });
    }
  });

  app.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment({
        ...commentData,
        userId: req.user!.id
      });
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi tạo bình luận" });
    }
  });

  // Homework routes
  app.post("/api/homework", requireAuth, async (req, res) => {
    try {
      const submissionData = insertHomeworkSubmissionSchema.parse(req.body);
      const submission = await storage.createHomeworkSubmission({
        ...submissionData,
        userId: req.user!.id
      });

      // Analyze homework with AI
      const aiSettings = await storage.getAISettings();
      let model = "deepseek/deepseek-r1:free";
      
      if (aiSettings?.gptEnabled) {
        model = "openai/gpt-5-chat";
      } else if (!aiSettings?.deepseekEnabled) {
        return res.status(400).json({ message: "Hệ thống AI hiện không khả dụng" });
      }

      let messages: any[] = [
        {
          role: "system", 
          content: "Bạn là giáo viên chuyên nghiệp, hãy phân tích bài làm của học sinh một cách chi tiết và có tính xây dựng."
        }
      ];

      // Add text content
      const textPrompt = `Phân tích bài làm môn ${submissionData.subject} sau đây:
${submissionData.content}

Hãy phân tích theo format sau (SỬ DỤNG LaTeX để viết công thức toán học):

**PHÂN TÍCH BÀI LÀM**

**1. Lỗi sai đã phát hiện:**
- Liệt kê từng lỗi cụ thể

**2. Giải thích lỗi sai:**
- Giải thích tại sao sai, nguyên nhân

**3. Lời giải đúng:**
- Trình bày lời giải từng bước rõ ràng
- Sử dụng LaTeX cho công thức: $5x + 6 = 0$ 
- Ví dụ: $5x + 6 = 0 \\Rightarrow 5x = -6 \\Rightarrow x = \\frac{-6}{5}$

**4. Đánh giá điểm: [X]/10**
- Giải thích điểm số cụ thể

**5. Đề xuất cải thiện:**
- Đưa ra gợi ý học tập cụ thể

QUAN TRỌNG: 
- Sử dụng $...$ cho công thức inline: $x = 2$
- Sử dụng $$...$$ cho công thức display (khối): $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
- Trả lời bằng tiếng Việt, sử dụng LaTeX cho tất cả công thức toán học.`;

      // For GPT-4o with image, use array format; for text-only, use string format
      let userMessage: any;
      
      if (submissionData.imageUrl && aiSettings?.gptEnabled) {
        // Multimodal format for GPT-4o
        userMessage = {
          role: "user",
          content: []
        };
        
        userMessage.content.push({
          type: "text",
          text: textPrompt
        });
      } else {
        // Simple text format for other models
        userMessage = {
          role: "user",
          content: textPrompt
        };
      }

      // Check for images in content (Imgur links) when using ChatGPT-5
      const imageRegex = /!\[.*?\]\((https:\/\/i\.imgur\.com\/[^\)]+)\)/g;
      const imageMatches = Array.from(submissionData.content.matchAll(imageRegex));
      
      if (imageMatches.length > 0 && aiSettings?.gptEnabled) {
        // Add each image found in content
        imageMatches.forEach((match, index) => {
          const imageUrl = match[1];
          console.log(`Adding image ${index + 1} to ChatGPT-5 request:`, imageUrl);
          
          userMessage.content.push({
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high"
            }
          });
        });
        
        // Add note about image analysis for ChatGPT-5
        userMessage.content.push({
          type: "text", 
          text: `\n\nHãy phân tích cả ${imageMatches.length} ảnh bài làm đính kèm ở trên. Đọc kỹ nội dung trong từng ảnh và kết hợp với văn bản để đưa ra đánh giá toàn diện. Nếu có công thức toán học hoặc hình vẽ trong ảnh, hãy phân tích chi tiết.`
        });
        
        console.log("Sending to OpenRouter with model:", model);
        console.log("Message structure:", JSON.stringify(messages, null, 2));
      }

      messages.push(userMessage);

      const analysis = await callOpenRouter(model, messages, 2000);


      await storage.updateHomeworkAnalysis(submission.id, {
        content: analysis,
        errors: [],
        suggestions: []
      });

      res.json({ ...submission, analysis: { content: analysis } });
    } catch (error) {
      console.error("Error analyzing homework:", error);
      res.status(500).json({ message: "Lỗi khi phân tích bài làm" });
    }
  });

  app.get("/api/homework/:id", requireAuth, async (req, res) => {
    try {
      const submission = await storage.getHomeworkSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Không tìm thấy bài làm" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy thông tin bài làm" });
    }
  });

  // Chat with AI about homework
  app.post("/api/homework/:id/chat", requireAuth, async (req, res) => {
    try {
      const submission = await storage.getHomeworkSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Không tìm thấy bài làm" });
      }

      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Tin nhắn không được để trống" });
      }

      // Get AI settings
      const aiSettings = await storage.getAISettings();
      let model = "deepseek/deepseek-r1:free";
      
      if (aiSettings?.gptEnabled) {
        model = "openai/gpt-5-chat";
      } else if (!aiSettings?.deepseekEnabled) {
        return res.status(400).json({ message: "Hệ thống AI hiện không khả dụng" });
      }

      const chatPrompt = `Bạn là giáo viên AI thân thiện, đang hỗ trợ học sinh về bài làm môn ${submission.subject}.

Bài làm của học sinh:
${submission.content}

Phân tích trước đó:
${submission.analysis?.content || 'Chưa có phân tích'}

Câu hỏi của học sinh: ${message}

Hãy trả lời câu hỏi một cách:
- Thân thiện, dễ hiểu
- Liên quan đến bài làm
- Sử dụng LaTeX cho công thức: $x = 2$ hoặc $$formula$$
- Giải thích chi tiết nhưng ngắn gọn
- Khuyến khích học sinh

Trả lời bằng tiếng Việt:`;

      const aiResponse = await callOpenRouter(model, [
        {
          role: "system",
          content: "Bạn là giáo viên AI thân thiện, hỗ trợ học sinh học tập hiệu quả."
        },
        { role: "user", content: chatPrompt }
      ], 800);

      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Lỗi khi chat với AI" });
    }
  });

  // Practice routes
  app.post("/api/homework/:id/practice", requireAuth, async (req, res) => {
    try {
      const submission = await storage.getHomeworkSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Không tìm thấy bài làm" });
      }

      // Generate 12 practice questions using AI
      const aiSettings = await storage.getAISettings();
      let model = "deepseek/deepseek-r1:free";
      
      if (aiSettings?.gptEnabled) {
        model = "openai/gpt-5-chat";
      }

      const prompt = `Dựa trên bài làm môn ${submission.subject} này:
${submission.content}

Tạo 12 câu hỏi trắc nghiệm (4 dễ, 4 trung bình, 4 khó) với format JSON:
{
  "questions": [
    {
      "question": "Câu hỏi...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "explanation": "Giải thích...",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Đảm bảo câu hỏi liên quan đến chủ đề và có độ khó tăng dần.`;

      const response = await callOpenRouter(model, [
        {
          role: "system",
          content: "Bạn là chuyên gia tạo câu hỏi trắc nghiệm giáo dục. Hãy tạo câu hỏi chất lượng cao với đáp án chính xác."
        },
        { role: "user", content: prompt }
      ], 3000);

      try {
        // Try to extract JSON from AI response (handle markdown code blocks)
        let jsonContent = response.trim();
        
        // Remove markdown code blocks
        if (jsonContent.includes('```json')) {
          const start = jsonContent.indexOf('```json') + 7;
          const end = jsonContent.indexOf('```', start);
          if (end !== -1) {
            jsonContent = jsonContent.substring(start, end).trim();
          }
        } else if (jsonContent.includes('```')) {
          const start = jsonContent.indexOf('```') + 3;
          const end = jsonContent.indexOf('```', start);
          if (end !== -1) {
            jsonContent = jsonContent.substring(start, end).trim();
          }
        } else {
          // Fallback to finding JSON object
          const jsonStart = jsonContent.indexOf('{');
          const jsonEnd = jsonContent.lastIndexOf('}');
          
          if (jsonStart !== -1 && jsonEnd !== -1) {
            jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
          }
        }
        
        const questionsData = JSON.parse(jsonContent);
        const questions = questionsData.questions.map((q: any, index: number) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          orderIndex: index
        }));

        await storage.createPracticeQuestions(submission.id, questions);
        res.json(questions);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        console.error("AI Response:", response);
        // Fallback: create simple practice questions
        const fallbackQuestions = [
          {
            question: `Câu hỏi luyện tập về ${submission.subject}`,
            options: ["A. Đáp án A", "B. Đáp án B", "C. Đáp án C", "D. Đáp án D"],
            correctAnswer: "A",
            explanation: "Đây là câu hỏi mẫu",
            difficulty: "medium",
            orderIndex: 0
          }
        ];
        await storage.createPracticeQuestions(submission.id, fallbackQuestions);
        res.json(fallbackQuestions);
      }
    } catch (error) {
      console.error("Error generating practice:", error);
      res.status(500).json({ message: "Lỗi khi tạo bài luyện tập" });
    }
  });

  app.get("/api/homework/:id/practice", requireAuth, async (req, res) => {
    try {
      const questions = await storage.getPracticeQuestions(req.params.id);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy câu hỏi luyện tập" });
    }
  });

  // Ratings routes
  app.post("/api/ratings", requireAuth, async (req, res) => {
    try {
      const ratingData = insertRatingSchema.parse(req.body);
      const rating = await storage.createRating({
        ...ratingData,
        userId: req.user!.id
      });
      res.json(rating);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi đánh giá" });
    }
  });

  // Likes routes
  app.post("/api/likes", requireAuth, async (req, res) => {
    try {
      const { insertLikeSchema } = await import("@shared/schema");
      const likeData = insertLikeSchema.parse(req.body);
      const like = await storage.createLike({
        ...likeData,
        userId: req.user!.id
      });
      res.json(like);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi thích" });
    }
  });

  app.get("/api/likes/count", async (req, res) => {
    try {
      const { postId, commentId } = req.query;
      const count = await storage.getLikesCount(
        postId as string || undefined,
        commentId as string || undefined
      );
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy số lượt thích" });
    }
  });

  app.get("/api/likes/check", requireAuth, async (req, res) => {
    try {
      const { postId, commentId } = req.query;
      const isLiked = await storage.isLikedByUser(
        req.user!.id,
        postId as string || undefined,
        commentId as string || undefined
      );
      res.json({ isLiked });
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi kiểm tra lượt thích" });
    }
  });

  // Rankings routes
  app.get("/api/rankings/:type", async (req, res) => {
    try {
      const type = req.params.type as 'school' | 'province' | 'national';
      const limit = parseInt(req.query.limit as string) || 50;
      const rankings = await storage.getMonthlyRankings(type, limit);
      res.json(rankings);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy bảng xếp hạng" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      // This would need to be implemented in storage
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng" });
    }
  });

  app.put("/api/admin/users/:id/verify", requireAdmin, async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, { isVerified: true });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi xác thực người dùng" });
    }
  });

  // Cron job to update monthly rankings (would be better with a proper cron service)
  setInterval(async () => {
    const now = new Date();
    if (now.getDate() === 1 && now.getHours() === 0) {
      try {
        await storage.updateMonthlyRankings();
        console.log("Monthly rankings updated");
      } catch (error) {
        console.error("Error updating monthly rankings:", error);
      }
    }
  }, 60 * 60 * 1000); // Check every hour

  // Admin user creation route (for initial setup)
  app.post("/api/admin/create-admin", async (req, res) => {
    try {
      const { email, username, password, name } = req.body;
      
      // Check if any admin already exists
      const existingAdmin = await storage.getUserByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({ message: "Tài khoản admin đã tồn tại" });
      }

      // Hash password (simple version for admin creation)
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user directly in database
      const adminUser = await storage.createUser({
        email,
        username,
        password: hashedPassword,
        name,
        school: "LimVA System",
        province: "Hà Nội",
      });

      // Update to admin status
      const adminUpdated = await storage.updateUser(adminUser.id, { 
        isAdmin: true,
        isVerified: true 
      });

      res.status(201).json({ 
        message: "Tài khoản admin đã được tạo thành công",
        user: { ...adminUpdated, password: undefined }
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Lỗi khi tạo tài khoản admin" });
    }
  });

  // Avatar upload routes
  app.get("/objects/:objectPath(*)", requireAuth, async (req, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Profile routes
  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const profileData = updateUserProfileSchema.parse(req.body);
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updatedUser = await storage.updateUserProfile(userId, profileData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/profile/avatar", requireAuth, async (req, res) => {
    if (!req.body.avatarURL) {
      return res.status(400).json({ error: "avatarURL is required" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.avatarURL,
        {
          owner: userId,
          visibility: "public", // Avatars are public
        }
      );

      const updatedUser = await storage.updateUserProfile(userId, {
        avatar: objectPath,
      });

      res.status(200).json({
        objectPath,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error setting avatar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
