import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface LikeData {
  postId?: string;
  commentId?: string;
}

export function useLikes(postId?: string, commentId?: string) {
  // Get likes count
  const likesCountQuery = useQuery({
    queryKey: ['likes', 'count', postId, commentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (postId) params.set('postId', postId);
      if (commentId) params.set('commentId', commentId);
      
      const res = await apiRequest('GET', `/api/likes/count?${params}`);
      return await res.json();
    },
    enabled: !!(postId || commentId),
  });

  // Check if current user liked
  const userLikedQuery = useQuery({
    queryKey: ['likes', 'check', postId, commentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (postId) params.set('postId', postId);
      if (commentId) params.set('commentId', commentId);
      
      const res = await apiRequest('GET', `/api/likes/check?${params}`);
      return await res.json();
    },
    enabled: !!(postId || commentId),
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (data: LikeData) => {
      const res = await apiRequest('POST', '/api/likes', data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate both queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['likes', 'count', postId, commentId] });
      queryClient.invalidateQueries({ queryKey: ['likes', 'check', postId, commentId] });
    },
  });

  return {
    likesCount: likesCountQuery.data?.count || 0,
    isLiked: userLikedQuery.data?.isLiked || false,
    isLoading: likesCountQuery.isLoading || userLikedQuery.isLoading,
    toggleLike: (data: LikeData) => toggleLikeMutation.mutate(data),
    isToggling: toggleLikeMutation.isPending,
  };
}