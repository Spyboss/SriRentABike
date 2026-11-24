import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const touristSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  passport_no: Joi.string().required(),
  nationality: Joi.string().required(),
  home_address: Joi.string().required(),
  phone_number: Joi.string().required(),
  email: Joi.string().email().required(),
  hotel_name: Joi.string().allow('', null),
});

export const createAgreementSchema = Joi.object({
  tourist_data: touristSchema.required(),
  signature: Joi.string().required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  daily_rate: Joi.number().min(0).optional(),
  total_amount: Joi.number().min(0).optional(),
  deposit: Joi.number().min(0).optional(),
  requested_model: Joi.string().optional(),
  outside_area: Joi.boolean().optional(),
});

// Admin books a rental over the phone / WhatsApp. No signature yet — the
// tourist supplies it later through the guest link, which is the whole point
// of that link existing.
export const createAdminAgreementSchema = Joi.object({
  tourist_data: touristSchema.required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  daily_rate: Joi.number().min(0).optional(),
  total_amount: Joi.number().min(0).optional(),
  deposit: Joi.number().min(0).optional(),
  requested_model: Joi.string().optional(),
  outside_area: Joi.boolean().optional(),
}).messages({
  'date.min': '"end_date" must be greater than or equal to "start_date" when both are provided'
});

// Status moves forward only, one step at a time. Every transition has a
// side effect attached to it in the route (bike availability, timestamps),
// so letting the client jump straight to 'completed' would skip them.
export const AGREEMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['signed'],
  signed: ['active'],
  active: ['completed'],
  completed: [],
};

export const updateAgreementSchema = Joi.object({
  bike_id: Joi.string().uuid().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
  daily_rate: Joi.number().min(0).optional(),
  // The admin UI recalculates total_amount when dates or the daily rate change.
  // validateRequest strips unknown keys, so without this it was silently dropped.
  total_amount: Joi.number().min(0).optional(),
  deposit: Joi.number().min(0).optional(),
  // No `status` here on purpose: status only moves through POST /:id/status,
  // which carries the bike-availability and timestamp side effects with it.
  // validateRequest strips unknown keys, so a PUT carrying status is a no-op
  // rather than a bypass.
  payment_status: Joi.string().valid('unpaid', 'partial', 'paid').optional(),
  amount_paid: Joi.number().min(0).optional(),
}).messages({
  'date.min': '"end_date" must be greater than or equal to "start_date" when both are provided'
});
