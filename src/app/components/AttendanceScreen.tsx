import { useEffect, useState } from "react";
import { absentStudent, attendanceTodaysAllSchedules, getTodaySchedulesFromNotion, rescheduleStudent, Schedule } from "../services/notionService";
import { RescheduleModal } from "./RescheduleModal";
import { ScheduleCard } from "./ScheduleCard";

export default function AttendanceScreen() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        attendTodaysClasses();
        loadSchedules();
    }, []);

    const attendTodaysClasses = async () => {
        try {
            setLoading(true);
            setError(null);
            await attendanceTodaysAllSchedules();
        } catch (err) {
            console.error("출석 처리 실패:", err);
            setError("출석 처리 중 오류가 발생했습니다. 노션 API 설정을 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const loadSchedules = async () => {
        try {
            setLoading(true);
            setError(null);
            const schedules = await getTodaySchedulesFromNotion();
            setSchedules(schedules);
        } catch (err) {
            console.error("스케줄 목록 로드 실패:", err);
            setError("스케줄 목록을 불러오는데 실패했습니다. 노션 API 설정을 확인해주세요.");
            // 에러 발생 시 기본 데이터 사용
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    const [rescheduleModal, setRescheduleModal] = useState<{
        isOpen: boolean;
        schedule: Schedule | null;
    }>({ isOpen: false, schedule: null });

    const handleAbsent = async (scheduleId: string) => {
        try {
            const isConfirm = confirm("정말로 결석 처리하시겠습니까?");
            if (!isConfirm) return;

            setLoading(true);
            await absentStudent(scheduleId);
        } catch (err) {
            console.error("결석 처리 실패:", err);
            setError("결석 처리 중 오류가 발생했습니다. 노션 API 설정을 확인해주세요.");
        } finally {
            setLoading(false);
            loadSchedules();
        }
    };

    const handleReschedule = (schedule: Schedule) => {
        setRescheduleModal({ isOpen: true, schedule });
    };

    const onRescheduleConfirm = async (date: string, time: string) => {
        setRescheduleModal({ isOpen: false, schedule: null });

        try {
            setLoading(true);
            await rescheduleStudent(rescheduleModal.schedule!.id, date, time);
            await loadSchedules();
        } catch (err) {
            console.error("수업 일정 변경 실패:", (err as any).message);
            setError((err as any).message || "수업 일정 변경 중 오류가 발생했습니다. 노션 API 설정을 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const handleExtendPayment = (studentId: string) => {
        console.log(`Extend payment for student ${studentId}`);
    };

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const date = today.getDate();
        const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
        const dayName = dayNames[today.getDay()];

        return `${year}년 ${month}월 ${date}일 (${dayName})`;
    };

    return (
        <div className="px-4 space-y-4">
            {/* Date Header */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h2 className="text-lg text-gray-900 font-medium">{getTodayDate()}</h2>
                <p className="text-sm text-gray-500 mt-1">오늘 수업 일정</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            {/* Student List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">수업 목록을 불러오는 중...</p>
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">오늘 수업이 없습니다.</p>
                    </div>
                ) : (
                    schedules.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} onAbsent={handleAbsent} onReschedule={handleReschedule} onExtendPayment={handleExtendPayment} />)
                )}
            </div>

            {/* Reschedule Modal */}
            <RescheduleModal
                isOpen={rescheduleModal.isOpen}
                schedule={rescheduleModal.schedule}
                onClose={() => setRescheduleModal({ isOpen: false, schedule: null })}
                onConfirm={onRescheduleConfirm}
            />
        </div>
    );
}
