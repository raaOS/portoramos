import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Basic text generation wrapper
 */
export async function generateText(prompt: string): Promise<string> {
    if (!API_KEY) {
        throw new Error("GEMINI_API_KEY is not configured in .env.local");
    }

    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("[Gemini] Generation failed:", error);
        throw error;
    }
}
