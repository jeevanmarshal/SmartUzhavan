const validators = {
  isValidEmail: (email) => {
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
  },

  isValidPhone: (phone) => {
    const re = /^[0-9]{10,14}$/;
    return re.test(phone);
  },

  isStrongPassword: (password) => {
    // At least 8 chars, 1 upper, 1 lower, 1 digit
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },

  isValidLicense: (license) => {
    // Basic format: 2 letters + 13 digits (India format usually)
    const re = /^[A-Z]{2}[0-9]{13}$/;
    return re.test(license);
  },

  isValidFarmSize: (size) => {
    return size > 0 && size <= 10000;
  },
};

module.exports = validators;
