import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
	throw new Error("GEMINI_API_KEY is not defined in the environment.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const modelName = "gemini-2.5-flash-lite" as const;
export const generativeModel = genAI.getGenerativeModel({
	model: modelName,
});
