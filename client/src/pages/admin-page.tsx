import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
// Badge component not available, using span instead
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Settings, Users, Bot, CheckCircle, Ban, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AISettings } from "@shared/schema";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: aiSettings, isLoading: aiSettingsLoading } = useQuery<AISettings>({
    queryKey: ["/api/ai-settings"],
  });

  const updateAISettingsMutation = useMutation({
    mutationFn: async (settings: { deepseekEnabled: boolean; gptEnabled: boolean; gemmaEnabled: boolean; gptOssEnabled: boolean }) => {
      const res = await apiRequest("PUT", "/api/ai-settings", settings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-settings"] });
      toast({
        title: "Cập nhật thành công",
        description: "Cài đặt AI đã được lưu.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cập nhật",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAISelect = (model: 'deepseek' | 'gpt' | 'gemma' | 'gptOss') => {
    if (!aiSettings) return;

    // Only one AI can be active at a time
    let newSettings = {
      ...aiSettings,
      deepseekEnabled: model === 'deepseek',
      gptEnabled: model === 'gpt', 
      gemmaEnabled: model === 'gemma',
      gptOssEnabled: model === 'gptOss'
    };

    updateAISettingsMutation.mutate(newSettings);
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-64" data-testid="admin-unauthorized">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Không có quyền truy cập</h3>
          <p className="text-gray-600">Bạn không có quyền truy cập trang quản trị.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-page">
      <div className="flex items-center space-x-3">
        <h2 className="text-3xl font-bold text-gray-800" data-testid="text-admin-title">Quản trị hệ thống</h2>
        <Shield className="h-8 w-8 text-primary" />
      </div>

      {/* AI Model Controls */}
      <Card data-testid="ai-controls">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Điều khiển AI</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiSettingsLoading ? (
            <div className="text-center py-4" data-testid="ai-settings-loading">
              <div className="text-gray-500">Đang tải cài đặt...</div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Chọn AI đầu não chính</h3>
                <p className="text-sm text-gray-600 mb-4">Chỉ một AI có thể hoạt động tại một thời điểm. AI trả phí sẽ có tính năng upload và môn học mới.</p>
              </div>

              <RadioGroup
                value={
                  aiSettings?.deepseekEnabled ? 'deepseek' :
                  aiSettings?.gptEnabled ? 'gpt' :
                  aiSettings?.gemmaEnabled ? 'gemma' :
                  aiSettings?.gptOssEnabled ? 'gptOss' : ''
                }
                onValueChange={(value) => handleAISelect(value as 'deepseek' | 'gpt' | 'gemma' | 'gptOss')}
                className="space-y-4"
                disabled={updateAISettingsMutation.isPending}
              >
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border-2 hover:border-blue-200 transition-colors" data-testid="deepseek-option">
                  <RadioGroupItem value="deepseek" id="deepseek" />
                  <Label htmlFor="deepseek" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">DeepSeek R1 (Miễn phí)</div>
                        <div className="text-sm text-gray-600">deepseek/deepseek-r1-distill-qwen-14b:free</div>
                        <div className="text-xs text-blue-600 mt-1">🔒 Chỉ môn cơ bản, không upload ảnh</div>
                      </div>
                      {aiSettings?.deepseekEnabled && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Đang hoạt động</span>
                      )}
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border-2 hover:border-blue-200 transition-colors" data-testid="gpt-option">
                  <RadioGroupItem value="gpt" id="gpt" />
                  <Label htmlFor="gpt" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">GPT-5 (Trả phí) ⭐</div>
                        <div className="text-sm text-gray-600">openai/gpt-5-chat</div>
                        <div className="text-xs text-green-600 mt-1">✅ Đầy đủ tính năng, upload ảnh, môn mới</div>
                      </div>
                      {aiSettings?.gptEnabled && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Đang hoạt động</span>
                      )}
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border-2 hover:border-blue-200 transition-colors" data-testid="gemma-option">
                  <RadioGroupItem value="gemma" id="gemma" />
                  <Label htmlFor="gemma" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Google Gemma 3B (Miễn phí)</div>
                        <div className="text-sm text-gray-600">google/gemma-3n-e2b-it:free</div>
                        <div className="text-xs text-blue-600 mt-1">🔒 Chỉ môn cơ bản, không upload ảnh</div>
                      </div>
                      {aiSettings?.gemmaEnabled && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Đang hoạt động</span>
                      )}
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border-2 hover:border-blue-200 transition-colors" data-testid="gpt-oss-option">
                  <RadioGroupItem value="gptOss" id="gptOss" />
                  <Label htmlFor="gptOss" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">GPT OSS 20B (Miễn phí)</div>
                        <div className="text-sm text-gray-600">openai/gpt-oss-20b:free</div>
                        <div className="text-xs text-blue-600 mt-1">🔒 Chỉ môn cơ bản, không upload ảnh</div>
                      </div>
                      {aiSettings?.gptOssEnabled && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Đang hoạt động</span>
                      )}
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {!aiSettings?.deepseekEnabled && !aiSettings?.gptEnabled && !aiSettings?.gemmaEnabled && !aiSettings?.gptOssEnabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4" data-testid="ai-warning">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Cảnh báo</span>
                  </div>
                  <p className="text-yellow-700 mt-1">
                    Chưa chọn AI đầu não. Vui lòng chọn một mô hình để hệ thống có thể hoạt động.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <Card data-testid="user-management">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Quản lý người dùng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8" data-testid="user-management-placeholder">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Tính năng đang phát triển</h3>
            <p className="text-gray-600">Tính năng quản lý người dùng sẽ sớm được cập nhật.</p>
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card data-testid="stat-users">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-sm text-gray-600">Tổng người dùng</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-questions">
          <CardContent className="p-6 text-center">
            <Bot className="h-8 w-8 text-secondary mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-sm text-gray-600">Câu hỏi hôm nay</div>
          </CardContent>
        </Card>

        <Card data-testid="stat-homework">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">--</div>
            <div className="text-sm text-gray-600">Bài làm đã kiểm tra</div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Info */}
      <Card className="bg-blue-50 border-blue-200" data-testid="admin-info">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-white">
                {user.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-blue-800">{user.name}</span>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm text-blue-600">Quản trị viên hệ thống</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
