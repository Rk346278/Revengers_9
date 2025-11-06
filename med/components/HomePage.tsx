
import React, { useState, useRef } from 'react';
import { SearchIcon, CameraIcon, MicIcon } from './icons';
import { parsePrescription } from '../services/geminiService';

interface HomePageProps {
  onSearch: (query: string) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


export const HomePage: React.FC<HomePageProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        const base64 = await blobToBase64(file);
        const medicineName = await parsePrescription(base64);
        setQuery(medicineName);
        if (medicineName !== "Error identifying medicine") {
          onSearch(medicineName);
        }
      } catch (error) {
        console.error("Error processing prescription image:", error);
        setQuery("Could not read prescription");
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
      <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-4">
        Find Your Medicine <span className="text-teal-400">Near You.</span>
      </h1>
      <p className="max-w-2xl text-lg md:text-xl text-gray-400 mb-8">
        Instantly locate pharmacies, compare prices, and get AI-powered recommendations.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-[#1E1E1E] rounded-full shadow-2xl shadow-teal-900/20 p-2 flex items-center transition-all focus-within:ring-2 focus-within:ring-cyan-500">
        <SearchIcon className="h-6 w-6 text-gray-500 ml-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter medicine or disease name..."
          className="w-full bg-transparent text-lg text-white placeholder-gray-500 border-none focus:ring-0 px-4 py-2"
        />
        <div className="flex items-center space-x-1 mr-1">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <button type="button" onClick={handleScanClick} className="p-3 rounded-full hover:bg-gray-700 transition-colors" aria-label="Upload or Scan Prescription">
            {isProcessingImage ? (
                <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <CameraIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <button type="button" className="p-3 rounded-full hover:bg-gray-700 transition-colors" aria-label="Voice Search">
            <MicIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </form>
      <button 
        onClick={() => onSearch(query)}
        className="mt-8 px-10 py-4 bg-teal-500 text-white font-bold text-lg rounded-full shadow-lg shadow-teal-500/30 hover:bg-teal-400 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300">
        Search Medicine
      </button>
    </div>
  );
};