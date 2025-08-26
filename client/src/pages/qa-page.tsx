import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, HelpCircle, Share, Star, Bot } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Post, Comment } from "@shared/schema";
import PostCard from "@/components/post-card";
import PostModal from "@/components/post-modal";

export default function QAPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64" data-testid="qa-loading">
        <div className="text-lg text-gray-500">Đang tải câu hỏi...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="qa-page">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800" data-testid="text-qa-title">Hỏi bài</h2>
        <PostModal 
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          trigger={
            <Button 
              onClick={() => setIsPostModalOpen(true)}
              data-testid="button-new-question"
            >
              <Plus className="mr-2 h-4 w-4" />
              Đăng câu hỏi
            </Button>
          }
        />
      </div>

      {/* Post Feed */}
      <div className="space-y-6">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <Card data-testid="no-posts">
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Chưa có câu hỏi nào</h3>
              <p className="text-gray-600 mb-4">Hãy là người đầu tiên đặt câu hỏi trong cộng đồng!</p>
              <Button onClick={() => setIsPostModalOpen(true)} data-testid="button-first-question">
                <Plus className="mr-2 h-4 w-4" />
                Đặt câu hỏi đầu tiên
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
