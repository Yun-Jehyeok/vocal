export function getKoreanDate(date?: string) {
    let now = new Date();
    if (date) {
        now = new Date(date);
    }

    // 한국 시간 기준으로 변환
    const koreaDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));

    const year = koreaDate.getFullYear();
    const month = String(koreaDate.getMonth() + 1).padStart(2, "0");
    const day = String(koreaDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
