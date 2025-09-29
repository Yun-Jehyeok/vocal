"use server";

import { Client } from "@notionhq/client";
import axios from "axios";
import { getKoreanDate } from "../utils/utils";

// 노션 클라이언트 초기화
const notion = new Client({
    auth: process.env.NEXT_PUBLIC_NOTION_API_KEY,
});

// 노션 데이터베이스 ID들 (환경 변수에서 가져옴)
const STUDENT_DATABASE_ID = process.env.NEXT_PUBLIC_NOTION_STUDENT_DATABASE_ID;
const SCHEDULE_DATABASE_ID = process.env.NEXT_PUBLIC_NOTION_SCHEDULE_DATABASE_ID;

export interface StudentData {
    name: string;
    lessonsPerWeek: number;
    lessonSchedules: {
        day: string;
        time: string;
    }[];
}

export interface NotionStudent {
    id: string;
    name: string;
    attendanceCount: number;
    absentCount: number;
    rescheduledCount: number;
    totalClassCount: number;
    lessonsPerWeek: number;
    registrationDate: string | null;
    schedules?: ScheduleData[];
}

export interface ScheduleData {
    id: string;
    title: string;
    date: string;
    time: string;
    status: "미출석" | "출석" | "결석" | "연기";
    studentId: string;
}

export interface Schedule {
    id: string;
    student: {
        id: string;
        name: string;
        totalClassCount: number;
        attendanceCount: number;
        absentCount: number;
        rescheduledCount: number;
    };
    time: string;
    status: "미출석" | "출석" | "결석" | "연기";
    isAllScheduleOver: boolean;
}

/**
 * 노션 데이터베이스에 새 학생 추가
 */
export async function addStudentToNotion(studentData: StudentData): Promise<string | null> {
    try {
        if (!STUDENT_DATABASE_ID) {
            throw new Error("STUDENT_DATABASE_ID가 설정되지 않았습니다.");
        }

        // 1. 학생 데이터베이스에 학생 추가
        const studentResponse = await notion.pages.create({
            parent: {
                database_id: STUDENT_DATABASE_ID,
            },
            properties: {
                name: {
                    title: [
                        {
                            text: {
                                content: studentData.name,
                            },
                        },
                    ],
                },
                lessonsPerWeek: {
                    number: studentData.lessonsPerWeek,
                },
                attendanceCount: {
                    number: 0,
                },
                absentCount: {
                    number: 0,
                },
                rescheduledCount: {
                    number: 0,
                },
                totalClassCount: {
                    number: 0,
                },
                registrationDate: {
                    date: {
                        start: getKoreanDate(),
                    },
                },
            },
        });

        const studentId = studentResponse.id;

        /**
         * lessonSchedules 배열을 받아, 오늘 이후의 각 요일별로 4번씩 날짜를 계산하여 반환
         */
        function getNextLessonDates(lessonSchedules: { day: string; time: string }[]): { day: string; date: string; time: string }[] {
            // 요일 한글 → 숫자 매핑 (월:1, 화:2, ...)
            const dayMap: Record<string, number> = {
                일요일: 0,
                월요일: 1,
                화요일: 2,
                수요일: 3,
                목요일: 4,
                금요일: 5,
                토요일: 6,
            };

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const results: { day: string; date: string; time: string }[] = [];

            for (const schedule of lessonSchedules) {
                const targetDay = dayMap[schedule.day];
                if (targetDay === undefined) continue;

                const currentDate = new Date(today);

                // 첫 번째 해당 요일까지 이동
                const dayDiff = (targetDay - currentDate.getDay() + 7) % 7 || 7; // 오늘이면 다음주
                currentDate.setDate(currentDate.getDate() + dayDiff);

                for (let i = 0; i < 4; i++) {
                    results.push({
                        day: schedule.day,
                        date: currentDate.toISOString().split("T")[0],
                        time: schedule.time,
                    });
                    currentDate.setDate(currentDate.getDate() + 7); // 다음주 같은 요일
                }
            }

            // 날짜순 정렬
            results.sort((a, b) => a.date.localeCompare(b.date));

            return results;
        }

        // 2. 일정 데이터베이스에 각 수업 일정 추가
        if (SCHEDULE_DATABASE_ID && studentData.lessonSchedules.length > 0) {
            const upcomingLessons = getNextLessonDates(studentData.lessonSchedules);

            upcomingLessons.forEach(async (lesson) => {
                await notion.pages.create({
                    parent: {
                        database_id: SCHEDULE_DATABASE_ID,
                    },
                    properties: {
                        title: {
                            title: [
                                {
                                    text: {
                                        content: studentData.name + " " + lesson.date + " " + lesson.time,
                                    },
                                },
                            ],
                        },
                        Student: {
                            relation: [
                                {
                                    id: studentId,
                                },
                            ],
                        },
                        date: {
                            date: {
                                start: lesson.date,
                            },
                        },
                        time: {
                            rich_text: [
                                {
                                    text: {
                                        content: lesson.time,
                                    },
                                },
                            ],
                        },
                        status: {
                            status: {
                                name: "미출석",
                            },
                        },
                    },
                });
            });
        }

        return studentId;
    } catch (error) {
        console.error("노션에 학생 추가 실패:", error);
        throw error;
    }
}

