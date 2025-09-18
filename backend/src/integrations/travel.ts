// Integration stubs for Booking.com / Airbnb
export async function searchStays({ location, priceMax, stars }: { location: string; priceMax?: number; stars?: number; }) {
  return [
    { id: 'stay-1', name: `Hotel in ${location}`, price: 45, stars: 3 },
    { id: 'stay-2', name: `Apartment in ${location}`, price: 60, stars: 4 }
  ];
}