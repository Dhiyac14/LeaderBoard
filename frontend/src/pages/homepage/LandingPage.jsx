import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from './SRM.jpg';
import srmLogo from './SRMlogo.png';
import { FaTrophy, FaUserFriends, FaChartLine, FaNewspaper, FaEnvelope } from 'react-icons/fa';

const LandingPage = () => {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLoginClick = (role) => {
        navigate(`/${role}-login`); // Dynamic navigation
        setShowDropdown(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-100 relative">
            {/* Navbar */}
            <nav className="w-full flex justify-between items-center py-4 px-10 bg-white shadow-md relative z-50">
                <img src={srmLogo} alt="SRM Logo" className="h-10" />
                <div className="space-x-6 relative flex items-center">
                    <a href="#about" className="hover:text-yellow-500">About</a>
                    <a href="#leaderboard" className="hover:text-yellow-500">Leaderboard</a>
                    <a href="#features" className="hover:text-yellow-500">Features</a>
                    <div className="relative inline-block" ref={dropdownRef}>
                        <button 
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300">
                            Login
                        </button>
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-50 border border-gray-200">
                                <button onClick={() => handleLoginClick('student')} className="block px-4 py-2 hover:bg-gray-200 w-full text-left">Student</button>
                                <button onClick={() => handleLoginClick('teacher')} className="block px-4 py-2 hover:bg-gray-200 w-full text-left">Teacher</button>
                                <button onClick={() => handleLoginClick('admin')} className="block px-4 py-2 hover:bg-gray-200 w-full text-left">Admin</button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative w-full h-screen flex flex-col justify-center items-center text-white text-center z-10"
                style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="bg-black bg-opacity-50 p-6 rounded-lg">
                    <h1 className="text-5xl font-bold">Compete. Conquer. Climb the Ranks!</h1>
                    <p className="text-xl mt-4">The journey of a thousand miles begins with a single step.</p>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" className="w-4/5 max-w-4xl text-center py-10">
                <h2 className="text-3xl font-bold">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    {[{ icon: FaChartLine, text: "Real-time Updates" }, { icon: FaUserFriends, text: "Event Tracking" }, { icon: FaTrophy, text: "User-Friendly UI" }].map((feature, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                            <feature.icon size={40} className="text-yellow-500 mx-auto" />
                            <p className="mt-4 font-semibold">{feature.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Blog Section */}
            <div id="blog" className="w-4/5 max-w-4xl text-center py-10">
                <h2 className="text-3xl font-bold">Latest News & Updates</h2>
                <FaNewspaper size={50} className="text-yellow-500 mx-auto mt-4" />
            </div>

            {/* Contact Us Section */}
            <div id="contact" className="w-4/5 max-w-4xl text-center py-10">
                <h2 className="text-3xl font-bold">Contact Us</h2>
                <FaEnvelope size={50} className="text-yellow-500 mx-auto mt-4" />
            </div>

            {/* Footer */}
            <footer className="w-full bg-black text-white py-4 mt-10 text-center">
                <p className="text-sm">© 2023 SRM Leaderboard. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
