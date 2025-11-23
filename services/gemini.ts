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
          description: "4-5 plausible options including the correct one."
        }
      },
      required: ["id", "type", "questionText", "correctAnswer", "explanation", "options"]
    }
  };

  const prompt = `
    Generate ${count} unique, challenging IBPS RRB PO level math questions for the topic: "${topic}".
    
    Guidelines:
    - For 'Number Series', provide the series with a missing term (marked as ?) or finding the wrong term.
    - For 'Simplification/Approximation', use standard BODMAS rules. Complex calculations but solvable mentally or with quick scribbling.
    - For 'Quadratic Equations', provide two equations (I and II) involving x and y. The answer should be the relationship (e.g., x > y, x <= y, etc.).
    - Ensure answers are distinct and correct.
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
     
     Provide 3 concise, bullet-pointed tips to improve their speed and accuracy for IBPS PO exams. Focus on the types of errors made.
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