import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Calendar, Trophy, CheckCircle, XCircle, Clock } from 'lucide-react';

const StudentEventHistory = ({ handleBackToDashboard }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/student/events-history`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('student-token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full">
            <CheckCircle size={16} />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="flex items-center gap-1 text-red-700 bg-red-100 px-3 py-1 rounded-full">
            <XCircle size={16} />
            Rejected
          </span>
        );
      case 'Pending':
        return (
          <span className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
            <Clock size={16} />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-6">
      <button
        onClick={handleBackToDashboard}
        className="flex items-center gap-2 text-blue-500 hover:underline mb-6"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Event Submission History</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.eventName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{event.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{event.positionSecured}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{event.pointsEarned || '0'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentEventHistory; 