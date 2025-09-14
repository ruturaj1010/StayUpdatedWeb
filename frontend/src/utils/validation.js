// Validation utility functions

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8 || password.length > 16) {
    errors.push('Password must be between 8 and 16 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateName = (name) => {
  const errors = [];
  
  if (name.length < 20 || name.length > 60) {
    errors.push('Name must be between 20 and 60 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateAddress = (address) => {
  const errors = [];
  
  if (address.length > 400) {
    errors.push('Address must not exceed 400 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateLoginForm = (email, password) => {
  const errors = {};
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateSignupForm = (email, password, name, address) => {
  const errors = {};
  
  if (!email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
  }
  
  if (!name) {
    errors.name = 'Name is required';
  } else {
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.errors[0];
    }
  }
  
  if (!address) {
    errors.address = 'Address is required';
  } else {
    const addressValidation = validateAddress(address);
    if (!addressValidation.isValid) {
      errors.address = addressValidation.errors[0];
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
