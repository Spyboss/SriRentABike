export interface BikeModel {
  id: string;
  name: string;
  /** Lower bound of the daily rate range. Used for all price calculations. */
  dailyRateLKR: number;
  /** Upper bound of the daily rate range. Display only — never used to calculate totals. */
  dailyRateMaxLKR?: number;
  /** For 30+ day rentals. 0 means no monthly package: fall back to the daily rate. */
  monthlyRateLKR: number; // For 30+ days
}

export const BIKE_MODELS: BikeModel[] = [
  {
    id: 'yamaha-zr',
    name: 'Yamaha ZR',
    dailyRateLKR: 1500,
    dailyRateMaxLKR: 1850,
    monthlyRateLKR: 27000, // $90 @ 300 LKR/USD
  },
  {
    id: 'yamaha-zr-street-rally',
    name: 'Yamaha ZR Street Rally (New)',
    dailyRateLKR: 2000,
    dailyRateMaxLKR: 2500,
    monthlyRateLKR: 33000, // $110 @ 300 LKR/USD
  },
  {
    id: 'tvs-ntorq',
    name: 'TVS Ntorq (New)',
    dailyRateLKR: 2500,
    dailyRateMaxLKR: 2800,
    monthlyRateLKR: 34800, // $116 @ 300 LKR/USD
  },
  {
    id: 'yamaha-125',
    name: 'Yamaha 125',
    dailyRateLKR: 2500,
    dailyRateMaxLKR: 2800,
    monthlyRateLKR: 0, // No monthly package: 30+ days bill at the daily rate
  },
  {
    id: 'zoom-110',
    name: 'Zoom 110cc',
    dailyRateLKR: 2000,
    dailyRateMaxLKR: 2300,
    monthlyRateLKR: 0, // No monthly package: 30+ days bill at the daily rate
  },
  {
    id: 'yamaha-fz',
    name: 'Yamaha FZ',
    dailyRateLKR: 2800,
    dailyRateMaxLKR: 3500,
    monthlyRateLKR: 30000, // $100 @ 300 LKR/USD
  },
];

export const PRICING_RULES = {
  longTermDiscountDays: 3,
  longTermDiscountPercentage: 0.10, // 10% off for > 3 days
  outsideAreaRateLKR: 500, // Flat daily surcharge
};
