import { Clock, CreditCard, RotateCcw, XCircle } from "lucide-react";
import { Schedule } from "../services/notionService";
import { Button } from "./ui/button";

interface ScheduleCardProps {
    schedule: Schedule;
    onAbsent: (scheduleId: string) => void;
    onReschedule: (schedule: Schedule) => void;
    onExtendPayment: (scheduleId: string) => void;
}

export function ScheduleCard({ schedule, onAbsent, onReschedule, onExtendPayment }: ScheduleCardProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "출석":
                return "text-green-600 bg-green-50 border-green-200";
            case "결석":
                return "text-red-600 bg-red-50 border-red-200";
            case "미출석":
                return "text-gray-600 bg-gray-50 border-gray-200";
            case "연기":
                return "text-blue-600 bg-blue-50 border-blue-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            {/* schedule Info */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-lg text-gray-900 font-medium">{schedule.student.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{schedule.time}</span>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(schedule.status)}`}>{schedule.status}</div>
            </div>

            {/* Session Info */}
            <div className="mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>총 수업 횟수</span>
                        <span className="text-base font-medium text-gray-900">{schedule.student.totalClassCount}회</span>
                    </div>
                </div>
            </div>

            {/* Payment Warning */}
            {schedule.isAllScheduleOver && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-orange-700">총 수업 회차가 만료되었습니다.</span>
                        </div>
                        <Button size="sm" onClick={() => onExtendPayment(schedule.id)} className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1">
                            연장
                        </Button>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {(schedule.status === "미출석" || schedule.status === "출석") && (
                <div className="flex gap-2">
                    <Button onClick={() => onAbsent(schedule.id)} variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" size="sm">
                        <XCircle className="w-4 h-4 mr-2" />
                        결석
                    </Button>
                    <Button onClick={() => onReschedule(schedule)} variant="outline" className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50" size="sm">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        연기
                    </Button>
                </div>
            )}
        </div>
    );
}
