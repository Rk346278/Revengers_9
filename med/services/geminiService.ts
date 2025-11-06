import { GoogleGenAI } from "@google/genai";

// This is a placeholder for the actual Gemini API key
// In a real production environment, this should be handled securely and not hardcoded.
const API_KEY = process.env.API_KEY;

// Ensure API_KEY is available before initializing
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/**
 * Parses a prescription image to identify the medicine name.
 * @param imageBase64 The base64 encoded string of the prescription image.
 * @returns The identified medicine name as a string.
 */
export const parsePrescription = async (imageBase64: string): Promise<string> => {
  if (!ai) {
    console.error("Gemini API key not configured.");
    // Return a mock response for demonstration purposes
    return "Metformin 500mg";
  }

  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg', // Assuming jpeg, could be dynamic
        data: imageBase64,
      },
    };

    const textPart = {
      text: "Identify the name of the prescribed medicine from this image. Provide only the name and dosage of the medication."
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error parsing prescription with Gemini API:", error);
    // Fallback for demonstration
    return "Error identifying medicine";
  }
};

/**
 * Gets medicine recommendations for a given query (disease or medicine name).
 * @param userQuery The user's search query.
 * @returns A comma-separated string of recommended medicine names.
 */
export const getMedicineRecommendations = async (userQuery: string): Promise<string> => {
  if (!ai) {
    console.error("Gemini API key not configured.");
    // Return a mock response for demonstration purposes
    if (userQuery.toLowerCase().includes('fever')) {
        return "Paracetamol, Ibuprofen";
    }
    return userQuery; // a fallback for mock
  }

  try {
    const prompt = `Based on the user's query, recommend relevant medicine names. If the query is a disease (e.g., 'fever', 'diabetes'), list common over-the-counter or prescription medicines. If the query is already a medicine name, just return that name. Please provide the response as a single, comma-separated string of the top 1-3 medicine names. For example, for 'headache', return 'Paracetamol, Ibuprofen'. For 'Lipitor', return 'Lipitor'. User query: '${userQuery}'`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const recommendations = response.text.trim();
    if (!recommendations) {
        // If Gemini returns empty, fallback to the original query
        return userQuery;
    }
    return recommendations;
  } catch (error) {
    console.error("Error getting medicine recommendations from Gemini API:", error);
    // Fallback to original query on error
    return userQuery;
  }
};