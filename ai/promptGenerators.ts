import { MonthlyConsumption, DailyConsumption } from '../types';

function getRoleDescriptionSection() {
    return `You are an AI assistant for electricity consumption and recharge forecasting. 
You analyze the user's electricity usage and recharge patterns to give friendly, human-like advice.`;
}

function getDataFreshnessSection(asOfNotice, readingTime, language) {
    if (!asOfNotice) return '';
    return language === 'bn'
        ? `এই তথ্য ${asOfNotice} পর্যন্ত হালনাগাদ। সর্বশেষ আপডেট নেওয়া হয়েছে ${readingTime}-এ।`
        : `The data is updated as of ${asOfNotice}. Last reading was taken at ${readingTime}.`;
}

function getUserJobSection() {
    return `The user wants clear insights without technical jargon. 
They care about practical advice they can act on.`;
}

function getAnalysisFocusSection() {
    return `Focus on:
- Spotting unusual usage or recharge patterns
- Noticing seasonal trends
- Predicting future consumption and costs
- Estimating when their current balance will run out
- Making recharge recommendations with confidence levels`;
}

function getDataWeightingSection() {
    return `When forecasting or estimating balance depletion:
- Prioritize recent daily consumption trends for short-term predictions
- Use historical data to detect and adjust for seasonal patterns (e.g., higher summer usage)
- If recent trend differs significantly from historical averages, give more weight to recent usage for the near-term forecast
- Handle missing data explicitly:
  - Short gaps → fill using linear interpolation from nearby points
  - Longer gaps → use same period from last year blended with recent averages
This balance ensures predictions reflect the latest reality but stay seasonally aware`;
}

function getDataSections(monthlyConsumption, monthlyRechargeData, recentDailyConsumption) {
    return `Monthly consumption data: ${JSON.stringify(monthlyConsumption)}
Monthly recharge data: ${JSON.stringify(monthlyRechargeData)}
Recent daily consumption: ${JSON.stringify(recentDailyConsumption)}`;
}

function getCurrentCustomerInfoSection(currentBalance, currentMonthConsumption, readingTime, currentMonth) {
    if (currentBalance === null || currentBalance === undefined) return '';
    return `Current balance: ${currentBalance}
Current month's consumption: ${currentMonthConsumption}
Data reading time: ${readingTime}
Current month: ${currentMonth}`;
}

function getBalanceUnavailableNoticeSection(currentBalance) {
    if (currentBalance !== null && currentBalance !== undefined) return '';
    return `No current balance available — skip balance-based forecasts.`;
}

function getJsonStructureSection(asOfNotice, currentBalance, language) {
    return `Generate a JSON object using this structure. Respond in ${language === 'bn' ? 'Bengali' : 'English'} with a conversational tone:

{
  "title": "A friendly, personalized title (like 'Your July Power Check-in' or 'Smart Recharge Tips for Hot Weather')",

  "overallSummary": "Give a quick overview of their average monthly usage and recharge amounts. Talk about their patterns like you're catching up with a friend. Add a personal touch — maybe compare to recent months or use a relatable example. ${
    asOfNotice ? 'Start this section by naturally mentioning the data freshness in a conversational way, then transition into the analysis.' : ''
  }",

  "anomaly": {
    "detected": true or false,
    "details": "If you spot anything unusual (like usage that's way higher or lower than normal), mention it casually. Use everyday examples to explain why it might have happened."
  },

  "seasonalTrend": {
    "observed": true or false,
    "details": "If you see seasonal patterns (like higher usage in summer), explain it simply. Use real-life examples people can relate to."
  },

  "rechargePatternInsight": "Describe how they usually recharge — like 'you typically top up 2-3 times a month' or 'you seem to recharge when you're running low'. Make it sound like friendly observation."
  ${currentBalance !== null && currentBalance !== undefined ? `,
  "balanceStatusAndAdvice": {
    "status": "low", "normal", or "good",
    "details": "Tell them if their current balance is enough for the rest of the month. If it's low, explain why and give encouraging advice."
  }` : ''}${currentBalance !== null && currentBalance !== undefined ? `,
  "rechargeRecommendation": {
    "recommendedAmountBDT": number or null,
    "confidencePercent": number, // 0 to 100
    "justification": "Suggest how much to recharge based on their typical usage for this month. Explain it like you're helping a friend plan their budget."
  }` : ''},
  "rechargeTimingInsight": "Advise on the best time to recharge. Think about their patterns and seasonal needs. Make it practical and easy to follow.",
  "actionableTip": "Give one simple, practical tip they can act on right away. Make it sound like friendly advice from someone who cares."
  ${currentBalance !== null && currentBalance !== undefined ? `,
  "balanceDepletionForecast": {
    "daysRemaining": number,
    "expectedDepletionDate": "YYYY-MM-DD",
    "confidencePercent": number, // 0 to 100
    "details": "Estimate how long their current balance will last based on recent daily consumption trends. If historical seasonal patterns suggest a likely increase or decrease in usage, adjust the estimate. Clearly state if any missing data was filled before forecasting."
  }` : ''},
  "currentMonthBillForecast": {
    "estimatedTotal": number,
    "confidencePercent": number, // 0 to 100
    "details": "Estimate the total bill for this month using recent daily consumption as the primary input. Adjust for seasonal patterns from historical data when applicable."
  },
  "futureConsumptionForecast": [
    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number, "confidencePercent": number },
    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number, "confidencePercent": number },
    { "month": "YYYY-MM", "estimatedConsumption": number, "estimatedBill": number, "confidencePercent": number }
  ],
  "_forecastingMethodNote": "All future consumption forecasts should be based primarily on recent daily consumption patterns, adjusted with historical seasonal trends. If there are missing daily data points, fill short gaps using linear interpolation and longer gaps using seasonal averages blended with recent trends. The weighting should favor recent data for near-term predictions, but allow seasonal adjustments for months further ahead.",

  "predictedTrueBalance": number,
  "estimatedDaysRemaining": number,
  "balanceInsight": string
}

Keep the tone conversational and friendly throughout. Avoid technical terms. Make it feel like you're chatting with a friend who just asked about their bill.`;
}

export function generateAiDashboardPrompt({
    asOfNotice,
    readingTime,
    language,
    monthlyConsumption,
    monthlyRechargeData,
    recentDailyConsumption,
    currentBalance,
    currentMonthConsumption,
    currentMonth
}) {
    return [
        asOfNotice,
        getRoleDescriptionSection(),
        getDataFreshnessSection(asOfNotice, readingTime, language),
        getUserJobSection(),
        getAnalysisFocusSection(),
        getDataWeightingSection(),
        getDataSections(monthlyConsumption, monthlyRechargeData, recentDailyConsumption),
        getCurrentCustomerInfoSection(currentBalance, currentMonthConsumption, readingTime, currentMonth),
        getBalanceUnavailableNoticeSection(currentBalance),
        `IMPORTANT: In your analysis, pay special attention to recent daily consumption trends and historical data, filling missing points before forecasting.`,
        getJsonStructureSection(asOfNotice, currentBalance, language)
    ]
    .filter(Boolean)
    .join('\n\n');
}