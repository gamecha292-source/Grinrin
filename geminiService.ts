
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectIdea, Task, Department, TaskStatus, Employee } from "./types";

// Always use a named parameter and direct process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates innovative HR project ideas using Gemini.
 * Uses 'gemini-3-pro-preview' for complex brainstorming and creative reasoning tasks.
 */
export const generateHRProjectIdeas = async (retailChallenge: string, availableDepartments: string[]): Promise<ProjectIdea[]> => {
  const depts = availableDepartments.join(", ");
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `สร้างไอเดียโปรเจกต์ HR นวัตกรรมใหม่ 3 ไอเดียสำหรับบริษัทค้าปลีกเพื่อแก้ปัญหาความท้าทายนี้: "${retailChallenge}".
    เน้นการประสานงานระหว่างแผนกต่างๆ เหล่านี้: ${depts}
    **สำคัญ: ทุกข้อความใน JSON ต้องเป็นภาษาไทย**`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "ชื่อโปรเจกต์" },
            description: { type: Type.STRING, description: "คำอธิบาย" },
            objective: { type: Type.STRING, description: "วัตถุประสงค์" },
            keySteps: { 
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "ขั้นตอนหลัก"
            },
            impact: { type: Type.STRING, description: "ผลกระทบที่คาดหวัง" }
          },
          required: ["title", "description", "objective", "keySteps", "impact"]
        }
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return [];
  }
};

/**
 * Parses a natural language prompt into a structured Task object.
 * Uses 'gemini-3-flash-preview' for fast parsing and extraction.
 */
export const parseTaskFromPrompt = async (prompt: string, employees: Employee[], availableDepartments: string[]): Promise<any> => {
  const employeeList = employees.map(e => `${e.name} (ID: ${e.id}, แผนก: ${e.department})`).join(", ");
  const departments = availableDepartments.join(", ");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `จากข้อความคำสั่งงานนี้: "${prompt}" 
    จงวิเคราะห์และสร้างข้อมูลงานในรูปแบบ JSON.
    รายชื่อพนักงานที่สามารถมอบหมายได้: ${employeeList}
    รายการแผนก: ${departments}
    
    ถ้าไม่ระบุพนักงาน ให้เลือกพนักงานที่เหมาะสมที่สุดตามแผนกที่วิเคราะห์ได้ หรือระบุ assigneeId เป็น ""
    **สำคัญ: ทุกข้อความใน JSON ต้องเป็นภาษาไทย**`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "หัวข้องานที่กระชับ" },
          description: { type: Type.STRING, description: "รายละเอียดงาน" },
          department: { type: Type.STRING, description: "แผนกที่รับผิดชอบ (ต้องตรงกับรายการที่ให้มา)" },
          assigneeId: { type: Type.STRING, description: "ID ของพนักงานที่ได้รับมอบหมาย" },
          assigneeName: { type: Type.STRING, description: "ชื่อของพนักงานที่ได้รับมอบหมาย" },
          deadline: { type: Type.STRING, description: "วันที่ครบกำหนดรูปแบบ YYYY-MM-DD" },
          suggestedSubTasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "รายการงานย่อยที่แนะนำ"
          }
        },
        required: ["title", "description", "department", "assigneeId", "assigneeName", "deadline"]
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse Task from Gemini", error);
    return null;
  }
};
