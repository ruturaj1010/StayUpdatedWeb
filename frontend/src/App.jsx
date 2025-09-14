import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import { AppRoutes } from "./routes.jsx";

function App() {
  return (
    <MainLayout>
      <Router>
        <AppRoutes />
      </Router>
    </MainLayout>
  );
}

export default App;
