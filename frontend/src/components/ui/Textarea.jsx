import React from 'react';

const Textarea = ({ 
  label,
  error,
  className = '',
  id,
  ...props 
}) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

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
      <textarea
        id={inputId}
        className={`input-primary ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Textarea;
