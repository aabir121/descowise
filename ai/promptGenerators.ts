import { MonthlyConsumption, DailyConsumption } from '../types';

function getAsOfNotice(readingTime?: string, language: 'bn' | 'en' = 'en'): string {
    if (!readingTime) return '';
    const latestDate = new Date(readingTime).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const daysBehind = Math.floor((new Date(today).getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24));
    if (language === 'bn') {
        return daysBehind > 0
            ? `তথ্য সর্বশেষ আপডেট হয়েছে ${latestDate} পর্যন্ত, যা আজকের (${today}) থেকে ${daysBehind} দিন পিছিয়ে থাকতে পারে (DESCO API দেরির কারণে)। দয়া করে আপনার মিটার দেখে সর্বশেষ তথ্য যাচাই করুন।`
            : `তথ্য সর্বশেষ আপডেট: ${latestDate}`;
    } else {
        return daysBehind > 0
            ? `The data is current as of ${latestDate}, which may be up to ${daysBehind} day(s) behind today (${today}) due to DESCO API delays. Please check your meter for the most up-to-date info.`
            : `Data current as of: ${latestDate}`;
    }
}

function getRoleDescriptionSection() {
    return `You are an electricity bill and recharge analyst who explains things like you're talking to a friend over coffee. Use everyday language, avoid technical jargon, and keep it conversational. Whether responding in English or Bengali, maintain the same friendly, casual tone that regular people use in daily conversations.`;
}

function getDataFreshnessSection(asOfNotice: string, readingTime?: string, language: 'bn' | 'en' = 'en') {
    if (!asOfNotice) return '';
    return `IMPORTANT: Start your response by naturally acknowledging the data freshness. If there's a delay, mention it conversationally like "Hey, just a heads up - the info I'm looking at is from ${readingTime ? new Date(readingTime).toISOString().split('T')[0] : 'recent data'}, so it might be a bit behind what you see on your meter right now. But let me walk you through what I can see from the data we have!" or in Bengali "হ্যালো, একটা কথা বলি - আমি যে তথ্য দেখছি সেটা ${readingTime ? new Date(readingTime).toISOString().split('T')[0] : 'সাম্প্রতিক তথ্য'} পর্যন্ত, তাই আপনার মিটারে যা দেখছেন তার থেকে একটু পিছিয়ে থাকতে পারে। কিন্তু আমি যা দেখতে পাচ্ছি সেটা নিয়ে কথা বলি!"`;
}

function getUserJobSection() {
    return `Your job is to help people understand their electricity usage and give practical advice. Think of yourself as a helpful neighbor who knows about electricity bills and wants to share useful tips. Use examples from daily life, make comparisons people can relate to, and be encouraging.`;
}

function getAnalysisFocusSection() {
    return `Look at the customer's electricity usage history, recharge patterns, recent daily usage, and current balance. Focus on seasonal trends, unusual patterns, recharge habits, and give specific advice for what to do next.`;
}

function getDataSections(
    monthlyConsumption: MonthlyConsumption[],
    monthlyRechargeData: any,
    recentDailyConsumption: DailyConsumption[]
) {
    return `*Historical Electricity Consumption Data (24 months, JSON array, sorted by month):* \n- 'month': year-month (e.g., "2024-01")\n- 'consumedUnit': electricity consumption in kWh\n- 'consumedTaka': cost of consumption in BDT\n\n${JSON.stringify(monthlyConsumption)}\n\n*Historical Electricity Recharge Data (24 months, JSON array, sorted by month):* \n- 'month': year-month (e.g., "2024-01")\n- 'rechargeAmount': total BDT recharged in that month \n- 'rechargeCount': number of recharge transactions \n\n${JSON.stringify(monthlyRechargeData)}\n\n*Recent Daily Consumption (last 14 days, JSON array):* \n- 'date': YYYY-MM-DD\n- 'consumedUnit': kWh\n- 'consumedTaka': BDT\n\n${JSON.stringify(recentDailyConsumption)}`;
}

function getCurrentCustomerInfoSection(
    currentBalance: number | null | undefined,
    currentMonthConsumption: number | null | undefined,
    readingTime: string | undefined,
    currentMonth: string
) {
    return `*Current Customer Info:* \n- Current Meter Balance: ${currentBalance !== null && currentBalance !== undefined ? currentBalance + ' BDT' : 'Unavailable (N/A)'}\n- Current Month Consumption: ${currentMonthConsumption !== null && currentMonthConsumption !== undefined ? currentMonthConsumption + ' BDT' : 'Unavailable (N/A)'}\n- Reading Time: ${readingTime || 'Unavailable (N/A)'}\n- Current Month (YYYY-MM): ${currentMonth}`;
}

