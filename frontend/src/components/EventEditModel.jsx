import React, { useState } from 'react';
import { X } from 'lucide-react';

const EventDetailsModal = ({ event, onClose, onApprove, onReject }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!event) return null;

  const handleStatusUpdate = (newStatus) => {
    setIsLoading(true);

    // Simulate a delay for loading state
    setTimeout(() => {
      // Call the appropriate callback based on the status
      if (newStatus === 'Approved') {
        onApprove();
      } else {
        onReject();
      }
      setIsLoading(false);
    }, 1000); // 1 second delay to mimic processing
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-80 p-4 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          disabled={isLoading}
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Event Details</h3>
        </div>

        <div className="space-y-2">
          <p>
            <strong>Submitted By:</strong> {event.submittedBy.name}
          </p>
          <p>
            <strong>Event Name:</strong> {event.eventName}
          </p>
          <p>
            <strong>Description:</strong> {event.description}
          </p>
          <p>
            <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
          </p>
          <p>
            <strong>Category:</strong> {event.category}
          </p>
          <p>
            <strong>Position Secured:</strong> {event.positionSecured}
          </p>
          <p>
            <strong>Status:</strong>{' '}
            <span
              className={`px-2 py-1 rounded ${
                event.status === 'Pending'
                  ? 'bg-yellow-200 text-yellow-800'
                  : event.status === 'approved'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-red-200 text-red-800'
              }`}
            >
              {event.status}
            </span>
          </p>
          <div>
            <strong>Proof:</strong>
            <img
              src={event.proofUrl}
              alt="Event Proof"
              className="mt-2 border rounded-md shadow-md max-w-full h-48 object-contain"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            onClick={() => handleStatusUpdate('Approved')}
            disabled={isLoading}
            className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => handleStatusUpdate('Rejected')}
            disabled={isLoading}
            className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;