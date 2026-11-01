import React from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Zap,
  LayoutDashboard,
  FileText,
  Plus,
  LogOut,
  Settings,
  User,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../features/auth/hooks/useAuth";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogout } = useAuth();

  const path = location.pathname;

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-slate-800/80 bg-[#0b101b]/95 backdrop-blur-2xl z-50 flex-col py-7 px-4">
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-3 px-3 mb-10 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <Zap size={20} className="text-white fill-white" />
          </div>

          <div>
            <span className="text-lg font-extrabold text-white tracking-tight block leading-none">
              AURALIS<span className="text-indigo-400">.AI</span>
            </span>
            <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">
              Career Suite
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 w-full">
          <SidebarItem
            icon={<LayoutDashboard size={19} />}
            label="Overview"
            active={path === "/dashboard"}
            onClick={() => navigate("/dashboard")}
          />
          <SidebarItem
            icon={<FileText size={19} />}
            label="Roadmap & Plans"
            active={path === "/plans"}
            onClick={() => navigate("/plans")}
          />
          <SidebarItem
            icon={<MessageCircle size={19} />}
            label="Community"
            active={path === "/community"}
            onClick={() => navigate("/community")}
          />
          <SidebarItem
            icon={<Plus size={19} />}
            label="Analyze Resume"
            highlight
            active={path === "/app"}
            onClick={() => navigate("/app")}
          />
          <SidebarItem
            icon={<Settings size={19} />}
            label="Settings"
            active={path === "/settings"}
            onClick={() => navigate("/settings")}
          />
        </nav>

        <div className="pt-4 border-t border-slate-800/80 space-y-1.5">
          {/* Profile */}
          <SidebarItem
            icon={<User size={19} />}
            label="Profile"
            active={path === "/profile"}
            onClick={() => navigate("/profile")}
          />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors w-full cursor-pointer"
          >
            <LogOut size={19} />
            <span className="font-semibold text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0b101b]/95 backdrop-blur-xl border-t border-slate-800/80 z-50 flex justify-around py-2.5 px-2">
        <MobileItem
          icon={<LayoutDashboard size={20} />}
          active={path === "/dashboard"}
          onClick={() => navigate("/dashboard")}
        />
        <MobileItem
          icon={<FileText size={20} />}
          active={path === "/plans"}
          onClick={() => navigate("/plans")}
        />
        <MobileItem
          icon={<Settings size={20} />}
          active={path === "/settings"}
          onClick={() => navigate("/settings")}
        />
        {/* Center Button */}
        <button
          onClick={() => navigate("/app")}
          className="bg-gradient-to-tr from-indigo-600 to-sky-500 p-3.5 rounded-full -mt-6 shadow-lg shadow-indigo-600/30 text-white"
        >
          <Plus size={22} />
        </button>
        <MobileItem
          icon={<MessageCircle size={20} />}
          active={path === "/community"}
          onClick={() => navigate("/community")}
        />
        <MobileItem
          icon={<User size={20} />}
          active={path === "/profile"}
          onClick={() => navigate("/profile")}
        />
        <MobileItem icon={<LogOut size={20} />} onClick={handleLogout} />
      </div>
    </>
  );
}

/* Desktop Item */
function SidebarItem({ icon, label, active, highlight, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer text-left ${
        active
          ? "bg-indigo-600/15 text-white border border-indigo-500/30 shadow-sm"
          : highlight
            ? "text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
      }`}
    >
      <span className={active ? "text-indigo-400" : ""}>{icon}</span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

/* Mobile Item */
function MobileItem({ icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-lg ${
        active ? "text-indigo-400 bg-indigo-500/10" : "text-slate-400"
      }`}
    >
      {icon}
    </button>
  );
}
