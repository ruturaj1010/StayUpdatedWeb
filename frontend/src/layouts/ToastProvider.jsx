import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="bottom-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
          },
          // Success toast styling
          success: {
            duration: 3000,
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          // Error toast styling
          error: {
            duration: 5000,
            style: {
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          // Loading toast styling
          loading: {
            style: {
              background: '#eff6ff',
              color: '#1d4ed8',
              border: '1px solid #bfdbfe',
            },
          },
        }}
      />
    </>
  );
};

export default ToastProvider;