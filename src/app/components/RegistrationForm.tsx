import { Calendar, Minus, Plus, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface RegistrationFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export function RegistrationForm({ onSubmit, onCancel }: RegistrationFormProps) {
    const [formData, setFormData] = useState({
        name: "",
        lessonsPerWeek: 1,
        lessonSchedules: [{ day: "월요일", time: "09:00" }],
    });

    const timeSlots = [
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
        "17:30",
        "18:00",
        "18:30",
        "19:00",
        "19:30",
    ];

    const weekDays = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

    const addLessonSchedule = () => {
        if (formData.lessonSchedules.length < 7) {
            setFormData({
                ...formData,
                lessonSchedules: [...formData.lessonSchedules, { day: "월요일", time: "09:00" }],
                lessonsPerWeek: formData.lessonSchedules.length + 1,
            });
        }
    };

    const removeLessonSchedule = (index: number) => {
        if (formData.lessonSchedules.length > 1) {
            const newSchedules = formData.lessonSchedules.filter((_, i) => i !== index);
            setFormData({
                ...formData,
                lessonSchedules: newSchedules,
                lessonsPerWeek: newSchedules.length,
            });
        }
    };

    const updateLessonSchedule = (index: number, field: "day" | "time", value: string) => {
        const newSchedules = [...formData.lessonSchedules];
        newSchedules[index] = { ...newSchedules[index], [field]: value };
        setFormData({
            ...formData,
            lessonSchedules: newSchedules,
            lessonsPerWeek: newSchedules.length,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim()) {
            onSubmit(formData);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg text-gray-900 font-medium">새 학생 등록</h3>
                <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Name */}
                <div>
                    <Label htmlFor="studentName">학생 이름</Label>
                    <Input
                        id="studentName"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="학생 이름을 입력하세요"
                        className="mt-1"
                        required
                    />
                </div>

                {/* Lesson Schedules */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <Label>수업 일정</Label>
                        <Button type="button" onClick={addLessonSchedule} size="sm" variant="outline" disabled={formData.lessonSchedules.length >= 7}>
                            <Plus className="w-4 h-4 mr-1" />
                            일정 추가
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {formData.lessonSchedules.map((schedule, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">수업 {index + 1}</span>
                                </div>

                                <div className="flex gap-2">
                                    {/* Day Selection */}
                                    <Select value={schedule.day} onValueChange={(value) => updateLessonSchedule(index, "day", value)}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="요일 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {weekDays.map((day) => (
                                                <SelectItem key={day} value={day}>
                                                    {day}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Time Selection */}
                                    <Select value={schedule.time} onValueChange={(value) => updateLessonSchedule(index, "time", value)}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="시간 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timeSlots.map((slot) => (
                                                <SelectItem key={slot} value={slot}>
                                                    {slot}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {formData.lessonSchedules.length > 1 && (
                                        <Button type="button" onClick={() => removeLessonSchedule(index)} size="sm" variant="outline" className="p-2">
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                        취소
                    </Button>
                    <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                        등록
                    </Button>
                </div>
            </form>
        </div>
    );
}
