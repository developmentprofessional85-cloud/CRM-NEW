
import { GoogleGenAI } from "@google/genai";

export async function suggestScopeOfWork(serviceType: string, clientName: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a professional 'Scope of Work' for a service quotation for ${clientName}. The service category is ${serviceType}. Keep it detailed, bulleted, and professional.`,
    });
    return response.text || "Professional scope of work details to be manually added.";
  } catch (error) {
    console.error("AI Scope suggestion failed:", error);
    return "Error generating AI suggestion.";
  }
}

export async function suggestTermsAndConditions(quoteType: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a concise set of professional 'Terms and Conditions' for a ${quoteType} business quotation. Focus on payment terms, validity, and standard liability.`,
    });
    return response.text || "Default terms and conditions apply.";
  } catch (error) {
    console.error("AI Terms suggestion failed:", error);
    return "Error generating AI terms.";
  }
}

export async function suggestClientResponsibilities(serviceType: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `List 5 standard client responsibilities for a professional service project involving ${serviceType}.`,
    });
    return response.text || "Standard site access and data provision.";
  } catch (error) {
    console.error("AI Responsibilities suggestion failed:", error);
    return "Error generating AI responsibilities.";
  }
}

export async function generateMeetingMinutes(notes: string, clientName: string, repName: string, base64Image?: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const textPart = {
      text: `
        Act as a professional Executive Assistant and Site Engineer. 
        Convert the provided data into a structured "Minutes of Meeting" (MoM).
        
        Client Name: ${clientName}
        Company Representative: ${repName}
        Raw Text Context (Transcripts/Notes): ${notes}

        IMPORTANT: If an image is provided, it contains handwritten site notes and sketches. 
        Perform OCR on the handwriting and include those observations in the final MoM.

        Format:
        1. Executive Summary
        2. Site Observations & Dimensions (Extracted from sketch/handwriting)
        3. Key Discussion Points
        4. Decisions Made
        5. Action Items
        6. Next Steps
      `
    };

    interface ContentPart {
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }

    const parts: ContentPart[] = [textPart];
    
    if (base64Image) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Image.split(',')[1] // Strip prefix
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
    });
    
    return response.text || "Could not generate minutes from the provided data.";
  } catch (error) {
    console.error("AI MoM generation failed:", error);
    return "AI error: Unable to process data. Check your connection or API key.";
  }
}
