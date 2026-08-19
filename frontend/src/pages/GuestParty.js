import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, getGuestName } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { toast } from "sonner";
import { Search, Plus, Radio, Zap, Music2, Loader2 } from "lucide-react";

export default function GuestParty() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const guestName = getGuestName();

  const [party, setParty] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [queue, setQueue] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [tab, setTab] = useState("search");

  useEffect(() => {
    if (!guestName) {
      navigate(`/party/${partyId}`);
    }
  }, [guestName, partyId, navigate]);

  useEffect(() => {
    api.get(`/parties/${partyId}`).then(({ data }) => setParty(data)).catch(() => {
      toast.error("Party nicht gefunden");
      navigate("/");
    });
  }, [partyId, navigate]);

  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get(`/parties/${partyId}/queue`);
      setQueue(data);
    } catch {}
  }, [partyId]);

  useEffect(() => {
    fetchQueue();
    const iv = setInterval(fetchQueue, 3000);
    return () => clearInterval(iv);
  }, [fetchQueue]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search`, { params: { q: query, limit: 15 } });
        setResults(data);
      } catch {
        toast.error("Suche fehlgeschlagen");
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  const addToQueue = async (priority) => {
    if (!selectedSong) return;
    try {
      await api.post(`/parties/${partyId}/queue`, {
        ...selectedSong,
        guest_name: guestName,
        priority,
      });
      toast.success(priority ? "Als Priorität hinzugefügt" : "Zur Queue hinzugefügt");
      setSelectedSong(null);
      fetchQueue();
      setTab("queue");
    } catch {
      toast.error("Fehler beim Hinzufügen");
    }
  };

  const upcoming = queue.filter((q) => !q.played);
  const current = upcoming[0];

  return (
    <div className="min-h-screen bg-white flex flex-col pb-6">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-zinc-100">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0a0a0a] flex items-center justify-center flex-shrink-0">
              <Radio className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold tracking-tight text-sm truncate" data-testid="guest-party-header">
                {party?.name || "..."}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">
                Hi, {guestName}
              </div>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400">#{partyId}</div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-5 pt-5">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full h-11 rounded-full bg-zinc-100 p-1">
            <TabsTrigger
              value="search"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:text-[#0a0a0a] data-[state=active]:shadow-sm text-sm font-semibold"
              data-testid="guest-tab-search"
            >
              Suchen
            </TabsTrigger>
            <TabsTrigger
              value="queue"
              className="rounded-full data-[state=active]:bg-white data-[state=active]:text-[#0a0a0a] data-[state=active]:shadow-sm text-sm font-semibold"
              data-testid="guest-tab-queue"
            >
              Queue ({upcoming.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Song, Artist, Album..."
                className="h-12 pl-12 pr-5 rounded-full border-zinc-200 focus-visible:ring-1 focus-visible:ring-[#0a0a0a] bg-zinc-50"
                data-testid="guest-search-input"
              />
              {searching && (
                <Loader2 className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
              )}
            </div>

            <div className="mt-4 space-y-2" data-testid="guest-search-results">
              {!query && (
                <div className="text-center text-zinc-400 py-16 text-sm">
                  <Music2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  Suche nach einem Song
                </div>
              )}
              {results.map((song) => (
                <button
                  key={song.videoId}
                  onClick={() => setSelectedSong(song)}
                  className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-zinc-50 text-left active:scale-[0.99]"
                  data-testid={`guest-result-${song.videoId}`}
                >
                  {song.thumbnail ? (
                    <img src={song.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{song.title}</div>
                    <div className="text-xs text-zinc-500 truncate">
                      {song.artist}{song.duration ? ` · ${song.duration}` : ""}
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#0a0a0a] flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="queue" className="mt-5">
            {current && (
              <div className="bg-[#0a0a0a] text-white rounded-3xl p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400">Now Playing</span>
                </div>
                <div className="flex items-center gap-3">
                  {current.thumbnail && (
                    <img src={current.thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-lg truncate">{current.title}</div>
                    <div className="text-xs text-zinc-400 truncate">{current.artist}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2" data-testid="guest-queue-list">
              {upcoming.length <= 1 && (
                <div className="text-center text-zinc-400 py-12 text-sm">
                  Noch keine weiteren Songs.
                </div>
              )}
              {upcoming.slice(1).map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border ${
                    item.priority ? "border-[#FF3B30]/30 bg-red-50/40" : "border-zinc-100"
                  }`}
                  data-testid={`guest-queue-item-${item.id}`}
                >
                  <div className="w-6 text-center text-xs font-bold text-zinc-400">{idx + 1}</div>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{item.title}</div>
                    <div className="text-xs text-zinc-500 truncate">{item.artist} · {item.guest_name}</div>
                  </div>
                  {item.priority && <Zap className="w-4 h-4 text-[#FF3B30]" />}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Drawer */}
      <Drawer open={!!selectedSong} onOpenChange={(o) => !o && setSelectedSong(null)}>
        <DrawerContent className="bg-white">
          <DrawerHeader>
            <DrawerTitle className="font-display text-2xl tracking-tight text-left">
              Song hinzufügen
            </DrawerTitle>
          </DrawerHeader>
          {selectedSong && (
            <div className="px-4 pb-2">
              <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl bg-zinc-50">
                {selectedSong.thumbnail && (
                  <img src={selectedSong.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{selectedSong.title}</div>
                  <div className="text-sm text-zinc-500 truncate">{selectedSong.artist}</div>
                </div>
              </div>
            </div>
          )}
          <DrawerFooter className="gap-2">
            <Button
              onClick={() => addToQueue(false)}
              className="w-full h-12 rounded-full bg-[#0a0a0a] hover:bg-[#0a0a0a]/90 text-white active:scale-95"
              data-testid="guest-add-normal-btn"
            >
              Zur Queue hinzufügen
            </Button>
            <Button
              onClick={() => addToQueue(true)}
              className="w-full h-12 rounded-full bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white active:scale-95"
              data-testid="guest-add-priority-btn"
            >
              <Zap className="w-4 h-4 mr-2" />
              Als Priorität hinzufügen
            </Button>
            <Button
              onClick={() => setSelectedSong(null)}
              variant="ghost"
              className="w-full h-11 rounded-full"
              data-testid="guest-cancel-add-btn"
            >
              Abbrechen
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
