import { Calendar, Clock } from "lucide-react";
import { useState } from "react";
import { Schedule } from "../services/notionService";
import { Button } from "./ui/button";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface RescheduleModalProps {
    isOpen: boolean;
    schedule: Schedule | null;
    onClose: () => void;
    onConfirm: (date: string, time: string) => void;
}

export function RescheduleModal({ isOpen, schedule, onClose, onConfirm }: RescheduleModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedTime, setSelectedTime] = useState("09:00");

    const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];

    const handleConfirm = () => {
        if (selectedDate) {
            const dateString = selectedDate.toLocaleDateString("ko-KR");
            onConfirm(dateString, selectedTime);
        }
    };

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
        const dayName = dayNames[date.getDay()];

        return `${year}년 ${month}월 ${day}일 (${dayName})`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm mx-auto" style={{ backgroundColor: "white", maxHeight: "80dvh", overflowY: "auto" }}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        수업 일정 변경
                    </DialogTitle>
                </DialogHeader>

                {schedule && (
                    <div className="space-y-6">
                        {/* schedule Info */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <h3 className="font-medium text-gray-900">{schedule.student.name}</h3>
                            <p className="text-sm text-gray-500">기존 수업 시간: {schedule.time}</p>
                        </div>

                        {/* Date Picker */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">새로운 날짜 선택</label>
                            <div className="border border-gray-200 rounded-lg p-2">
                                <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date()} className="w-full" />
                            </div>
                        </div>

                        {/* Time Picker */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">새로운 시간 선택</label>
                            <div className="grid grid-cols-3 gap-2">
                                {timeSlots.map((time) => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        className={`p-2 text-sm rounded-lg border transition-colors ${
                                            selectedTime === time ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selected Date/Time Preview */}
                        {selectedDate && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">
                                        변경될 수업 일정: {formatDate(selectedDate)} {selectedTime}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button variant="outline" onClick={onClose} className="flex-1">
                                취소
                            </Button>
                            <Button onClick={handleConfirm} disabled={!selectedDate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                                확인
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
