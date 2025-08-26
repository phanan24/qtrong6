import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import limvaLogo from "@/assets/limva-logo.png";
import verifiedBadge from "@/assets/verified-badge.png";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-surface shadow-sm border-b" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center" data-testid="link-home">
            <img src={limvaLogo} alt="LimVA Logo" className="h-10 w-auto" />
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`transition-colors ${isActive('/') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
              data-testid="nav-home"
            >
              Trang chủ
            </Link>
            <Link 
              href="/qa" 
              className={`transition-colors ${isActive('/qa') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
              data-testid="nav-qa"
            >
              Hỏi bài
            </Link>
            <Link 
              href="/homework" 
              className={`transition-colors ${isActive('/homework') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
              data-testid="nav-homework"
            >
              Kiểm tra bài làm
            </Link>
            <Link 
              href="/rankings" 
              className={`transition-colors ${isActive('/rankings') ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}
              data-testid="nav-rankings"
            >
              Bảng xếp hạng
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar ? `/api${user.avatar}` : undefined} />
                      <AvatarFallback className="bg-primary text-white">
                        {user.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user.name}</span>
                    {user.isVerified && (
                      <img src={verifiedBadge} alt="Verified" className="h-4 w-4" data-testid="verified-badge" />
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" data-testid="user-dropdown">
                  <DropdownMenuItem asChild data-testid="menu-profile">
                    <Link href="/profile">Hồ sơ cá nhân</Link>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem asChild data-testid="menu-admin">
                      <Link href="/admin">Quản trị hệ thống</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    data-testid="menu-logout"
                  >
                    {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild data-testid="button-login">
                <Link href="/auth">Đăng nhập</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
