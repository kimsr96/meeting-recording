import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeMeeting = async (transcript: string, historySummary?: string) => {
  const prompt = `
    You are an expert F&B business consultant specializing in South Korean restaurant franchises. 
    Analyze the following meeting transcript. Note that the transcript may contain F&B specific terms 
    (menu items like '마라로제', '청양마요', and operations like '발주', '재고관리').
    
    TRANSCRIPT:
    ${transcript}
    
    ${historySummary ? `PAST CONTEXT/HISTORY:\n${historySummary}` : ''}
    
    TASKS:
    1. Summarize the meeting briefly.
    2. Categorize customer feedback into Positive/Negative and mention specific menu items.
    3. Identify key decisions made.
    4. Extract actionable items with assignee, task, and deadline if mentioned.
    5. Connection to History: If PAST CONTEXT is provided, identify recurring issues or progress on previous items.
    
    Return the response in JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          insights: {
            type: Type.OBJECT,
            properties: {
              customerFeedback: { type: Type.STRING, description: "Structured feedback analysis" },
              decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    task: { type: Type.STRING },
                    assignee: { type: Type.STRING },
                    deadline: { type: Type.STRING }
                  }
                }
              }
            }
          },
          historyConnection: { type: Type.STRING, description: "Analysis of recurring issues compared to history" }
        },
        required: ["summary", "insights"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
