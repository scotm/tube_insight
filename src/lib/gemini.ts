import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
	throw new Error("GEMINI_API_KEY is not defined in the environment.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generativeModel = genAI.getGenerativeModel({
	model: "gemini-1.5-flash",
});
