"use client";

import React, { useEffect, useState, useMemo } from "react";
import { usePlan } from "../features/plan/hooks/usePlan";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  Target,
  Zap,
  ChevronRight,
  LayoutGrid,
  Loader2,
  Map,
  ListChecks,
  Flame,
  Trophy,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, isSameDay, startOfToday } from "date-fns";
import Sidebar from "../layouts/sidebar";

const CURRENT_YEAR = new Date().getFullYear();

function buildStarterDays(roadmapTitle) {
  const topic = roadmapTitle.trim() || "Technical Engineering";
  return [
    {
      day: 1,
      tasks: [
        {
          text: `[Foundations] Review core concepts, architecture, and best practices for ${topic}`,
          completed: false,
        },
        {
          text: `[Audit] Identify key knowledge gaps and set up local practice environment`,
          completed: false,
        },
      ],
    },
    {
      day: 2,
      tasks: [
        {
          text: `[Implementation] Build or refactor a core module demonstrating ${topic} patterns`,
          completed: false,
        },
        {
          text: `[Problem Solving] Practice 3 medium technical questions related to ${topic}`,
          completed: false,
        },
      ],
    },
    {
      day: 3,
      tasks: [
        {
          text: `[System Design] Map out scalability, caching, and data flow architecture`,
          completed: false,
        },
        {
          text: `[Optimization] Review debugging workflows, error handling, and performance tuning`,
          completed: false,
        },
      ],
    },
    {
      day: 4,
      tasks: [
        {
          text: `[Testing & Quality] Write unit/integration tests and verify edge cases`,
          completed: false,
        },
        {
          text: `[Resume Alignment] Refine project bullet points with quantifiable impact metrics`,
          completed: false,
        },
      ],
    },
    {
      day: 5,
      tasks: [
        {
          text: `[Mock Interview] Complete a timed technical & behavioral simulation session`,
          completed: false,
        },
        {
          text: `[Final Review] Consolidate notes and review high-priority interview questions`,
          completed: false,
        },
      ],
    },
  ];
}

