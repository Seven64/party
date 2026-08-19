import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, setGuestName, getGuestName } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Radio, ArrowRight } from "lucide-react";

export default function GuestJoin() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState(getGuestName());
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/parties/${partyId}`).then(({ data }) => setParty(data)).catch(() => {
      toast.error("Party nicht gefunden");
    });
  }, [partyId]);

  const join = (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    setLoading(true);
    setGuestName(clean);
    navigate(`/party/${partyId}/room`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#0a0a0a] flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">QueueBeats</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center px-6 pb-12 max-w-md mx-auto w-full">
        <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          Du wirst gleich Teil von
        </div>
        <h1 className="font-display text-5xl font-bold tracking-tight mb-2" data-testid="guest-party-name">
          {party?.name || "..."}
        </h1>
        <p className="text-zinc-500 mb-12">
          Gib deinen Namen ein, damit der Host sieht, wer welchen Song hinzugefügt hat.
        </p>

        <form onSubmit={join} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2 block">
              Dein Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Alex"
              maxLength={30}
              className="h-14 rounded-full px-6 text-lg border-zinc-200 focus-visible:ring-1 focus-visible:ring-[#0a0a0a]"
              data-testid="guest-name-input"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !name.trim() || !party}
            className="w-full h-14 rounded-full bg-[#0a0a0a] hover:bg-[#0a0a0a]/90 text-white text-base active:scale-95"
            data-testid="guest-join-btn"
          >
            Party beitreten
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </main>
    </div>
  );
}
