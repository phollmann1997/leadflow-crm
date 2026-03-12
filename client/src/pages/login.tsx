import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (error: any) {
      toast({ title: "Chyba přihlášení", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">LeadFlow CRM</CardTitle>
          <CardDescription>Spravuj svoje leady a outreach</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" data-testid="input-email" type="email" placeholder="vas@email.cz" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input id="password" data-testid="input-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <Button type="submit" data-testid="button-login" className="w-full" disabled={submitting || isLoading}>
              {submitting ? "Přihlašuji..." : "Přihlásit se"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
