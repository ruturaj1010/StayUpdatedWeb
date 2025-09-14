import React from 'react';
import ToastProvider from './ToastProvider';

const MainLayout = ({ children }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
};

export default MainLayout;
