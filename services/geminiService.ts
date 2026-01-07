
import { GoogleGenAI } from "@google/genai";

// Always use the standard initialization format with process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMatchCommentary = async (winnerName: string, loserName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a high-energy, funny, and slightly aggressive boxing commentator like Michael Buffer mixed with a comedian. 
      Announce the winner of a match between ${winnerName} and ${loserName}. 
      Keep it under 3 sentences. Be punchy (pun intended)!`,
      config: {
        temperature: 0.9,
      }
    });
    // The response features a .text property as per guidelines
    return response.text || "IT'S ALL OVER! WHAT A FIGHT!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `THE FIGHT IS OVER! ${winnerName} STANDS TRIUMPHANT!`;
  }
};
