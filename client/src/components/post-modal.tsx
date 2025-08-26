import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { Image, X } from "lucide-react";

const postFormSchema = insertPostSchema.extend({
  title: z.string().optional(),
});

type PostFormData = z.infer<typeof postFormSchema>;

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: React.ReactNode;
}

export default function PostModal({ isOpen, onClose, trigger }: PostModalProps) {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
      imageUrl: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Đăng bài thành công",
        description: "Câu hỏi của bạn đã được đăng lên diễn đàn.",
      });
      onClose();
      form.reset();
      setSelectedImage(null);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi đăng bài",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PostFormData) => {
    createPostMutation.mutate(data);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // In a real app, you would upload the image and get a URL
      // For now, we'll use a placeholder
      form.setValue("imageUrl", URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    form.setValue("imageUrl", "");
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setSelectedImage(null);
  };

  return (
    <>
      {trigger}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]" data-testid="post-modal">
          <DialogHeader>
            <DialogTitle data-testid="modal-title">Đăng câu hỏi</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề (không bắt buộc)</Label>
              <Input
                id="title"
                placeholder="Nhập tiêu đề cho câu hỏi..."
                data-testid="input-post-title"
                {...form.register("title")}
              />
            </div>

            <div>
              <Label htmlFor="content">Nội dung câu hỏi *</Label>
              <Textarea
                id="content"
                rows={6}
                placeholder="Nhập câu hỏi của bạn..."
                className="resize-none"
                data-testid="textarea-post-content"
                {...form.register("content")}
              />
              {form.formState.errors.content && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.content.message}</p>
              )}
            </div>
            
            {/* Image Upload */}
            <div className="space-y-3">
              <Label>Hình ảnh minh họa</Label>
              
              {selectedImage ? (
                <div className="relative">
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  data-testid="image-preview"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                  data-testid="button-remove-image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Thêm ảnh minh họa</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  data-testid="button-select-image"
                >
                  Chọn ảnh
                </Button>
                <p className="text-sm text-gray-500 mt-2">JPG, PNG (tối đa 10MB)</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-post"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createPostMutation.isPending || !form.watch("content")}
              data-testid="button-submit-post"
            >
              {createPostMutation.isPending ? "Đang đăng..." : "Đăng bài"}
            </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