export default function MyPlans() {
  const {
    plans,
    plan,
    loading,
    fetchPlans,
    fetchPlanById,
    createNewPlan,
    toggleTask,
    addTask,
    deleteTask,
  } = usePlan();

  const [title, setTitle] = useState("");
  const [selectedDay, setSelectedDay] = useState(0);
  const [viewMode, setViewMode] = useState("timeline"); // "timeline" | "phase"
  const [taskText, setTaskText] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeYear, setActiveYear] = useState(CURRENT_YEAR);
  const location = useLocation();

  useEffect(() => {
    fetchPlans();
  }, [location.key]);

  useEffect(() => {
    setSelectedDay(0);
  }, [plan?._id]);

  /* --- HEATMAP LOGIC --- */
  const heatmapWeeks = useMemo(() => {
    const allCompletedTasks =
      plans?.flatMap(
        (p) =>
          p.days?.flatMap(
            (d) =>
              d.tasks
                ?.filter((t) => t.completed && t.completedAt)
                .map((t) => ({
                  ...t,
                  date: new Date(t.completedAt),
                })) || []
          ) || []
      ) || [];

    const startOfYearDate = new Date(activeYear, 0, 1);
    const endOfYearDate = new Date(activeYear, 11, 31);
    const dayRegistry = [];
    let iterDate = new Date(startOfYearDate);
    while (iterDate.getDay() !== 0) iterDate = subDays(iterDate, 1);

    while (iterDate <= endOfYearDate || dayRegistry.length % 7 !== 0) {
      const count = allCompletedTasks.filter((task) =>
        isSameDay(task.date, iterDate)
      ).length;
      let level = 0;
      if (count > 0 && count <= 2) level = 1;
      else if (count > 2 && count <= 4) level = 2;
      else if (count > 4 && count <= 6) level = 3;
      else if (count > 6) level = 4;
      dayRegistry.push({ date: new Date(iterDate), level, count });
      iterDate.setDate(iterDate.getDate() + 1);
      if (dayRegistry.length > 371) break;
    }

    const columns = [];
    for (let i = 0; i < dayRegistry.length; i += 7) {
      columns.push(dayRegistry.slice(i, i + 7));
    }
    return columns;
  }, [plans, activeYear]);

  /* --- STREAK LOGIC --- */
  const { currentStreak, bestStreak } = useMemo(() => {
    const completedDates =
      plans?.flatMap(
        (p) =>
          p.days?.flatMap(
            (d) =>
              d.tasks
                ?.filter((t) => t.completed && t.completedAt)
                .map((t) => new Date(t.completedAt)) || []
          ) || []
      ) || [];
    if (completedDates.length === 0) return { currentStreak: 0, bestStreak: 0 };
    const uniqueDays = [
      ...new Set(
        completedDates.map((d) =>
          new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        )
      ),
    ].sort((a, b) => a - b);
    let best = 1,
      current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      if ((uniqueDays[i] - uniqueDays[i - 1]) / 86400000 === 1) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 1;
      }
    }
    let streak = 0,
      today = startOfToday();
    while (uniqueDays.includes(today.getTime())) {
      streak++;
      today = subDays(today, 1);
    }
    return { currentStreak: streak, bestStreak: best };
  }, [plans]);

  const monthLabels = useMemo(() => {
    const labels = [];
    heatmapWeeks.forEach((week, index) => {
      if (week[0].date.getDate() <= 7)
        labels.push({ name: format(week[0].date, "MMM"), index });
    });
    return labels;
  }, [heatmapWeeks]);

  const overallPlanProgress = useMemo(() => {
    const allTasks = plan?.days?.flatMap((d) => d.tasks || []) || [];
    if (allTasks.length === 0) return 0;
    return Math.round(
      (allTasks.filter((t) => t.completed).length / allTasks.length) * 100
    );
  }, [plan]);

  const phaseProgress = useMemo(() => {
    const tasks = plan?.days?.[selectedDay]?.tasks || [];
    if (tasks.length === 0) return 0;
    return Math.round(
      (tasks.filter((t) => t.completed).length / tasks.length) * 100
    );
  }, [plan, selectedDay]);

  const handleCreatePlan = async () => {
    if (!title.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await createNewPlan({
        title: title.trim(),
        days: buildStarterDays(title),
      });
      setTitle("");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddTask = () => {
    if (!taskText.trim() || !plan?._id) return;
    addTask(plan._id, selectedDay, taskText.trim());
    setTaskText("");
  };

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100 selection:bg-indigo-500/30 font-sans">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-12 lg:p-16 pb-24 md:pb-16 relative overflow-x-hidden">
        {/* Subtle Background Glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[10%] w-[520px] h-[520px] bg-indigo-600/8 blur-[140px] rounded-full" />
          <div className="absolute bottom-[5%] left-[10%] w-[450px] h-[450px] bg-sky-600/6 blur-[130px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-10">
          {/* HEADER SECTION */}
          <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-slate-800/80 pb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                <Map size={13} />
                Technical Roadmap & Timeline Tracker
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Study Plans & Execution Timeline
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Create structured technical roadmaps, track daily milestones, and monitor consistency.
              </p>
            </div>

            <div className="flex items-center bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl backdrop-blur-xl shadow-lg w-full lg:w-auto">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePlan()}
                placeholder="New roadmap title (e.g. Full Stack Prep)..."
                className="bg-transparent border-none px-4 py-2 outline-none w-full lg:w-72 text-xs md:text-sm text-white placeholder:text-slate-500"
              />
              <button
                onClick={handleCreatePlan}
                disabled={isCreating || !title.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-semibold text-xs transition-all disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isCreating ? (
                  <Loader2 className="animate-spin" size={15} />
                ) : (
                  <Plus size={15} />
                )}
                Create Roadmap
              </button>
            </div>
          </header>

          {/* ACTIVITY HEATMAP SECTION */}
          <section className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
                  <Flame size={14} className="text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{currentStreak}</span>
                  <span className="text-slate-400">Day Streak</span>
                </div>
                <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
                  <Trophy size={14} className="text-indigo-400" />
                  <span className="text-indigo-400 font-bold">{bestStreak}</span>
                  <span className="text-slate-400">Best Streak</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(
                    (yr) => (
                      <button
                        key={yr}
                        onClick={() => setActiveYear(yr)}
                        className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          activeYear === yr
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {yr}
                      </button>
                    )
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span>Less</span>
                  {[0, 1, 2, 3, 4].map((l) => (
                    <div
                      key={l}
                      className={`w-3 h-3 rounded-[3px] ${
                        l === 0
                          ? "bg-slate-800/80"
                          : l === 1
                            ? "bg-indigo-900/70"
                            : l === 2
                              ? "bg-indigo-700/80"
                              : l === 3
                                ? "bg-indigo-500"
                                : "bg-emerald-400"
                      }`}
                    />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar relative">
              <div className="relative flex flex-col gap-2 w-max">
                <div className="flex h-4 mb-1 relative">
                  {monthLabels.map((mon, i) => (
                    <div
                      key={i}
                      className="text-[10px] text-slate-500 font-semibold uppercase absolute"
                      style={{ left: `${mon.index * 18}px` }}
                    >
                      {mon.name}
                    </div>
                  ))}
                </div>
                <div className="flex gap-[4px]">
                  {heatmapWeeks.map((week, w) => (
                    <div key={w} className="flex flex-col gap-[4px]">
                      {week.map((day, d) => (
                        <div
                          key={d}
                          title={`${day.count} tasks completed on ${format(
                            day.date,
                            "MMM do, yyyy"
                          )}`}
                          className={`w-3.5 h-3.5 rounded-[3px] transition-colors ${
                            day.date.getFullYear() !== activeYear
                              ? "opacity-0"
                              : ""
                          } ${
                            day.level === 0
                              ? "bg-slate-800/70"
                              : day.level === 1
                                ? "bg-indigo-900/70"
                                : day.level === 2
                                  ? "bg-indigo-700/80"
                                  : day.level === 3
                                    ? "bg-indigo-500"
                                    : "bg-emerald-400"
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* MAIN ROADMAP & TIMELINE GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT SIDEBAR: ROADMAP LIST */}
            <aside className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <LayoutGrid size={14} className="text-indigo-400" />
                  Saved Roadmaps ({plans?.length || 0})
                </span>
              </div>

              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1 custom-scrollbar">
                {plans?.length > 0 ? (
                  plans.map((p) => {
                    const pTasks = p.days?.flatMap((d) => d.tasks || []) || [];
                    const pDone = pTasks.filter((t) => t.completed).length;
                    const pPct =
                      pTasks.length > 0
                        ? Math.round((pDone / pTasks.length) * 100)
                        : 0;
                    const isSelected = plan?._id === p._id;

                    return (
                      <div
                        key={p._id}
                        onClick={() => fetchPlanById(p._id)}
                        className={`p-5 rounded-2xl cursor-pointer border transition-all ${
                          isSelected
                            ? "bg-indigo-600/15 border-indigo-500/50 shadow-lg"
                            : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm md:text-base text-white truncate">
                              {p.title}
                            </h3>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-1">
                              <Target size={13} className="text-indigo-400" />
                              {p.days?.length || 5} Phases • {pPct}% Complete
                            </span>
                          </div>
                          <ChevronRight
                            size={18}
                            className={
                              isSelected ? "text-indigo-400 shrink-0" : "text-slate-600 shrink-0"
                            }
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-300">
                      No Roadmaps Created Yet
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Enter a title above and click &ldquo;Create Roadmap&rdquo; or sync one from an interview report.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* RIGHT PANEL: ACTIVE ROADMAP TIMELINE & CHECKLIST */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {plan ? (
                  <motion.div
                    key={plan._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-8"
                  >
                    {/* Plan Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                          Active Technical Roadmap
                        </span>
                        <h2 className="text-2xl font-bold text-white mt-0.5">
                          {plan.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start sm:self-center">
                        <button
                          onClick={() => setViewMode("timeline")}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            viewMode === "timeline"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <Map size={13} /> Timeline View
                        </button>
                        <button
                          onClick={() => setViewMode("phase")}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            viewMode === "phase"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <ListChecks size={13} /> Phase Focus
                        </button>
                      </div>
                    </div>

                    {/* Overall Progress */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold mb-2">
                        <span className="text-slate-300">
                          Overall Roadmap Completion
                        </span>
                        <span className="text-emerald-400">
                          {overallPlanProgress}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${overallPlanProgress}%` }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                        />
                      </div>
                    </div>

                    {viewMode === "timeline" ? (
                      /* FULL VERTICAL TIMELINE VIEW */
                      <div className="space-y-6 pt-2">
                        {plan.days?.map((d, dayIdx) => {
                          const dayTasks = d.tasks || [];
                          const dayDone = dayTasks.filter((t) => t.completed).length;
                          return (
                            <div
                              key={dayIdx}
                              className="relative pl-11 md:pl-14 pb-6 last:pb-0 group"
                            >
                              <div className="absolute left-[17px] md:left-[21px] top-9 bottom-0 w-[2px] bg-slate-800 group-last:hidden" />
                              <div
                                onClick={() => {
                                  setSelectedDay(dayIdx);
                                  setViewMode("phase");
                                }}
                                className={`absolute left-0 top-0 w-9 h-9 md:w-11 md:h-11 rounded-xl border flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                                  dayTasks.length > 0 && dayDone === dayTasks.length
                                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                                    : "bg-slate-950 border-slate-700 text-indigo-400 hover:border-indigo-500"
                                }`}
                              >
                                D{d.day}
                              </div>

                              <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 md:p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-bold text-white">
                                    Phase {d.day} Execution
                                  </h4>
                                  <span className="text-[11px] font-semibold text-slate-400">
                                    {dayDone}/{dayTasks.length} completed
                                  </span>
                                </div>

                                {dayTasks.length > 0 ? (
                                  <div className="space-y-2">
                                    {dayTasks.map((task, tIdx) => (
                                      <div
                                        key={tIdx}
                                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-all group/item"
                                      >
                                        <div
                                          onClick={() =>
                                            toggleTask(plan._id, dayIdx, tIdx)
                                          }
                                          className="flex items-start gap-3 cursor-pointer flex-1"
                                        >
                                          {task.completed ? (
                                            <CheckCircle2
                                              size={17}
                                              className="text-emerald-400 shrink-0 mt-0.5"
                                            />
                                          ) : (
                                            <Circle
                                              size={17}
                                              className="text-slate-500 shrink-0 mt-0.5"
                                            />
                                          )}
                                          <span
                                            className={`text-xs md:text-sm ${
                                              task.completed
                                                ? "line-through text-slate-500"
                                                : "text-slate-200"
                                            }`}
                                          >
                                            {task.text}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() =>
                                            deleteTask(plan._id, dayIdx, tIdx)
                                          }
                                          className="text-slate-600 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 italic">
                                    No tasks in Phase {d.day} yet.
                                  </p>
                                )}

                                <button
                                  onClick={() => {
                                    setSelectedDay(dayIdx);
                                    setViewMode("phase");
                                  }}
                                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                                >
                                  + Add or manage tasks in Phase {d.day}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* SINGLE PHASE FOCUS VIEW */
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                          {plan.days?.map((d, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedDay(i)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                selectedDay === i
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              Phase {d.day} ({phaseProgress}%)
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2.5">
                          {plan.days?.[selectedDay]?.tasks?.length > 0 ? (
                            plan.days[selectedDay].tasks.map((task, index) => (
                              <div
                                key={index}
                                className="group flex items-center justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 transition-all"
                              >
                                <div
                                  onClick={() =>
                                    toggleTask(plan._id, selectedDay, index)
                                  }
                                  className="flex items-center gap-3.5 cursor-pointer flex-1"
                                >
                                  {task.completed ? (
                                    <CheckCircle2
                                      size={20}
                                      className="text-emerald-400 shrink-0"
                                    />
                                  ) : (
                                    <Circle
                                      size={20}
                                      className="text-slate-500 shrink-0"
                                    />
                                  )}
                                  <span
                                    className={`text-xs md:text-sm font-medium ${
                                      task.completed
                                        ? "line-through text-slate-500"
                                        : "text-slate-200"
                                    }`}
                                  >
                                    {task.text}
                                  </span>
                                </div>
                                <Trash2
                                  size={16}
                                  onClick={() =>
                                    deleteTask(plan._id, selectedDay, index)
                                  }
                                  className="text-slate-600 hover:text-rose-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                              No tasks added to Phase {selectedDay + 1} yet. Add one below.
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 p-1.5 bg-slate-950/80 rounded-xl border border-slate-800 focus-within:border-indigo-500/50 transition-all">
                          <input
                            value={taskText}
                            onChange={(e) => setTaskText(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleAddTask()
                            }
                            placeholder={`Add a new milestone to Phase ${selectedDay + 1}...`}
                            className="flex-1 bg-transparent px-3.5 py-2.5 outline-none text-xs md:text-sm text-white placeholder:text-slate-500"
                          />
                          <button
                            onClick={handleAddTask}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-lg font-semibold text-xs transition-all cursor-pointer"
                          >
                            Add Task
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 px-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                      <Map size={26} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {loading ? "Loading Roadmaps..." : "Initialize Your First Roadmap"}
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm max-w-md mb-6">
                      Type a target role or study goal in the top bar (for example, &ldquo;Full Stack Engineer Prep&rdquo;) and click Create Roadmap to generate a 5-phase timeline.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
