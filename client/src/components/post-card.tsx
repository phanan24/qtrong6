import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share, Star, Bot, Send, Trash2, Image, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLikes } from "@/hooks/use-likes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Post, Comment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [selectedCommentImage, setSelectedCommentImage] = useState<File | null>(null);
  const [commentImageUrl, setCommentImageUrl] = useState("");
  
  // Likes for post
  const { likesCount, isLiked, toggleLike, isToggling } = useLikes(post.id);

  const { data: comments } = useQuery<Comment[]>({
    queryKey: ["/api/posts", post.id, "comments"],
    enabled: showComments,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string; imageUrl?: string }) => {
      const res = await apiRequest("POST", "/api/comments", {
        postId: post.id,
        content: data.content,
        parentId: data.parentId,
        imageUrl: data.imageUrl,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
      setNewComment("");
      setReplyTo(null);
      setSelectedCommentImage(null);
      setCommentImageUrl("");
      toast({
        title: "Đã thêm bình luận",
        description: "Bình luận của bạn đã được đăng.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi bình luận",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/posts/${post.id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Đã xóa bài đăng",
        description: "Bài đăng đã được xóa thành công.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi xóa bài",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rateMutation = useMutation({
    mutationFn: async (data: { commentId: string; rating: number }) => {
      const res = await apiRequest("POST", "/api/ratings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
      toast({
        title: "Đã đánh giá",
        description: "Cảm ơn bạn đã đánh giá câu trả lời.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi đánh giá",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCommentImage(file);
      setCommentImageUrl(URL.createObjectURL(file));
    }
  };

  const removeCommentImage = () => {
    setSelectedCommentImage(null);
    setCommentImageUrl("");
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() && !selectedCommentImage) return;
    
    addCommentMutation.mutate({
      content: newComment,
      parentId: replyTo || undefined,
      imageUrl: commentImageUrl || undefined,
    });
  };

  const handleRating = (commentId: string, rating: number) => {
    rateMutation.mutate({ commentId, rating });
  };

  const handleDeletePost = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) {
      deletePostMutation.mutate();
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt || Date.now()), {
    addSuffix: true,
    locale: vi,
  });

  // Group comments by parent/child relationship
  const parentComments = comments?.filter(c => !c.parentId) || [];

  return (
    <Card className="w-full" data-testid={`post-${post.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-white">
              {post.userId?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold" data-testid={`post-author-${post.id}`}>
                  Học sinh
                </span>
                <span className="text-sm text-gray-500" data-testid={`post-time-${post.id}`}>
                  • {timeAgo}
                </span>
              </div>
              
              {user?.isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeletePost}
                  disabled={deletePostMutation.isPending}
                  data-testid={`button-delete-post-${post.id}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>

            {post.title && (
              <h3 className="text-lg font-semibold mb-2" data-testid={`post-title-${post.id}`}>
                {post.title}
              </h3>
            )}
            
            <p className="text-gray-800 mb-4" data-testid={`post-content-${post.id}`}>
              {post.content}
            </p>
            
            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt="Post attachment"
                className="rounded-lg mb-4 max-w-md max-h-64 object-cover"
                data-testid={`post-image-${post.id}`}
              />
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : ''}`}
                onClick={() => toggleLike({ postId: post.id })}
                disabled={isToggling || !user}
                data-testid={`button-like-${post.id}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500' : ''}`} />
                <span>Thích ({likesCount})</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1"
                onClick={() => setShowComments(!showComments)}
                data-testid={`button-comments-${post.id}`}
              >
                <MessageCircle className="h-4 w-4" />
                <span>Bình luận</span>
              </Button>
              
              <div className="relative group">
                <Button variant="ghost" size="sm" className="flex items-center space-x-1" data-testid={`button-share-${post.id}`}>
                  <Share className="h-4 w-4" />
                  <span>Chia sẻ</span>
                </Button>
                
                {/* Share Dropdown */}
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-white border rounded-lg shadow-lg p-2 z-10">
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-blue-600"
                      onClick={() => {
                        const url = `${window.location.origin}/qa#post-${post.id}`;
                        const text = `Hệ thống giáo dục LimVA - ${post.title}`;
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank');
                      }}
                      data-testid={`button-share-facebook-${post.id}`}
                    >
                      🔄 Facebook
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-blue-500"
                      onClick={() => {
                        const url = `${window.location.origin}/qa#post-${post.id}`;
                        const text = `Hệ thống giáo dục LimVA - ${post.title}`;
                        window.open(`https://m.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                      }}
                      data-testid={`button-share-messenger-${post.id}`}
                    >
                      💬 Messenger
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="space-y-4" data-testid={`comments-${post.id}`}>
                {/* Comment List */}
                {parentComments.map((comment) => {
                  const childComments = comments?.filter(c => c.parentId === comment.id) || [];
                  
                  return (
                    <div key={comment.id} className="space-y-3">
                      {/* Parent Comment */}
                      <div className={`p-4 rounded-lg ${comment.isAiResponse ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                        <div className="flex items-start space-x-3">
                          {comment.isAiResponse ? (
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <Bot className="text-white text-sm" />
                            </div>
                          ) : (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-secondary text-white">
                                {comment.userId?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-semibold">
                                {comment.isAiResponse ? 'AI Assistant' : 'Học sinh'}
                              </span>
                              <span className="text-sm text-gray-500">
                                • {formatDistanceToNow(new Date(comment.createdAt || Date.now()), { addSuffix: true, locale: vi })}
                              </span>
                            </div>
                            
                            <p className="text-gray-800 mb-3">{comment.content}</p>
                            
                            {/* Display comment image if exists */}
                            {comment.imageUrl && (
                              <div className="mb-3">
                                <img
                                  src={comment.imageUrl}
                                  alt="Comment attachment"
                                  className="max-w-sm rounded-lg border"
                                  data-testid={`comment-image-${comment.id}`}
                                />
                              </div>
                            )}
                            
                            {!comment.isAiResponse && (
                              <div className="flex items-center space-x-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyTo(comment.id)}
                                  data-testid={`button-reply-${comment.id}`}
                                >
                                  Trả lời
                                </Button>
                                
                                {/* Star Rating */}
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-gray-500">Đánh giá:</span>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => handleRating(comment.id, star)}
                                      className="text-yellow-400 hover:text-yellow-500"
                                      data-testid={`star-${comment.id}-${star}`}
                                    >
                                      <Star className="h-3 w-3" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Child Comments */}
                      {childComments.map((childComment) => (
                        <div key={childComment.id} className="ml-8">
                          <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-accent text-white text-xs">
                                  {childComment.userId?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-sm">Học sinh</span>
                                  <span className="text-xs text-gray-500">
                                    • {formatDistanceToNow(new Date(childComment.createdAt || Date.now()), { addSuffix: true, locale: vi })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800">{childComment.content}</p>
                                
                                {/* Display child comment image if exists */}
                                {childComment.imageUrl && (
                                  <div className="mt-2">
                                    <img
                                      src={childComment.imageUrl}
                                      alt="Comment attachment"
                                      className="max-w-32 rounded-lg border"
                                      data-testid={`child-comment-image-${childComment.id}`}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Add Comment Form */}
                {user && (
                  <div className="border-t pt-4">
                    {replyTo && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Đang trả lời bình luận</span>
                        <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                          Hủy
                        </Button>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {/* Image Preview */}
                      {selectedCommentImage && (
                        <div className="relative inline-block">
                          <img
                            src={commentImageUrl}
                            alt="Comment Preview"
                            className="w-32 h-24 object-cover rounded-lg border"
                            data-testid={`comment-image-preview-${post.id}`}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={removeCommentImage}
                            data-testid={`button-remove-comment-image-${post.id}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Textarea
                            placeholder="Viết bình luận..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[80px] resize-none"
                            data-testid={`textarea-comment-${post.id}`}
                          />
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          {/* Image Upload Button */}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCommentImageSelect}
                            className="hidden"
                            id={`comment-image-upload-${post.id}`}
                            data-testid={`input-comment-image-${post.id}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`comment-image-upload-${post.id}`)?.click()}
                            data-testid={`button-comment-image-${post.id}`}
                          >
                            <Image className="h-4 w-4" />
                          </Button>
                          
                          {/* Submit Button */}
                          <Button
                            onClick={handleSubmitComment}
                            disabled={addCommentMutation.isPending || (!newComment.trim() && !selectedCommentImage)}
                            data-testid={`button-submit-comment-${post.id}`}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
