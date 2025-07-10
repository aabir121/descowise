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

export function generateBanglaAiDashboardPrompt(
    monthlyConsumption: MonthlyConsumption[],
    monthlyRechargeData: any,
    recentDailyConsumption: DailyConsumption[],
    currentBalance: number,
    currentMonth: string,
    readingTime?: string
): string {
    const asOfNotice = getAsOfNotice(readingTime, 'bn');
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

export function generateEnglishAiDashboardPrompt(
    monthlyConsumption: MonthlyConsumption[],
    monthlyRechargeData: any,
    recentDailyConsumption: DailyConsumption[],
    currentBalance: number,
    currentMonth: string,
    readingTime?: string
): string {
    const asOfNotice = getAsOfNotice(readingTime, 'en');
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