/**
 * 노션 데이터베이스에서 모든 학생 조회
 */
export async function getStudentsFromNotion(): Promise<NotionStudent[]> {
    try {
        if (!STUDENT_DATABASE_ID) {
            throw new Error("STUDENT_DATABASE_ID가 설정되지 않았습니다.");
        }

        const resp = await axios.get(`https://api.notion.com/v1/databases/${STUDENT_DATABASE_ID}`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTION_API_KEY}`,
                "Notion-Version": "2025-09-03",
            },
        });

        const dataSources = resp.data.data_sources;

        // 1. 학생 데이터베이스에서 모든 학생 조회
        const studentResponse = await notion.dataSources.query({
            data_source_id: dataSources[0].id,
        });

        const students: NotionStudent[] = [];

        // 2. 각 학생에 대해 관련 일정 조회
        for (const page of studentResponse.results as any[]) {
            const properties = page.properties;
            const studentId = page.id;

            const scheduleIds = properties["Schedule"]?.relation?.map((rel: any) => rel.id) || [];

            // 해당 학생의 일정 조회
            let schedules: ScheduleData[] = [];

            if (scheduleIds.length > 0) {
                const scheduleResponses = await Promise.all(scheduleIds.map((id: string) => notion.pages.retrieve({ page_id: id })));

                schedules = scheduleResponses.map((schedule: any) => ({
                    id: schedule.id,
                    title: schedule.properties["title"]?.title?.[0]?.text?.content || "",
                    date: schedule.properties["date"]?.date?.start || "",
                    time: schedule.properties["time"]?.rich_text?.[0]?.text?.content || "",
                    status: schedule.properties["status"]?.status?.name || "미출석",
                    studentId,
                }));
            }

            // 이름(title 속성)
            const name = properties.name?.title?.[0]?.plain_text ?? "";

            // 숫자 속성들
            const attendanceCount = properties.attendanceCount?.number ?? 0;
            const absentCount = properties.absentCount?.number ?? 0;
            const rescheduledCount = properties.rescheduledCount?.number ?? 0;
            const totalClassCount = properties.totalClassCount?.number ?? 0;
            const lessonsPerWeek = properties.lessonsPerWeek?.number ?? 0;

            // 날짜 속성
            const registrationDate = properties.registrationDate?.date?.start ?? null;

            students.push({
                id: studentId,
                name,
                lessonsPerWeek,
                attendanceCount,
                absentCount,
                rescheduledCount,
                totalClassCount,
                registrationDate,
                schedules,
            });
        }

        return students;
    } catch (error) {
        console.error("노션에서 학생 목록 조회 실패:", error);
        throw error;
    }
}

/**
 * 오늘 스케줄 조회
 */
export async function getTodaySchedulesFromNotion() {
    try {
        const resp = await axios.get(`https://api.notion.com/v1/databases/${SCHEDULE_DATABASE_ID}`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTION_API_KEY}`,
                "Notion-Version": "2025-09-03",
            },
        });

        const dataSources = resp.data.data_sources;

        // 한국 시간 기준 오늘 날짜 계산
        const todayStr = getKoreanDate();

        // 1. 스케줄 데이터베이스에서 모든 스케줄 조회
        const scheduleResponse = await notion.dataSources.query({
            data_source_id: dataSources[0].id,
            filter: {
                property: "date",
                date: { equals: todayStr },
            },
        });

        const schedules: Schedule[] = [];

        // 2. 각 스케줄에 대해 관련 학생 조회
        for (const page of scheduleResponse.results as any[]) {
            const properties = page.properties;
            const studentIds = properties["Student"]?.relation?.map((rel: any) => rel.id) || [];

            let student = {} as { id: string; name: string; totalClassCount: number; attendanceCount: number; absentCount: number; rescheduledCount: number };

            if (studentIds.length > 0) {
                const studentResponse = await Promise.all(studentIds.map((id: string) => notion.pages.retrieve({ page_id: id })));

                const studentId = studentResponse[0].id;
                const studentName = studentResponse[0].properties["name"]?.title?.[0]?.plain_text || "";
                const totalClassCount = studentResponse[0].properties["totalClassCount"]?.number || 0;
                const attendanceCount = studentResponse[0].properties["attendanceCount"]?.number || 0;
                const absentCount = studentResponse[0].properties["absentCount"]?.number || 0;
                const rescheduledCount = studentResponse[0].properties["rescheduledCount"]?.number || 0;
                const lessonsPerWeek = studentResponse[0].properties["lessonsPerWeek"]?.number || 0;

                student = {
                    id: studentId,
                    name: studentName,
                    totalClassCount: totalClassCount,
                    attendanceCount,
                    absentCount,
                    rescheduledCount,
                };

                schedules.push({
                    id: page.id,
                    student,
                    time: properties["time"]?.rich_text?.[0]?.text?.content || "",
                    status: properties["status"]?.status?.name || "미출석",
                    isAllScheduleOver: lessonsPerWeek * 4 <= totalClassCount, // 수업이 모두 끝났는지 여부
                });
            }
        }

        return schedules;
    } catch (error) {
        console.error("노션에서 오늘 수업할 학생 목록 조회 실패:", error);
        throw error;
    }
}

