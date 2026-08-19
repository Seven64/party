import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken, getSavedToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Radio, Lock } from "lucide-react";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getSavedToken();
    if (token) {
      api.get("/admin/verify").then(() => navigate("/admin/dashboard")).catch(() => setAuthToken(null));
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { password });
      setAuthToken(data.token);
      toast.success("Willkommen zurück");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error("Falsches Passwort");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] grain-bg flex flex-col">
      <header className="px-6 md:px-12 py-6">
        <a href="/" className="flex items-center gap-2 w-fit">
          <div className="w-9 h-9 rounded-full bg-[#0a0a0a] flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">QueueBeats</span>
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 md:p-10">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
              <Lock className="w-5 h-5 text-[#0a0a0a]" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight mb-2">Host-Login</h1>
            <p className="text-zinc-600 text-sm mb-8">
              Gib dein Admin-Passwort ein, um Partys zu verwalten.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">
                  Passwort
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••"
                  className="h-12 rounded-full px-5 border-zinc-200 focus-visible:ring-1 focus-visible:ring-[#0a0a0a]"
                  data-testid="admin-password-input"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !password}
                className="w-full h-12 rounded-full bg-[#0a0a0a] hover:bg-[#0a0a0a]/90 text-white active:scale-95"
                data-testid="admin-login-submit-btn"
              >
                {loading ? "Anmelden..." : "Anmelden"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
