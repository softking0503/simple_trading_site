import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Trading from "./components/trading";
import BinanceFuturesChart from "./components/charts";
import AuthForm from "./components/authForm";
const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/login" element={<AuthForm type={"login"} />} />
          <Route path="/register" element={<AuthForm type={"register"} />} />
          <Route path="/trading" element={<Trading />} />
          <Route path="/charts" element={<BinanceFuturesChart />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
