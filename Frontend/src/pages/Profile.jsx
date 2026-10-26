"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Target,
  Code,
  Camera,
  Save,
  X,
  User,
  Cpu,
  MessageSquare,
  Trophy,
  ChevronRight,
  Plus,
} from "lucide-react";
import Sidebar from "../layouts/sidebar";
import api from "../services/api";

const roles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Mobile Developer",
  "Other",
];

const suggestedSkills = [
  "React",
  "Node",
  "MongoDB",
  "Express",
  "Next.js",
  "Python",
  "Java",
  "C++",
  "Docker",
  "AWS",
  "TypeScript",
];

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [customSkill, setCustomSkill] = useState("");

  const [form, setForm] = useState({
    bio: "",
    targetRole: "",
    customRole: "",
    github: "",
    skills: [],
    leetcode: "",
    gfg: "",
    codeforces: "",
    codechef: "",
  });

  const completion = () => {
    let filled = 0;
    let total = 6;
    if (profile?.bio) filled++;
    if (profile?.targetRole) filled++;
    if (profile?.github) filled++;
    if (profile?.skills?.length) filled++;
    if (profile?.codingProfiles?.leetcode) filled++;
    if (profile?.profileImage) filled++;
    return Math.round((filled / total) * 100);
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/profile/me");
      const data = res.data;
      setProfile(data?.profile || null);
      setUser(data?.user || null);

      if (data?.profile) {
        const isStandardRole = roles.includes(data.profile.targetRole);
        setForm({
          bio: data.profile.bio || "",
          targetRole: isStandardRole ? data.profile.targetRole : "Other",
          customRole: isStandardRole ? "" : data.profile.targetRole,
          github: data.profile.github || "",
          skills: data.profile.skills || [],
          leetcode: data.profile.codingProfiles?.leetcode || "",
          gfg: data.profile.codingProfiles?.gfg || "",
          codeforces: data.profile.codingProfiles?.codeforces || "",
          codechef: data.profile.codingProfiles?.codechef || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const addCustomSkill = () => {
    if (!customSkill.trim()) return;
    if (!form.skills.includes(customSkill.trim())) {
      setForm({ ...form, skills: [...form.skills, customSkill.trim()] });
    }
    setCustomSkill("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profileImage", file);
    try {
      const res = await api.post("/api/profile/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const data = res.data;
      setProfile(data.profile || data);
    } catch (err) {
      console.error(err);
      alert("Failed to upload image.");
    }
  };

  const updateProfile = async () => {
    const finalRole =
      form.targetRole === "Other" ? form.customRole : form.targetRole;

    if (!finalRole) {
      alert("Please specify your target role");
      return;
    }

    try {
      const body = {
        bio: form.bio,
        targetRole: finalRole,
        github: form.github,
        skills: form.skills,
        codingProfiles: {
          leetcode: form.leetcode,
          gfg: form.gfg,
          codeforces: form.codeforces,
          codechef: form.codechef,
        },
      };
      const res = await api.put("/api/profile/update", body);
      const data = res.data;
      setProfile(data);
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update profile.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#090d16]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#090d16] text-slate-100 selection:bg-indigo-500/30 font-sans">
      <Sidebar />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[5%] w-[520px] h-[520px] bg-indigo-600/8 blur-[140px] rounded-full" />
        <div className="absolute bottom-[5%] left-[10%] w-[450px] h-[450px] bg-sky-600/6 blur-[130px] rounded-full" />
      </div>

      <main className="flex-1 md:ml-64 p-6 md:p-12 lg:p-16 pb-24 md:pb-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* --- HEADER --- */}
          <header className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-10 pb-8 border-b border-slate-800/80">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
              <div className="relative group">
                <label
                  htmlFor="imageUpload"
                  className="relative block cursor-pointer"
                >
                  <img
                    src={
                      profile?.profileImage ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt="Profile"
                    className="w-28 h-28 md:w-32 md:h-32 rounded-2xl border border-slate-700 object-cover bg-slate-900"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    <Camera className="text-white" size={22} />
                  </div>
                </label>
                <input
                  type="file"
                  id="imageUpload"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">
                  {user?.username}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="flex items-center gap-2 text-slate-300 text-xs font-medium bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
                    <Mail size={13} className="text-indigo-400" /> {user?.email}
                  </span>
                  <span className="flex items-center gap-2 text-slate-300 text-xs font-medium bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
                    <Target size={13} className="text-emerald-400" />{" "}
                    {profile?.targetRole || "Candidate"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                editing
                  ? "bg-slate-800 text-slate-200 border border-slate-700"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
              }`}
            >
              {editing ? (
                <>
                  <X size={15} /> Cancel
                </>
              ) : (
                <>
                  <User size={15} /> Edit Profile
                </>
              )}
            </button>
          </header>

          {/* --- COMPLETION BAR --- */}
          <section className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 mb-8 backdrop-blur-xl">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Profile Completeness
                </p>
                <h3 className="text-lg font-bold text-white">
                  {completion()}% Complete
                </h3>
              </div>
              <Cpu size={20} className="text-indigo-400" />
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completion()}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400"
              />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Professional Bio
                      </label>
                      <textarea
                        placeholder="Summarize your engineering experience and career goals..."
                        className="w-full bg-slate-950/80 border border-slate-800 p-4 rounded-xl focus:border-indigo-500/60 outline-none text-xs md:text-sm min-h-[110px]"
                        value={form.bio}
                        onChange={(e) =>
                          setForm({ ...form, bio: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300">
                          Target Role
                        </label>
                        <select
                          value={form.targetRole}
                          onChange={(e) =>
                            setForm({ ...form, targetRole: e.target.value })
                          }
                          className="w-full bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl focus:border-indigo-500/60 outline-none text-xs md:text-sm"
                        >
                          <option value="">Select Role</option>
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      {form.targetRole === "Other" && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-300">
                            Custom Role
                          </label>
                          <input
                            placeholder="Enter Custom Role"
                            className="w-full bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl outline-none text-xs md:text-sm"
                            value={form.customRole}
                            onChange={(e) =>
                              setForm({ ...form, customRole: e.target.value })
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-semibold text-slate-300 block">
                        Core Skills
                      </label>
                      <div className="flex flex-wrap gap-2 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                        {suggestedSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              form.skills.includes(skill)
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          placeholder="Add custom skill..."
                          className="flex-1 bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-xs md:text-sm outline-none focus:border-indigo-500/60"
                          value={customSkill}
                          onChange={(e) => setCustomSkill(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && addCustomSkill()
                          }
                        />
                        <button
                          type="button"
                          onClick={addCustomSkill}
                          className="px-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-indigo-600 transition-all cursor-pointer"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {form.skills.map((skill) => (
                          <span
                            key={skill}
                            className="flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-lg text-xs font-semibold text-indigo-300"
                          >
                            {skill}
                            <X
                              size={13}
                              className="cursor-pointer hover:text-white"
                              onClick={() => toggleSkill(skill)}
                            />
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        placeholder="GitHub URL"
                        className="w-full bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs md:text-sm"
                        value={form.github}
                        onChange={(e) =>
                          setForm({ ...form, github: e.target.value })
                        }
                      />
                      <input
                        placeholder="LeetCode URL"
                        className="w-full bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs md:text-sm"
                        value={form.leetcode}
                        onChange={(e) =>
                          setForm({ ...form, leetcode: e.target.value })
                        }
                      />
                      <input
                        placeholder="GeeksforGeeks URL"
                        className="w-full bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs md:text-sm"
                        value={form.gfg}
                        onChange={(e) =>
                          setForm({ ...form, gfg: e.target.value })
                        }
                      />
                      <input
                        placeholder="Codeforces URL"
                        className="w-full bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs md:text-sm"
                        value={form.codeforces}
                        onChange={(e) =>
                          setForm({ ...form, codeforces: e.target.value })
                        }
                      />
                    </div>

                    <button
                      onClick={updateProfile}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save size={16} /> Save Profile Changes
                    </button>
                  </motion.div>
                ) : (
                  <motion.div className="space-y-6">
                    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        <MessageSquare size={15} /> Professional Summary
                      </div>
                      <p className="text-sm md:text-base leading-relaxed text-slate-200">
                        {profile?.bio || "No professional bio added yet. Click Edit Profile to add your summary."}
                      </p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 md:p-8">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
                        <Code size={15} className="text-indigo-400" /> Technical Skills
                      </h3>
                      {profile?.skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                          {profile.skills.map((s, i) => (
                            <span
                              key={i}
                              className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          No skills listed yet.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2.5 mb-5">
                  <Trophy size={18} className="text-indigo-400" />
                  <h3 className="text-base font-bold text-white">
                    Coding Profiles
                  </h3>
                </div>
                <div className="space-y-2.5">
                  <ProfileLink label="GitHub" url={profile?.github} />
                  <ProfileLink
                    label="LeetCode"
                    url={profile?.codingProfiles?.leetcode}
                  />
                  <ProfileLink
                    label="GeeksforGeeks"
                    url={profile?.codingProfiles?.gfg}
                  />
                  <ProfileLink
                    label="Codeforces"
                    url={profile?.codingProfiles?.codeforces}
                  />
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-1">
                    Account Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span className="text-sm font-bold text-white">
                      Verified Member
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <p className="text-xs font-medium text-slate-400 mb-1">
                    Target Track
                  </p>
                  <span className="text-sm font-bold text-indigo-400">
                    {profile?.targetRole || "Software Engineering"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ProfileLink = ({ label, url }) => {
  const isLinked = url && url.trim() !== "";

  return (
    <div
      className={`flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 transition-all group ${
        isLinked
          ? "hover:border-indigo-500/40 cursor-pointer"
          : "opacity-50 cursor-not-allowed"
      }`}
      onClick={() => isLinked && window.open(url, "_blank")}
    >
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-slate-400">{label}</span>
        <span
          className={`text-xs font-semibold ${
            isLinked ? "text-slate-200" : "text-slate-500"
          }`}
        >
          {isLinked ? "View Profile" : "Not linked"}
        </span>
      </div>
      {isLinked ? (
        <ChevronRight
          size={14}
          className="text-slate-400 group-hover:translate-x-0.5 transition-all"
        />
      ) : (
        <X size={14} className="text-slate-600" />
      )}
    </div>
  );
};

export default Profile;