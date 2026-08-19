import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music, QrCode, Users, ArrowRight, Radio } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] grain-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#0a0a0a] flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">QueueBeats</span>
        </div>
        <Link to="/admin">
          <Button
            variant="ghost"
            className="rounded-full px-5 hover:bg-zinc-100"
            data-testid="landing-host-login-btn"
          >
            Host-Login
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 md:px-12 pt-12 md:pt-24 pb-24">
        <div className="grid md:grid-cols-5 gap-12 items-end">
          <div className="md:col-span-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
              Live Party Queue
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]">
              Deine Party.<br />
              Deine Warteschlange.<br />
              <span className="text-[#FF3B30]">Ihre Musik.</span>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-zinc-600 max-w-xl font-body">
              Host erstellt eine Party, Gäste scannen den QR-Code und werfen Songs in die Queue.
              Kein Login, keine Zeitlimits, volle Tracks von YouTube Music.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/admin">
                <Button
                  size="lg"
                  className="rounded-full bg-[#0a0a0a] hover:bg-[#0a0a0a]/90 text-white px-8 h-12 active:scale-95"
                  data-testid="landing-start-party-btn"
                >
                  Party starten
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-zinc-300 px-8 h-12 hover:bg-white active:scale-95"
                data-testid="landing-learn-more-btn"
                onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
              >
                So funktioniert's
              </Button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-br from-[#FF3B30]/10 to-transparent rounded-[40px] blur-2xl" />
              <div className="relative bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Now Playing
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />
                </div>
                <div className="aspect-square rounded-2xl bg-zinc-100 mb-4 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?crop=entropy&cs=srgb&fm=jpg&w=600&q=80"
                    alt="Party"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="font-display text-lg font-bold tracking-tight">Ready to vibe</div>
                <div className="text-sm text-zinc-500">Queue • 12 songs</div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <section id="how" className="mt-32">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-12">
            Drei Schritte. Kein Setup.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Music, title: "Party erstellen", desc: "Als Host loggst du dich ein und erstellst deine Party." },
              { icon: QrCode, title: "QR-Code teilen", desc: "Gäste scannen den QR-Code und sind sofort dabei." },
              { icon: Users, title: "Songs droppen", desc: "Suche in YouTube Music. Priorität optional." },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-3xl p-8">
                <div className="w-10 h-10 rounded-full bg-[#0a0a0a] flex items-center justify-center mb-6">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-display text-xl font-bold tracking-tight mb-2">{title}</div>
                <p className="text-zinc-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
