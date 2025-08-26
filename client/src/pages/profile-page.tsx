import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Removed Badge import - using span instead
import { User, Settings, Camera, Save, MapPin, School, TrendingUp, Star } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { updateUserProfileSchema, type UpdateUserProfile } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

const themes = [
  { value: 'default', name: 'Mặc định', description: 'Giao diện chuẩn' },
  { value: 'technology', name: 'Công nghệ', description: 'Xanh dương hiện đại' },
  { value: 'feminine', name: 'Nữ tính', description: 'Hồng pastel nhẹ nhàng' },
  { value: 'dark', name: 'Tối', description: 'Nền đen tinh tế' },
];

const provinces = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu', 'Bắc Giang', 'Bắc Kạn',
  'Bắc Ninh', 'Bến Tre', 'Bình Dương', 'Bình Định', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UpdateUserProfile>({
    name: user?.name || '',
    bio: user?.bio || '',
    school: user?.school || '',
    province: user?.province || '',
    theme: user?.theme || 'default',
  });

  const { data: rankings } = useQuery({
    queryKey: ["/api/rankings", user?.id],
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const res = await apiRequest("PUT", "/api/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "Thành công",
        description: "Hồ sơ đã được cập nhật!",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật hồ sơ. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarURL: string) => {
      const res = await apiRequest("PUT", "/api/profile/avatar", { avatarURL });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Thành công",
        description: "Avatar đã được cập nhật!",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật avatar. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const res = await apiRequest("POST", "/api/objects/upload");
    const data = await res.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      updateAvatarMutation.mutate(uploadedFile.uploadURL);
    }
  };

  const handleSave = () => {
    try {
      const validatedData = updateUserProfileSchema.parse(profileData);
      updateProfileMutation.mutate(validatedData);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof UpdateUserProfile, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Vui lòng đăng nhập để xem hồ sơ.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
        <Button
          variant={isEditing ? "outline" : "default"}
          onClick={() => setIsEditing(!isEditing)}
          data-testid="button-edit-profile"
        >
          <Settings className="w-4 h-4 mr-2" />
          {isEditing ? "Hủy" : "Chỉnh sửa"}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Avatar & Basic Info */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="relative">
              <Avatar className="w-32 h-32 mx-auto mb-4" data-testid="avatar-display">
                <AvatarImage src={user.avatar ? `/api${user.avatar}` : undefined} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute bottom-0 right-1/2 translate-x-16">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="rounded-full p-2"
                  >
                    <Camera className="w-4 h-4" />
                  </ObjectUploader>
                </div>
              )}
            </div>

            <h2 className="text-xl font-semibold mb-2">{user.name}</h2>
            <p className="text-gray-600 mb-4">@{user.username}</p>
            
            {user.bio && (
              <p className="text-sm text-gray-700 mb-4">{user.bio}</p>
            )}

            <div className="space-y-2">
              {user.school && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <School className="w-4 h-4 mr-2" />
                  {user.school}
                </div>
              )}
              {user.province && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {user.province}
                </div>
              )}
            </div>

            <div className="mt-4">
              <span className="inline-flex items-center rounded-full border border-secondary bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold">
                {themes.find(t => t.value === user.theme)?.name || 'Mặc định'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Họ và tên</Label>
                <Input
                  id="name"
                  value={isEditing ? profileData.name : user.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  data-testid="input-name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                  data-testid="input-email"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Giới thiệu</Label>
              <Textarea
                id="bio"
                placeholder="Viết vài dòng về bản thân..."
                value={isEditing ? profileData.bio : user.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                disabled={!isEditing}
                data-testid="textarea-bio"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school">Trường học</Label>
                <Input
                  id="school"
                  placeholder="Tên trường học"
                  value={isEditing ? profileData.school : user.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  disabled={!isEditing}
                  data-testid="input-school"
                />
              </div>
              <div>
                <Label htmlFor="province">Tỉnh/Thành phố</Label>
                <Select
                  value={isEditing ? profileData.province : user.province}
                  onValueChange={(value) => handleInputChange('province', value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger data-testid="select-province">
                    <SelectValue placeholder="Chọn tỉnh/thành phố" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="theme">Giao diện</Label>
              <Select
                value={isEditing ? profileData.theme : user.theme}
                onValueChange={(value) => handleInputChange('theme', value)}
                disabled={!isEditing}
              >
                <SelectTrigger data-testid="select-theme">
                  <SelectValue placeholder="Chọn giao diện" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      <div>
                        <div className="font-medium">{theme.name}</div>
                        <div className="text-xs text-gray-500">{theme.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="w-full"
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats & Rankings */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Thống kê & Xếp hạng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{user.totalScore || 0}</div>
                <div className="text-sm text-gray-600">Điểm tổng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {rankings?.schoolRank || '-'}
                </div>
                <div className="text-sm text-gray-600">Xếp hạng trường</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {rankings?.provinceRank || '-'}
                </div>
                <div className="text-sm text-gray-600">Xếp hạng tỉnh</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {rankings?.nationalRank || '-'}
                </div>
                <div className="text-sm text-gray-600">Xếp hạng quốc gia</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}