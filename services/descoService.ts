import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AccountInfo, BalanceData, CustomerLocation, MonthlyConsumption, RechargeHistoryItem, DailyConsumption, AiSummary } from '../types';

// Helper to format a date as YYYY-MM-DD
const formatDate = (date: Date): string => date.toISOString().split('T')[0];

// Helper to format a date as YYYY-MM
const formatMonth = (date: Date): string => date.toISOString().substring(0, 7);

// Helper to sanitize currency values (null/undefined to 0.00, else to two decimals)
const sanitizeCurrency = (value: any): number => {
    if (value === null || value === undefined || isNaN(Number(value))) return 0.00;
    return parseFloat(Number(value).toFixed(2));
};

// Helper to process recharge history into monthly format
const processRechargeHistoryToMonthly = (rechargeHistory: RechargeHistoryItem[]): Array<{month: string, rechargeAmount: number, rechargeCount: number}> => {
    const monthlyRecharge: Record<string, {amount: number, count: number}> = {};
    
    rechargeHistory.forEach(item => {
        const month = item.rechargeDate.substring(0, 7); // Extract YYYY-MM
        if (!monthlyRecharge[month]) {
            monthlyRecharge[month] = { amount: 0, count: 0 };
        }
        monthlyRecharge[month].amount += sanitizeCurrency(item.totalAmount);
        monthlyRecharge[month].count += 1;
    });
    
    return Object.entries(monthlyRecharge).map(([month, data]) => ({
        month,
        rechargeAmount: sanitizeCurrency(data.amount),
        rechargeCount: data.count
    })).sort((a, b) => a.month.localeCompare(b.month));
};