export async function attendanceTodaysAllSchedules() {
    try {
        const schedules = await getTodaySchedulesFromNotion();

        // 한국 시간 기준 현재 시각 구하기
        const now = new Date();
        const koreaOffset = 9 * 60; // 9시간(분)
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const koreaNow = new Date(utc + koreaOffset * 60000);

        for (const schedule of schedules) {
            // schedule.time이 "HH:mm" 형식이므로, 오늘 날짜 + time으로 Date 객체 생성
            const [hour, minute] = schedule.time.split(":").map(Number);
            const scheduleDateTime = new Date(koreaNow.getFullYear(), koreaNow.getMonth(), koreaNow.getDate(), hour, minute);

            if ((schedule.status === "미출석" || schedule.status === "연기") && !schedule.isAllScheduleOver && koreaNow.getTime() >= scheduleDateTime.getTime()) {
                // 출석 처리
                await notion.pages.update({
                    page_id: schedule.id,
                    properties: {
                        status: {
                            status: {
                                name: "출석",
                            },
                        },
                    },
                });

                // 학생의 출석 횟수 및 총 수업 횟수 증가
                await notion.pages.update({
                    page_id: schedule.student.id,
                    properties: {
                        attendanceCount: {
                            number: (schedule.student.attendanceCount || 0) + 1,
                        },
                        totalClassCount: {
                            number: (schedule.student.totalClassCount || 0) + 1,
                        },
                    },
                });

                console.log(`스케줄 ${schedule.id} 출석 처리 완료`);
            }
        }
    } catch (err) {
        console.error("노션에서 오늘 수업할 학생 목록 조회 실패:", err);
    }
}

/**
 * 노션에서 학생 정보 업데이트
 */
