import { useTranslation } from "react-i18next";
import { Heart, Mail, Phone, MapPin, Facebook, Linkedin, Instagram, Twitter } from "lucide-react";
import { Button } from "./ui/button";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl pflege-gradient-nurse flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Pflege<span className="text-accent">Connect</span>
              </span>
            </a>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10"><Facebook className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10"><Linkedin className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10"><Instagram className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10"><Twitter className="w-5 h-5" /></Button>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-6">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3">
              <li><a href="/#roles" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.forNurses")}</a></li>
              <li><a href="/#roles" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.forCompanies")}</a></li>
              <li><a href="/#roles" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.forRelatives")}</a></li>
              <li><a href="/pricing" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.pricing")}</a></li>
              <li><a href="/#about" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.aboutUs")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-6">{t("footer.legal")}</h4>
            <ul className="space-y-3">
              <li><a href="/terms" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.terms")}</a></li>
              <li><a href="/datenschutz" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.privacy")}</a></li>
              <li><a href="/privacy" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.gdpr")}</a></li>
              <li><a href="/privacy" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.cookies")}</a></li>
              <li><a href="/impressum" className="text-white/70 hover:text-accent transition-colors text-sm">{t("footer.imprint")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-6">{t("footer.contact")}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">Berlin, Almanya</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent flex-shrink-0" />
                <a href="mailto:info@pflegeconnect.eu" className="text-white/70 hover:text-accent transition-colors text-sm">info@pflegeconnect.eu</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                <a href="tel:+49123456789" className="text-white/70 hover:text-accent transition-colors text-sm">+49 123 456 789</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/50 text-sm text-center md:text-left">
              {t("footer.copyright")}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-white/50">🇩🇪 Deutsch</span>
              <span className="text-white/50">🇹🇷 Türkçe</span>
              <span className="text-white/50">🇬🇧 English</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
