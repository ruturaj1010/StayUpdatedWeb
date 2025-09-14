import React from 'react';

const Card = ({ 
  children, 
  className = '',
  padding = 'default',
  shadow = 'default',
  ...props 
}) => {
  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-4';
      case 'md':
        return 'p-6';
      case 'lg':
        return 'p-8';
      case 'default':
      default:
        return 'p-6';
    }
  };

  const getShadowClasses = () => {
    switch (shadow) {
      case 'none':
        return '';
      case 'sm':
        return 'shadow-sm';
      case 'md':
        return 'shadow-md';
      case 'lg':
        return 'shadow-lg';
      case 'xl':
        return 'shadow-xl';
      case 'default':
      default:
        return 'shadow-lg';
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 ${getPaddingClasses()} ${getShadowClasses()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