export async function updateStudentInNotion(studentId: string, updates: Partial<NotionStudent>): Promise<void> {
    try {
        const properties: any = {};

        if (updates.name !== undefined) {
            properties["name"] = {
                title: [{ text: { content: updates.name } }],
            };
        }

        if (updates.lessonsPerWeek !== undefined) {
            properties["lessonsPerWeek"] = { number: updates.lessonsPerWeek };
        }

        if (updates.attendanceCount !== undefined) {
            properties["attendanceCount"] = { number: updates.attendanceCount };
        }

        if (updates.absentCount !== undefined) {
            properties["결석 횟수"] = { number: updates.absentCount };
        }

        if (updates.rescheduledCount !== undefined) {
            properties["연기 횟수"] = { number: updates.rescheduledCount };
        }

        // 학생 기본 정보 업데이트
        if (Object.keys(properties).length > 0) {
            await notion.pages.update({
                page_id: studentId,
                properties,
            });
        }

        // 일정 업데이트 (필요한 경우)
        // if (updates.weeklySchedule !== undefined && SCHEDULE_DATABASE_ID) {
        //     // 기존 일정 삭제
        //     const existingSchedules = await (notion.databases as any).query({
        //         database_id: SCHEDULE_DATABASE_ID,
        //         filter: {
        //             property: "학생",
        //             relation: {
        //                 contains: studentId,
        //             },
        //         },
        //     });

        //     for (const schedule of existingSchedules.results) {
        //         await notion.pages.update({
        //             page_id: schedule.id,
        //             archived: true,
        //         });
        //     }

        //     // 새 일정 추가
        //     for (const schedule of updates.weeklySchedule) {
        //         await notion.pages.create({
        //             parent: {
        //                 database_id: SCHEDULE_DATABASE_ID,
        //             },
        //             properties: {
        //                 학생: {
        //                     relation: [{ id: studentId }],
        //                 },
        //                 요일: {
        //                     select: { name: schedule.day },
        //                 },
        //                 시간: {
        //                     rich_text: [{ text: { content: schedule.time } }],
        //                 },
        //                 상태: {
        //                     select: { name: "active" },
        //                 },
        //             },
        //         });
        //     }
        // }
    } catch (error) {
        console.error("노션에서 학생 정보 업데이트 실패:", error);
        throw error;
    }
}

/**
 * 노션에서 결석 처리
 */
export async function absentStudent(scheduleId: string): Promise<void> {
    try {
        // 1. 스케줄 상태를 '결석'으로 업데이트
        const schedulePage = await notion.pages.retrieve({ page_id: scheduleId });
        const currentState = (schedulePage as any).properties["status"]?.status?.name;
        const studentRelation = (schedulePage as any).properties["Student"]?.relation || [];
        if (studentRelation.length === 0) {
            throw new Error("스케줄에 연결된 학생이 없습니다.");
        }
        const studentId = studentRelation[0].id;
        await notion.pages.update({
            page_id: scheduleId,
            properties: {
                status: {
                    status: {
                        name: "결석",
                    },
                },
            },
        });

        // // 2. 학생의 결석 횟수 및 총 수업 횟수 증가
        const studentPage = (await notion.pages.retrieve({ page_id: studentId })) as any;
        const currentAbsentCount = studentPage.properties["absentCount"]?.number || 0;
        const currentTotalClassCount = studentPage.properties["totalClassCount"]?.number || 0;
        await notion.pages.update({
            page_id: studentId,
            properties: {
                absentCount: {
                    number: currentAbsentCount + 1,
                },
                totalClassCount: {
                    number: currentState === "출석" ? currentTotalClassCount : currentTotalClassCount + 1, // 이미 출석 된 상태였다면 총 수업 횟수 증가 X
                },
            },
        });
    } catch (error) {
        console.error("노션에서 결석 처리 실패:", error);
        throw error;
    }
}

/**
 * 노션에서 연기 처리
 */
