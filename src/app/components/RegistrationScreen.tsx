import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { addStudentToNotion, getStudentsFromNotion, NotionStudent, StudentData } from "../services/notionService";
import { RegistrationForm } from "./RegistrationForm";
import { StudentDetailCard } from "./StudentDetailCard";
import { Button } from "./ui/button";

export default function RegistrationScreen() {
    const [showForm, setShowForm] = useState(false);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const [registeredStudents, setRegisteredStudents] = useState<NotionStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 컴포넌트 마운트 시 노션에서 학생 목록 로드
    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError(null);
            const students = await getStudentsFromNotion();
            setRegisteredStudents(students);
        } catch (err) {
            console.error("학생 목록 로드 실패:", err);
            setError("학생 목록을 불러오는데 실패했습니다. 노션 API 설정을 확인해주세요.");
            // 에러 발생 시 기본 데이터 사용
            setRegisteredStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStudent = async (studentData: StudentData) => {
        try {
            setLoading(true);
            setError(null);

            console.log("Adding student:", studentData);

            // 노션에 학생 추가
            const studentId = await addStudentToNotion(studentData);

            if (studentId) {
                // 성공 시 학생 목록 새로고침
                await loadStudents();
                setShowForm(false);
                console.log("학생이 성공적으로 추가되었습니다:", studentData.name);
            }
        } catch (err) {
            console.error("학생 추가 실패:", err);
            setError("학생 추가에 실패했습니다. 노션 API 설정을 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const toggleStudentExpanded = (studentId: string) => {
        setExpandedStudent(expandedStudent === studentId ? null : studentId);
    };

    return (
        <div className="p-4 space-y-6">
            {/* Add Student Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg text-gray-900 font-medium">학생 관리</h2>
                <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? "로딩 중..." : "학생 추가"}
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            {/* Registration Form */}
            {showForm && <RegistrationForm onSubmit={handleAddStudent} onCancel={() => setShowForm(false)} />}

            {/* Registered Students List */}
            <div className="space-y-4">
                <h3 className="text-base text-gray-700 font-medium">등록된 학생 목록</h3>

                {loading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">학생 목록을 불러오는 중...</p>
                    </div>
                ) : registeredStudents.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">등록된 학생이 없습니다.</p>
                    </div>
                ) : (
                    registeredStudents.map((student) => (
                        <div key={student.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Student Summary */}
                            <button onClick={() => toggleStudentExpanded(student.id)} className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-base text-gray-900 font-medium">{student.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            주 {student.lessonsPerWeek}회 • 총 {student.attendanceCount}회 수업
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600">
                                                출석 {student.attendanceCount} • 결석 {student.absentCount} • 연기 {student.rescheduledCount}
                                            </div>
                                        </div>
                                        {expandedStudent === student.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                    </div>
                                </div>
                            </button>

                            {/* Expanded Details */}
                            {expandedStudent === student.id && <StudentDetailCard student={student} />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