// --- Prompt Generators ---
function generateBanglaAiDashboardPrompt(monthlyConsumption: MonthlyConsumption[], monthlyRechargeData: any, recentDailyConsumption: DailyConsumption[], currentBalance: number, currentMonth: string, readingTime?: string): string {
    // Only use readingTime for as-of date
    let asOfNotice = '';
    if (readingTime) {
        const latestDate = new Date(readingTime).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const daysBehind = Math.floor((new Date(today).getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24));
        asOfNotice = daysBehind > 0
            ? `তথ্য সর্বশেষ আপডেট হয়েছে ${latestDate} পর্যন্ত, যা আজকের (${today}) থেকে ${daysBehind} দিন পিছিয়ে থাকতে পারে (DESCO API দেরির কারণে)। দয়া করে আপনার মিটার দেখে সর্বশেষ তথ্য যাচাই করুন।`
            : `তথ্য সর্বশেষ আপডেট: ${latestDate}`;
    } else {
        asOfNotice = '';
    }
    return `
${asOfNotice}
আপনি একজন বিদ্যুৎ বিল ও রিচার্জ বিশ্লেষক, যিনি সাধারণ মানুষের জন্য সহজ ভাষায়, বন্ধুর মতো বোঝান। কঠিন শব্দ বা জটিল ব্যাখ্যা এড়িয়ে চলুন। দৈনন্দিন জীবনের মতো সহজ, গল্পের ছলে, মানুষের সাথে কথা বলার মতো করে ব্যাখ্যা দিন।

${asOfNotice ? `আপনার ব্যাখ্যার শুরুতেই বা সারাংশে নিচের তথ্যটি বন্ধুর মতো স্বাভাবিকভাবে উল্লেখ করুন: "${asOfNotice}"।` : ''}

আপনার ব্যাখ্যা যেন আরও বিস্তারিত, গল্পের মতো এবং উৎসাহব্যঞ্জক হয়। প্রতিটি অংশে উদাহরণ, ছোট গল্প, বা বাস্তব জীবনের তুলনা ব্যবহার করুন। ব্যবহারকারীর পাশে থেকে, বন্ধুর মতো সহানুভূতিশীল ও ইতিবাচক ভঙ্গিতে পরামর্শ দিন।

গ্রাহকের বিদ্যুৎ ব্যবহার, রিচার্জ ইতিহাস, সাম্প্রতিক দৈনিক ব্যবহার ও বর্তমান ব্যালান্স দেখে সহজ, কার্যকরী ও উৎসাহব্যঞ্জক পরামর্শ দিন। মৌসুমি প্রবণতা, অস্বাভাবিকতা, রিচার্জের ধরন, এবং সামনে কী করলে ভালো হয়—এসব নিয়ে আলাপ করুন।

*গত ২৪ মাসের বিদ্যুৎ ব্যবহার (JSON array, মাস অনুযায়ী):*
${JSON.stringify(monthlyConsumption)}

*গত ২৪ মাসের রিচার্জ ইতিহাস (JSON array, মাস অনুযায়ী):*
${JSON.stringify(monthlyRechargeData)}

*সাম্প্রতিক ১৪ দিনের দৈনিক ব্যবহার (JSON array):*
${JSON.stringify(recentDailyConsumption)}

*বর্তমান তথ্য:*
- মিটার ব্যালান্স: ${currentBalance} টাকা
- বর্তমান মাস: ${currentMonth}

নিচের কাঠামোতে শুধুমাত্র JSON আকারে উত্তর দিন (কোনো ব্যাখ্যা ছাড়াই):
{
  "title": "ব্যক্তিগত, উৎসাহব্যঞ্জক শিরোনাম (যেমন: 'গরমের মাসে স্মার্জ রিচার্জ টিপস', 'আপনার জুলাই পাওয়ার স্ন্যাপশট')",
  "overallSummary": "গড় মাসিক ব্যবহার (kWh) ও রিচার্জ (টাকা), এবং মূল ব্যবহার-রিচার্জের ধরন ২-৩ লাইনে বলুন। আরও বিস্তারিত দিন—যেমন, বিগত মাসের তুলনা, ছোট গল্প বা বাস্তব উদাহরণ যোগ করুন।",
  "anomaly": {
    "detected": true বা false,
    "details": "কোনো মাসে ব্যবহার বা রিচার্জ ৬ মাসের গড় থেকে ৫০% বেশি/কম হলে, এক লাইনে বলুন (যেমন: 'জানুয়ারি ২০২৪-এ অস্বাভাবিক কম ব্যবহার হয়েছে (৳৫২৩.২), যা আপনার স্বাভাবিকের চেয়ে অনেক কম।'), না হলে ফাঁকা রাখুন। উদাহরণ বা তুলনা দিন যেন ব্যবহারকারী বুঝতে পারেন।"
  },
  "seasonalTrend": {
    "observed": true বা false,
    "details": "কোনো মৌসুমি প্রবণতা থাকলে (যেমন: 'গরমে এসি চালানোর জন্য বেশি ব্যবহার'), সংক্ষেপে বলুন, এবং বাস্তব জীবনের উদাহরণ বা গল্প যোগ করুন, না থাকলে ফাঁকা রাখুন।"
  },
  "rechargePatternInsight": "রিচার্জের ধরন সহজ ভাষায় বলুন—যেমন, 'প্রতি মাসে ২-৩ বার রিচার্জ করেন, সাধারণত ব্যবহার অনুযায়ী'। আরও বিস্তারিত দিন—কখন বেশি রিচার্জ করেন, কোনো বিশেষ উপলক্ষ্যে কি বেশি রিচার্জ করেন ইত্যাদি।",
  "balanceStatusAndAdvice": {
    "status": "low", "normal", বা "good",
    "details": "বর্তমান ব্যালান্স মাসের বাকি সময়ের জন্য যথেষ্ট কি না, সহজ ভাষায় বলুন। কম হলে কারণ ব্যাখ্যা করুন এবং উৎসাহব্যঞ্জক পরামর্শ দিন।"
  },
  "rechargeRecommendation": {
    "recommendedAmountBDT": সংখ্যা বা 0.00,
    "justification": "গত বছরের এই মাসের গড় খরচ দেখে, কত টাকা রিচার্জ করলে ভালো হয়, সহজ ভাষায় বলুন এবং একটি ছোট গল্প বা উদাহরণ দিন।"
  },
  "rechargeTimingInsight": "কখন রিচার্জ করলে ভালো হয়, সহজ ও গল্পের ছলে বলুন (যেমন: 'গরমে মাসের শুরুতেই রিচার্জ করুন, তাহলে হঠাৎ ব্যালান্স শেষ হবে না')। বাস্তব জীবনের পরিস্থিতি বা অভিজ্ঞতা যোগ করুন।",
  "actionableTip": "ব্যবহার, সময় ও রিচার্জ নিয়ে এক লাইনের সহজ টিপস দিন (যেমন: 'জুলাইয়ের শুরুতেই ১০,০০০ টাকা রিচার্জ করুন, তাহলে মাঝপথে বিদ্যুৎ শেষ হবে না!')। টিপসটি যেন বন্ধুর মতো উৎসাহ দেয়।",
  "balanceDepletionForecast": {
    "daysRemaining": সংখ্যা,
    "expectedDepletionDate": "YYYY-MM-DD",
    "details": "সাম্প্রতিক দৈনিক গড় খরচ দেখে, ব্যালান্স কতদিন চলবে, সহজ ভাষায় বলুন এবং একটি ছোট গল্প বা তুলনা দিন।"
  },
  "currentMonthBillForecast": {
    "estimatedTotal": সংখ্যা,
    "details": "এই মাসের মোট বিল কত হতে পারে, সহজ ভাষায় বলুন এবং পূর্ববর্তী মাসের সাথে তুলনা করুন।"
  },
  "futureConsumptionForecast": [
    { "month": "YYYY-MM", "estimatedConsumption": সংখ্যা, "estimatedBill": সংখ্যা },
    { "month": "YYYY-MM", "estimatedConsumption": সংখ্যা, "estimatedBill": সংখ্যা },
    { "month": "YYYY-MM", "estimatedConsumption": সংখ্যা, "estimatedBill": সংখ্যা }
  ]
}

ভাষা সহজ, গল্পের মতো ও উৎসাহব্যঞ্জক রাখুন। কঠিন শব্দ বা জটিলতা এড়িয়ে চলুন। প্রতিটি অংশে বন্ধুর মতো সহানুভূতি ও ইতিবাচকতা রাখুন। শুধু JSON দিন, কোনো বাড়তি ব্যাখ্যা নয়।
`;
}