function getBalanceUnavailableNoticeSection(currentBalance: number | null | undefined) {
    if (currentBalance === null || currentBalance === undefined) {
        return `\n**IMPORTANT:** Current meter balance is unavailable. In this case, do NOT provide balance-related analysis (balanceStatusAndAdvice, rechargeRecommendation, balanceDepletionForecast). However, provide all other analysis (usage trends, seasonal patterns, recharge habits, etc.).`;
    }
    return '';
}

function getJsonStructureSection(
    asOfNotice: string,
    currentBalance: number | null | undefined,
    language: 'bn' | 'en' = 'en'
) {
    return `Generate a JSON object using this structure. Respond in ${language === 'bn' ? 'Bengali' : 'English'} with a conversational tone:\n\n{\n  "title": "A friendly, personalized title (like 'Your July Power Check-in' or 'Smart Recharge Tips for Hot Weather')",\n\n  "overallSummary": "Give a quick overview of their average monthly usage and recharge amounts. Talk about their patterns like you're catching up with a friend. Add a personal touch - maybe compare to recent months or use a relatable example. ${asOfNotice ? 'Start this section by naturally mentioning the data freshness in a conversational way, then transition into the analysis.' : ''}",\n\n  "anomaly": {\n    "detected": true or false,\n    "details": "If you spot anything unusual (like usage that's way higher or lower than normal), mention it casually. Use everyday examples to explain why it might have happened."\n  },\n\n  "seasonalTrend": {\n    "observed": true or false,\n    "details": "If you see seasonal patterns (like higher usage in summer), explain it simply. Use real-life examples people can relate to."\n  },\n\n  "rechargePatternInsight": "Describe how they usually recharge - like 'you typically top up 2-3 times a month' or 'you seem to recharge when you're running low'. Make it sound like friendly observation."${currentBalance !== null && currentBalance !== undefined ? `,\n  "balanceStatusAndAdvice": {\n    "status": "low", "normal", or "good",\n    "details": "Tell them if their current balance is enough for the rest of the month. If it's low, explain why and give encouraging advice."\n  }` : ''}${currentBalance !== null && currentBalance !== undefined ? `,\n  "rechargeRecommendation": {\n    "recommendedAmountBDT": number or null,\n    "justification": "Suggest how much to recharge based on their typical usage for this month. Explain it like you're helping a friend plan their budget."\n  }` : ''},\n  "rechargeTimingInsight": "Advise on the best time to recharge. Think about their patterns and seasonal needs. Make it practical and easy to follow.",\n  "actionableTip": "Give one simple, practical tip they can act on right away. Make it sound like friendly advice from someone who cares."${currentBalance !== null && currentBalance !== undefined ? `,\n  "balanceDepletionForecast": {\n    "daysRemaining": number,\n    "expectedDepletionDate": "YYYY-MM-DD",\n    "details": "Estimate how long their current balance will last based on recent usage. Explain it simply, like 'at your current rate, this should last about X days'."\n  }` : ''},\n  "currentMonthBillForecast": {\n    "estimatedTotal": number,\n    "details": "Give them an idea of what their total bill might be this month. Compare it to previous months if helpful."\n  },\n  "futureConsumptionForecast": [\n    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number },\n    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number },\n    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number }\n  ]\n}\n\nKeep the tone conversational and friendly throughout. Use everyday language, avoid technical terms, and make it feel like you're having a helpful chat with a friend. Respond in ${language === 'bn' ? 'Bengali' : 'English'}.
`;
}

export function generateAiDashboardPrompt(
    monthlyConsumption: MonthlyConsumption[],
    monthlyRechargeData: any,
    recentDailyConsumption: DailyConsumption[],
    currentBalance: number | null | undefined,
    currentMonth: string,
    readingTime?: string,
    currentMonthConsumption?: number | null,
    language: 'bn' | 'en' = 'en'
): string {
    const asOfNotice = getAsOfNotice(readingTime, language);
    return [
        asOfNotice,
        getRoleDescriptionSection(),
        getDataFreshnessSection(asOfNotice, readingTime, language),
        getUserJobSection(),
        getAnalysisFocusSection(),
        getDataSections(monthlyConsumption, monthlyRechargeData, recentDailyConsumption),
        getCurrentCustomerInfoSection(currentBalance, currentMonthConsumption, readingTime, currentMonth),
        getBalanceUnavailableNoticeSection(currentBalance),
        getJsonStructureSection(asOfNotice, currentBalance, language)
    ].filter(Boolean).join('\n\n');
} 