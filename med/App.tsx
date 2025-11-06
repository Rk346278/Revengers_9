import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { ResultsPage } from './components/ResultsPage';
import { PharmacyDetailModal } from './components/PharmacyDetailModal';
import { AccessibilityControls } from './components/AccessibilityControls';
import { getMedicineRecommendations } from './services/geminiService';
import { findNearbyPharmacies } from './services/pharmacyService';
// Fix: Import `StockStatus` as a value to access enum members, and other types as type-only.
import { StockStatus } from './types';
import type { Pharmacy, SortKey, FontSize } from './types';


export default function App() {
  const [page, setPage] = useState<'home' | 'results'>('home');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('distance');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [statusText, setStatusText] = useState('');
  const [medicineChoices, setMedicineChoices] = useState<string[]>([]);
  const [locationError, setLocationError] = useState<string>('');

  useEffect(() => {
    document.body.classList.remove('font-size-base', 'font-size-lg', 'font-size-xl');
    document.body.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);
  
  const handleMedicineSelect = (medicine: string) => {
    setPharmacies([]);
    setMedicineChoices([]);
    setLocationError('');
    setIsLoading(true);
    setStatusText('Getting your location...');

    if (!navigator.geolocation) {
      setIsLoading(false);
      setLocationError('Geolocation is not supported by your browser.');
      setStatusText('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setStatusText(`Finding pharmacies with ${medicine} near you...`);
        try {
          const foundPharmacies = await findNearbyPharmacies({ lat: latitude, lon: longitude }, medicine);
          setPharmacies(foundPharmacies);
        } catch (error) {
           console.error("Failed to find pharmacies:", error);
           setStatusText('Could not fetch pharmacy data.');
        } finally {
            setIsLoading(false);
            setStatusText('');
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMsg = 'Could not get your location. Please enable location services in your browser settings.';
        if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location access denied. Please allow location access to find nearby pharmacies.';
        }
        setLocationError(errorMsg);
        setStatusText(errorMsg);
        setIsLoading(false);
      }
    );
  };

  const handleSearch = async (query: string) => {
    if(!query.trim()) return;

    setIsLoading(true);
    setPage('results');
    setPharmacies([]);
    setMedicineChoices([]);
    setLocationError('');
    setStatusText('Consulting AI for medicine recommendations...');

    try {
      const recommendations = await getMedicineRecommendations(query);
      const choices = recommendations.split(',').map(m => m.trim()).filter(Boolean);
      
      if (choices.length === 0) {
        handleMedicineSelect(query);
      } else if (choices.length === 1) {
        handleMedicineSelect(choices[0]);
      } else {
        setMedicineChoices(choices);
        setIsLoading(false);
        setStatusText(`AI recommended the following for '${query}'. Please choose one.`);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setStatusText('An error occurred. Please try your search again.');
      setIsLoading(false);
    }
  };

  const sortedPharmacies = useMemo(() => {
    return [...pharmacies].sort((a, b) => {
      if (a.isBestOption) return -1;
      if (b.isBestOption) return 1;
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'distance':
          return a.distance - b.distance;
        case 'availability':
          const stockOrder = { [StockStatus.InStock]: 1, [StockStatus.LowStock]: 2, [StockStatus.OutOfStock]: 3 };
          return stockOrder[a.stock] - stockOrder[b.stock];
        default:
          return 0;
      }
    });
  }, [pharmacies, sortBy]);

  const handleFontSizeChange = () => {
    setFontSize(current => {
      if (current === 'base') return 'lg';
      if (current === 'lg') return 'xl';
      return 'base';
    });
  };

  return (
    <div className={`bg-[#121212] min-h-screen text-gray-200 selection:bg-teal-500/30 font-size-${fontSize}`}>
      <Header onHomeClick={() => setPage('home')} />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        {page === 'home' && <HomePage onSearch={handleSearch} />}
        {page === 'results' && (
          <ResultsPage
            pharmacies={sortedPharmacies}
            isLoading={isLoading}
            statusText={statusText || locationError}
            onSelectPharmacy={setSelectedPharmacy}
            sortBy={sortBy}
            onSortChange={setSortBy}
            medicineChoices={medicineChoices}
            onMedicineSelect={handleMedicineSelect}
          />
        )}
      </main>
      <PharmacyDetailModal
        pharmacy={selectedPharmacy}
        onClose={() => setSelectedPharmacy(null)}
      />
      <AccessibilityControls onFontSizeChange={handleFontSizeChange} />
    </div>
  );
}