function generateEnglishAiDashboardPrompt(monthlyConsumption: MonthlyConsumption[], monthlyRechargeData: any, recentDailyConsumption: DailyConsumption[], currentBalance: number, currentMonth: string, readingTime?: string): string {
    // Only use readingTime for as-of date
    let asOfNotice = '';
    if (readingTime) {
        const latestDate = new Date(readingTime).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        const daysBehind = Math.floor((new Date(today).getTime() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24));
        asOfNotice = daysBehind > 0
            ? `The data is current as of ${latestDate}, which may be up to ${daysBehind} day(s) behind today (${today}) due to DESCO API delays. Please check your meter for the most up-to-date info.`
            : `Data current as of: ${latestDate}`;
    } else {
        asOfNotice = '';
    }
    return `
${asOfNotice}
Use a friendly, conversational tone as if you’re explaining to a friend or family member. Make your advice easy to follow, use simple language, and avoid technical jargon. Use analogies, relatable examples, and positive encouragement throughout.

${asOfNotice ? `At the start or in the initial summary, naturally mention the following info in a friendly way: "${asOfNotice}".` : ''}

You are an expert electricity bill and recharge analyst for residential customers. Your role is to generate concise, data-driven insights to help them optimize energy usage and financial planning, especially during high-consumption months. Your advice should be simple, actionable, and based on historical trends and recent activity.

For each section, provide a bit more detail than usual. Use short stories, analogies, or real-life examples to make your points relatable. Be supportive, non-judgmental, and encouraging—like a helpful friend who wants the best for the user.

Analyze the customer’s historical electricity consumption, recharge history, recent daily usage, and current balance. Focus on highlighting seasonal trends, anomalies, recharge behavior, and provide specific forward-looking recommendations.

*Historical Electricity Consumption Data (24 months, JSON array, sorted by month):* 
- 'month': year-month (e.g., "2024-01")
- 'consumedUnit': electricity consumption in kWh
- 'consumedTaka': cost of consumption in BDT

${JSON.stringify(monthlyConsumption)}

*Historical Electricity Recharge Data (24 months, JSON array, sorted by month):* 
- 'month': year-month (e.g., "2024-01")
- 'rechargeAmount': total BDT recharged in that month 
- 'rechargeCount': number of recharge transactions 

${JSON.stringify(monthlyRechargeData)}

*Recent Daily Consumption (last 14 days, JSON array):* 
- 'date': YYYY-MM-DD
- 'consumedUnit': kWh
- 'consumedTaka': BDT

${JSON.stringify(recentDailyConsumption)}

*Current Customer Info:* 
- Current Meter Balance: ${currentBalance} BDT
- Current Month (YYYY-MM): ${currentMonth}

Generate a JSON object using this structure:

{
  "title": "Personalized, encouraging title for the analysis (e.g., 'Smart Recharge Planning for Peak Season', 'Your July Power Snapshot')",

  "overallSummary": "Briefly summarize average monthly consumption (in kWh) and recharge (in BDT), along with key consumption-recharge behavior patterns (e.g., consistent, seasonal spikes, frequent top-ups). Add a bit more detail—compare recent months, use a short story or analogy, and make it feel like a friendly check-in.",

  "anomaly": {
    "detected": true or false,
    "details": "If any month had consumption or recharge that deviated significantly from the 6-month average (e.g., spike or drop >50%), describe in one sentence (e.g., 'Unusually low usage in Jan 2024 (৳523.2), well below your norm.'). If possible, add a relatable example or comparison. Otherwise, leave empty string."
  },

  "seasonalTrend": {
    "observed": true or false,
    "details": "If clear seasonal usage/recharge pattern exists (e.g., 'High summer usage due to AC.'), summarize it and add a real-life example or short story. Otherwise, leave empty string."
  },

  "rechargePatternInsight": "Describe recharge behavior briefly — e.g., ‘2-3 top-ups monthly, usually matching or slightly exceeding usage’. Add more detail—when do they recharge most, any special occasions, and how this pattern helps them manage their balance.",

  "balanceStatusAndAdvice": {
    "status": "low", "normal", or "good",
    "details": "Assess whether the current balance is sufficient for the rest of the current month, based on historical average consumption for this month (${currentMonth}). If low, explain why (e.g., 'Your current balance of ${currentBalance} BDT is not enough to cover typical July usage of X BDT.'). Give supportive, encouraging advice."
  },

  "rechargeRecommendation": {
    "recommendedAmountBDT": number or null,
    "justification": "Based on average cost for ${currentMonth} in past years, recommend an amount (e.g., 'To match your typical July usage of X BDT, recharge ৳10,000 to ensure coverage and a small buffer.'). Add a short story or example to make it relatable."
  },

  "rechargeTimingInsight": "Suggest optimal recharge timing based on past patterns and seasonal need (e.g., 'To avoid low balance during summer, recharge at the start of July and August.'). Add a real-life scenario or experience to make it more engaging. Avoid repeating previous info; focus on when to recharge.",

  "actionableTip": "One practical tip combining usage, timing, and recharge insight (e.g., 'Recharge ৳10,000 early in July to avoid mid-month outages during high-consumption periods.'). Make the tip sound like friendly encouragement.",

  "balanceDepletionForecast": {
    "daysRemaining": number,
    "expectedDepletionDate": "YYYY-MM-DD",
    "details": "Estimate based on recent daily average cost (last 14 days or latest full month if 14-day data is missing). Mention average daily cost, how long the current balance will last, and add a short story or analogy to help the user relate. If the expectedDepletionDate is before today’s date, acknowledge this (e.g., 'You’ve already passed the predicted depletion date, so your balance management is better than expected!')."
  },

  "currentMonthBillForecast": {
    "estimatedTotal": number,
    "details": "Project total bill for ${currentMonth} using current and historical data. Be clear about method used (e.g., extrapolation from recent usage, or same as last year's July). Compare with previous months if possible."
  },

  "futureConsumptionForecast": [
    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number },
    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number },
    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number }
  ]
}

Keep the language encouraging, friendly, and easy to understand for everyday users. Use analogies, examples, and positive reinforcement. Avoid duplication across sections. Output only the JSON — no surrounding explanation.
`;
}

