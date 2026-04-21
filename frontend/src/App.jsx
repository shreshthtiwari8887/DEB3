import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import Navbar from "./Components/Navbar/Navbar";
import Home from "./Components/Homepage-components/Home";
import Contact from "./Components/Contact/Contact";
import CoursePage from "./Components/Courses/CoursePage";
import CourseDetails from "./Components/Courses/CourseDetails";
import QuizCard from "./Components/Quiz/QuizCard";
import Quiz from "./Components/Quiz/Quiz";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import RequiredAuth from "./Components/RequiredAuth";
import Footer from "./Components/Footer/Footer";
import Profile from "./Components/UserProfile/Profile";
import TeacherProfile from "./Components/TeacherProfile/TeacherProfile";
import CreateCourse from "./Components/TeacherProfile/CreateCourse";
import EditCourse from "./Components/TeacherProfile/EditCourse";
import Marketplace from "./Components/Marketplace/Marketplace";
import Cart from "./Components/Cart/Cart";
import AboutPage from "./Components/About/AboutPage";
import ManageCourse from "./Components/TeacherProfile/ManageCourse";
import EnrollCourse from "./Components/Courses/EnrollCourse";

import VendorProfile from "./Components/VendorProfile/VendorProfile";
import EditVendorProfile from "./Components/VendorProfile/EditVendorProfile";
import ProductDetails from "./Components/VendorProfile/ProductDetails";
import { CartProvider } from "./Components/Cart/CartContext";
import AdminDashboard from "./Components/Admin/AdminDashboard";
import AdminRoute from "./Components/Admin/AdminRoute";
import StateDetail from "./Components/States/StateDetail";

import "./App.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function App() {
  const [index, setIndex] = useState(() => {
    return localStorage.getItem("index") || "";
  });

  const handleChildData = (data) => {
    setIndex(data);
    localStorage.setItem("index", data);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <SnackbarProvider maxSnack={3}>
      <CartProvider>
        <Router>
          <div className="App">
            <Navbar />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/state/:stateName" element={<StateDetail />} />
                <Route path="/courses" element={<CoursePage />} />
                <Route path="/enroll/:id" element={<EnrollCourse />} />
                <Route
                  path="/quizcard"
                  element={<QuizCard sendIndex={handleChildData} />}
                />
                <Route
                  path="/quiz"
                  element={
                    <RequiredAuth>
                      <Quiz index={index} />
                    </RequiredAuth>
                  }
                />
                <Route
                  path="/login"
                  element={<Login onLogin={handleLogin} />}
                />
                <Route path="/signup" element={<Signup />} />
                <Route path="/course/:id" element={<CourseDetails />} />

                {/* ✅ USER PROFILE */}
                {/* <Route path="/profile" element={<Profile />} /> */}
                <Route
                  path="/profile"
                  element={(() => {
                    const role = localStorage.getItem("role");

                    if (role === "vendor") return <VendorProfile />;
                    if (role === "teacher") return <TeacherProfile />;
                    return <Profile />;
                  })()}
                />

                {/* ✅ TEACHER PROFILE */}
                <Route path="/teacher-profile" element={<TeacherProfile />} />
                <Route path="/create-course" element={<CreateCourse />} />
                <Route path="/edit-course/:id" element={<EditCourse />} />
                <Route path="/manage-course/:id" element={<ManageCourse />} />

                <Route path="/vendor-profile" element={<VendorProfile />} />
                <Route path="/vendor/edit" element={<EditVendorProfile />} />
                <Route path="/product/:id" element={<ProductDetails />} />

                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/cart" element={<Cart />} />
                <Route
                  path="/admin-dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
              </Routes>
            </div>
            <Footer isLoggedIn={isLoggedIn} onLogout={handleLogout} />
          </div>
        </Router>
      </CartProvider>
    </SnackbarProvider>
  );
}

export default App;