export async function rescheduleStudent(scheduleId: string, date: string, time: string): Promise<void> {
    try {
        // 1. 스케줄 상태를 '연기'으로 업데이트
        const schedulePage = await notion.pages.retrieve({ page_id: scheduleId });
        const studentRelation = (schedulePage as any).properties["Student"]?.relation || [];
        if (studentRelation.length === 0) {
            throw new Error("스케줄에 연결된 학생이 없습니다.");
        }

        // 2. 해당 date, time에 이미 스케줄이 있는지 확인
        const resp = await axios.get(`https://api.notion.com/v1/databases/${SCHEDULE_DATABASE_ID}`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTION_API_KEY}`,
                "Notion-Version": "2025-09-03",
            },
        });

        const dataSources = resp.data.data_sources;

        const existingSchedules = await notion.dataSources.query({
            data_source_id: dataSources[0].id,
            filter: {
                and: [
                    {
                        property: "date",
                        date: { equals: getKoreanDate(date) },
                    },
                    {
                        property: "time",
                        rich_text: { equals: time },
                    },
                ],
            },
        });

        if (existingSchedules.results.length > 0) {
            throw new Error("해당 날짜와 시간에 이미 스케줄이 존재합니다.");
        }

        const studentId = studentRelation[0].id;
        await notion.pages.update({
            page_id: scheduleId,
            properties: {
                status: {
                    status: {
                        name: "연기",
                    },
                },
                date: {
                    date: {
                        start: getKoreanDate(date),
                    },
                },
                time: {
                    rich_text: [
                        {
                            text: {
                                content: time,
                            },
                        },
                    ],
                },
            },
        });

        // 2. 학생의 연기 횟수 증가 (총 수업 횟수는 증가하지 않음)
        const studentPage = (await notion.pages.retrieve({ page_id: studentId })) as any;
        const currentRescheduledCount = studentPage.properties["rescheduledCount"]?.number || 0;
        await notion.pages.update({
            page_id: studentId,
            properties: {
                rescheduledCount: {
                    number: currentRescheduledCount + 1,
                },
            },
        });
    } catch (error) {
        console.error("노션에서 연기 처리 실패:", error);
        throw error;
    }
}

/**
 * 특정 날짜의 스케줄 조회
 */
export async function getSchedulesByDate(date: string) {
    try {
        const resp = await axios.get(`https://api.notion.com/v1/databases/${SCHEDULE_DATABASE_ID}`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTION_API_KEY}`,
                "Notion-Version": "2025-09-03",
            },
        });

        const dataSources = resp.data.data_sources;

        // 1. 스케줄 데이터베이스에서 해당 날짜의 모든 스케줄 조회
        const scheduleResponse = await notion.dataSources.query({
            data_source_id: dataSources[0].id,
            filter: {
                property: "date",
                date: { equals: date },
            },
        });

        const schedules: Schedule[] = [];

        // 2. 각 스케줄에 대해 관련 학생 조회
        for (const page of scheduleResponse.results as any[]) {
            const properties = page.properties;
            const studentIds = properties["Student"]?.relation?.map((rel: any) => rel.id) || [];

            let student = {} as {
                id: string;
                name: string;
                totalClassCount: number;
                attendanceCount: number;
                absentCount: number;
                rescheduledCount: number;
            };

            if (studentIds.length > 0) {
                const studentResponse = await Promise.all(studentIds.map((id: string) => notion.pages.retrieve({ page_id: id })));

                const studentId = studentResponse[0].id;
                const studentName = studentResponse[0].properties["name"]?.title?.[0]?.plain_text || "";
                const totalClassCount = studentResponse[0].properties["totalClassCount"]?.number || 0;
                const attendanceCount = studentResponse[0].properties["attendanceCount"]?.number || 0;
                const absentCount = studentResponse[0].properties["absentCount"]?.number || 0;
                const rescheduledCount = studentResponse[0].properties["rescheduledCount"]?.number || 0;
                const lessonsPerWeek = studentResponse[0].properties["lessonsPerWeek"]?.number || 0;

                student = {
                    id: studentId,
                    name: studentName,
                    totalClassCount: totalClassCount,
                    attendanceCount,
                    absentCount,
                    rescheduledCount,
                };

                schedules.push({
                    id: page.id,
                    student,
                    time: properties["time"]?.rich_text?.[0]?.text?.content || "",
                    status: properties["status"]?.status?.name || "미출석",
                    isAllScheduleOver: lessonsPerWeek * 4 <= totalClassCount,
                });
            }
        }

        return schedules;
    } catch (error) {
        console.error("특정 날짜 스케줄 조회 실패:", error);
        throw error;
    }
}
