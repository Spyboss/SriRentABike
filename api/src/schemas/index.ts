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

export const updateAgreementSchema = Joi.object({
  bike_id: Joi.string().uuid().optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
  daily_rate: Joi.number().min(0).optional(),
  deposit: Joi.number().min(0).optional(),
  status: Joi.string().valid('pending', 'active', 'completed', 'cancelled').optional(),
}).messages({
  'date.min': '"end_date" must be greater than or equal to "start_date" when both are provided'
});
