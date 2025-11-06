import React, { useState } from 'react';
import type { Pharmacy, SortKey } from '../types';
import { PharmacyCard } from './PharmacyCard';
import { MapPinIcon, ListIcon, LayoutIcon } from './icons';

interface ResultsPageProps {
  pharmacies: Pharmacy[];
  isLoading: boolean;
  statusText: string;
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
  sortBy: SortKey;
  onSortChange: (key: SortKey) => void;
  medicineChoices: string[];
  onMedicineSelect: (medicine: string) => void;
}

const SortButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
        active
          ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
          : 'bg-[#2a2a2a] text-gray-300 hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
  );
};

export const ResultsPage: React.FC<ResultsPageProps> = ({ 
  pharmacies, 
  isLoading, 
  statusText, 
  onSelectPharmacy, 
  sortBy, 
  onSortChange,
  medicineChoices,
  onMedicineSelect,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  
  const loadingContent = (
    <div className="text-center py-10">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-lg text-gray-300">{statusText || 'Searching for pharmacies...'}</p>
    </div>
  );

  const medicineSelectionContent = (
    <div className="container mx-auto text-center py-10 animate-fade-in">
        <h2 className="text-2xl font-bold text-white mb-4">Please Select a Medicine</h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">{statusText}</p>
        <div className="flex flex-wrap justify-center gap-4">
            {medicineChoices.map(medicine => (
                <button 
                    key={medicine}
                    onClick={() => onMedicineSelect(medicine)}
                    className="px-6 py-3 bg-[#1E1E1E] border border-gray-700 text-white font-bold rounded-full shadow-lg hover:bg-teal-500 hover:border-teal-500 transition-all duration-300 transform hover:scale-105"
                >
                    {medicine}
                </button>
            ))}
        </div>
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
    </div>
  );
  
  const pharmacyResultsContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
      <div className={`
        ${viewMode === 'map' ? 'hidden md:hidden' : ''}
        ${viewMode === 'split' ? 'lg:col-span-2' : 'col-span-1 md:col-span-2 lg:col-span-5'}
      `}>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          {pharmacies.map(p => (
            <PharmacyCard key={p.id} pharmacy={p} onClick={() => onSelectPharmacy(p)} />
          ))}
        </div>
      </div>
      
      <div className={`
        bg-[#1E1E1E] rounded-2xl min-h-[300px] md:min-h-0
        flex items-center justify-center
        ${viewMode === 'list' ? 'hidden md:hidden' : ''}
        ${viewMode === 'split' ? 'lg:col-span-3' : 'col-span-1 md:col-span-2 lg:col-span-5'}
      `}>
        <div className="text-center text-gray-500">
          <MapPinIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
          <p className="font-semibold">Interactive Map View</p>
          <p className="text-sm">Map would be displayed here.</p>
        </div>
      </div>
    </div>
  );

  const noResultsContent = (
     <p className="text-center text-gray-400 py-10">{statusText || 'No results found.'}</p>
  );

  const renderMainContent = () => {
    if (isLoading) return loadingContent;
    if (medicineChoices.length > 0 && pharmacies.length === 0) return medicineSelectionContent;
    if (pharmacies.length > 0) return pharmacyResultsContent;
    return noResultsContent;
  };


  return (
    <div className="container mx-auto">
      {!isLoading && pharmacies.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <SortButton active={sortBy === 'distance'} onClick={() => onSortChange('distance')}>Distance</SortButton>
            <SortButton active={sortBy === 'price'} onClick={() => onSortChange('price')}>Price</SortButton>
            <SortButton active={sortBy === 'availability'} onClick={() => onSortChange('availability')}>Availability</SortButton>
          </div>
          <div className="flex items-center bg-[#1E1E1E] p-1 rounded-full">
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-teal-500' : ''}`}><ListIcon className="h-5 w-5 text-white"/></button>
              <button onClick={() => setViewMode('split')} className={`p-2 rounded-full hidden md:block ${viewMode === 'split' ? 'bg-teal-500' : ''}`}><LayoutIcon className="h-5 w-5 text-white"/></button>
              <button onClick={() => setViewMode('map')} className={`p-2 rounded-full ${viewMode === 'map' ? 'bg-teal-500' : ''}`}><MapPinIcon className="h-5 w-5 text-white"/></button>
          </div>
        </div>
      )}
      {renderMainContent()}
    </div>
  );
};