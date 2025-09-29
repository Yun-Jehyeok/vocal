import { BarChart3, Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { NotionStudent } from "../services/notionService";

interface StudentDetailCardProps {
    student: NotionStudent;
}

export function StudentDetailCard({ student }: StudentDetailCardProps) {
    // 출석 상태 색상 (한글 상태명 기준)
    const getStatusColor = (status: string) => {
        switch (status) {
            case "출석":
                return "bg-green-500";
            case "결석":
                return "bg-red-500";
            case "연기":
                return "bg-yellow-500";
            default:
                return "bg-gray-300";
        }
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "출석":
                return "bg-green-100 text-green-700 border-green-200";
            case "결석":
                return "bg-red-100 text-red-700 border-red-200";
            case "연기":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getDayOfWeek = (dateString: string) => {
        const date = new Date(dateString);
        return ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    };

    // 월 변경 state 추가
    const today = new Date();
    const [calendarYear, setCalendarYear] = useState(today.getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(today.getMonth());

    // 월 이동 함수
    const handlePrevMonth = () => {
        setCalendarMonth((prev) => {
            if (prev === 0) {
                setCalendarYear((y) => y - 1);
                return 11;
            }
            return prev - 1;
        });
    };
    const handleNextMonth = () => {
        setCalendarMonth((prev) => {
            if (prev === 11) {
                setCalendarYear((y) => y + 1);
                return 0;
            }
            return prev + 1;
        });
    };

    // 월별 달력 데이터 생성 함수 수정
    const generateCalendarData = (year: number, month: number) => {
        // 이번 달 일수
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const calendarDays: ({ day: number; attendance?: string } | null)[] = [];

        // 첫 주 빈칸
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(null);
        }

        // 날짜별 출석 상태 매핑
        const scheduleMap: Record<string, string> = {};
        if (student.schedules) {
            student.schedules.forEach((s) => {
                if (s.date) scheduleMap[s.date] = s.status;
            });
        }

        // 달력 날짜 채우기
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const attendance = scheduleMap[dateString];
            calendarDays.push({
                day,
                attendance,
            });
        }

        return calendarDays;
    };

    const calendarData = generateCalendarData(calendarYear, calendarMonth);

    return (
        <div className="border-t border-gray-200 p-4 space-y-6">
            {/* Weekly Schedule */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-medium text-gray-900">수업 일정</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {student.schedules &&
                        student.schedules
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .slice(0, 8)
                            .map((schedule, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-700">
                                        {schedule.date} ({getDayOfWeek(schedule.date)})
                                    </span>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Clock className="w-3 h-3" />
                                        <span>{schedule.time}</span>
                                    </div>
                                    <span className={`ml-2 px-2 py-0.5 rounded text-xs border ${getStatusBadgeVariant(schedule.status)}`}>{schedule.status}</span>
                                </div>
                            ))}
                </div>
            </div>

            {/* Progress */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-medium text-gray-900">수업 이력</h4>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-center">
                        <div className="text-2xl font-medium text-gray-900">{student.totalClassCount}</div>
                        <div className="text-sm text-gray-600">총 수업 횟수</div>
                    </div>
                </div>
            </div>

            {/* Attendance Summary */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">출석 현황</h4>
                <div className="grid grid-cols-3 gap-3">
                    <div className={`p-3 rounded-lg border ${getStatusBadgeVariant("출석")}`}>
                        <div className="text-center">
                            <div className="text-lg font-medium">{student.attendanceCount}</div>
                            <div className="text-xs">출석</div>
                        </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${getStatusBadgeVariant("결석")}`}>
                        <div className="text-center">
                            <div className="text-lg font-medium">{student.absentCount}</div>
                            <div className="text-xs">결석</div>
                        </div>
                    </div>
                    <div className={`p-3 rounded-lg border ${getStatusBadgeVariant("연기")}`}>
                        <div className="text-center">
                            <div className="text-lg font-medium">{student.rescheduledCount}</div>
                            <div className="text-xs">연기</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mini Calendar */}
            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">출석 달력</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-2">
                        <button className="px-2 py-1 text-xs text-gray-500 hover:text-indigo-600" onClick={handlePrevMonth} aria-label="이전 달">
                            &lt;
                        </button>
                        <span className="text-sm font-semibold text-gray-700">
                            {calendarYear}년 {calendarMonth + 1}월
                        </span>
                        <button className="px-2 py-1 text-xs text-gray-500 hover:text-indigo-600" onClick={handleNextMonth} aria-label="다음 달">
                            &gt;
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                            <div key={day} className="text-center text-xs text-gray-500 p-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarData.map((day, index) => (
                            <div key={index} className="aspect-square flex items-center justify-center relative">
                                {day ? (
                                    <>
                                        <span className="text-xs text-gray-700">{day.day}</span>
                                        {day.attendance && <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${getStatusColor(day.attendance)}`} />}
                                    </>
                                ) : null}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">출석</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">결석</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-xs text-gray-600">연기</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
