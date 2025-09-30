"use client";
import { Calendar, Users } from "lucide-react";
import { useState } from "react";
import AttendanceScreen from "./components/AttendanceScreen";
import RegistrationScreen from "./components/RegistrationScreen";
import ScheduleByDateScreen from "./components/ScheduleByDateScreen";

export default function App() {
    const [currentScreen, setCurrentScreen] = useState("attendance");

    return (
        <div className="bg-background max-w-[480px] mx-auto min-h-screen">
            {/* Header */}
            <header className="bg-white backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border px-4 py-3 fixed w-full top-0 z-50">
                <div className="flex items-center justify-between">
                    <h1 className="text-lg text-foreground font-medium tracking-tight">출결 관리</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-[72px] pb-[88px]">
                {currentScreen === "attendance" && <AttendanceScreen />}
                {currentScreen === "registration" && <RegistrationScreen />}
                {currentScreen === "schedule" && <ScheduleByDateScreen />}
            </main>

            {/* Bottom Navigation */}
            <nav
                className="fixed max-w-[480px] mx-auto inset-x-0 bottom-0 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-t border-border px-4 z-50"
                role="tablist"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="flex items-center justify-center py-2.5">
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <button
                            onClick={() => setCurrentScreen("attendance")}
                            className={`w-full flex items-center justify-center gap-2 rounded-lg px-0 py-3 text-sm font-medium transition-colors ${
                                currentScreen === "attendance" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            }`}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>오늘 출석</span>
                        </button>
                        <button
                            onClick={() => setCurrentScreen("registration")}
                            className={`w-full flex items-center justify-center gap-2 rounded-lg px-0 py-3 text-sm font-medium transition-colors ${
                                currentScreen === "registration" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>학생 등록</span>
                        </button>
                        <button
                            onClick={() => setCurrentScreen("schedule")}
                            className={`w-full flex items-center justify-center gap-2 rounded-lg px-0 py-3 text-sm font-medium transition-colors ${
                                currentScreen === "registration" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>스케줄</span>
                        </button>
                    </div>
                </div>
            </nav>
        </div>
    );
}
