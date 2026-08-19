import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Radio, Play, Pause, SkipForward, ArrowLeft, Music2, Zap, Trash2 } from "lucide-react";

function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

export default function HostControl() {
  const { partyId } = useParams();
  const navigate = useNavigate();
  const [party, setParty] = useState(null);
  const [queue, setQueue] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const playerRef = useRef(null);
  const currentIdRef = useRef(null);
  const queueRef = useRef([]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const fetchParty = useCallback(async () => {
    try {
      const { data } = await api.get(`/parties/${partyId}`);
      setParty(data);
    } catch {
      toast.error("Party nicht gefunden");
      navigate("/admin/dashboard");
    }
  }, [partyId, navigate]);

  const fetchQueue = useCallback(async () => {
    try {
      const { data } = await api.get(`/parties/${partyId}/queue`);
      setQueue(data);
      return data;
    } catch {
      return [];
    }
  }, [partyId]);

  const advanceToNext = useCallback(async () => {
    try {
      const { data } = await api.post(`/parties/${partyId}/queue/next`);
      const fresh = await fetchQueue();
      if (data && playerRef.current) {
        currentIdRef.current = data.id;
        playerRef.current.loadVideoById(data.videoId);
      } else if (!data) {
        currentIdRef.current = null;
        playerRef.current?.stopVideo?.();
        setPlaying(false);
      }
      return { next: data, queue: fresh };
    } catch (e) {
      console.error(e);
    }
  }, [partyId, fetchQueue]);

  // Init player once
  useEffect(() => {
    let disposed = false;
    loadYouTubeAPI().then((YT) => {
      if (disposed) return;
      playerRef.current = new YT.Player("yt-player", {
        width: "100%",
        height: "100%",
        videoId: "",
        playerVars: { playsinline: 1, autoplay: 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => {
            setPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.ENDED) {
              advanceToNext();
            }
          },
          onError: () => {
            toast.error("Video kann nicht abgespielt werden. Überspringe...");
            advanceToNext();
          },
        },
      });
    });
    return () => {
      disposed = true;
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
  }, [advanceToNext]);

  useEffect(() => {
    fetchParty();
    fetchQueue();
    const iv = setInterval(fetchQueue, 3000);
    return () => clearInterval(iv);
  }, [fetchParty, fetchQueue]);

  // Auto-load first unplayed if nothing is loaded
  useEffect(() => {
    if (!ready || !playerRef.current) return;
    const upcoming = queue.filter((q) => !q.played);
    const first = upcoming[0];
    if (first && currentIdRef.current !== first.id && !playing) {
      // Only auto-load if player is stopped/uninitialized
      const state = playerRef.current.getPlayerState?.();
      // -1 unstarted, 5 cued, 0 ended
      if (state === undefined || state === -1 || state === 0 || state === 5) {
        currentIdRef.current = first.id;
        playerRef.current.cueVideoById(first.videoId);
      }
    }
  }, [ready, queue, playing]);

  const upcoming = queue.filter((q) => !q.played);
  const current = upcoming[0];

  const handlePlay = () => {
    if (!playerRef.current) return;
    if (playing) {
      playerRef.current.pauseVideo();
    } else {
      // If nothing loaded yet, load first
      if (!currentIdRef.current && current) {
        currentIdRef.current = current.id;
        playerRef.current.loadVideoById(current.videoId);
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const handleSkip = () => {
    advanceToNext();
  };

  const removeItem = async (id) => {
    try {
      await api.delete(`/parties/${partyId}/queue/${id}`);
      fetchQueue();
    } catch {
      toast.error("Fehler");
    }
  };

  const guestUrl = `${window.location.origin}/party/${partyId}`;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard">
            <Button variant="ghost" size="sm" className="rounded-full" data-testid="host-back-btn">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#FF3B30]" />
            <span className="font-display font-bold tracking-tight text-lg" data-testid="host-party-name">
              {party?.name || "..."}
            </span>
          </div>
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hidden sm:block">
          ID · {partyId}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-6 p-6 md:p-8">
        {/* LEFT: Player */}
        <section className="lg:col-span-3 space-y-6">
          <div className="yt-shell aspect-video w-full">
            <div id="yt-player" className="w-full h-full" data-testid="youtube-player" />
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
              Now Playing
            </div>
            {current ? (
              <div className="flex items-center gap-4">
                {current.thumbnail && (
                  <img src={current.thumbnail} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl font-bold tracking-tight truncate" data-testid="host-current-title">
                    {current.title}
                  </div>
                  <div className="text-sm text-zinc-500 truncate">{current.artist}</div>
                </div>
                {current.priority && (
                  <span className="bg-[#FF3B30] text-white rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    Priorität
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-zinc-500">
                <Music2 className="w-5 h-5" />
                <span>Warteschlange ist leer</span>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={handlePlay}
                disabled={!ready || !current}
                className="rounded-full h-14 w-14 bg-[#0a0a0a] hover:bg-[#0a0a0a]/90 text-white active:scale-95 p-0"
                data-testid="host-play-btn"
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </Button>
              <Button
                onClick={handleSkip}
                disabled={!current}
                variant="outline"
                className="rounded-full h-14 w-14 border-zinc-200 active:scale-95 p-0"
                data-testid="host-skip-btn"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
              <div className="ml-auto flex items-center gap-3 bg-zinc-50 rounded-full px-4 py-2 border border-zinc-200">
                <QRCodeSVG value={guestUrl} size={40} bgColor="transparent" fgColor="#0a0a0a" />
                <div className="text-xs">
                  <div className="font-semibold uppercase tracking-widest text-zinc-500">Beitreten</div>
                  <div className="text-zinc-600 truncate max-w-[180px]">{guestUrl.replace(/^https?:\/\//, "")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT: Queue */}
        <section className="lg:col-span-2">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Warteschlange</div>
                <div className="font-display text-2xl font-bold tracking-tight">{upcoming.length} Songs</div>
              </div>
            </div>
            <div className="queue-scroll space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto pr-1" data-testid="host-queue-list">
              {upcoming.length === 0 && (
                <div className="text-center text-zinc-500 py-12 text-sm">
                  Gäste können jetzt Songs hinzufügen.
                </div>
              )}
              {upcoming.map((item, idx) => (
                <div
                  key={item.id}
                  className={`group flex items-center gap-3 p-3 rounded-2xl border ${
                    item.priority ? "border-[#FF3B30]/30 bg-red-50/40" : "border-zinc-100 bg-zinc-50/60"
                  } ${idx === 0 ? "ring-1 ring-[#0a0a0a]" : ""}`}
                  data-testid={`host-queue-item-${item.id}`}
                >
                  <div className="w-8 text-center text-xs font-bold text-zinc-500">
                    {idx === 0 ? "▶" : idx}
                  </div>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-200 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{item.title}</div>
                    <div className="text-xs text-zinc-500 truncate">
                      {item.artist} · von {item.guest_name}
                    </div>
                  </div>
                  {item.priority && (
                    <Zap className="w-4 h-4 text-[#FF3B30]" />
                  )}
                  <Button
                    onClick={() => removeItem(item.id)}
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 rounded-full h-8 w-8 p-0 text-zinc-400 hover:text-[#FF3B30]"
                    data-testid={`host-remove-${item.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
