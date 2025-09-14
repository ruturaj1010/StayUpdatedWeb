import React from 'react';

const Select = ({ 
  label,
  error,
  options = [],
  className = '',
  id,
  ...props 
}) => {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-primary-700 mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`input-primary ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Select;
