import { UserRole } from '@/api/user';
import { i18n } from '@/i18n';
import * as z from 'zod';

export const hrFormSchema = z.object({
  firstName: z.string()
    .min(1, { message: i18n.hr_popup.validation_required })
    .max(20, { message: i18n.hr_popup.validation_name_length }),
  lastName: z.string()
    .min(1, { message: i18n.hr_popup.validation_required })
    .max(20, { message: i18n.hr_popup.validation_name_length }),
  email: z.string()
    .min(1, { message: i18n.hr_popup.validation_required })
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: i18n.hr_popup.validation_email }),
  nationalId: z.string().optional(),
  role: z.enum(UserRole, { message: i18n.hr_popup.validation_required }),
});

export type HRFormData = z.infer<typeof hrFormSchema>;
