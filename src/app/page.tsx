"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, Droplet, Footprints, Timer, Shield } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/app/logo";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { icon: Footprints, label: "Short home moves" },
  { icon: Droplet, label: "Hydration nudges" },
  { icon: Shield, label: "Posture resets" },
  { icon: Timer, label: "Focus + breaks" },
];

export default function WelcomePage() {
  const { state, ready, loadDemo } = useStore();
  const router = useRouter();

  // If already set up, go straight to the dashboard.
  useEffect(() => {
    if (ready && state.onboarded) router.replace("/dashboard");
  }, [ready, state.onboarded, router]);

  function handleDemo() {
    loadDemo();
    router.push("/dashboard");
  }

  return (
    <main
      id="main"
      className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-between overflow-hidden px-6 py-10"
    >
      {/* soft decorative background blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary-soft blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-accent-soft blur-2xl"
      />

      <div className="relative">
        <Logo />
      </div>

      <div className="relative flex flex-1 flex-col justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-6 grid grid-cols-2 gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-soft"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </motion.div>
            ))}
          </div>

          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Level up your health, one small quest at a time.
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            DeskHero turns tiny bursts of movement, hydration, and posture care
            into a friendly game. No gym, no equipment, and no pressure — just
            small wins that fit around a busy workday.
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="relative flex flex-col gap-3"
      >
        <Link
          href="/onboarding"
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          Get Started
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
        <Button
          onClick={handleDemo}
          variant="outline"
          size="lg"
          className="w-full"
        >
          <Play className="h-5 w-5" aria-hidden />
          Explore Demo
        </Button>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Explore Demo loads a sample profile instantly — nothing to sign up for.
        </p>
      </motion.div>
    </main>
  );
}
