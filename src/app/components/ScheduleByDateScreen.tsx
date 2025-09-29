import { useEffect, useState } from "react";
import { getSchedulesByDate, Schedule } from "../services/notionService";
import { getKoreanDate } from "../utils/utils";

function toISODate(date: Date) {
    // YYYY-MM-DD (padStart)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function ScheduleByDateScreen() {
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = getKoreanDate();
        return now;
    });
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSchedules(selectedDate);
    }, [selectedDate]);

    const loadSchedules = async (date: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSchedulesByDate(date);
            setSchedules(data);
        } catch (err: any) {
            setError(err.message || "스케줄을 불러오지 못했습니다.");
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = getKoreanDate(e.target.value);
        setSelectedDate(newDate);
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-lg text-gray-900 font-medium">날짜별 전체 스케줄</h2>
                <input type="date" className="border rounded px-2 py-1 text-sm" value={toISODate(new Date(selectedDate))} onChange={handleDateChange} />
            </div>
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">스케줄을 불러오는 중...</p>
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">해당 날짜에 스케줄이 없습니다.</p>
                    </div>
                ) : (
                    schedules.map((schedule) => (
                        <div key={schedule.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100">
                            <div>
                                <div className="font-medium text-gray-900">{schedule.student.name}</div>
                                <div className="text-sm text-gray-600 mt-1">시간: {schedule.time}</div>
                            </div>
                            <div className="mt-2 sm:mt-0">
                                <span
                                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                        schedule.status === "출석"
                                            ? "bg-green-100 text-green-700"
                                            : schedule.status === "결석"
                                            ? "bg-red-100 text-red-700"
                                            : schedule.status === "연기"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}
                                >
                                    {schedule.status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
