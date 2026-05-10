import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "framer-motion";
import { BlockMath, InlineMath } from "react-katex";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Compass,
  GraduationCap,
  Grid3X3,
  History,
  Layers3,
  Lightbulb,
  MessageCircle,
  Orbit,
  Play,
  Send,
  Sigma,
  Sparkles,
  Target,
  Wand2
} from "lucide-react";
import "katex/dist/katex.min.css";
import "./styles.css";
import { modules } from "./modules.js";
import { AlgebraCanvas } from "./visuals/AlgebraCanvas.jsx";

const stageIcons = [Compass, Target, Brain, Sigma, Wand2];
const stageNames = ["观察", "问题", "解释", "定义", "应用"];

const previewColor = {
  vector: "#F6C86E",
  space: "#6EE7B7",
  transform: "#60A5FA",
  determinant: "#60A5FA",
  eigen: "#C084FC",
  form: "#C084FC"
};

function Pill({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pill ${active ? "pill-active" : ""}`}
    >
      {children}
    </button>
  );
}

function Header({ activeModule, progress }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-midnight/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="brand-mark">
            <Orbit className="h-5 w-5 text-skyMath" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">高等代数交互式学习平台</div>
            <div className="truncate text-xs text-slate-400">{activeModule.title} · {activeModule.coreQuestion}</div>
          </div>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-skyMath via-vectorGold to-eigenPurple"
              animate={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-slate-400">{Math.round(progress)}%</span>
        </div>
      </div>
    </header>
  );
}

function ModuleNav({ activeId, setActiveId }) {
  return (
    <aside className="module-nav">
      <div className="mb-4 flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Learning Map</span>
        <Layers3 className="h-4 w-4 text-slate-500" />
      </div>
      <div className="space-y-2">
        {modules.map((module, index) => (
          <button
            key={module.id}
            type="button"
            onClick={() => setActiveId(module.id)}
            className={`nav-item ${activeId === module.id ? "nav-item-active" : ""}`}
          >
            <span className="nav-index">{String(index + 1).padStart(2, "0")}</span>
            <ModuleMiniPreview module={module} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{module.title}</span>
              <span className="block truncate text-xs text-slate-500">{module.short}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-55" />
          </button>
        ))}
      </div>
    </aside>
  );
}

function ModuleMiniPreview({ module }) {
  const color = previewColor[module.type] ?? "#60A5FA";
  return (
    <svg className="mini-preview" viewBox="0 0 48 32" aria-hidden="true">
      <path d="M2 26 L46 26 M8 30 L8 4 M20 30 L20 4 M32 30 L32 4 M44 30 L44 4 M2 18 L46 18 M2 10 L46 10" />
      {module.type === "eigen" ? (
        <>
          <line x1="8" y1="24" x2="40" y2="8" stroke={color} strokeWidth="2.7" />
          <circle cx="32" cy="12" r="3" fill={color} />
        </>
      ) : module.type === "space" ? (
        <polygon points="8,23 26,9 42,18 22,29" fill={color} opacity="0.22" stroke={color} strokeWidth="1.6" />
      ) : module.type === "form" ? (
        <ellipse cx="25" cy="17" rx="15" ry="7" fill="none" stroke={color} strokeWidth="2" transform="rotate(-22 25 17)" />
      ) : (
        <>
          <line x1="8" y1="24" x2="35" y2="9" stroke={color} strokeWidth="2.6" />
          <path d="M35 9 L31 17 L27 12 Z" fill={color} />
        </>
      )}
    </svg>
  );
}

function StageRail({ activeStage, setActiveStage }) {
  return (
    <div className="stage-rail">
      {stageNames.map((name, index) => {
        const Icon = stageIcons[index];
        return (
          <button
            type="button"
            className={`stage-node ${activeStage === index ? "stage-node-active" : ""}`}
            key={name}
            onClick={() => setActiveStage(index)}
            title={name}
          >
            <Icon className="h-4 w-4" />
            <span>{name}</span>
          </button>
        );
      })}
    </div>
  );
}

function Formula({ children }) {
  return (
    <motion.div
      className="formula-box"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: 0.12 }}
    >
      <BlockMath math={children} />
    </motion.div>
  );
}

function TeacherPanel({ module, activeStage, setActiveStage }) {
  const stage = module.story[activeStage];
  return (
    <motion.section
      layout
      className="teacher-panel"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
    >
      <StageRail activeStage={activeStage} setActiveStage={setActiveStage} />
      <AnimatePresence mode="wait">
        <motion.div
          key={`${module.id}-${activeStage}`}
          initial={{ opacity: 0, y: 14, filter: "none" }}
          animate={{ opacity: 1, y: 0, filter: "none" }}
          exit={{ opacity: 0, y: -8, filter: "none" }}
          transition={{ duration: 0.35 }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="stage-badge">
              {stage.label}
            </span>
            <span className="text-xs text-slate-500">从现象走向抽象</span>
          </div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{stage.title}</h2>
          <p className="mt-4 leading-8 text-slate-300">{stage.body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 grid gap-4">
        <InfoBlock icon={Lightbulb} title="直觉">
          <p>{module.beginner}</p>
        </InfoBlock>
        <InfoBlock icon={Sparkles} title="几何图像">
          <p>{module.geometry}</p>
        </InfoBlock>
        <InfoBlock icon={BookOpen} title="公式与定义">
          <p>{module.definition}</p>
          <Formula>{module.formula}</Formula>
        </InfoBlock>
        <InfoBlock icon={History} title="历史背景">
          <p>{module.history}</p>
        </InfoBlock>
        <InfoBlock icon={History} title="本质总结">
          <p>{module.why}</p>
        </InfoBlock>
        <InfoBlock icon={Target} title="常见误区">
          <p>{module.misconception}</p>
        </InfoBlock>
        <InfoBlock icon={Wand2} title="应用">
          <p>{module.application}</p>
        </InfoBlock>
      </div>
      <AiTutorPanel module={module} activeStage={activeStage} />
    </motion.section>
  );
}

function AiTutorPanel({ module, activeStage }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const stage = module.story[activeStage];
  const sample = answer || `当前我会围绕「${module.title}」解释：先看 ${stage.label}，再把动画里的几何现象翻译成 ${module.formula}。你可以直接问“为什么这个方向不变”或“给我一道例题”。`;

  const askTutor = async (event) => {
    event.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          module: {
            id: module.id,
            title: module.title,
            formula: module.formula,
            stage: stage.label,
            stageBody: stage.body,
            geometry: module.geometry,
            definition: module.definition,
            misconception: module.misconception,
            application: module.application
          }
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "AI 导师暂时不可用");
      setAnswer(payload.answer);
      setQuestion("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ai-tutor">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-skyMath/15 text-skyMath">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <h3>AI 数学导师</h3>
          <p>解释当前动画、公式，并生成例题。</p>
        </div>
      </div>
      <div className="ai-answer">{sample}</div>
      {error ? <div className="ai-error">{error}</div> : null}
      <form
        className="ai-input-row"
        onSubmit={askTutor}
      >
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={`问 AI：为什么 ${module.coreQuestion}`}
          aria-label="向 AI 数学导师提问"
        />
        <button type="submit" title="发送问题" disabled={loading}>
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}

function InfoBlock({ icon: Icon, title, children }) {
  return (
    <div className="info-block">
      <div className="flex items-start gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/7 text-gold">
          <Icon className="h-4 w-4" />
        </div>
        <div className="content-stage min-w-0">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <div className="mt-2 text-sm leading-7 text-slate-300">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DetailGrid({ module }) {
  const cards = [
    ["为什么提出", module.why],
    ["实际应用", module.application],
    ["新手讲解", module.beginner],
    ["严格数学解释", module.rigorous],
    ["常见误区", module.misconception]
  ];
  return (
    <section className="detail-grid">
      {cards.map(([title, text]) => (
        <motion.article
          key={title}
          className="detail-card"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
        >
          <h3>{title}</h3>
          <p>{text}</p>
        </motion.article>
      ))}
    </section>
  );
}

function TopHero({ activeModule, setActiveId }) {
  return (
    <section className="hero">
      <FloatingMath />
      <div className="hero-grid">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
            <Play className="h-3.5 w-3.5 text-skyMath" />
            观察 → 几何现象 → 问题 → 抽象 → 定义 → 应用
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-6xl">
            让高等代数从“公式集合”变成可观察的数学世界
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            每个概念都从一个可拖动、可变化的现象开始。你先看见问题，再理解为什么需要定义，最后才进入严格表述。
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {modules.slice(0, 6).map((module) => (
              <Pill key={module.id} active={activeModule.id === module.id} onClick={() => setActiveId(module.id)}>
                {module.title}
              </Pill>
            ))}
          </div>
        </motion.div>
        <motion.div
          className="hero-stage"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <svg className="hero-board" viewBox="0 0 520 380" aria-hidden="true">
            <defs>
              <marker id="heroArrowGold" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#F6C86E" />
              </marker>
              <marker id="heroArrowPurple" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#C084FC" />
              </marker>
            </defs>
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i}>
                <line x1={i * 48 - 20} y1="0" x2={i * 48 - 90} y2="380" className="hero-grid-line" />
                <line x1="0" y1={i * 38} x2="520" y2={i * 38 - 64} className="hero-grid-line" />
              </g>
            ))}
            <polygon points="120,270 316,178 410,228 214,320" className="hero-plane" />
            <line x1="120" y1="270" x2="345" y2="128" className="hero-vector" markerEnd="url(#heroArrowGold)" />
            <line x1="128" y1="254" x2="400" y2="120" className="hero-eigen" markerEnd="url(#heroArrowPurple)" />
            <circle cx="345" cy="128" r="7" fill="#F6C86E" />
            <circle cx="400" cy="120" r="7" fill="#C084FC" />
          </svg>
          <div className="hero-equation">
            <InlineMath math="A\\mathbf{x}=\\lambda\\mathbf{x}" />
          </div>
          <div className="orbit-note note-a">线性变换</div>
          <div className="orbit-note note-b">特征方向</div>
          <div className="orbit-note note-c">不变量</div>
        </motion.div>
      </div>
    </section>
  );
}

function CourseBlueprint({ activeModule }) {
  const tracks = [
    ["基础结构", "向量、空间、子空间、基与维数", "建立坐标与自由度语言"],
    ["变换核心", "矩阵、秩、行列式、方程组", "看懂线性规则如何改变空间"],
    ["谱理论", "特征值、对角化、Jordan", "找到系统自己的坐标轴"],
    ["应用桥梁", "二次型、内积、正交化、PCA", "连接优化、机器学习与金融建模"]
  ];
  const activePosition = modules.findIndex((module) => module.id === activeModule.id) + 1;

  return (
    <section className="course-blueprint">
      <div className="blueprint-head">
        <div>
          <div className="section-kicker">
            <GraduationCap className="h-4 w-4" />
            University Learning System
          </div>
          <h2>从概念直觉到可计算能力的完整学习路径</h2>
        </div>
        <div className="blueprint-progress">
          <span>当前进度</span>
          <strong>{activePosition}/{modules.length}</strong>
        </div>
      </div>
      <div className="track-grid">
        {tracks.map(([title, topics, outcome], index) => (
          <motion.article
            className="track-card"
            key={title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="track-index">{String(index + 1).padStart(2, "0")}</div>
            <h3>{title}</h3>
            <p>{topics}</p>
            <div className="track-outcome">
              <CheckCircle2 className="h-4 w-4" />
              {outcome}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function FloatingMath() {
  const symbols = ["λ", "det A", "span", "rank", "V", "Aⁿ", "ker", "⟂"];
  return (
    <div className="floating-math" aria-hidden="true">
      {symbols.map((symbol, index) => (
        <motion.span
          key={symbol}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0.2, 0.55, 0.2], y: [0, -12, 0] }}
          transition={{ duration: 6 + index * 0.45, repeat: Infinity, delay: index * 0.35 }}
          style={{ left: `${8 + index * 12}%`, top: `${18 + (index % 3) * 22}%` }}
        >
          {symbol}
        </motion.span>
      ))}
    </div>
  );
}

function App() {
  const [activeId, setActiveId] = useState(modules[0].id);
  const [activeStage, setActiveStage] = useState(0);
  const activeIndex = modules.findIndex((item) => item.id === activeId);
  const activeModule = modules[activeIndex] ?? modules[0];
  const progress = useMemo(() => ((activeIndex + 1) / modules.length) * 100, [activeIndex]);

  return (
    <div className="app-shell min-h-screen text-slate-100">
      <Header activeModule={activeModule} progress={progress} />
      <TopHero activeModule={activeModule} setActiveId={(id) => { setActiveId(id); setActiveStage(0); }} />
      <CourseBlueprint activeModule={activeModule} />
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 pb-16 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ModuleNav activeId={activeId} setActiveId={(id) => { setActiveId(id); setActiveStage(0); }} />
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <section className="learning-shell">
                <div className="visual-pane">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyanGlow">
                        <Grid3X3 className="h-4 w-4" />
                        Interactive Lab
                      </div>
                      <h2 className="mt-2 text-2xl font-semibold text-white">{activeModule.title}</h2>
                      <p className="mt-1 text-sm text-slate-400">{activeModule.visualHint}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-right">
                      <div className="text-xs text-slate-500">核心问题</div>
                      <div className="mt-1 max-w-56 text-sm text-slate-200">{activeModule.coreQuestion}</div>
                    </div>
                  </div>
                  <AlgebraCanvas module={activeModule} />
                </div>
                <TeacherPanel module={activeModule} activeStage={activeStage} setActiveStage={setActiveStage} />
              </section>
              <DetailGrid module={activeModule} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-500">
        面向大一学生的高等代数学习系统 · 用交互理解定义的来源
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
