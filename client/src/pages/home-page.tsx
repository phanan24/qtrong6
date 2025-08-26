import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Sigma, Book, Users, FlaskConical, HelpCircle, Search, TrendingUp, Beaker, Zap } from "lucide-react";
import limvaLogo from "@/assets/limva-logo.png";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleFeatureClick = (path: string) => {
    if (user) {
      setLocation(path);
    } else {
      setLocation("/auth");
    }
  };

  return (
    <div className="space-y-8" data-testid="home-page">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl p-8 md:p-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="hero-title">
            Nền tảng học tập thông minh với AI
          </h1>
          <p className="text-xl mb-6 opacity-90" data-testid="hero-description">
            Hỏi bài, kiểm tra bài làm và thi đua với bạn bè trên toàn quốc. Được hỗ trợ bởi công nghệ AI tiên tiến.
          </p>
          <Button 
            onClick={() => handleFeatureClick("/qa")} 
            className="bg-white text-primary hover:bg-gray-100 btn-smooth"
            data-testid="button-start-learning"
          >
            Bắt đầu học ngay
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="cursor-pointer card-hover" onClick={() => handleFeatureClick("/qa")}>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <HelpCircle className="text-primary text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2" data-testid="text-qa-title">Hỏi bài</h3>
            <p className="text-gray-600" data-testid="text-qa-description">
              Đăng câu hỏi và nhận câu trả lời từ cộng đồng và AI thông minh
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer card-hover" onClick={() => handleFeatureClick("/homework")}>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Search className="text-secondary text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2" data-testid="text-homework-title">Kiểm tra bài làm</h3>
            <p className="text-gray-600" data-testid="text-homework-description">
              Upload bài làm để AI phân tích, chỉ ra lỗi sai và đưa ra lời giải
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer card-hover" onClick={() => handleFeatureClick("/rankings")}>
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-accent text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-2" data-testid="text-rankings-title">Bảng xếp hạng</h3>
            <p className="text-gray-600" data-testid="text-rankings-description">
              Thi đua với học sinh khác và xem thứ hạng của trường, tỉnh
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Cards for Homework */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800" data-testid="text-subjects-title">Các môn học</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="cursor-pointer card-hover" onClick={() => handleFeatureClick("/homework")}>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Sigma className="text-primary text-xl" />
              </div>
              <h3 className="text-sm font-semibold" data-testid="text-subject-math">Toán học</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer card-hover" onClick={() => handleFeatureClick("/homework")}>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Book className="text-secondary text-xl" />
              </div>
              <h3 className="text-sm font-semibold" data-testid="text-subject-literature">Ngữ văn</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer card-hover" onClick={() => handleFeatureClick("/homework")}>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="text-accent text-xl" />
              </div>
              <h3 className="text-sm font-semibold" data-testid="text-subject-english">Ngoại ngữ</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer card-hover" onClick={() => handleFeatureClick("/homework")}>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-orange-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Beaker className="text-orange-500 text-xl" />
              </div>
              <h3 className="text-sm font-semibold" data-testid="text-subject-chemistry">Hoá học</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer card-hover" onClick={() => handleFeatureClick("/homework")}>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-yellow-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="text-yellow-500 text-xl" />
              </div>
              <h3 className="text-sm font-semibold" data-testid="text-subject-physics">Vật lý</h3>
            </CardContent>
          </Card>

          <Card className="cursor-pointer card-hover" onClick={() => handleFeatureClick("/homework")}>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-500 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FlaskConical className="text-green-500 text-xl" />
              </div>
              <h3 className="text-sm font-semibold" data-testid="text-subject-biology">Sinh học</h3>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer CTA Section */}
      <section className="relative mt-16 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-[4rem] relative z-10 px-8 py-16 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Bạn đang gặp khó khăn trong học tập?
          </h3>
          <p className="text-lg mb-8 opacity-90">
            Đội ngũ LimVA luôn sẵn sàng hỗ trợ bạn học tập hiệu quả hơn
          </p>
          <Button 
            onClick={() => handleFeatureClick("/qa")} 
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold btn-smooth"
            data-testid="button-ask-question"
          >
            HỎI BÀI NGAY
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-3">
              <img src={limvaLogo} alt="LimVA Logo" className="h-12 w-auto" />
              <div>
                <p className="text-sm text-gray-400">Nền tảng học tập thông minh</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-6 text-sm">
              <button 
                onClick={() => handleFeatureClick("/qa")} 
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                Hỏi bài
              </button>
              <button 
                onClick={() => handleFeatureClick("/homework")} 
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Kiểm tra bài
              </button>
              <button 
                onClick={() => handleFeatureClick("/rankings")} 
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Xếp hạng
              </button>
            </div>

            {/* Contact Info */}
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-400">📧 phanvanan242008@gmail.com</p>
              <p className="text-xs text-gray-500 mt-1">&copy; 2025 LimVA. Phát triển bởi Văn An</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
