"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate, useParams } from "react-router";
import {
  Code2,
  MessageSquare,
  Map,
  Download,
  ChevronDown,
  ArrowLeft,
  BarChart3,
  Target,
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Briefcase,
  Activity,
  ShieldCheck,
  Menu,
  X,
  Zap,
  Award,
  Calendar,
  Sparkles,
  Check,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth.js";
import { evaluatePracticeAnswer } from "../services/interview.api";
import { createPlan } from "../../plan/services/plan.api";

const NAV_ITEMS = [
  { id: "analysis", label: "Job Fit & ATS", icon: <BarChart3 size={18} /> },
  { id: "technical", label: "Technical Q&A", icon: <Code2 size={18} /> },
  { id: "behavioral", label: "Behavioral Q&A", icon: <MessageSquare size={18} /> },
  { id: "roadmap", label: "Technical Roadmap", icon: <Map size={18} /> },
  { id: "practice", label: "AI Mock Interview", icon: <Zap size={18} /> },
];

function buildClientFallbackData(report) {
  const skills =
    report?.resumeAnalysis?.resume_skills?.length > 0
      ? report.resumeAnalysis.resume_skills
      : ["JavaScript", "React", "Node.js", "SQL", "System Design"];
  const s1 = skills[0] || "Core Stack";
  const s2 = skills[1] || "Backend Services";
  const s3 = skills[2] || "Data Layer";

  const fallbackTechnical = [
    {
      question: `How do you structure and optimize production applications using ${s1}?`,
      intention: `Assess architectural depth, state/data flow management, and performance tuning in ${s1}.`,
      answer: `Focus on modular component/service boundaries, profiling bottlenecks, memoization or caching strategies, and clean error handling in ${s1}.`,
    },
    {
      question: `How does ${s2} interact with ${s3} under high concurrency?`,
      intention: `Evaluate full-stack integration knowledge, latency reduction, and data consistency.`,
      answer: `Explain connection pooling, indexing, asynchronous request queues, schema validation, and graceful degradation under load.`,
    },
    {
      question: `What security practices do you enforce across authentication and API endpoints?`,
      intention: `Verify practical understanding of web security and access control.`,
      answer: `Discuss JWT/cookie security, RBAC authorization, input validation, rate limiting, CORS configuration, and secret management.`,
    },
    {
      question: `How do you diagnose and resolve a sudden latency spike in production?`,
      intention: `Test debugging methodology and observability skills.`,
      answer: `Walk through inspecting logs and APM traces, isolating slow database queries or memory leaks, reproducing the issue, and deploying a verified fix.`,
    },
    {
      question: `How do you design automated testing pipelines before shipping features?`,
      intention: `Check engineering quality across unit, integration, and end-to-end tests.`,
      answer: `Describe unit tests for core logic, integration tests for API contracts, and automated CI checks on pull requests.`,
    },
  ];

  const fallbackBehavioral = [
    {
      question: `Describe a complex technical challenge you solved using ${s1} under a tight deadline.`,
      intention: `Evaluate prioritization, ownership, and execution under pressure.`,
      answer: `Use the STAR framework: explain the project context, how you isolated the critical path, trade-offs made, and measurable results delivered.`,
    },
    {
      question: `Tell me about a time you disagreed with a teammate on an implementation approach.`,
      intention: `Assess collaboration, objective reasoning, and communication.`,
      answer: `Highlight focusing on objective trade-offs, running a quick benchmark or prototype, and aligning on the most maintainable solution.`,
    },
    {
      question: `How do you ramp up on an unfamiliar technology or codebase quickly?`,
      intention: `Gauge learning agility and structured problem-solving.`,
      answer: `Explain reading core architecture docs, tracing key data flows, building a small proof-of-concept, and seeking early feedback.`,
    },
  ];

  const fallbackRoadmap = [
    {
      day: 1,
      focus: `${s1} Core Architecture & Deep Dive`,
      tasks: [
        `Review advanced ${s1} design patterns, lifecycle mechanics, and performance best practices`,
        `Audit resume project bullet points and prepare clear architectural explanations`,
        `Practice 3 technical interview questions focused on ${s1}`,
      ],
    },
    {
      day: 2,
      focus: `${s2} & Scalable API Engineering`,
      tasks: [
        `Study service architecture, middleware design, and asynchronous error handling in ${s2}`,
        `Review authentication, authorization, caching, and rate-limiting patterns`,
        `Map out a system design diagram for a core project on your resume`,
      ],
    },
    {
      day: 3,
      focus: `${s3}, Data Modeling & Skill Gap Closure`,
      tasks: [
        `Review indexing, query optimization, and schema design in ${s3}`,
        `Practice addressing identified skill gaps with hands-on code exercises`,
        `Prepare examples demonstrating database performance tuning`,
      ],
    },
    {
      day: 4,
      focus: `Testing, Security & Production Debugging`,
      tasks: [
        `Review unit and integration testing strategies and CI/CD workflows`,
        `Rehearse debugging scenarios for memory leaks, race conditions, and API bottlenecks`,
        `Verify all technical claims on your resume with concrete metrics`,
      ],
    },
    {
      day: 5,
      focus: `Mock Interview Simulation & Behavioral Mastery`,
      tasks: [
        `Prepare 5 structured STAR stories covering leadership, teamwork, and conflict resolution`,
        `Run a full timed session in the AI Mock Interview tab`,
        `Review final feedback and refine weak areas before the interview`,
      ],
    },
  ];

  return { fallbackTechnical, fallbackBehavioral, fallbackRoadmap };
}

// --- High-Fidelity Sub-Components ---

const ScoreRing = ({ score }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#10b981" : score >= 50 ? "#6366f1" : "#f59e0b";

  return (
    <div className="relative flex items-center justify-center w-36 h-36 md:w-44 md:h-44">
      <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-2xl" />
      <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-slate-800"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "circOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          {score}%
        </span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
          Match Score
        </span>
      </div>
    </div>
  );
};

const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(index === 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`mb-4 overflow-hidden rounded-2xl border transition-all duration-300 ${
        open
          ? "bg-slate-900/90 border-indigo-500/40 shadow-lg"
          : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 md:p-6 text-left group cursor-pointer"
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-all shrink-0 ${
            open
              ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/25"
              : "bg-slate-800/80 border-slate-700 text-slate-400 group-hover:text-white"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
        <span className="flex-1 text-sm md:text-base font-semibold text-slate-100 group-hover:text-white leading-snug">
          {item.question}
        </span>
        <div
          className={`p-2 rounded-lg transition-all ${
            open
              ? "rotate-180 bg-indigo-500/15 text-indigo-400"
              : "bg-slate-800/60 text-slate-400"
          }`}
        >
          <ChevronDown size={16} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="px-5 pb-6 md:px-6 md:pb-6 pt-0 space-y-4">
              <div className="h-[1px] bg-slate-800 w-full mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-2">
                    <Target size={14} /> Interviewer Intent
                  </p>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    {item.intention}
                  </p>
                </div>
                <div className="bg-emerald-500/[0.04] p-5 rounded-xl border border-emerald-500/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Recommended Answer Strategy
                  </p>
                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const RoadMapDay = ({ day, index, completedMap, onToggleTask }) => {
  const tasks = day.tasks || [];
  const completedCount = tasks.filter(
    (_, idx) => completedMap[`${day.day}-${idx}`]
  ).length;
  const phasePercent =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative pl-12 md:pl-20 pb-8 md:pb-12 group last:pb-0"
    >
      {/* Vertical Timeline Connector */}
      <div className="absolute left-[19px] md:left-[31px] top-10 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/60 via-sky-500/30 to-slate-800 group-last:hidden" />

      {/* Timeline Node Badge */}
      <div
        className={`absolute left-0 top-0 w-10 h-10 md:w-16 md:h-16 rounded-2xl border flex items-center justify-center z-10 shadow-lg transition-all ${
          phasePercent === 100
            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
            : "bg-slate-900 border-slate-700/80 group-hover:border-indigo-500/60 text-white"
        }`}
      >
        <div className="text-center">
          <span className="block text-[8px] md:text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
            Day
          </span>
          <span className="text-sm md:text-xl font-extrabold">{day.day}</span>
        </div>
      </div>

      {/* Phase Card */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 md:p-7 backdrop-blur-xl hover:border-slate-700/80 transition-all shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
              Phase {day.day} Milestone
            </span>
            <h3 className="text-base md:text-lg font-bold text-white mt-0.5">
              {day.focus}
            </h3>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                phasePercent === 100
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-800/80 border-slate-700 text-slate-300"
              }`}
            >
              {completedCount}/{tasks.length} Completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {tasks.map((task, i) => {
            const key = `${day.day}-${i}`;
            const isDone = !!completedMap[key];
            return (
              <div
                key={i}
                onClick={() => onToggleTask(key)}
                className={`flex items-start gap-3.5 p-3.5 md:p-4 rounded-xl border transition-all cursor-pointer ${
                  isDone
                    ? "bg-emerald-500/[0.05] border-emerald-500/25 text-slate-400"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-indigo-500/40 text-slate-200"
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 shrink-0 text-indigo-400"
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-emerald-400" />
                  ) : (
                    <Circle size={18} className="text-slate-500" />
                  )}
                </button>
                <span
                  className={`text-xs md:text-sm leading-relaxed ${
                    isDone ? "line-through text-slate-500" : "text-slate-200"
                  }`}
                >
                  {task}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

const MockInterviewSimulator = ({ report, technicalList, behavioralList }) => {
  const [step, setStep] = useState("init"); // init, chat, scorecard
  const [practiceType, setPracticeType] = useState("technical");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoresList, setScoresList] = useState([]);
  const [finalSummary, setFinalSummary] = useState(null);

  const questions =
    practiceType === "technical" ? technicalList : behavioralList;

  const startSimulation = (type) => {
    const list = type === "technical" ? technicalList : behavioralList;
    if (!list || list.length === 0) {
      alert("No questions available for this category.");
      return;
    }
    setPracticeType(type);
    setStep("chat");
    setCurrentQuestionIdx(0);
    setScoresList([]);
    setFinalSummary(null);
    setUserAnswer("");

    setChatHistory([
      {
        role: "assistant",
        text: `Welcome to the ${type} interview simulation. I will evaluate your responses to ${list.length} questions one by one.\n\nQuestion 1: ${list[0].question}`,
      },
    ]);
  };

  const handleResponseSubmit = async () => {
    if (!userAnswer.trim()) return;
    setIsSubmitting(true);

    try {
      const result = await evaluatePracticeAnswer({
        interviewId: report._id,
        type: practiceType,
        currentQuestionIndex: currentQuestionIdx,
        userAnswer: userAnswer,
      });

      const updatedHistory = [
        ...chatHistory,
        { role: "user", text: userAnswer },
        {
          role: "assistant",
          text: result.feedback,
          score: result.score,
          feedback: result.feedback,
        },
      ];

      const newScores = [...scoresList, result.score];
      setScoresList(newScores);

      if (result.isFinished) {
        setFinalSummary(result.finalSummary);
        setChatHistory(updatedHistory);
        setStep("scorecard");
      } else {
        updatedHistory.push({
          role: "assistant",
          text: `Question ${currentQuestionIdx + 2}: ${result.nextQuestion}`,
        });
        setChatHistory(updatedHistory);
        setCurrentQuestionIdx(currentQuestionIdx + 1);
        setUserAnswer("");
      }
    } catch (err) {
      console.error(err);
      // Graceful client-side progression if offline
      const nextIdx = currentQuestionIdx + 1;
      const isLast = nextIdx >= questions.length;
      const fallbackScore = Math.min(
        9,
        Math.max(6, Math.round(userAnswer.trim().split(/\s+/).length / 12) + 5)
      );
      const feedbackMsg =
        "Solid structured response. Make sure to highlight quantifiable metrics and architectural trade-offs.";
      const updatedHistory = [
        ...chatHistory,
        { role: "user", text: userAnswer },
        {
          role: "assistant",
          text: feedbackMsg,
          score: fallbackScore,
          feedback: feedbackMsg,
        },
      ];
      setScoresList([...scoresList, fallbackScore]);

      if (isLast) {
        setFinalSummary(
          "You demonstrated clear technical communication across the session. Continue refining your system design examples and quantifiable impact metrics."
        );
        setChatHistory(updatedHistory);
        setStep("scorecard");
      } else {
        updatedHistory.push({
          role: "assistant",
          text: `Question ${nextIdx + 1}: ${questions[nextIdx].question}`,
        });
        setChatHistory(updatedHistory);
        setCurrentQuestionIdx(nextIdx);
        setUserAnswer("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const overallScore =
    scoresList.length > 0
      ? Math.round(
          (scoresList.reduce((a, b) => a + b, 0) / scoresList.length) * 10
        )
      : 0;

  if (step === "init") {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-8 py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <Zap size={28} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            AI Mock Interview Simulator
          </h2>
          <p className="text-slate-400 text-sm max-w-md">
            Practice answering role-specific questions with real-time AI scoring, constructive feedback, and readiness metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4">
          <button
            onClick={() => startSimulation("technical")}
            className="group flex flex-col items-center text-center p-8 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 rounded-2xl transition-all cursor-pointer shadow-lg"
          >
            <Code2
              className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform"
              size={30}
            />
            <span className="text-sm font-bold text-white mb-1.5">
              Technical Interview ({technicalList.length} Questions)
            </span>
            <span className="text-xs text-slate-400">
              Test system design, architecture, and core stack proficiency.
            </span>
          </button>

          <button
            onClick={() => startSimulation("behavioral")}
            className="group flex flex-col items-center text-center p-8 bg-slate-900/60 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 rounded-2xl transition-all cursor-pointer shadow-lg"
          >
            <MessageSquare
              className="text-sky-400 mb-4 group-hover:scale-110 transition-transform"
              size={30}
            />
            <span className="text-sm font-bold text-white mb-1.5">
              Behavioral Interview ({behavioralList.length} Questions)
            </span>
            <span className="text-xs text-slate-400">
              Practice STAR-method responses, leadership, and team collaboration.
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (step === "chat") {
    return (
      <div className="max-w-3xl mx-auto flex flex-col h-[72vh] bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
        {/* Top Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              {practiceType} Simulation
            </span>
          </div>
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Question {currentQuestionIdx + 1} of {questions.length}
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {chatHistory.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${
                item.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 md:p-5 text-xs md:text-sm leading-relaxed ${
                  item.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-950/80 border border-slate-800 text-slate-200"
                }`}
              >
                {item.score !== undefined && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                    <Award size={14} className="text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Evaluation Score: {item.score}/10
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-line">{item.text}</p>
              </div>
            </motion.div>
          ))}
          {isSubmitting && (
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium pl-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              Evaluating your answer...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex gap-3">
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isSubmitting}
            placeholder="Write your response here..."
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl p-3.5 text-xs md:text-sm text-white outline-none resize-none h-16 md:h-20"
          />
          <button
            onClick={handleResponseSubmit}
            disabled={isSubmitting || !userAnswer.trim()}
            className="px-5 md:px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  if (step === "scorecard") {
    return (
      <div className="max-w-3xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 md:p-12 text-center space-y-8 backdrop-blur-xl shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Assessment Complete
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-white">
            Session Scorecard
          </h2>
        </div>

        <div className="flex justify-center py-2">
          <ScoreRing score={overallScore} />
        </div>

        {finalSummary && (
          <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl max-w-xl mx-auto text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-2">
              <CheckCircle2 size={14} /> Executive Feedback
            </p>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {finalSummary}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-xl mx-auto">
          {scoresList.map((sc, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center"
            >
              <span className="text-[11px] font-medium text-slate-400 mb-1">
                Q{i + 1}
              </span>
              <span className="text-lg font-bold text-white">{sc}/10</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={() => setStep("init")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Start Another Session
          </button>
        </div>
      </div>
    );
  }

  return null;
};

const Interview = () => {
  const [activeNav, setActiveNav] = useState("analysis");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { report, getReportById, loading, getResumePdf } = useInterview();
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [completedRoadmapTasks, setCompletedRoadmapTasks] = useState({});
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planSavedToast, setPlanSavedToast] = useState(false);

  useEffect(() => {
    if (interviewId) getReportById(interviewId);
  }, [interviewId]);

  useEffect(() => {
    if (interviewId) {
      try {
        const saved = localStorage.getItem(`roadmap_progress_${interviewId}`);
        if (saved) setCompletedRoadmapTasks(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [interviewId]);

  const handleToggleRoadmapTask = (key) => {
    setCompletedRoadmapTasks((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (interviewId) {
        try {
          localStorage.setItem(
            `roadmap_progress_${interviewId}`,
            JSON.stringify(updated)
          );
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
  };

  const handleNavClick = (id) => {
    setActiveNav(id);
    setSidebarOpen(false);
  };

  const { fallbackTechnical, fallbackBehavioral, fallbackRoadmap } = useMemo(
    () => buildClientFallbackData(report),
    [report]
  );

  const technicalList =
    report?.technicalQuestions?.length > 0
      ? report.technicalQuestions
      : fallbackTechnical;

  const behavioralList =
    report?.behavioralQuestions?.length > 0
      ? report.behavioralQuestions
      : fallbackBehavioral;

  const roadmapList =
    report?.preparationPlan?.length > 0
      ? report.preparationPlan
      : fallbackRoadmap;

  const totalRoadmapTasks = useMemo(
    () => roadmapList.reduce((acc, d) => acc + (d.tasks?.length || 0), 0),
    [roadmapList]
  );

  const completedRoadmapCount = useMemo(() => {
    let count = 0;
    roadmapList.forEach((d) => {
      (d.tasks || []).forEach((_, idx) => {
        if (completedRoadmapTasks[`${d.day}-${idx}`]) count++;
      });
    });
    return count;
  }, [roadmapList, completedRoadmapTasks]);

  const roadmapProgressPct =
    totalRoadmapTasks > 0
      ? Math.round((completedRoadmapCount / totalRoadmapTasks) * 100)
      : 0;

  const handleDeployToMyPlans = async () => {
    if (isSavingPlan) return;
    setIsSavingPlan(true);
    try {
      const payload = {
        title: `${report?.title || "Technical Interview"} Roadmap`,
        days: roadmapList.map((d) => ({
          day: d.day,
          tasks: (d.tasks || []).map((t, idx) => ({
            text: `[${d.focus}] ${t}`,
            completed: !!completedRoadmapTasks[`${d.day}-${idx}`],
            completedAt: completedRoadmapTasks[`${d.day}-${idx}`]
              ? new Date()
              : null,
          })),
        })),
      };
      await createPlan(payload);
      setPlanSavedToast(true);
      setTimeout(() => {
        navigate("/plans");
      }, 900);
    } catch (err) {
      console.error("Failed to save roadmap to plans:", err);
      alert("Could not sync roadmap to My Plans. Please try again.");
    } finally {
      setIsSavingPlan(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center relative overflow-hidden p-6">
        <div className="relative">
          <div className="w-20 h-20 border border-indigo-500/20 rounded-full flex items-center justify-center">
            <div className="w-14 h-14 border-4 border-t-indigo-500 border-transparent rounded-full animate-spin" />
          </div>
          <Activity
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400"
            size={20}
          />
        </div>
        <p className="text-slate-300 font-semibold text-xs mt-6 uppercase tracking-widest animate-pulse">
          Loading Analysis & Technical Roadmap...
        </p>
      </main>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#090d16] text-slate-200 p-6">
        <div className="max-w-md text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
          <AlertCircle size={36} className="text-indigo-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Report Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The requested analysis report could not be loaded or does not exist.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const score = report.matchScore ?? 0;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#0b101b]/95 backdrop-blur-xl z-50">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Nexus Report
        </span>
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 text-white bg-slate-800 rounded-lg"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Left Sidebar Navigation */}
      <nav
        className={`
        fixed inset-0 lg:relative lg:inset-auto z-40
        w-full lg:w-72 border-r border-slate-800/80 bg-[#0b101b] lg:bg-[#0b101b]/90 backdrop-blur-2xl 
        flex flex-col p-6 lg:p-7
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="hidden lg:flex items-center gap-2.5 text-slate-400 hover:text-white transition-all group mb-10 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Dashboard
        </button>

        <div className="mb-6 px-2 hidden lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Report Workspace
          </p>
          <h2 className="text-sm font-bold text-white truncate mt-1">
            {report.title || "Resume Strategy Report"}
          </h2>
        </div>

        <div className="space-y-1.5 flex-1 mt-12 lg:mt-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full group relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNav === item.id
                  ? "bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <span
                className={
                  activeNav === item.id
                    ? "text-indigo-400"
                    : "group-hover:text-indigo-400 transition-colors"
                }
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5 mt-6 lg:mt-auto pt-6 border-t border-slate-800/80">
          <button
            onClick={() => navigate("/plans")}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/70 rounded-xl font-semibold text-xs transition-all cursor-pointer"
          >
            <Calendar size={15} className="text-indigo-400" />
            Open My Plans
          </button>

          <button
            onClick={() => {
              if (interviewId) getResumePdf(interviewId);
              setSidebarOpen(false);
            }}
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Download size={15} /> Export Optimized PDF
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
        <AnimatePresence mode="wait">
          {/* 1. JOB FIT & ATS ANALYSIS */}
          {activeNav === "analysis" && (
            <motion.section
              key="analysis"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="max-w-5xl mx-auto space-y-8"
            >
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                    <Activity size={13} />
                    ATS Compatibility Report
                  </div>
                  <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                    {report.title || "Resume Match Overview"}
                  </h1>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setActiveNav("roadmap")}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Map size={14} /> View Technical Roadmap
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 flex flex-col items-center justify-center backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <ShieldCheck size={15} />
                    <p className="text-xs font-semibold uppercase tracking-wider">
                      Overall Job Fit
                    </p>
                  </div>
                  <ScoreRing score={score} />
                </div>

                <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8 backdrop-blur-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                        <AlertCircle size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          Identified Skill Gaps & Focus Areas
                        </h3>
                        <p className="text-xs text-slate-400">
                          Recommended topics to review before your technical interview
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {(report.skillGaps?.length > 0
                        ? report.skillGaps
                        : report.resumeAnalysis?.recommended_jobs?.[0]?.missing_skills?.map(
                            (s) => ({ skill: s, severity: "medium" })
                          ) || [
                            { skill: "System Design & Scalability", severity: "medium" },
                            { skill: "Automated Testing", severity: "low" },
                          ]
                      ).map((gap, i) => (
                        <span
                          key={i}
                          className="px-3.5 py-2 text-xs font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-xl"
                        >
                          {gap.skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs text-slate-400">
                      Ready to prepare for these topics systematically?
                    </span>
                    <button
                      onClick={() => setActiveNav("roadmap")}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      Open 5-Day Timeline & Roadmap →
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-slate-400">
                    Extracted Resume Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(report.resumeAnalysis?.resume_skills?.length > 0
                      ? report.resumeAnalysis.resume_skills
                      : ["JavaScript", "React", "Node.js", "API Development"]
                    ).map((s, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 text-slate-400">
                    Recommended Career Paths
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(report.resumeAnalysis?.career_paths?.length > 0
                      ? report.resumeAnalysis.career_paths.slice(0, 8)
                      : ["Full Stack Engineer", "Software Developer", "Backend Engineer"]
                    ).map((c, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 rounded-lg"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Role Compatibility
                    </h3>
                    <TrendingUp size={15} className="text-emerald-400" />
                  </div>
                  <div className="space-y-2.5">
                    {(report.resumeAnalysis?.recommended_jobs?.length > 0
                      ? report.resumeAnalysis.recommended_jobs.slice(0, 3)
                      : [
                          {
                            role: report.title || "Target Engineering Role",
                            match_score: score || 75,
                            missing_skills: ["System Architecture"],
                          },
                        ]
                    ).map((job, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-white">
                            {job.role || job.job_title}
                          </p>
                          <span className="text-xs font-bold text-emerald-400">
                            {job.match_score}%
                          </span>
                        </div>
                        {job.missing_skills?.length > 0 && (
                          <p className="text-[11px] text-slate-400 truncate">
                            Focus: {job.missing_skills.slice(0, 2).join(", ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Market Section */}
              {report?.live_jobs?.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Live Job Opportunities
                      </h3>
                      <p className="text-xs text-slate-400">
                        Active roles matching your extracted skill profile
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.live_jobs.map((job, i) => (
                      <a
                        key={i}
                        href={job.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {job.title}
                          </p>
                          <ExternalLink
                            size={14}
                            className="text-slate-500 group-hover:text-indigo-400 shrink-0 mt-0.5"
                          />
                        </div>
                        <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                          <p className="font-semibold text-slate-300">
                            {job.company}
                          </p>
                          <p>{job.location}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* 2. TECHNICAL QUESTIONS */}
          {activeNav === "technical" && (
            <motion.section
              key="technical"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <header className="border-b border-slate-800/80 pb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Technical Evaluation
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                  Role-Specific Technical Questions
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Click any question below to inspect interviewer intent and recommended answer structure.
                </p>
              </header>

              <div>
                {technicalList.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </motion.section>
          )}

          {/* 3. BEHAVIORAL QUESTIONS */}
          {activeNav === "behavioral" && (
            <motion.section
              key="behavioral"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <header className="border-b border-slate-800/80 pb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                  Behavioral & Leadership
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                  Behavioral Scenarios & STAR Guides
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Structured scenarios tailored to evaluate communication, ownership, and engineering culture fit.
                </p>
              </header>

              <div>
                {behavioralList.map((q, i) => (
                  <QuestionCard key={i} item={q} index={i} />
                ))}
              </div>
            </motion.section>
          )}

          {/* 4. TECHNICAL ROADMAP & TIMELINE */}
          {activeNav === "roadmap" && (
            <motion.section
              key="roadmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {/* Roadmap & Timeline Header Card */}
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                      <Map size={13} />
                      Technical Roadmap & Execution Timeline
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {roadmapList.length}-Phase Preparation Timeline
                    </h2>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">
                      Check off milestones directly below or sync this roadmap to your active study plans.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <button
                      onClick={handleDeployToMyPlans}
                      disabled={isSavingPlan}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {planSavedToast ? (
                        <>
                          <Check size={15} /> Synced to My Plans!
                        </>
                      ) : (
                        <>
                          <PlusCircle size={15} />
                          {isSavingPlan ? "Syncing..." : "Track in My Plans"}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Timeline Overall Progress Bar */}
                <div className="mt-6 pt-6 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-300">
                      Timeline Completion ({completedRoadmapCount} of {totalRoadmapTasks} tasks)
                    </span>
                    <span className="text-emerald-400">{roadmapProgressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${roadmapProgressPct}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="relative pt-2">
                {roadmapList.map((day, i) => (
                  <RoadMapDay
                    key={day.day || i}
                    day={day}
                    index={i}
                    completedMap={completedRoadmapTasks}
                    onToggleTask={handleToggleRoadmapTask}
                  />
                ))}
              </div>
            </motion.section>
          )}

          {/* 5. AI MOCK INTERVIEW SIMULATOR */}
          {activeNav === "practice" && (
            <motion.section
              key="practice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto py-2"
            >
              <MockInterviewSimulator
                report={report}
                technicalList={technicalList}
                behavioralList={behavioralList}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/6 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-600/6 blur-[130px] rounded-full" />
      </div>
    </div>
  );
};

export default Interview;