// This service now calls the real DESCO API.
// NOTE: This may be blocked by the browser's CORS policy. 
// A backend proxy is the standard solution for production applications.
export const verifyAccount = async (accountNo: string): Promise<{ success: true; data: AccountInfo } | { success: false; message: string }> => {
    if (!accountNo || !/^\d+$/.test(accountNo) || accountNo.length < 5) {
        return { success: false, message: 'Invalid account number. Please enter only digits and ensure it is a valid length.' };
    }

    try {
        const response = await fetch(`https://prepaid.desco.org.bd/api/unified/customer/getCustomerInfo?accountNo=${accountNo}`);

        if (!response.ok) {
            let errorMessage = `Error: Account not found or API unavailable (status: ${response.status}).`;
            try {
                const errorJson = await response.json();
                if(errorJson.message) {
                    errorMessage = errorJson.message;
                }
            } catch (e) {
                // Body was not JSON or empty, use the generic message.
            }
            return { success: false, message: errorMessage };
        }

        const result = await response.json();

        if (result.code === 200 && result.data) {
            return { success: true, data: result.data };
        } else {
            return { success: false, message: result.message || 'Account not found or an unknown error occurred.' };
        }
    } catch (error) {
        console.error('Failed to verify account:', error);
        return { success: false, message: 'A network error occurred. This could be due to your connection or a CORS policy blocking the request.' };
    }
};

