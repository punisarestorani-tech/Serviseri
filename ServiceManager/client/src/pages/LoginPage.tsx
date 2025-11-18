import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";
import tehnikoLogo from "@assets/ChatGPT Image Oct 28, 2025, 11_42_45 AM_1761649167166.png";

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
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.message || t.auth.loginError);
        setIsLoading(false);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setLocation('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      alert(t.auth.loginError);
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
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src={tehnikoLogo} 
              alt={`${t.auth.appTitle} - ${t.auth.appSubtitle}`}
              className="w-full max-w-md h-auto"
              data-testid="img-logo"
            />
          </div>
          <p className="text-sm text-muted-foreground">
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
