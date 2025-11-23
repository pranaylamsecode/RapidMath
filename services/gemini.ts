import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question, QuestionType } from '../types';

const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const generateQuestions = async (topic: QuestionType, count: number = 5): Promise<Question[]> => {
  const model = "gemini-2.5-flash";

  // Define the schema for structured output
  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['simplification', 'series', 'quadratic', 'approximation'] },
        questionText: { type: Type.STRING, description: "The mathematical problem statement. For quadratic, provide two equations labeled I and II." },
        correctAnswer: { type: Type.STRING, description: "The precise numerical answer or relationship (e.g., x > y)." },
        explanation: { type: Type.STRING, description: "Short step-by-step logic to solve it." },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Exactly 5 plausible options including the correct one."
        }
      },
      required: ["id", "type", "questionText", "correctAnswer", "explanation", "options"]
    }
  };

  const prompt = `
    Generate ${count} unique, challenging IBPS RRB PO level math questions for the topic: "${topic}".
    
    Guidelines:
    - **Options**: EXACTLY 5 options are required for every question.
    - **Simplification/Approximation**: Use standard BODMAS. For Approximation, use values like 14.99% or 120.01. Answer matches one option exactly.
    - **Number Series**: Provide the sequence. Question text: "Find the missing term: 12, 24, ?, 96".
    - **Quadratic Equations**: Two equations (I and II). Answer choices MUST be: "x > y", "x >= y", "x < y", "x <= y", "x = y or no relation".
    - **Difficulty**: Moderate to High (PO Prelims/Mains level).
    
    Ensure answers are unambiguous.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7 // Slight randomness for variety
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];
    
    const parsed = JSON.parse(jsonText);
    return parsed as Question[];
  } catch (error) {
    console.error("Failed to generate questions:", error);
    // Fallback or re-throw depending on app needs
    return [];
  }
};

export const getDrillAnalysis = async (results: any): Promise<string> => {
   const model = "gemini-2.5-flash";
   const prompt = `
     Analyze this student's math drill performance:
     ${JSON.stringify(results)}
     
     Provide 3 concise, bullet-pointed tips to improve their speed and accuracy for IBPS PO exams. Focus on the types of errors made and time management.
     Be encouraging but technical (e.g., "Use unit digit method" or "Memorize squares up to 30").
   `;

   try {
     const response = await ai.models.generateContent({
       model,
       contents: prompt,
     });
     return response.text || "Keep practicing to improve speed!";
   } catch (e) {
     return "Great effort! Consistency is key.";
   }
};