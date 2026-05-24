/**
 * Validation Utilities
 * Zod schemas for form validation
 */

import {z} from 'zod';

// Phone number regex for African countries (international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Email regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Authentication Schemas
 */

export const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .regex(phoneRegex, 'Format de numéro de téléphone invalide'),
  pin: z
    .string()
    .length(4, 'Le code PIN doit contenir exactement 4 chiffres')
    .regex(/^\d{4}$/, 'Le code PIN doit contenir uniquement des chiffres'),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Le nom complet doit contenir au moins 3 caractères')
    .max(100, 'Le nom complet ne peut pas dépasser 100 caractères'),
  phoneNumber: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .regex(phoneRegex, 'Format de numéro de téléphone invalide'),
  email: z
    .string()
    .email('Adresse email invalide')
    .optional()
    .or(z.literal('')),
  pin: z
    .string()
    .length(4, 'Le code PIN doit contenir exactement 4 chiffres')
    .regex(/^\d{4}$/, 'Le code PIN doit contenir uniquement des chiffres'),
  confirmPin: z.string(),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, {
      message: 'Vous devez accepter les conditions générales',
    }),
}).refine(data => data.pin === data.confirmPin, {
  message: 'Les codes PIN ne correspondent pas',
  path: ['confirmPin'],
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'Le code OTP doit contenir exactement 6 chiffres')
    .regex(/^\d{6}$/, 'Le code OTP doit contenir uniquement des chiffres'),
});

/**
 * Tontine Creation Schemas
 */

export const tontineBasicInfoSchema = z.object({
  name: z
    .string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z
    .string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
  category: z.enum(['Family', 'Friends', 'Professional', 'Community'], {
    errorMap: () => ({message: 'Veuillez sélectionner une catégorie'}),
  }),
  type: z.enum(['ROSCA', 'ASCA', 'Hybrid'], {
    errorMap: () => ({message: 'Veuillez sélectionner un type'}),
  }),
});

export const tontineFinancialSchema = z.object({
  contributionAmount: z
    .number({
      required_error: 'Le montant de contribution est requis',
      invalid_type_error: 'Le montant doit être un nombre',
    })
    .positive('Le montant doit être supérieur à 0')
    .max(100000000, 'Le montant est trop élevé'),
  currency: z.string().default('XOF'),
  frequency: z.enum(['Daily', 'Weekly', 'BiWeekly', 'Monthly'], {
    errorMap: () => ({message: 'Veuillez sélectionner une fréquence'}),
  }),
  totalMembers: z
    .number({
      required_error: 'Le nombre de membres est requis',
      invalid_type_error: 'Le nombre de membres doit être un nombre',
    })
    .int('Le nombre de membres doit être un entier')
    .min(3, 'Le nombre minimum de membres est 3')
    .max(100, 'Le nombre maximum de membres est 100'),
  startDate: z
    .string()
    .min(1, 'La date de début est requise')
    .refine(
      date => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      {message: 'La date de début ne peut pas être dans le passé'}
    ),
  depositAmount: z
    .number()
    .nonnegative('Le montant de la caution ne peut pas être négatif')
    .optional()
    .default(0),
});

export const tontineRulesSchema = z.object({
  distributionOrder: z.enum(['Sequential', 'Random', 'Vote', 'NeedBased'], {
    errorMap: () => ({message: 'Veuillez sélectionner un ordre de distribution'}),
  }),
  latePenaltyPercent: z
    .number()
    .nonnegative('La pénalité ne peut pas être négative')
    .max(50, 'La pénalité ne peut pas dépasser 50%')
    .default(5),
  gracePeriodDays: z
    .number()
    .int('Le nombre de jours doit être un entier')
    .nonnegative('Le nombre de jours ne peut pas être négatif')
    .max(30, 'La période de grâce ne peut pas dépasser 30 jours')
    .default(3),
  minReputationRequired: z
    .number()
    .int('Le score de réputation doit être un entier')
    .nonnegative('Le score de réputation ne peut pas être négatif')
    .max(1000, 'Le score de réputation maximum est 1000')
    .default(0),
  isPublic: z.boolean().default(false),
  chatEnabled: z.boolean().default(true),
  votingEnabled: z.boolean().default(false),
});

export const createTontineSchema = tontineBasicInfoSchema
  .merge(tontineFinancialSchema)
  .merge(tontineRulesSchema);