export const getAccountBalance = async (accountNo: string): Promise<{ success: true; data: BalanceData } | { success: false; message: string }> => {
    try {
        const response = await fetch(`https://prepaid.desco.org.bd/api/unified/customer/getBalance?accountNo=${accountNo}`);
        if (!response.ok) {
            return { success: false, message: `API error fetching balance (status: ${response.status})` };
        }
        
        const result: { code: number; desc: string; data: BalanceData | null; message?: string } = await response.json();

        if (result.code === 200 && result.data) {
            // Sanitize all currency fields in BalanceData
            const sanitizedData = { ...result.data };
            if ('balance' in sanitizedData) sanitizedData.balance = sanitizeCurrency(sanitizedData.balance);
            if ('emergencyBalance' in sanitizedData) sanitizedData.emergencyBalance = sanitizeCurrency(sanitizedData.emergencyBalance);
            return { success: true, data: sanitizedData };
        }
        
        return { success: false, message: result.message || 'Could not fetch balance from API response.' };
    } catch (error) {
        console.error(`Failed to fetch balance for account ${accountNo}:`, error);
        return { success: false, message: 'A network error occurred while fetching balance.' };
    }
};

export const getAiDashboardSummary = async (
    monthlyConsumption: MonthlyConsumption[], 
    rechargeHistory: RechargeHistoryItem[], 
    currentBalance: number, 
    currentMonth: string,
    recentDailyConsumption: DailyConsumption[],
    banglaEnabled: boolean = false,
    readingTime?: string
): Promise<AiSummary> => {
    // Sanitize currency in monthlyConsumption
    const sanitizedMonthlyConsumption = monthlyConsumption.map(item => ({
        ...item,
        consumedTaka: sanitizeCurrency(item.consumedTaka)
    }));
    // Sanitize currency in rechargeHistory
    const sanitizedRechargeHistory = rechargeHistory.map(item => ({
        ...item,
        totalAmount: sanitizeCurrency(item.totalAmount)
    }));
    // Sanitize currency in recentDailyConsumption
    const sanitizedRecentDailyConsumption = recentDailyConsumption.map(item => ({
        ...item,
        consumedTaka: sanitizeCurrency(item.consumedTaka)
    }));
    // Sanitize currentBalance
    const sanitizedCurrentBalance = sanitizeCurrency(currentBalance);

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your Vercel environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });

    // --- Model and temperature config ---
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';
    let temperature = 0.3;
    if (process.env.GEMINI_TEMPERATURE) {
        const parsed = parseFloat(process.env.GEMINI_TEMPERATURE);
        if (!isNaN(parsed)) temperature = parsed;
    }

    // Process recharge history into monthly format
    const monthlyRechargeData = processRechargeHistoryToMonthly(sanitizedRechargeHistory);

    const prompt = banglaEnabled
        ? generateBanglaAiDashboardPrompt(sanitizedMonthlyConsumption, monthlyRechargeData, sanitizedRecentDailyConsumption, sanitizedCurrentBalance, currentMonth, readingTime)
        : generateEnglishAiDashboardPrompt(sanitizedMonthlyConsumption, monthlyRechargeData, sanitizedRecentDailyConsumption, sanitizedCurrentBalance, currentMonth, readingTime);

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature
        }
    });

    let jsonStr = response.text?.trim() || '';
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    try {
        return JSON.parse(jsonStr) as AiSummary;
    } catch (e) {
        console.error("Failed to parse AI response:", jsonStr, e);
        throw new Error("Failed to get a valid analysis from the AI.");
    }
};

/**
 * Ask Gemini a free-form question about the user's account, using available data.
 * @param question The user's question
 * @param data The raw account data (e.g., from useDashboardData)
 * @param processedData The processed dashboard data
 * @param banglaEnabled Whether to answer in Bangla
 * @returns Gemini's answer as a string
 */
