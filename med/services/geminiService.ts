import { GoogleGenAI, Type } from "@google/genai";

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
 * Gets medicine recommendations for a given disease or symptom.
 * @param diseaseQuery The user's search query for a disease/symptom.
 * @returns A comma-separated string of recommended medicine names.
 */
export const getMedicineRecommendations = async (diseaseQuery: string): Promise<string> => {
  if (!ai) {
    console.error("Gemini API key not configured.");
    // Return a mock response for demonstration purposes
    if (diseaseQuery.toLowerCase().includes('fever')) {
        return "Paracetamol, Ibuprofen, Dolo 650";
    }
     if (diseaseQuery.toLowerCase().includes('headache')) {
        return "Paracetamol, Ibuprofen, Aspirin";
    }
    return ""; // a fallback for mock
  }

  try {
    const prompt = `Based on the user's query for a disease or symptom, recommend relevant medicine names. List common over-the-counter or prescription medicines. Provide the response as a single, comma-separated string of the top 1-3 medicine names. For example, for 'headache', return 'Paracetamol, Ibuprofen'. User query: '${diseaseQuery}'`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error getting medicine recommendations from Gemini API:", error);
    return "";
  }
};


/**
 * Validates a medicine name using the Gemini API.
 * @param medicineName The user's input for a medicine name.
 * @returns An object indicating if the name is valid and a corrected name if applicable.
 */
export const validateMedicineName = async (medicineName: string): Promise<{ valid: boolean; correctedName: string; reason: string }> => {
  if (!ai) {
    console.error("Gemini API key not configured.");
    // Mock response for demonstration
    const lowerCaseName = medicineName.toLowerCase();
    const knownMedicines = ['paracetamol', 'ibuprofen', 'metformin', 'aspirin', 'atorvastatin', 'amoxicillin', 'cetirizine', 'metformin 500mg', 'dolo 650'];
    
    if (knownMedicines.includes(lowerCaseName)) {
        const properName = lowerCaseName === 'dolo 650' ? 'Dolo 650' : medicineName.charAt(0).toUpperCase() + medicineName.slice(1).toLowerCase();
        return { valid: true, correctedName: properName, reason: '' };
    }
    if (lowerCaseName === 'paracetmol') {
        return { valid: true, correctedName: 'Paracetamol', reason: 'Corrected spelling.' };
    }
    if (medicineName.length < 3) {
      return { valid: false, correctedName: '', reason: `"${medicineName}" is too short to be a valid medicine name.` };
    }

    return { valid: false, correctedName: '', reason: `"${medicineName}" does not seem to be a valid medicine name. Please check the spelling.` };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a helpful medical assistant. The user has entered a medicine name. Please validate it.
        User input: "${medicineName}"
        Is this a recognized medicine name? If it is a common misspelling, correct it.
        Provide a response in JSON format with three fields:
        1. "valid": a boolean (true if it's a real medicine or a correctable misspelling, false otherwise).
        2. "correctedName": a string with the corrected, properly capitalized name if valid, otherwise an empty string.
        3. "reason": a brief explanation for the user, e.g., "Corrected spelling from 'paracetmol'." or "'asdfg' does not appear to be a medicine." if invalid.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN, description: "Whether the medicine name is valid or correctable." },
            correctedName: { type: Type.STRING, description: "The corrected or properly formatted medicine name." },
            reason: { type: Type.STRING, description: "A brief explanation for the validation result." },
          },
        },
      },
    });

    const jsonString = response.text.trim();
    if (jsonString.startsWith('{') && jsonString.endsWith('}')) {
        const result = JSON.parse(jsonString);
        return result;
    }
    // Fallback if the response isn't valid JSON, assume it's okay to proceed
    return { valid: true, correctedName: medicineName, reason: '' };
    
  } catch (error) {
    console.error("Error validating medicine name with Gemini API:", error);
    // Fallback to allow search if validation service fails, to not block the user
    return { valid: true, correctedName: medicineName, reason: 'Could not validate medicine name, but proceeding with search.' };
  }
};

/**
 * Gets medicine name autocomplete suggestions based on user input.
 * @param query The partial medicine name typed by the user.
 * @returns A promise that resolves to an array of suggestion strings.
 */
export const getMedicineSuggestions = async (query: string): Promise<string[]> => {
  if (!ai) {
    console.error("Gemini API key not configured.");
    // Mock response for demonstration
    const mockSuggestions: { [key: string]: string[] } = {
      'para': ['Paracetamol', 'Paracetamol 500mg', 'Paracetamol 650mg'],
      'ibu': ['Ibuprofen', 'Ibuprofen 400mg'],
      'met': ['Metformin', 'Metformin 500mg', 'Methotrexate'],
      'dolo': ['Dolo 650'],
    };
    const key = Object.keys(mockSuggestions).find(k => query.toLowerCase().startsWith(k));
    return key ? mockSuggestions[key] : [];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on the user's partial input, provide up to 5 common medicine names that start with these letters.
        User input: "${query}"
        Provide the response as a JSON array of strings. For example, for "para", return ["Paracetamol", "Paracetamol 500mg"].
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A medicine name suggestion."
          }
        },
      },
    });

    const jsonString = response.text.trim();
    if (jsonString.startsWith('[') && jsonString.endsWith(']')) {
      const result = JSON.parse(jsonString);
      return result;
    }
    return [];

  } catch (error) {
    console.error("Error getting medicine suggestions with Gemini API:", error);
    return [];
  }
};


/**
 * Gets a simple, user-friendly description of a medicine.
 * @param medicineName The name of the medicine.
 * @returns A promise that resolves to a description string.
 */
export const getMedicineDescription = async (medicineName: string): Promise<string> => {
  if (!ai) {
    console.error("Gemini API key not configured.");
    // Mock response for demonstration
    const lowerCaseName = medicineName.toLowerCase();
    if (lowerCaseName.includes('paracetamol') || lowerCaseName.includes('dolo 650')) {
      return 'Paracetamol, the active ingredient in Dolo 650, is a common pain reliever and fever reducer. It is used to treat many conditions such as headaches, muscle aches, arthritis, backache, toothaches, colds, and fevers.';
    }
    return `Information about ${medicineName} would be shown here.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a brief, simple, one-paragraph description for the medicine "${medicineName}". Write it for a layperson, focusing on its common use. For example, for 'Paracetamol', you could say 'Paracetamol is a common pain reliever and fever reducer used to treat many conditions such as headaches, muscle aches, arthritis, backache, toothaches, colds, and fevers.'`,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error getting medicine description from Gemini API:", error);
    return `Could not load information for ${medicineName}.`;
  }
};