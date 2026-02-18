import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Camera, Trash2, Loader2, User, Building2 } from "lucide-react";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  onUpload: (url: string) => void;
  variant?: "nurse" | "company";
}

export function AvatarUpload({ userId, currentUrl, onUpload, variant = "nurse" }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({ title: "Hata", description: "Sadece resim dosyaları yüklenebilir.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Hata", description: "Dosya boyutu 2MB'dan küçük olmalıdır.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${userId}/avatar.${ext}`;

      // Remove old file if exists
      await supabase.storage.from("avatars").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache-busting param
      const url = `${publicUrl}?t=${Date.now()}`;

      // Update profile avatar_url
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      onUpload(url);
      toast({ title: "Başarılı", description: "Fotoğraf güncellendi." });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Hata", description: "Fotoğraf yüklenirken hata oluştu.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;
    setUploading(true);
    try {
      // Extract path from URL
      const pathMatch = currentUrl.match(/avatars\/(.+?)(\?|$)/);
      if (pathMatch) {
        await supabase.storage.from("avatars").remove([pathMatch[1]]);
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", userId);

      if (error) throw error;

      onUpload("");
      toast({ title: "Başarılı", description: "Fotoğraf kaldırıldı." });
    } catch (error) {
      console.error("Remove error:", error);
      toast({ title: "Hata", description: "Fotoğraf kaldırılırken hata oluştu.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const FallbackIcon = variant === "company" ? Building2 : User;
  const size = "w-24 h-24";
  const shape = variant === "company" ? "rounded-xl" : "rounded-full";

  return (
    <div className="flex items-center gap-4">
      <div className={`${size} ${shape} bg-muted flex items-center justify-center overflow-hidden relative group border-2 border-border`}>
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className={`${size} ${shape} object-cover`} />
        ) : (
          <FallbackIcon className="w-10 h-10 text-muted-foreground" />
        )}
        {uploading && (
          <div className={`absolute inset-0 bg-background/70 flex items-center justify-center ${shape}`}>
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Camera className="w-4 h-4 mr-2" />
          {currentUrl ? "Değiştir" : "Fotoğraf Yükle"}
        </Button>
        {currentUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Kaldır
          </Button>
        )}
        <p className="text-xs text-muted-foreground">JPG, PNG veya WebP. Max 2MB.</p>
      </div>
    </div>
  );
}
