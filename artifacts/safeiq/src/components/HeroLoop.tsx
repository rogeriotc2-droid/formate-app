import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SCENE_DURATIONS = [900, 3400, 2400, 2200, 2400, 2400, 500];

const STICKY_FIELDS = [
  { label: "Date", value: "21 May 2026" },
  { label: "Inspector", value: "Jordan Taylor" },
  { label: "Site", value: "Auckland CBD — Site 4" },
  { label: "PCBU", value: "BuildCo NZ Ltd" },
];

const TASK_ITEMS = ["PPE check complete", "Toolbox talk delivered", "Hazards logged"];

const SIGNATURE_PATH =
  "M 5 30 Q 15 5, 25 25 T 50 22 Q 65 10, 80 30 T 115 18 Q 125 35, 140 22";

function useScenePlayer() {
  const [scene, setScene] = useState(0);
  const durations = useRef(SCENE_DURATIONS).current;

  useEffect(() => {
    const t = setTimeout(() => {
      setScene((s) => (s >= durations.length - 1 ? 0 : s + 1));
    }, durations[scene]);
    return () => clearTimeout(t);
  }, [scene, durations]);

  return scene;
}

export default function HeroLoop() {
  const scene = useScenePlayer();

  const phoneVisible = scene >= 0 && scene <= 4;
  const flyingPdf = scene === 4;
  const showLockup = scene === 5;

  const phoneAnim =
    scene === 4
      ? { y: "0vh", scale: 0.92, opacity: 1 }
      : scene >= 5
      ? { y: "8vh", scale: 0.6, opacity: 0 }
      : { y: "0vh", scale: 1, opacity: 1 };

  return (
    <div
      className="w-full h-full overflow-hidden relative flex items-center justify-center"
      style={{ backgroundColor: "#0F172A" }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute w-[70%] h-[70%] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, #f97316 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
        animate={{ opacity: scene === 5 ? 0.45 : 0.18, scale: scene === 5 ? 1.3 : 1 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Caption */}
      <AnimatePresence mode="wait">
        {!showLockup && scene !== 6 && (
          <motion.div
            key={`cap-${scene}`}
            className="absolute top-[8%] text-white/95 text-sm sm:text-base font-bold tracking-tight z-30 text-center px-4"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.45 }}
          >
            {scene === 0 && "Open a form on site"}
            {scene === 1 && (
              <>
                <span className="text-[#f97316]">Sticky fields</span> fill themselves
              </>
            )}
            {scene === 2 && "Tick what matters"}
            {scene === 3 && "Sign"}
            {scene === 4 && "Send — PDF filed by site"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone / tablet mockup */}
      <AnimatePresence>
        {phoneVisible && (
          <motion.div
            key="phone"
            className="absolute z-10"
            style={{ width: "min(420px, 88%)" }}
            initial={{ y: 40, opacity: 0, scale: 0.94 }}
            animate={phoneAnim}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="w-full rounded-2xl p-2 shadow-2xl"
              style={{
                background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
                boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
              }}
            >
              <div className="w-full rounded-xl overflow-hidden bg-white flex flex-col">
                {/* Top bar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50">
                  <span className="text-[10px] font-semibold text-slate-700">9:14 · On site</span>
                  <span className="text-[10px] font-black">
                    <span className="text-slate-900">FOR</span>
                    <span style={{ color: "#f97316" }}>MATE</span>
                  </span>
                </div>

                {/* Form header */}
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-sm font-bold text-slate-900">Daily Site Inspection</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Template · Inspection</div>
                </div>

                {/* Two-column body */}
                <div className="grid grid-cols-2 gap-3 px-3 py-3">
                  {/* LEFT: Sticky fields */}
                  <div className="space-y-2">
                    {STICKY_FIELDS.map((f, i) => (
                      <div key={f.label}>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
                          {f.label}
                        </div>
                        <motion.div
                          className="rounded px-2 py-1 flex items-center"
                          initial={false}
                          animate={{
                            backgroundColor: scene >= 1 ? "#fff7ed" : "#f8fafc",
                            borderColor:
                              scene === 1 ? "#f97316" : scene >= 2 ? "#fed7aa" : "#e2e8f0",
                          }}
                          style={{ borderWidth: 1, borderStyle: "solid" }}
                          transition={{ duration: 0.4, delay: scene === 1 ? i * 0.55 : 0 }}
                        >
                          <motion.span
                            className="text-[10px] font-medium text-slate-900 leading-none"
                            initial={false}
                            animate={{ opacity: scene >= 1 ? 1 : 0 }}
                            transition={{ duration: 0.35, delay: scene === 1 ? i * 0.55 + 0.18 : 0 }}
                          >
                            {f.value}
                          </motion.span>
                          <motion.span
                            className="ml-auto text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-full"
                            style={{ backgroundColor: "#f97316", color: "white" }}
                            initial={false}
                            animate={{
                              opacity: scene >= 1 && scene <= 4 ? 1 : 0,
                              scale: scene === 1 ? [0.6, 1.15, 1] : 1,
                            }}
                            transition={{ duration: 0.45, delay: scene === 1 ? i * 0.55 + 0.05 : 0 }}
                          >
                            Auto
                          </motion.span>
                        </motion.div>
                      </div>
                    ))}
                  </div>

                  {/* RIGHT: Checklist + signature + submit */}
                  <div className="flex flex-col">
                    <div className="space-y-2">
                      {TASK_ITEMS.map((t, i) => (
                        <div key={t} className="flex items-center gap-2">
                          <motion.div
                            className="rounded flex items-center justify-center flex-shrink-0"
                            style={{ width: 14, height: 14, borderWidth: 1, borderStyle: "solid" }}
                            initial={false}
                            animate={{
                              backgroundColor: scene >= 2 ? "#10b981" : "#ffffff",
                              borderColor: scene >= 2 ? "#10b981" : "#cbd5e1",
                              scale: scene === 2 ? [1, 1.15, 1] : 1,
                            }}
                            transition={{ duration: 0.35, delay: scene === 2 ? i * 0.5 : 0 }}
                          >
                            <motion.svg
                              viewBox="0 0 24 24"
                              style={{ width: 9, height: 9 }}
                              fill="none"
                              stroke="white"
                              strokeWidth={4}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={false}
                              animate={{ opacity: scene >= 2 ? 1 : 0 }}
                              transition={{ duration: 0.2, delay: scene === 2 ? i * 0.5 + 0.15 : 0 }}
                            >
                              <path d="M5 12l5 5L20 6" />
                            </motion.svg>
                          </motion.div>
                          <span className="text-[10px] text-slate-700 font-medium leading-tight">{t}</span>
                        </div>
                      ))}
                    </div>

                    {/* Signature */}
                    <div className="mt-2">
                      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                        Signature
                      </div>
                      <div
                        className="rounded relative overflow-hidden"
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px dashed #cbd5e1",
                          height: 36,
                        }}
                      >
                        <svg viewBox="0 0 150 40" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                          <motion.path
                            d={SIGNATURE_PATH}
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth={2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={false}
                            animate={{ pathLength: scene >= 3 ? 1 : 0 }}
                            transition={{ duration: scene === 3 ? 1.4 : 0, ease: "easeInOut" }}
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.div
                      className="rounded flex items-center justify-center text-white font-bold text-[11px] mt-2"
                      style={{ backgroundColor: "#f97316", height: 28 }}
                      initial={false}
                      animate={{
                        scale: scene === 4 ? [1, 0.94, 1.02] : 1,
                        backgroundColor: scene === 4 ? "#ea580c" : "#f97316",
                      }}
                      transition={{ duration: 0.5, times: [0, 0.3, 1] }}
                    >
                      {scene === 4 ? "Sending…" : "Submit"}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flying PDF + Sent badge */}
      <AnimatePresence>
        {flyingPdf && (
          <>
            <motion.div
              key="pdf"
              className="absolute z-20 bg-white rounded-xl shadow-2xl flex flex-col p-2"
              style={{ width: 80, height: 96 }}
              initial={{ x: 0, y: 0, scale: 0.6, opacity: 0 }}
              animate={{
                x: [0, 60, 120],
                y: [0, -40, -100],
                scale: [0.6, 0.9, 0.55],
                opacity: [0, 1, 1],
                rotate: [-2, 4, -3],
              }}
              transition={{ duration: 1.8, times: [0, 0.45, 1], ease: "easeOut" }}
            >
              <div className="text-[8px] font-bold text-[#f97316] tracking-widest">PDF</div>
              <div className="text-[8px] font-semibold text-slate-700 mt-0.5 leading-tight">Daily Inspection</div>
              <div className="text-[7px] text-slate-400 mt-0.5 leading-tight">Auckland CBD · 21 May</div>
              <div className="mt-2 space-y-1">
                <div className="h-1 bg-slate-200 rounded-full w-4/5" />
                <div className="h-1 bg-slate-200 rounded-full w-3/5" />
                <div className="h-1 bg-slate-200 rounded-full w-[70%]" />
              </div>
            </motion.div>
            <motion.div
              key="sent"
              className="absolute right-[8%] top-[18%] z-30 flex items-center gap-1.5 bg-emerald-500 text-white rounded-full px-3 py-1.5 font-bold text-xs shadow-2xl"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ delay: 1.4, type: "spring", stiffness: 280, damping: 18 }}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 6" />
              </svg>
              Filed
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FORMATE lockup */}
      <AnimatePresence>
        {showLockup && (
          <motion.div
            key="lockup"
            className="absolute z-40 flex flex-col items-center justify-center"
            initial={{ scale: 0.6, opacity: 0, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 1.3, opacity: 0, filter: "blur(15px)" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center text-6xl sm:text-7xl font-black tracking-tighter leading-none">
              <span className="text-white">FOR</span>
              <span style={{ color: "#f97316" }}>MATE</span>
            </div>
            <motion.div
              className="text-slate-400 mt-3 tracking-[0.3em] uppercase text-xs font-semibold"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              Your mate on site
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
