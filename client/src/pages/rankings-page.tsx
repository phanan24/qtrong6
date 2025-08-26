import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Sparkles, Clock } from "lucide-react";

export default function RankingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <TrendingUp className="mr-3 h-8 w-8 text-primary" />
          Bảng Xếp Hạng
        </h1>
        <p className="text-gray-600">
          Tính năng bảng xếp hạng học tập đang được phát triển
        </p>
      </div>

      <div className="space-y-6">
        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-700">
              <Sparkles className="mr-2 h-5 w-5 text-yellow-500" />
              Sắp Ra Mắt - Bảng Xếp Hạng Học Tập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12" data-testid="coming-soon-rankings">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Đang Phát Triển</h3>
              <div className="space-y-3 text-gray-600 max-w-md mx-auto">
                <p className="flex items-center justify-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Bảng xếp hạng trường học
                </p>
                <p className="flex items-center justify-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Bảng xếp hạng tỉnh/thành phố
                </p>
                <p className="flex items-center justify-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Bảng xếp hạng toàn quốc
                </p>
              </div>
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  🎯 Tính năng này đang được hoàn thiện để mang đến trải nghiệm tốt nhất cho học sinh
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-700">
              <Sparkles className="mr-2 h-5 w-5 text-yellow-500" />
              Tính Năng Sắp Có
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800">Theo Dõi Tiến Độ</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Thống kê chi tiết về quá trình học tập
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h4 className="font-semibold text-gray-800">Thách Thức Hàng Tháng</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Các cuộc thi và thử thách học tập
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}