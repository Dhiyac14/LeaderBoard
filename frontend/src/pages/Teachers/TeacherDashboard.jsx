import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Bell,
  User,
  Users,
  LogOut,
  Building,
  Hash,
  CheckCircle, // Added missing import
} from "lucide-react";
import TeacherProfile from "../../components/TeacherProfile";
import ClassDetails from "../../components/ClassList";

const TeacherDashboard = () => {
  const [events, setEvents] = useState([]);
  const [teacherData, setTeacherData] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard"); // Track current view
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPDF, setSelectedPDF] = useState(null);

  const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("teacher-token");
        
        if (!token) {
          console.error("No auth token found");
          return;
        }
        
        console.log("Fetching events with token:", token.substring(0, 10) + "...");
        
        // First check if teacher has classes assigned
        const teacherResponse = await axios.get(`${VITE_BASE_URL}/teacher/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        console.log("Teacher has classes:", teacherResponse.data.classes?.length > 0);
        if (teacherResponse.data.classes) {
          const classIds = teacherResponse.data.classes.map(c => c._id).join(", ");
          console.log("Class IDs:", classIds);
        }
        
        // Now fetch events
        const response = await axios.get(`${VITE_BASE_URL}/event`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        console.log("Events API response status:", response.status);
        console.log("Events received:", response.data.length);
        setEvents(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching events:", error);
        if (error.response) {
          console.error("Response status:", error.response.status);
          console.error("Response data:", error.response.data);
        }
      }
    };

    fetchEvents();
  }, [VITE_BASE_URL]);

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        const response = await axios.get(`${VITE_BASE_URL}/teacher/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        
        console.log("API response:", response);
        // Store the teacher data
        const teacherData = response.data.teacher || response.data;
        console.log("Processed teacher data:", teacherData);
        setTeacherData(teacherData);
      } catch (error) {
        console.error("Error fetching teacher profile:", error);
      }
    };

    fetchTeacherProfile();
  }, [VITE_BASE_URL]);

  const navigate = useNavigate();

  const handleLogoutClick = async () => { 
    const token = localStorage.getItem("token"); 
    try{
      const response = await axios.get(`${VITE_BASE_URL}/teacher/logout`,{
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if(response.status === 200) {
        localStorage.removeItem("token");
        navigate("/teacher-login"); 
      } 
    } catch(err) {  
      console.error("Error logging out:", err);
    }
  }

  const handleCheckNow = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("teacher-token");
      await axios.patch(
        `${VITE_BASE_URL}/event/${selectedEvent._id}/review`,
        { status: 'Approved' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      
      setEvents((prevEvents) =>
        prevEvents.filter(event => event._id !== selectedEvent._id)
      );
      handleCloseModal();
    } catch (error) {
      console.error("Error approving event:", error);
      alert("Failed to approve event. Please try again.");
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("teacher-token");
      await axios.patch(
        `${VITE_BASE_URL}/event/${selectedEvent._id}/review`,
        { status: 'Rejected' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );
      
      setEvents((prevEvents) =>
        prevEvents.filter(event => event._id !== selectedEvent._id)
      );
      handleCloseModal();
    } catch (error) {
      console.error("Error rejecting event:", error);
      alert("Failed to reject event. Please try again.");
    }
  };

  const handleLogout = () => {
    console.log("Logging out...");
  };

  const handleShowProfile = () => {
    setShowProfile(true);
  };

  const handleShowClassList = () => {
    setShowClassList(true);
  };

  const handleBackToDashboard = () => {
    setShowProfile(false);
    setShowClassList(false);
  };

  const handleShowPDF = (event) => {
    // Ensure the PDF document exists before opening it in the modal
    if (event.pdfDocument) {
      const pdfUrl = `http://localhost:4000/uploads/pdf/${event.pdfDocument}`;
      setSelectedPDF(pdfUrl);  // Set the PDF URL to the state
    } else {
      console.error('No PDF document available for this event');
    }
  };

  const handleClosePDFModal = () => {
    setSelectedPDF(null);
  };

  const renderContent = () => {
    if (currentView === "profile") {
      return (
        <TeacherProfile
          teacherData={teacherData}
          handleBackToDashboard={() => setCurrentView("dashboard")}
        />
      );
    }
  
    if (currentView === "classList") {
      return (
        <ClassDetails
          classId={teacherData?.classes?.[0]?._id}
          teacherData={teacherData}
          handleBackToDashboard={() => setCurrentView("dashboard")}
        />
      );
    }
  
    // Default to dashboard content
    return (
      <div className="p-4 lg:p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Department Info */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-gray-700">Department</h3>
              <Building className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500" />
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">
              {teacherData?.department || "N/A"}
            </p>
            <p className="text-xs lg:text-sm text-gray-500 mt-2">Current Department</p>
          </div>
        
          {/* Role Info */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-gray-700">Role</h3>
              <User className="h-5 w-5 lg:h-6 lg:w-6 text-green-500" />
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">
              {teacherData?.role || "N/A"}
            </p>
            <p className="text-xs lg:text-sm text-gray-500 mt-2">Faculty Role</p>
          </div>
        
          {/* Register Number */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-base lg:text-lg font-semibold text-gray-700">Register No.</h3>
              <Hash className="h-5 w-5 lg:h-6 lg:w-6 text-purple-500" />
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">
              {teacherData?.registerNo || "N/A"}
            </p>
            <p className="text-xs lg:text-sm text-gray-500 mt-2">Faculty ID</p>
          </div>
        </div>
  
        {/* Events Section */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Events to Review</h2>
            </div>
          </div>
  
          <div className="p-6">
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-lg text-gray-900">{event.submittedBy.name}</h3>
                      <p className="text-gray-600">{event.eventName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-4 flex gap-4 items-center">
                      <button
                        onClick={() => handleShowPDF(event)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Show PDF Proof
                      </button>
  
                      {event.status === "Pending" ? (
                        <button
                          onClick={() => handleCheckNow(event)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Check Now
                        </button>
                      ) : (
                        <div
                          className={`flex items-center ${
                            event.status === "Approved" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {event.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600 mb-2">No events to review</p>
                <p className="text-sm text-gray-500">
                  {teacherData?.classes && teacherData.classes.length > 0 
                    ? `You have ${teacherData.classes.length} class(es) assigned, but no pending events.` 
                    : "No classes are assigned to you yet. Events will appear when students from your classes submit them."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg p-4 lg:p-6">
        <div className="flex flex-col h-full">
          <h1 className="text-xl font-bold text-gray-800 mb-8">Teacher Portal</h1>
          <nav className="flex flex-col gap-4">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                currentView === "dashboard" ? "bg-gray-100" : ""
              }`}
            >
              <Bell size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView("profile")}
              className={`flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                currentView === "profile" ? "bg-gray-100" : ""
              }`}
            >
              <User size={18} />
              Profile
            </button>
            <button
              onClick={() => setCurrentView("classList")}
              className={`flex items-center gap-2 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                currentView === "classList" ? "bg-gray-100" : ""
              }`}
            >
              <Users size={18} />
              Class List
            </button>
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">{renderContent()}</div>

      {/* Add this modal JSX at the end of your renderContent function's return statement */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h3 className="text-lg font-bold mb-4">Review Event</h3>
            <div className="mb-4">
              <p><strong>Student:</strong> {selectedEvent.submittedBy.name}</p>
              <p><strong>Event:</strong> {selectedEvent.eventName}</p>
              <p><strong>Description:</strong> {selectedEvent.description}</p>
              <p><strong>Category:</strong> {selectedEvent.category}</p>
              <p><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString()}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button 
                onClick={handleApprove}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Approve
              </button>
              <button 
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full h-3/4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">PDF Document</h3>
              <button 
                onClick={handleClosePDFModal}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <iframe 
              src={selectedPDF} 
              className="w-full h-full" 
              title="PDF Viewer"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
