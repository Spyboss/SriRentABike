export interface BikeModel {
  id: string;
  name: string;
  dailyRateLKR: number;
  monthlyRateLKR: number; // For 30+ days
}

export const BIKE_MODELS: BikeModel[] = [
  {
    id: 'honda-dio',
    name: 'Honda Dio',
    dailyRateLKR: 2500,
    monthlyRateLKR: 60000,
  },
  {
    id: 'yamaha-ray-z',
    name: 'Yamaha Ray-Z',
    dailyRateLKR: 2800,
    monthlyRateLKR: 70000,
  },
  {
    id: 'tvs-jupiter',
    name: 'TVS Jupiter',
    dailyRateLKR: 2600,
    monthlyRateLKR: 65000,
  },
  {
    id: 'suzuki-access',
    name: 'Suzuki Access',
    dailyRateLKR: 3000,
    monthlyRateLKR: 75000,
  },
  {
    id: 'bajaj-pulsar',
    name: 'Bajaj Pulsar',
    dailyRateLKR: 4500,
    monthlyRateLKR: 110000,
  },
];

export const PRICING_RULES = {
  longTermDiscountDays: 3,
  longTermDiscountPercentage: 0.10, // 10% off for > 3 days
  outsideAreaRateLKR: 500, // Flat daily surcharge
};
