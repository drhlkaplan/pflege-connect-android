import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe, Heart, User, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const languages = [
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl pflege-gradient-nurse flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-secondary leading-tight">
                Pflege<span className="text-primary">Connect</span>
              </span>
              <span className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">
                Healthcare Connection Platform
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/nurses" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {t("header.nurses")}
            </Link>
            <Link to="/companies" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {t("header.companies")}
            </Link>
            <Link to="/search" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {t("header.search", "Harita")}
            </Link>
            <a href="/#about" className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {t("header.about")}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className="gap-2 cursor-pointer"
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user && <NotificationBell />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline max-w-[100px] truncate">
                      {profile?.full_name || user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    {t("header.dashboard")}
                  </DropdownMenuItem>
                  {profile?.role === "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                      <Globe className="w-4 h-4 mr-2" />
                      {t("admin.title")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("header.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">{t("header.login")}</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/auth">{t("header.register")}</Link>
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <nav className="flex flex-col gap-2">
              <Link to="/nurses" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                {t("header.nurses")}
              </Link>
              <Link to="/companies" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                {t("header.companies")}
              </Link>
              <Link to="/search" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg" onClick={() => setIsMenuOpen(false)}>
                {t("header.search", "Harita")}
              </Link>
              <a href="/#about" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">
                {t("header.about")}
              </a>
              {user ? (
                <div className="flex flex-col gap-2 px-4 pt-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                    {t("header.dashboard")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    {t("header.logout")}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 px-4 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to="/auth">{t("header.login")}</Link>
                  </Button>
                  <Button variant="default" size="sm" className="flex-1" asChild>
                    <Link to="/auth">{t("header.register")}</Link>
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
