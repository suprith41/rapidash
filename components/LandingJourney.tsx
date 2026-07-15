"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import type { MouseEvent, ReactNode } from "react";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  FileUp,
  Fingerprint,
  LockKeyhole,
  MessageCircleMore,
  ScanText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import HeroMockup from "@/components/HeroMockup";

const ease = [0.22, 1, 0.36, 1] as const;

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] ${
        light
          ? "border-white/15 bg-white/10 text-white/75"
          : "border-[#635bff]/15 bg-[#635bff]/5 text-[#635bff]"
      }`}
    >
      <Sparkles className="size-3.5" />
      {children}
    </div>
  );
}

function TiltSurface({ children, className = "" }: { children: ReactNode; className?: string }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 180, damping: 22 });
  const springY = useSpring(rotateY, { stiffness: 180, damping: 22 });

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(y * -5);
    rotateY.set(x * 6);
  }

  function resetTilt() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      className={className}
      onMouseLeave={resetTilt}
      onMouseMove={handleMove}
      style={{ rotateX: springX, rotateY: springY, transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
}

function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const orbY = useTransform(scrollYProgress, [0, 1], [80, -90]);
  const orbRotate = useTransform(scrollYProgress, [0, 1], [-10, 18]);

  return (
    <section
      className="relative isolate overflow-hidden bg-[#fafaff] px-6 py-24 sm:py-32"
      ref={sectionRef}
    >
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_10%,rgba(99,91,255,0.14),transparent_34%),linear-gradient(180deg,#fafaff_0%,#f5f3ff_58%,#eef2ff_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-50 [background-image:linear-gradient(rgba(99,91,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(99,91,255,0.055)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

      <motion.div
        className="absolute -left-24 top-56 -z-10 size-80 rounded-full bg-[#635bff]/15 blur-3xl"
        style={{ y: orbY }}
      />
      <motion.div
        className="absolute -right-20 top-24 -z-10 h-72 w-72 rounded-[35%] border border-[#635bff]/15 bg-white/40 shadow-[0_35px_100px_rgba(99,91,255,0.12)] backdrop-blur-xl"
        style={{ rotate: orbRotate, y: orbY }}
      />

      <div className="mx-auto max-w-[1280px]">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.7, ease }}
          viewport={{ amount: 0.5, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Eyebrow>One calm command center</Eyebrow>
          <h2 className="mt-6 text-5xl leading-[0.95] tracking-[-0.04em] text-[#0a2540] sm:text-6xl lg:text-7xl">
            Your wealth, finally in focus.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#425466] sm:text-lg">
            Health, rebalancing, and SIP decisions move together in one private workspace built to
            make complex portfolios feel beautifully simple.
          </p>
        </motion.div>

        <div className="relative mx-auto mt-20 max-w-5xl [perspective:1600px]">
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [-3, -1, -3] }}
            className="absolute -left-7 top-24 z-20 hidden rounded-2xl border border-white/80 bg-white/80 p-4 shadow-[0_20px_55px_rgba(10,37,64,0.14)] backdrop-blur-xl lg:block"
            transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0a2540]">Local processing</p>
                <p className="mt-0.5 text-[11px] text-[#697386]">Your PDF stays private</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0], rotate: [3, 1, 3] }}
            className="absolute -right-8 bottom-28 z-20 hidden rounded-2xl border border-white/80 bg-white/80 p-4 shadow-[0_20px_55px_rgba(10,37,64,0.14)] backdrop-blur-xl lg:block"
            transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#635bff]/10 text-[#635bff]">
                <ChartNoAxesCombined className="size-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0a2540]">Portfolio pulse</p>
                <p className="mt-0.5 text-[11px] text-[#697386]">Insights that stay actionable</p>
              </div>
            </div>
          </motion.div>

          <TiltSurface className="relative rounded-[2rem] border border-white/80 bg-white/35 p-2 shadow-[0_40px_100px_rgba(99,91,255,0.18)] backdrop-blur-md sm:p-4">
            <div className="pointer-events-none absolute inset-x-16 top-8 -z-10 h-3/4 rounded-full bg-[#635bff]/20 blur-3xl" />
            <div style={{ transform: "translateZ(36px)" }}>
              <HeroMockup />
            </div>
          </TiltSurface>
        </div>
      </div>
    </section>
  );
}

const privacyCards = [
  {
    icon: Fingerprint,
    label: "Identity",
    value: "Never profiled",
    position: "left-0 top-8 lg:left-10",
    delay: 0,
  },
  {
    icon: LockKeyhole,
    label: "Statements",
    value: "Processed locally",
    position: "right-0 top-28 lg:right-6",
    delay: 0.7,
  },
  {
    icon: MessageCircleMore,
    label: "Dash chat",
    value: "Context, not custody",
    position: "bottom-4 left-6 lg:left-20",
    delay: 1.4,
  },
];

function AboutExperience() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f8f7ff] px-6 py-24 text-[#0a2540] sm:py-32" id="about">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_18%,rgba(99,91,255,0.18),transparent_30%),radial-gradient(circle_at_86%_72%,rgba(147,197,253,0.3),transparent_32%),linear-gradient(145deg,#ffffff,#f5f3ff_52%,#eef5ff)]" />
      <div className="absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(rgba(99,91,255,0.3)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(90deg,black,transparent_70%)]" />

      <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
        <motion.div
          initial={{ opacity: 0, x: -36 }}
          transition={{ duration: 0.75, ease }}
          viewport={{ amount: 0.4, once: true }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <Eyebrow>Privacy architecture</Eyebrow>
          <h2 className="mt-7 max-w-xl text-5xl leading-[0.96] tracking-[-0.04em] sm:text-6xl">
            Intelligence without the surveillance.
          </h2>
          <p className="mt-7 max-w-xl text-base leading-8 text-[#425466] sm:text-lg">
            Rapidash turns static NSE and BSE statements into a living financial workspace. The
            useful context travels through the experience; your financial identity does not.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {[
              ["0", "ad trackers"],
              ["100%", "audit trail"],
              ["Local", "first parse"],
            ].map(([value, label]) => (
              <div className="rounded-2xl border border-white/80 bg-white/65 p-4 shadow-[0_16px_45px_rgba(99,91,255,0.08)] backdrop-blur" key={label}>
                <p className="text-2xl text-[#0a2540] sm:text-3xl">{value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#697386]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative min-h-[520px] [perspective:1400px]">
          <div className="absolute left-1/2 top-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#635bff]/15 sm:size-[410px]" />
          <div className="absolute left-1/2 top-1/2 size-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#8b85ff]/35 sm:size-[300px]" />

          <motion.div
            animate={{ rotate: 360 }}
            className="absolute left-1/2 top-1/2 size-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:size-[410px]"
            transition={{ duration: 32, ease: "linear", repeat: Infinity }}
          >
            <div className="absolute left-1/2 top-0 size-3 -translate-x-1/2 rounded-full bg-[#8b85ff] shadow-[0_0_24px_#8b85ff]" />
            <div className="absolute bottom-8 right-8 size-2 rounded-full bg-sky-300 shadow-[0_0_18px_#7dd3fc]" />
          </motion.div>

          <TiltSurface className="absolute left-1/2 top-1/2 z-10 w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white bg-white/75 p-7 text-center shadow-[0_35px_90px_rgba(99,91,255,0.2)] backdrop-blur-2xl sm:w-[270px] sm:p-9">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c75ff] to-[#4f46e5] shadow-[0_18px_45px_rgba(99,91,255,0.5)]" style={{ transform: "translateZ(45px)" }}>
              <ShieldCheck className="size-8 text-white" />
            </div>
            <p className="mt-6 text-3xl" style={{ transform: "translateZ(34px)" }}>Private core</p>
            <p className="mt-2 text-sm leading-6 text-[#697386]" style={{ transform: "translateZ(26px)" }}>
              Analysis happens around your data—not at its expense.
            </p>
          </TiltSurface>

          {privacyCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                animate={{ y: [0, -10, 0] }}
                className={`absolute z-20 w-[185px] rounded-2xl border border-white bg-white/75 p-4 shadow-[0_20px_60px_rgba(99,91,255,0.14)] backdrop-blur-xl ${card.position}`}
                key={card.label}
                transition={{ delay: card.delay, duration: 5, ease: "easeInOut", repeat: Infinity }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#635bff]/10 text-[#635bff]">
                    <Icon className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#697386]">{card.label}</p>
                    <p className="mt-1 text-xs font-semibold text-[#0a2540]">{card.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const workflowSteps = [
  {
    number: "01",
    icon: FileUp,
    title: "Drop the statement",
    description: "Upload your broker PDF into a private workspace designed around local-first processing.",
    note: "PDF · NSE · BSE",
    rotate: "lg:-rotate-2",
  },
  {
    number: "02",
    icon: ScanText,
    title: "Watch it become clear",
    description: "Rapidash structures holdings, flags risk, and gives every insight a traceable source.",
    note: "Parsed with provenance",
    rotate: "lg:rotate-1",
  },
  {
    number: "03",
    icon: ChartNoAxesCombined,
    title: "Move with confidence",
    description: "Explore rebalancing, ask Dash for context, and shape a monthly SIP plan you understand.",
    note: "Action-ready insights",
    rotate: "lg:-rotate-1",
  },
];

function WorkflowExperience() {
  return (
    <section className="relative overflow-hidden bg-[#f7f7ff] px-6 py-24 sm:py-32" id="workflow">
      <div className="absolute left-1/2 top-0 h-px w-[min(90%,1100px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#635bff]/25 to-transparent" />
      <div className="absolute -left-32 bottom-0 size-96 rounded-full bg-[#635bff]/10 blur-3xl" />
      <div className="absolute -right-32 top-16 size-96 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-[1280px]">
        <motion.div
          className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"
          initial={{ opacity: 0, y: 26 }}
          transition={{ duration: 0.7, ease }}
          viewport={{ amount: 0.5, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div>
            <Eyebrow>How it flows</Eyebrow>
            <h2 className="mt-6 max-w-3xl text-5xl leading-[0.95] tracking-[-0.04em] text-[#0a2540] sm:text-6xl lg:text-7xl">
              From PDF to perspective.
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-[#425466] lg:pb-2">
            Three focused moments. No setup maze, no spreadsheet archaeology, and no mystery behind the numbers.
          </p>
        </motion.div>

        <div className="relative mt-20 grid gap-8 lg:grid-cols-3 lg:gap-6 [perspective:1600px]">
          <div className="absolute left-[15%] right-[15%] top-16 hidden h-px bg-gradient-to-r from-[#635bff]/10 via-[#635bff]/45 to-[#635bff]/10 lg:block" />

          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                className={`group relative ${step.rotate}`}
                initial={{ opacity: 0, y: 55, rotateX: 12 }}
                key={step.number}
                transition={{ delay: index * 0.12, duration: 0.7, ease }}
                viewport={{ amount: 0.35, once: true }}
                whileHover={{ y: -14, rotate: 0, scale: 1.015 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              >
                <div className="relative h-full min-h-[390px] overflow-hidden rounded-[2rem] border border-white bg-white/80 p-7 shadow-[0_24px_70px_rgba(10,37,64,0.09)] backdrop-blur-xl transition-shadow duration-500 group-hover:shadow-[0_35px_90px_rgba(99,91,255,0.19)] sm:p-9">
                  <div className="absolute -right-16 -top-16 size-44 rounded-full bg-[#635bff]/10 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                  <div className="flex items-start justify-between">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[#635bff] text-white shadow-[0_16px_35px_rgba(99,91,255,0.32)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="size-6" />
                    </div>
                    <span className="text-5xl text-[#635bff]/15">{step.number}</span>
                  </div>
                  <h3 className="mt-16 text-3xl leading-none tracking-[-0.025em] text-[#0a2540]">
                    {step.title}
                  </h3>
                  <p className="mt-5 leading-7 text-[#425466]">{step.description}</p>
                  <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between border-t border-slate-100 pt-5 text-xs font-bold uppercase tracking-[0.13em] text-[#697386] sm:left-9 sm:right-9">
                    <span>{step.note}</span>
                    <ArrowUpRight className="size-4 text-[#635bff] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function LandingJourney() {
  return (
    <>
      <ProductShowcase />
      <AboutExperience />
      <WorkflowExperience />
    </>
  );
}
