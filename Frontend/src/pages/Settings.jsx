"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Sidebar from "../layouts/sidebar.jsx";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Zap,
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  Trash2,
  ExternalLink,
  UserCheck,
  Server,
  Save,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../features/auth/hooks/useAuth.js";
import {
  saveGrokApiKey,
  removeGrokApiKey,
  getSettingsStatus,
} from "../services/settingsApi.js";

const DEFAULT_PREFS = {
  defaultScanMode: "full",
  roadmapDuration: "5",
  questionDifficulty: "senior",
  autoSyncRoadmap: false,
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState(null);

  const [statusData, setStatusData] = useState({
    hasCustomKey: false,
    systemAiActive: true,
    ocrEngine: "Tesseract.js + PDF.js",
    mlServiceUrl: "http://localhost:8000",
  });
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);

  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nexus_user_settings");
      if (saved) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Failed to read preferences:", e);
    }
    handleCheckStatus();
  }, []);

  const handleCheckStatus = async () => {
    setCheckingHealth(true);
    const start = performance.now();
    try {
      const data = await getSettingsStatus();
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      if (data?.success) {
        setStatusData(data);
      }
    } catch (err) {
      console.error("Status check error:", err);
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setKeyFeedback({
        type: "error",
        text: "Please enter a valid API key before saving.",
      });
      return;
    }

    setSavingKey(true);
    setKeyFeedback(null);
    try {
      const res = await saveGrokApiKey(apiKey.trim());
      await refreshUser();
      setStatusData((prev) => ({ ...prev, hasCustomKey: true }));
      setApiKey("");
      setKeyFeedback({
        type: "success",
        text: res.message || "API key encrypted and saved successfully.",
      });
    } catch (err) {
      setKeyFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to save API key.",
      });
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    setSavingKey(true);
    setKeyFeedback(null);
    try {
      const res = await removeGrokApiKey();
      await refreshUser();
      setStatusData((prev) => ({ ...prev, hasCustomKey: false }));
      setKeyFeedback({
        type: "success",
        text: res.message || "Custom key removed. Using system AI engine.",
      });
    } catch (err) {
      setKeyFeedback({
        type: "error",
        text: err.response?.data?.message || "Failed to remove API key.",
      });
    } finally {
      setSavingKey(false);
    }
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem("nexus_user_settings", JSON.stringify(prefs));
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save preferences:", e);
    }
  };

  const hasCustomKey = statusData.hasCustomKey || !!user?.grokApiKey;

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Subtle Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[5%] w-[520px] h-[520px] bg-indigo-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[15%] w-[480px] h-[480px] bg-sky-600/6 rounded-full blur-[130px]" />
      </div>

      <Sidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-12 lg:p-16 pb-24 md:pb-16 relative z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-8"
        >
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                <Sliders size={13} />
                System Configuration
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                Workspace Settings
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage AI engine credentials, roadmap defaults, and service diagnostics.
              </p>
            </div>

            <button
              onClick={handleCheckStatus}
              disabled={checkingHealth}
              className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs font-semibold text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={checkingHealth ? "animate-spin text-indigo-400" : "text-indigo-400"}
              />
              {checkingHealth ? "Checking Services..." : "Verify System Status"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: API KEY & PREFERENCES */}
            <div className="lg:col-span-7 space-y-8">
              {/* AI API KEY CONFIGURATION CARD */}
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-xl">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                      <Key size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        AI Provider & API Key
                      </h2>
                      <p className="text-xs text-slate-400">
                        Configure a personal Groq API key or use the built-in Gemini AI engine.
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${
                      hasCustomKey
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                        : "bg-indigo-500/10 border-indigo-500/25 text-indigo-300"
                    }`}
                  >
                    {hasCustomKey ? "Custom Key Active" : "System Engine Active"}
                  </span>
                </div>

                <form onSubmit={handleSaveApiKey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Personal Groq / LLM API Key (Optional Override)
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        placeholder={
                          hasCustomKey
                            ? "•••••••••••••••••••••••••••••••• (Saved - enter new key to replace)"
                            : "gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        }
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 rounded-xl py-3 pl-4 pr-11 text-sm text-white outline-none transition-colors placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                      <span>Keys are encrypted with AES-256 before storage.</span>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
                      >
                        Get Groq Key <ExternalLink size={11} />
                      </a>
                    </p>
                  </div>

                  {keyFeedback && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${
                        keyFeedback.type === "success"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                      }`}
                    >
                      {keyFeedback.type === "success" ? (
                        <CheckCircle2 size={16} className="shrink-0" />
                      ) : (
                        <AlertCircle size={16} className="shrink-0" />
                      )}
                      <span>{keyFeedback.text}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingKey}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Save size={15} />
                      {savingKey ? "Saving..." : "Save API Key"}
                    </button>

                    {hasCustomKey && (
                      <button
                        type="button"
                        onClick={handleRemoveApiKey}
                        disabled={savingKey}
                        className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Remove Custom Key
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* ANALYSIS & ROADMAP PREFERENCES CARD */}
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
                    <Sliders size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Roadmap & Evaluation Defaults
                    </h2>
                    <p className="text-xs text-slate-400">
                      Customize how technical roadmaps, timelines, and mock interviews behave.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Default Analysis Mode
                      </label>
                      <select
                        value={prefs.defaultScanMode}
                        onChange={(e) =>
                          setPrefs({ ...prefs, defaultScanMode: e.target.value })
                        }
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="full">Full AI Strategy & Roadmap</option>
                        <option value="analysis">Quick ATS Compatibility Scan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-2">
                        Target Technical Depth
                      </label>
                      <select
                        value={prefs.questionDifficulty}
                        onChange={(e) =>
                          setPrefs({
                            ...prefs,
                            questionDifficulty: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="foundational">Foundational / Entry Level</option>
                        <option value="mid">Mid-Level / Practical Engineering</option>
                        <option value="senior">Senior / System Architecture</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        Auto-Sync Roadmaps to My Plans
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Automatically prepare timeline phases for one-click tracking in My Plans.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPrefs((p) => ({
                          ...p,
                          autoSyncRoadmap: !p.autoSyncRoadmap,
                        }))
                      }
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                        prefs.autoSyncRoadmap ? "bg-indigo-600" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          prefs.autoSyncRoadmap ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-white text-slate-900 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Save size={14} />
                      Save Preferences
                    </button>

                    {prefsSaved && (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={15} /> Preferences saved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PIPELINE DIAGNOSTICS & ACCOUNT */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                      <Cpu size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Pipeline Diagnostics
                      </h3>
                      <p className="text-xs text-slate-400">
                        Active runtime services
                      </p>
                    </div>
                  </div>
                  {latencyMs !== null && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      {latencyMs} ms
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          AI Strategy & Roadmap Engine
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Gemini Flash + Smart Fallback
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400">
                      Operational
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          Document OCR & Parser
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {statusData.ocrEngine}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400">
                      Operational
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          Scikit-Learn ATS Scorer
                        </p>
                        <p className="text-[11px] text-slate-500">
                          TF-IDF + Skill Gap Vectorizer
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-400">
                      Connected
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Account Email</span>
                    <span className="text-slate-200 font-medium">
                      {user?.email || "Authenticated User"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Role Permission</span>
                    <span className="text-slate-200 font-medium capitalize">
                      {user?.role || "Standard"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Encryption</span>
                    <span className="text-emerald-400 font-medium">
                      AES-256-CBC Active
                    </span>
                  </div>
                </div>
              </div>

              {/* QUICK NAVIGATION */}
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Quick Actions
                </h3>
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <UserCheck size={16} className="text-indigo-400" />
                    Update Professional Profile
                  </span>
                  <ExternalLink size={13} className="text-slate-500" />
                </button>
                <button
                  onClick={() => navigate("/plans")}
                  className="w-full p-3.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <Zap size={16} className="text-sky-400" />
                    View Active Study Roadmaps
                  </span>
                  <ExternalLink size={13} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
