import { StockStatus } from '../types';
import type { Pharmacy } from '../types';

interface Location {
  lat: number;
  lon: number;
}

// A more realistic, expanded dataset simulating a response from an API like Google Places
// Contains real coordinates for pharmacies in Bangalore, India, across various neighborhoods
const SIMULATED_GOOGLE_PLACES_PHARMACIES = [
    // Jayanagar & JP Nagar
    { id: 1, name: 'Apollo Pharmacy', address: 'Jayanagar 9th Block, Bangalore', phone: '080-2663-0919', lat: 12.9248, lon: 77.5843 },
    { id: 6, name: 'Sagar Apollo Pharmacy', address: 'Tilak Nagar, Jayanagar, Bangalore', phone: '080-4299-9999', lat: 12.9308, lon: 77.5838 },
    { id: 7, name: 'MedPlus JP Nagar', address: 'JP Nagar 1st Phase, Bangalore', phone: '080-2665-1111', lat: 12.9123, lon: 77.5872 },
    { id: 8, name: 'Planet Health', address: 'Jayanagar 4th Block, Bangalore', phone: '080-4121-1212', lat: 12.9314, lon: 77.5813 },

    // Koramangala & BTM Layout
    { id: 2, name: 'Wellness Forever', address: 'Koramangala 4th Block, Bangalore', phone: '080-4110-2222', lat: 12.9345, lon: 77.6264 },
    { id: 9, name: 'Fortis Healthworld', address: 'Koramangala 5th Block, Bangalore', phone: '080-4146-7676', lat: 12.9284, lon: 77.6268 },
    { id: 10, name: 'Medlife Pharmacy', address: 'BTM 2nd Stage, Bangalore', phone: '1860-123-123', lat: 12.9166, lon: 77.6111 },
    { id: 11, name: 'Aswin Medicals', address: 'Koramangala 1st Block, Bangalore', phone: '080-2550-4444', lat: 12.9442, lon: 77.6221 },

    // Indiranagar & Domlur
    { id: 3, name: 'MedPlus Pharmacy', address: 'Indiranagar, 100 Feet Rd, Bangalore', phone: '080-4092-7575', lat: 12.9784, lon: 77.6408 },
    { id: 12, name: 'Anu Medicals', address: 'CMH Road, Indiranagar, Bangalore', phone: '080-2525-1313', lat: 12.9719, lon: 77.6373 },
    { id: 13, name: 'GNC Live Well', address: '12th Main, Indiranagar, Bangalore', phone: '080-4164-8888', lat: 12.9718, lon: 77.6401 },
    { id: 14, name: 'Domlur Pharmacy', address: 'Domlur Layout, Bangalore', phone: '080-2535-1234', lat: 12.9625, lon: 77.6385 },
  
    // Malleshwaram & Rajajinagar
    { id: 4, name: 'Trust Pharmacy', address: 'Malleshwaram, 8th Cross Rd, Bangalore', phone: '080-2334-5566', lat: 12.9983, lon: 77.5701 },
    { id: 15, name: 'Subbiah Medical Stores', address: 'Margosa Road, Malleshwaram', phone: '080-2331-4545', lat: 13.0076, lon: 77.5682 },
    { id: 16, name: 'Navadurga Pharma', address: 'Rajajinagar 2nd Block, Bangalore', phone: '080-2332-7777', lat: 12.9904, lon: 77.5539 },
  
    // South & Central Bangalore
    { id: 5, name: 'Himalaya Pharmacy', address: 'Bannerghatta Main Rd, Bangalore', phone: '080-2658-2233', lat: 12.8994, lon: 77.5999 },
    { id: 17, name: 'Cash Pharmacy', address: 'Residency Road, Bangalore', phone: '080-2221-2221', lat: 12.9716, lon: 77.6053 },
    { id: 18, name: 'Banashankari Medicals', address: 'BSK 2nd Stage, Bangalore', phone: '080-2671-5555', lat: 12.9254, lon: 77.5466 },

    // Whitefield & Marathahalli
    { id: 19, name: 'RxDx Pharmacy', address: 'Whitefield Main Road, Bangalore', phone: '080-4922-2222', lat: 12.9698, lon: 77.7499 },
    { id: 20, name: 'Maruthi Medicals', address: 'Marathahalli Bridge, Bangalore', phone: '080-2524-1111', lat: 12.9569, lon: 77.7011 },
];

// Mock database of common medicine prices (per strip of 10-15 tablets) in Rupees
const MEDICINE_PRICES: { [key: string]: number } = {
    'paracetamol': 30,
    'ibuprofen': 45,
    'metformin': 60,
    'atorvastatin': 80,
    'amoxicillin': 75,
    'cetirizine': 25,
};

/**
 * Calculates the Haversine distance between two points on the Earth.
 * @param loc1 First location { lat, lon }
 * @param loc2 Second location { lat, lon }
 * @returns The distance in kilometers.
 */
function haversineDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLon = (loc2.lon - loc1.lon) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Simulates finding nearby pharmacies, calculating distances, and generating dynamic price/stock info.
 * @param userLocation The user's current latitude and longitude.
 * @param medicineName The name of the medicine being searched.
 * @returns A promise that resolves to an array of Pharmacy objects.
 */
export const findNearbyPharmacies = (userLocation: Location, medicineName: string): Promise<Pharmacy[]> => {
  return new Promise(resolve => {
    // Simulate network delay
    setTimeout(() => {
      const pharmaciesWithDistance = SIMULATED_GOOGLE_PLACES_PHARMACIES.map(pharmacy => ({
        ...pharmacy,
        distance: haversineDistance(userLocation, pharmacy),
      }));

      // Find the 10 closest pharmacies
      const closestPharmacies = pharmaciesWithDistance
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);
      
      const pharmaciesWithDetails = closestPharmacies.map(pharmacy => {
        // Simulate realistic pricing and stock
        const lowerCaseMedicine = medicineName.toLowerCase();
        const basePrice = MEDICINE_PRICES[lowerCaseMedicine] || (lowerCaseMedicine.length * 5 + Math.random() * 20);
        // Add slight price variation per pharmacy
        const price = basePrice * (1 + (Math.random() - 0.5) * 0.1); 
        const stockOptions = [StockStatus.InStock, StockStatus.InStock, StockStatus.InStock, StockStatus.LowStock, StockStatus.OutOfStock];
        const stock = stockOptions[Math.floor(Math.random() * stockOptions.length)];
        
        return {
          ...pharmacy,
          distance: parseFloat(pharmacy.distance.toFixed(1)),
          price: parseFloat(price.toFixed(2)),
          priceUnit: 'per strip of 10',
          stock,
          isBestOption: false, // We'll determine this next
        };
      });

      // Simple AI logic to determine the "Best Option" from the closest pharmacies
      // Prefers In Stock, then closest, then cheapest.
      let bestOption: Pharmacy | null = null;
      pharmaciesWithDetails
        .filter(p => p.stock !== StockStatus.OutOfStock)
        .forEach(p => {
            if (!bestOption) {
                bestOption = p;
            } else {
                if (p.stock === StockStatus.InStock && bestOption.stock === StockStatus.LowStock) {
                    bestOption = p;
                } else if (p.distance < bestOption.distance && p.price < bestOption.price + 5) {
                    bestOption = p;
                } else if (p.price < bestOption.price && p.distance < bestOption.distance + 1) {
                    bestOption = p;
                }
            }
        });

      if (bestOption) {
        bestOption.isBestOption = true;
      }
      
      resolve(pharmaciesWithDetails);
    }, 1500);
  });
};