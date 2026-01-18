import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Wrench } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/login', { username, password });
      const data = await response.json();

      console.log('[Login] Success:', data);
      // Clear all cached data and set user data directly from login response
      queryClient.clear();
      // Set the user data directly to avoid race condition with session persistence
      queryClient.setQueryData(["/api/user/me"], data.user);
      setLocation('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      // Extract error message from HttpError or use generic message
      const errorMessage = error.message || t.auth.loginError;
      alert(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
              <Wrench className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {t.auth.appTitle}
              </h1>
              <p className="text-sm text-muted-foreground font-medium tracking-wide">
                {t.auth.appSubtitle}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            {t.auth.loginHelper}
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t.auth.username}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t.auth.username}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.auth.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? `${t.auth.loginButton}...` : t.auth.loginButton}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