/**
 * Profile Update Schema
 */

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Le nom complet doit contenir au moins 3 caractères')
    .max(100, 'Le nom complet ne peut pas dépasser 100 caractères')
    .optional(),
  email: z
    .string()
    .email('Adresse email invalide')
    .optional()
    .or(z.literal('')),
  avatar: z.string().url('URL invalide').optional().or(z.literal('')),
  preferredCurrency: z.string().optional(),
  language: z.enum(['fr', 'en', 'wo', 'ar']).optional(),
});

/**
 * Mobile Money Account Schema
 */

export const mobileMoneyAccountSchema = z.object({
  provider: z.enum(['M-Pesa', 'Orange Money', 'MTN Money', 'Wave', 'Moov Money'], {
    errorMap: () => ({message: 'Veuillez sélectionner un opérateur'}),
  }),
  phoneNumber: z
    .string()
    .min(1, 'Le numéro de téléphone est requis')
    .regex(phoneRegex, 'Format de numéro de téléphone invalide'),
  accountName: z
    .string()
    .min(3, 'Le nom du compte doit contenir au moins 3 caractères')
    .max(100, 'Le nom du compte ne peut pas dépasser 100 caractères'),
  isDefault: z.boolean().default(false),
});

/**
 * Contribution Schema
 */

export const contributionSchema = z.object({
  amount: z
    .number({
      required_error: 'Le montant est requis',
      invalid_type_error: 'Le montant doit être un nombre',
    })
    .positive('Le montant doit être supérieur à 0')
    .max(100000000, 'Le montant est trop élevé'),
  paymentMethod: z.enum(['MobileMoney', 'BankTransfer', 'Cash'], {
    errorMap: () => ({message: 'Veuillez sélectionner un moyen de paiement'}),
  }),
  mobileMoneyAccountId: z.string().optional(),
});

/**
 * Message Schema
 */

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Le message ne peut pas être vide')
    .max(1000, 'Le message ne peut pas dépasser 1000 caractères'),
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'document', 'audio']),
        url: z.string().url('URL invalide'),
      })
    )
    .optional()
    .default([]),
});

/**
 * Vote Schema
 */

export const voteSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  description: z
    .string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères'),
  options: z
    .array(z.string().min(1, 'Une option ne peut pas être vide'))
    .min(2, 'Au moins 2 options sont requises')
    .max(10, 'Maximum 10 options autorisées'),
  endDate: z
    .string()
    .min(1, 'La date de fin est requise')
    .refine(
      date => {
        const selectedDate = new Date(date);
        const now = new Date();
        return selectedDate > now;
      },
      {message: 'La date de fin doit être dans le futur'}
    ),
  allowMultipleVotes: z.boolean().default(false),
});

/**
 * Helper Functions
 */

/**
 * Validate data against a schema
 */
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: null,
    };
  }

  // Format Zod errors into a more usable structure
  const errors: Record<string, string> = {};
  result.error.errors.forEach(err => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return {
    success: false,
    data: null,
    errors,
  };
};

/**
 * Validate a single field
 */
export const validateField = <T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown
) => {
  try {
    // Create a partial schema for the single field
    const fieldSchema = (schema as any).shape[fieldName];
    if (!fieldSchema) {
      return {valid: true, error: null};
    }

    fieldSchema.parse(value);
    return {valid: true, error: null};
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {valid: false, error: error.errors[0]?.message || 'Valeur invalide'};
    }
    return {valid: false, error: 'Erreur de validation'};
  }
};

/**
 * Get error message for a specific field
 */
export const getFieldError = (
  errors: Record<string, string> | null,
  fieldName: string
): string | undefined => {
  if (!errors) return undefined;
  return errors[fieldName];
};

// Export schema types for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type OTPFormData = z.infer<typeof otpSchema>;
export type TontineBasicInfoData = z.infer<typeof tontineBasicInfoSchema>;
export type TontineFinancialData = z.infer<typeof tontineFinancialSchema>;
export type TontineRulesData = z.infer<typeof tontineRulesSchema>;
export type CreateTontineFormData = z.infer<typeof createTontineSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type MobileMoneyAccountFormData = z.infer<typeof mobileMoneyAccountSchema>;
export type ContributionFormData = z.infer<typeof contributionSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type VoteFormData = z.infer<typeof voteSchema>;

export default {
  // Schemas
  loginSchema,
  registerSchema,
  otpSchema,
  tontineBasicInfoSchema,
  tontineFinancialSchema,
  tontineRulesSchema,
  createTontineSchema,
  updateProfileSchema,
  mobileMoneyAccountSchema,
  contributionSchema,
  messageSchema,
  voteSchema,

  // Helper functions
  validate,
  validateField,
  getFieldError,
};
