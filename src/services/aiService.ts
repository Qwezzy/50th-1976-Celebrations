import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODELS = {
  PRO: "gemini-3.1-pro-preview",
  FLASH: "gemini-3-flash-preview",
  LITE: "gemini-3.1-flash-lite-preview",
};

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function getLegacyAssistantResponse(history: ChatMessage[], prompt: string) {
  const chat = ai.chats.create({
    model: MODELS.PRO,
    config: {
      systemInstruction: `You are the Soweto 50th Anniversary Legacy Assistant. 
      Your role is to help users understand the Soweto 50th Anniversary Legacy Process, its historical significance (June 16, 1976), 
      and how they can participate through their local churches.
      
      You have deep knowledge of:
      - The 'Class of 76' (the pioneers).
      - The 'Bridge Generation' (those turning 50 in 2026).
      - The 'Born-Free' generation.
      - The 'Rising Generation' (today's youth, focused on AI and Tech).
      
      Be respectful, inspiring, and informative. Use South African English where appropriate (e.g., 'Ubuntu', 'Lekker', 'Sharp').
      Encourage users to register for sessions and connect with their church leaders.`,
    },
  });

  const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
  return response.text;
}

export async function findNearbyChurches(location: { lat: number, lng: number }, query: string = "churches in Soweto") {
  const response = await ai.models.generateContent({
    model: MODELS.FLASH,
    contents: `Find ${query} near my current location.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: location.lat,
            longitude: location.lng,
          }
        }
      }
    },
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

export async function getQuickFact(topic: string) {
  const response = await ai.models.generateContent({
    model: MODELS.LITE,
    contents: `Give me a very brief, 1-sentence inspiring fact about ${topic} in the context of Soweto's history or future.`,
  });
  return response.text;
}
