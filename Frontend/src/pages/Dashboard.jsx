import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FileText,
  TrendingUp,
  Zap,
  ChevronRight,
  Search,
  Map,
  ArrowLeft,
  X,
  Upload,
  ShieldCheck,
  Cpu,
  Sparkles,
} from "lucide-react";
import { useInterview } from "../features/interview/hooks/useInterview";
import { useAuth } from "../features/auth/hooks/useAuth";
import Sidebar from "../layouts/sidebar";

export default function Dashboard() {
  const navigate = useNavigate();
  const { reports, generateReport } = useInterview();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFileName(file.name);
  };

  const handleRunAnalysis = async (mode = "full") => {
    const resumeFile = fileInputRef.current?.files[0];
    if (!resumeFile && !selfDescription.trim()) {
      alert("Please upload a resume file or enter your professional summary.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await generateReport({
        jobDescription,
        selfDescription,
        resumeFile,
        mode,
      });
      if (data?._id) {
        setIsModalOpen(false);
        navigate(`/interview/${data._id}`);
      } else {
        alert("Failed to generate report. Please verify your backend is running.");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Analysis failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin");
    }
  }, [user, navigate]);

  const totalReports = reports.length;
  const avgScore =
    reports.length === 0
      ? 0
      : Math.round(
          reports.reduce((sum, r) => sum + (r.matchScore || 0), 0) /
            reports.length
        );

  const filteredReports = reports.filter((r) =>
    (r.title || "Standard Analysis")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100 selection:bg-indigo-500/30 font-sans">
      <Sidebar />

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 lg:p-16 pb-24 md:pb-16">
        {/* Subtle Background Glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[10%] w-[550px] h-[550px] bg-indigo-600/8 blur-[150px] rounded-full" />
          <div className="absolute bottom-[5%] left-[5%] w-[450px] h-[450px] bg-sky-600/6 blur-[130px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-800/80 pb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI Career Intelligence Active
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Workspace Overview
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Analyze resumes against target roles, generate technical roadmaps, and practice mock interviews.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs md:text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <Plus size={18} />
                Analyze Resume
              </button>

              <button
                onClick={() => navigate("/")}
                className="md:hidden px-4 py-3 bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={15} />
                Home
              </button>
            </div>
          </header>

          {/* --- BENTO GRID STATS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <BentoCard
              label="Career Alignment"
              value={`${avgScore}%`}
              sub="Average ATS Match Score"
              icon={<TrendingUp size={20} className="text-emerald-400" />}
              badge="ATS Metric"
            />
            <BentoCard
              label="Analyzed Resumes"
              value={totalReports}
              sub="Generated Strategy Reports"
              icon={<FileText size={20} className="text-indigo-400" />}
              badge="Active"
            />

            <div
              onClick={() => navigate("/plans")}
              className="bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-6 flex flex-col justify-between cursor-pointer transition-all shadow-xl group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 group-hover:scale-105 transition-transform">
                  <Map size={20} />
                </div>
                <span className="bg-sky-500/10 text-sky-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-sky-500/20">
                  Timeline
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-1">
                  Technical Roadmaps
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Track daily milestones, study phases, and execution timelines.
                </p>
              </div>
            </div>

            <div
              onClick={() => navigate("/app")}
              className="bg-gradient-to-br from-indigo-600 to-sky-600 rounded-2xl p-6 relative overflow-hidden group shadow-xl shadow-indigo-600/15 cursor-pointer hover:shadow-indigo-600/30 transition-all flex flex-col justify-between"
            >
              <div className="relative z-10">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-semibold uppercase tracking-wider mb-3">
                  Full Suite
                </span>
                <h3 className="text-xl font-bold text-white mb-2 leading-snug">
                  AI Strategy Studio
                </h3>
                <p className="text-indigo-100 text-xs mb-4">
                  Deep resume diagnostics, custom roadmaps, and mock interviews.
                </p>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-sm">
                  Launch Studio <ChevronRight size={14} />
                </span>
              </div>
              <Zap
                size={120}
                className="absolute right-[-18px] bottom-[-18px] text-white/10 -rotate-12 group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>

          {/* --- REPORT LIST --- */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Saved Analyses & Roadmaps
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any report to view ATS breakdown, technical questions, and 5-day preparation timeline.
                </p>
              </div>

              <div className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  size={15}
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-500/50 w-full sm:w-64 transition-all placeholder:text-slate-500"
                  placeholder="Filter reports by title..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report, i) => (
                    <ReportRow
                      key={report._id}
                      report={report}
                      index={i}
                      onClick={() => navigate(`/interview/${report._id}`)}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 flex flex-col items-center justify-center text-slate-400 text-center px-4"
                  >
                    <FileText size={32} className="mb-3 text-slate-600" />
                    <p className="font-semibold text-sm text-slate-300">
                      No analysis reports found
                    </p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Upload your resume to generate an ATS compatibility score and personalized technical roadmap.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      Analyze First Resume
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>

      {/* --- ANALYZE RESUME MODAL --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmitting) setIsModalOpen(false);
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-2xl bg-[#0e1422] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] text-left"
            >
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    New Resume Analysis & Roadmap
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Upload your resume and target job description to generate ATS scores, technical questions, and a 5-day preparation timeline.
                  </p>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg border border-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {isSubmitting ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-5">
                  <div className="relative w-16 h-16 border border-indigo-500/20 rounded-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-t-indigo-500 border-r-sky-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                    <Cpu className="absolute text-indigo-400" size={20} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-white">
                      Generating Strategy & Technical Roadmap...
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Extracting skills, computing ATS match, and building your 5-day execution plan.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative min-h-[130px] bg-slate-950/60 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      fileName
                        ? "border-emerald-500/50 bg-emerald-500/[0.04]"
                        : "border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                    />
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 ${
                        fileName
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-slate-800 text-indigo-400"
                      }`}
                    >
                      {fileName ? <ShieldCheck size={22} /> : <Upload size={22} />}
                    </div>
                    <p className="text-xs font-semibold text-white text-center">
                      {fileName ? fileName : "Upload Resume (PDF or Image)"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 text-center">
                      Click to browse or drag and drop your resume file
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Target Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description and requirements here..."
                      className="w-full h-28 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 rounded-xl p-3.5 text-xs text-slate-200 outline-none resize-none transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Professional Summary / Additional Context (Optional)
                    </label>
                    <textarea
                      value={selfDescription}
                      onChange={(e) => setSelfDescription(e.target.value)}
                      placeholder="Highlight key technologies, years of experience, or target roles..."
                      className="w-full h-20 bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 rounded-xl p-3.5 text-xs text-slate-200 outline-none resize-none transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => handleRunAnalysis("analysis")}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-semibold text-xs text-slate-200 transition-colors cursor-pointer"
                    >
                      Quick ATS Scan
                    </button>
                    <button
                      onClick={() => handleRunAnalysis("full")}
                      className="flex-1 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                    >
                      <Sparkles size={15} />
                      Generate Full Strategy & Roadmap
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BentoCard({ label, value, sub, icon, badge }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70">
          {icon}
        </div>
        <span className="bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          {badge}
        </span>
      </div>
      <div>
        <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-1">
          {value}
        </h3>
        <p className="text-slate-200 font-semibold text-xs mb-0.5">{label}</p>
        <p className="text-slate-500 text-[11px]">{sub}</p>
      </div>
    </div>
  );
}

function ReportRow({ report, index, onClick }) {
  const score = report.matchScore ?? 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="group flex flex-wrap md:flex-nowrap items-center justify-between p-4 md:p-5 bg-slate-900/60 border border-slate-800/90 rounded-2xl hover:bg-slate-900 hover:border-indigo-500/40 transition-all cursor-pointer shadow-sm"
    >
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
          <FileText size={19} />
        </div>
        <div>
          <h4 className="text-sm md:text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
            {report.title || "Resume Analysis Report"}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Report ID: {report._id.slice(-6)} •{" "}
            {new Date(report.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-3 md:mt-0 w-full md:w-auto justify-between md:justify-end">
        <div className="text-right">
          <div className="flex items-center gap-3">
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden lg:block">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
              />
            </div>
            <span className="text-lg font-bold text-emerald-400">{score}%</span>
          </div>
          <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
            ATS Match
          </p>
        </div>
        <div className="p-1.5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all">
          <ChevronRight size={18} />
        </div>
      </div>
    </motion.div>
  );
}