export async function askGeminiAboutAccount(
    question: string,
    data: any,
    processedData: any,
    banglaEnabled: boolean = false
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in your Vercel environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-04-17';
    let temperature = 0.3;
    if (process.env.GEMINI_TEMPERATURE) {
        const parsed = parseFloat(process.env.GEMINI_TEMPERATURE);
        if (!isNaN(parsed)) temperature = parsed;
    }
    // Compose a prompt with the user's question and available data
    let prompt = '';
    if (banglaEnabled) {
        prompt = `আপনি একজন বিদ্যুৎ বিল ও রিচার্জ বিশ্লেষক, যিনি সাধারণ মানুষের জন্য সহজ ভাষায়, বন্ধুর মতো বোঝান।\n\nনিচে গ্রাহকের বিদ্যুৎ সংক্রান্ত তথ্য ও ব্যবহারকারীর প্রশ্ন দেয়া হলো।\n\n*গ্রাহকের তথ্য (JSON):*\n${JSON.stringify(data, null, 2)}\n\n*প্রসেসড ড্যাশবোর্ড ডেটা (JSON):*\n${JSON.stringify(processedData, null, 2)}\n\n*প্রশ্ন:*\n${question}\n\nসহজ, গল্পের মতো, বন্ধুর মতো উত্তর দিন। কঠিন শব্দ বা জটিলতা এড়িয়ে চলুন।`; 
    } else {
        prompt = `You are an expert electricity bill and recharge analyst for residential customers.\n\nBelow is the user's account data and their question.\n\n*Account Data (JSON):*\n${JSON.stringify(data, null, 2)}\n\n*Processed Dashboard Data (JSON):*\n${JSON.stringify(processedData, null, 2)}\n\n*User's Question:*\n${question}\n\nAnswer in a friendly, conversational, and encouraging tone. Use simple language and examples if helpful.`;
    }
    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "text/plain",
            temperature
        }
    });
    return response.text?.trim() || 'Sorry, I could not get an answer.';
}

// --- New Dashboard APIs ---

export const getCustomerLocation = async (accountNo: string): Promise<CustomerLocation> => {
    const response = await fetch(`https://prepaid.desco.org.bd/api/common/getCustomerLocation?accountNo=${accountNo}`);
    if (!response.ok) throw new Error('Failed to fetch customer location');
    const result = await response.json();
    if (result.code !== 200 || !result.data) throw new Error(result.message || 'Invalid data for customer location');
    return result.data;
};

export const getCustomerDailyConsumption = async (accountNo: string, meterNo: string, days: number = 30): Promise<DailyConsumption[]> => {
    const today = new Date();
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - (days - 1));
    
    const url = `https://prepaid.desco.org.bd/api/unified/customer/getCustomerDailyConsumption?accountNo=${accountNo}&meterNo=${meterNo}&dateFrom=${formatDate(fromDate)}&dateTo=${formatDate(today)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch daily consumption');
    const result = await response.json();
    if (result.code !== 200 || !result.data) throw new Error(result.message || 'Invalid data for daily consumption');
    // Sanitize currency in result.data
    return result.data.map((item: DailyConsumption) => ({
        ...item,
        consumedTaka: sanitizeCurrency(item.consumedTaka)
    }));
};


export const getRechargeHistory = async (accountNo: string, meterNo: string, year: number): Promise<RechargeHistoryItem[]> => {
    const fromDate = new Date(year, 0, 1); // January 1st of the selected year
    const toDate = new Date(year, 11, 31); // December 31st of the selected year

    const url = `https://prepaid.desco.org.bd/api/unified/customer/getRechargeHistory?accountNo=${accountNo}&meterNo=${meterNo}&dateFrom=${formatDate(fromDate)}&dateTo=${formatDate(toDate)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch recharge history for ${year}`);
    const result = await response.json();
    if (result.code !== 200 || !result.data) return []; // Return empty array if no data
    // Sanitize currency in result.data
    return result.data.map((item: RechargeHistoryItem) => ({
        ...item,
        totalAmount: sanitizeCurrency(item.totalAmount)
    }));
};

export const getCustomerMonthlyConsumption = async (accountNo: string, meterNo: string, months: number = 24): Promise<MonthlyConsumption[]> => {
    const today = new Date();
    const toMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const fromMonth = new Date();
    fromMonth.setMonth(toMonth.getMonth() - (months - 1));

    const url = `https://prepaid.desco.org.bd/api/unified/customer/getCustomerMonthlyConsumption?accountNo=${accountNo}&meterNo=${meterNo}&monthFrom=${formatMonth(fromMonth)}&monthTo=${formatMonth(toMonth)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch monthly consumption');
    const result = await response.json();
    if (result.code !== 200 || !result.data) throw new Error(result.message || 'Invalid data for monthly consumption');
    // Sanitize currency in result.data
    return result.data.map((item: MonthlyConsumption) => ({
        ...item,
        consumedTaka: sanitizeCurrency(item.consumedTaka)
    }));
};