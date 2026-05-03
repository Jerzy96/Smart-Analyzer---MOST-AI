import * as pdfjs from 'pdfjs-dist';
import { GoogleGenAI, Type } from "@google/genai";

// Konfiguracja workera PDF.js przy użyciu lokalnego pliku z paczki
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface TextPosition {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
}

export async function extractTextFromPdf(file: File): Promise<{ text: string, pages: string[], positions: TextPosition[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  const pageImages: string[] = [];
  const positions: TextPosition[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    
    // Extract text with positions
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.5 });
    
    const pageText = textContent.items.map((item: any) => {
      const { str, transform } = item;
      // transform is [a, b, c, d, e, f] -> e is x, f is y (from bottom-left)
      // We convert to percentages or scale relative to viewport
      const x = transform[4];
      const y = transform[5];
      
      // Approximating width based on item.width or font size
      positions.push({
        text: str,
        x: (x / viewport.viewBox[2]) * 100,
        y: 100 - ((y / viewport.viewBox[3]) * 100), // Invert Y
        w: (item.width / viewport.viewBox[2]) * 100,
        h: (item.height / viewport.viewBox[3]) * 100,
        page: i
      });
      
      return str;
    }).join(' ');
    
    fullText += `--- STRONA ${i} ---\n${pageText}\n\n`;

    // Render page to image for preview
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      pageImages.push(canvas.toDataURL('image/png'));
    }
  }

  return { text: fullText, pages: pageImages, positions };
}

const getApiKey = () => {
  return localStorage.getItem('custom_gemini_api_key') || (process.env.GEMINI_API_KEY as string);
};

export async function analyzeBrokerStatement(text: string) {
  const currentApiKey = getApiKey();
  if (!currentApiKey) {
    throw new Error("Brak klucza API. Skonfiguruj go w ustawieniach.");
  }
  
  const ai = new GoogleGenAI({ apiKey: currentApiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following broker statement text. 
    1. Extract financial data.
    2. For EACH extracted field, you MUST also provide the exact "evidenceSnippet" (the string exactly as it appears in the text) so I can highlight it.
    
    Text:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fundId: { type: Type.STRING },
          account: { type: Type.STRING },
          currency: { type: Type.STRING },
          cashOpening: { type: Type.NUMBER },
          cashClosing: { type: Type.NUMBER },
          equitiesOpening: { type: Type.NUMBER },
          equitiesClosing: { type: Type.NUMBER },
          marginOpening: { type: Type.NUMBER },
          marginClosing: { type: Type.NUMBER },
          freeMarginOpening: { type: Type.NUMBER },
          freeMarginClosing: { type: Type.NUMBER },
          confidenceScore: { type: Type.NUMBER },
          evidence: {
            type: Type.OBJECT,
            properties: {
              fundId: { type: Type.STRING },
              account: { type: Type.STRING },
              openingBalance: { type: Type.STRING }, // Matches App.tsx key
              closingBalance: { type: Type.STRING }, // Matches App.tsx key
              equities: { type: Type.STRING }
            }
          },
          transactions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                evidenceSnippet: { type: Type.STRING }
              },
              required: ["date", "type", "description", "amount", "currency", "evidenceSnippet"]
            }
          }
        },
        required: ["fundId", "currency", "cashOpening", "cashClosing", "evidence", "transactions"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Nie udało się przeanalizować dokumentu. Spróbuj ponownie.");
  }
}

export async function analyzeBrokerStatementWithTemplate(text: string, templatePrompt: string, fields: string[], context?: string) {
  const currentApiKey = getApiKey();
  if (!currentApiKey) {
    throw new Error("Brak klucza API. Skonfiguruj go w ustawieniach.");
  }
  
  const ai = new GoogleGenAI({ apiKey: currentApiKey });

  const dynamicProperties: any = {};
  fields.forEach(field => {
    dynamicProperties[field] = { type: Type.STRING };
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `SYSTEM CONTEXT:
    ${context || 'No additional system context.'}
    
    USER CUSTOM INSTRUCTIONS:
    ${templatePrompt}
    
    TASK:
    Extract values from the provided document text for the specific fields requested below. 
    You MUST follow the USER CUSTOM INSTRUCTIONS explicitly to derive or find these values.
    
    FIELDS TO EXTRACT: ${fields.join(', ')}
    
    TEXT TO ANALYZE:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: dynamicProperties,
        required: fields
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse template analysis response", e);
    throw new Error("Błąd podczas analizy szablonowej.");
  }
}
