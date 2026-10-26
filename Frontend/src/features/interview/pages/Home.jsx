"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate, useLocation } from "react-router";
import {
  Briefcase,
  User,
  Upload,
  Sparkles,
  FileText,
  Cpu,
  ShieldCheck,
  History,
  ChevronRight,
  Activity,
  ArrowLeft,
} from "lucide-react";

const Home = () => {
  const { loading, generateReport, reports } = useInterview();
  const navigate = useNavigate();
  const location = useLocation();

  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const resumeInputRef = useRef();

  useEffect(() => {
    if (location.state?.triggerUpload && resumeInputRef.current) {
      resumeInputRef.current.click();
    }
  }, [location.state]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setFileName(file.name);
  };

  const handleRunAnalysis = async (mode = "full") => {
    const resumeFile = resumeInputRef.current?.files?.[0];
    if (!resumeFile && !selfDescription.trim()) {
      alert("Please upload a resume file or enter your professional summary.");
      return;
    }
    try {
      const data = await generateReport({
        jobDescription,
        selfDescription,
        resumeFile,
        mode,
      });
      if (data?._id) {
        navigate(`/interview/${data._id}`);
      } else {
        alert("Failed to generate report. Please verify your backend server connection.");
      }
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "An error occurred during analysis. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="relative">
          <div className="relative w-24 h-24 border border-indigo-500/30 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-t-indigo-500 border-r-sky-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
            <Cpu
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400"
              size={26}
            />
          </div>
        </div>
        <h2 className="text-lg font-bold text-white mt-8 tracking-wide">
          Analyzing Resume & Building Technical Roadmap...
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Extracting skills, computing ATS match score, and preparing 5-day timeline
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 selection:bg-indigo-500/30 font-sans pb-24">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-indigo-600/8 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-600/6 blur-[140px] rounded-full" />
      </div>

      <header className="max-w-6xl mx-auto pt-10 md:pt-16 pb-10 px-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group cursor-pointer"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-xs font-semibold">Back to Dashboard</span>
        </button>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
          <Activity size={13} className="text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-400">
            AI Resume Strategy Studio
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-3">
          Resume & Technical Roadmap Generator
        </h1>
        <p className="text-slate-400 max-w-2xl text-sm">
          Upload your resume and target job description. Our engine computes ATS compatibility, identifies skill gaps, and creates a 5-day interview roadmap.
        </p>
      </header>

      <main className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* INPUT PANEL */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          {/* 1. Job Description Card */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <Briefcase size={19} />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                  Step 1
                </span>
                <p className="text-sm font-bold text-white">
                  Target Job Description
                </p>
              </div>
            </div>
            <textarea
              className="w-full h-44 md:h-56 bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs md:text-sm text-slate-200 focus:border-indigo-500/60 outline-none transition-all resize-none placeholder:text-slate-600"
              placeholder="Paste the job description, required skills, and responsibilities here..."
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* 2. Upload & Profile Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => resumeInputRef.current.click()}
              className={`group relative min-h-[220px] bg-slate-900/60 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                fileName
                  ? "border-emerald-500/50 bg-emerald-500/[0.04]"
                  : "border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900"
              }`}
            >
              <input
                type="file"
                ref={resumeInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
              />
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                  fileName
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-slate-800 text-indigo-400 group-hover:scale-105"
                }`}
              >
                {fileName ? <ShieldCheck size={28} /> : <Upload size={28} />}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white break-all px-3">
                  {fileName ? fileName : "Upload Resume (PDF or Image)"}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click to browse or drag and drop file
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400">
                  <User size={19} />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                    Step 2
                  </span>
                  <p className="text-sm font-bold text-white">
                    Professional Summary (Optional)
                  </p>
                </div>
              </div>
              <textarea
                className="w-full flex-1 min-h-[120px] bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs md:text-sm text-slate-200 outline-none focus:border-indigo-500/60 resize-none transition-all placeholder:text-slate-600"
                placeholder="Describe your background, key achievements, or career goals..."
                onChange={(e) => setSelfDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-900/60 border border-slate-800/90 rounded-2xl gap-4 shadow-xl">
            <div>
              <h4 className="text-white font-bold text-sm">
                Ready to Generate Analysis
              </h4>
              <p className="text-xs text-slate-400">
                Includes ATS match score, technical Q&A, and 5-day roadmap
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleRunAnalysis("analysis")}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-semibold text-xs text-slate-200 transition-all cursor-pointer"
              >
                Quick ATS Scan
              </button>

              <button
                onClick={() => handleRunAnalysis("full")}
                className="px-6 py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
              >
                <Sparkles size={15} />
                Generate Full Strategy
              </button>
            </div>
          </div>
        </div>

        {/* RECENT REPORTS SIDEBAR */}
        <aside className="lg:col-span-4 space-y-4 order-1 lg:order-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <History size={15} className="text-indigo-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recent Reports
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <AnimatePresence>
              {reports.slice(0, 6).map((report, i) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/interview/${report._id}`)}
                  className="group p-4 bg-slate-900/60 border border-slate-800/90 rounded-xl hover:border-indigo-500/40 hover:bg-slate-900 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate max-w-[180px]">
                      {report.title || "Resume Analysis"}
                    </p>
                    <span className="text-xs font-bold text-emerald-400">
                      {report.matchScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {reports.length === 0 && (
              <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <FileText size={28} className="mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-500">
                  No previous reports yet
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            View All Reports
          </button>
        </aside>
      </main>
    </div>
  );
};

export default Home;