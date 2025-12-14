export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateZipCode = (zipCode: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
};

export const validateCreditCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.length >= 13 && cleaned.length <= 19 && luhnCheck(cleaned);
};

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export const validateIPAddress = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  if (ipv4Regex.test(ip)) {
    return ip.split('.').every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  return ipv6Regex.test(ip);
};

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationRules {
  [key: string]: {
    required?: boolean | string;
    email?: boolean | string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    custom?: (value: unknown) => string | null;
  };
}

export function validateForm(
  data: Record<string, unknown>,
  rules: FormValidationRules
): ValidationError[] {
  const errors: ValidationError[] = [];

  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field];

    if (rule.required && (!value || String(value).trim() === '')) {
      errors.push({
        field,
        message: typeof rule.required === 'string' ? rule.required : 'This field is required',
      });
      return;
    }

    if (value && rule.email && typeof value === 'string' && !validateEmail(value)) {
      errors.push({
        field,
        message: typeof rule.email === 'string' ? rule.email : 'Invalid email address',
      });
    }

    if (value && rule.minLength && typeof value === 'string' && value.length < rule.minLength.value) {
      errors.push({
        field,
        message: rule.minLength.message,
      });
    }

    if (value && rule.maxLength && typeof value === 'string' && value.length > rule.maxLength.value) {
      errors.push({
        field,
        message: rule.maxLength.message,
      });
    }

    if (value && rule.pattern && typeof value === 'string' && !rule.pattern.value.test(value)) {
      errors.push({
        field,
        message: rule.pattern.message,
      });
    }

    if (value && rule.custom) {
      const error = rule.custom(value);
      if (error) {
        errors.push({
          field,
          message: error,
        });
      }
    }
  });

  return errors;
}
