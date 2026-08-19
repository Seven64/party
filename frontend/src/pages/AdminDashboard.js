import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, setAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Radio, Plus, Trash2, ExternalLink, LogOut, Copy } from "lucide-react";

export default function AdminDashboard() {
  const [parties, setParties] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get("/parties");
      setParties(data);
    } catch (e) {
      if (e.response?.status === 401) {
        setAuthToken(null);
        navigate("/admin");
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createParty = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await api.post("/parties", { name: newName });
      setNewName("");
      toast.success("Party erstellt");
      load();
    } catch {
      toast.error("Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  };

  const deleteParty = async (id) => {
    if (!window.confirm("Party wirklich löschen?")) return;
    try {
      await api.delete(`/parties/${id}`);
      toast.success("Party gelöscht");
      load();
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const logout = () => {
    setAuthToken(null);
    navigate("/admin");
  };

  const copyLink = (id) => {
    const url = `${window.location.origin}/party/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link kopiert");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] grain-bg">
      <header className="flex items-center justify-between px-6 md:px-12 py-6 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#0a0a0a] flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">QueueBeats</span>
          <span className="ml-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Host</span>
        </div>
        <Button
          onClick={logout}
          variant="ghost"
          className="rounded-full"
          data-testid="admin-logout-btn"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-12">
          Dashboard
        </h1>

        {/* Create party */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
            Neue Party
          </div>
          <form onSubmit={createParty} className="flex flex-col sm:flex-row gap-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="z.B. Freitagabend-Session"
              className="h-12 rounded-full px-5 border-zinc-200 focus-visible:ring-1 focus-visible:ring-[#0a0a0a] flex-1"
              data-testid="admin-new-party-input"
            />
            <Button
              type="submit"
              disabled={loading || !newName.trim()}
              className="h-12 rounded-full bg-[#0a0a0a] hover:bg-[#0a0a0a]/90 text-white px-8 active:scale-95"
              data-testid="admin-create-party-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Party erstellen
            </Button>
          </form>
        </div>

        {/* Party list */}
        <div className="grid md:grid-cols-2 gap-6" data-testid="admin-parties-list">
          {parties.length === 0 && (
            <div className="md:col-span-2 bg-white border border-dashed border-zinc-300 rounded-3xl p-12 text-center">
              <p className="text-zinc-500">Noch keine Party. Erstelle deine erste oben.</p>
            </div>
          )}
          {parties.map((p) => {
            const guestUrl = `${window.location.origin}/party/${p.id}`;
            return (
              <div
                key={p.id}
                className="bg-white border border-zinc-200 rounded-3xl p-6 flex gap-5"
                data-testid={`party-card-${p.id}`}
              >
                <div className="bg-white p-2 rounded-2xl border border-zinc-200 flex-shrink-0">
                  <QRCodeSVG value={guestUrl} size={112} bgColor="#ffffff" fgColor="#0a0a0a" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
                    ID · {p.id}
                  </div>
                  <div className="font-display text-xl font-bold tracking-tight truncate mb-1">
                    {p.name}
                  </div>
                  <div className="text-xs text-zinc-500 mb-4">
                    {new Date(p.created_at).toLocaleString("de-DE")}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <Link to={`/admin/party/${p.id}`}>
                      <Button
                        size="sm"
                        className="rounded-full h-9 bg-[#0a0a0a] hover:bg-[#0a0a0a]/90 text-white active:scale-95"
                        data-testid={`open-party-${p.id}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Öffnen
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(p.id)}
                      className="rounded-full h-9 border-zinc-200 active:scale-95"
                      data-testid={`copy-link-${p.id}`}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Link
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteParty(p.id)}
                      className="rounded-full h-9 text-[#FF3B30] hover:bg-red-50 hover:text-[#FF3B30] active:scale-95"
                      data-testid={`delete-party-${p.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
