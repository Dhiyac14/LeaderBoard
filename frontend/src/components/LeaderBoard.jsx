import React, { useEffect, useState } from 'react';
import { Medal, ChevronLeft, ChevronRight } from 'lucide-react';

const VITE_BASE_URL = import.meta.env.VITE_BASE_URL;

const LeaderboardTable = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${VITE_BASE_URL}/leaderboard?page=${currentPage}&limit=${itemsPerPage}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('student-token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const data = await response.json();
        
        if (!data.success) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        setLeaderboardData(data.data);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (event) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading) {
    return (
      <div className="border rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Medal className="h-5 w-5" />
          <h2 className="text-lg font-bold">Leaderboard</h2>
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="text-gray-500">Loading leaderboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Medal className="h-5 w-5" />
          <h2 className="text-lg font-bold">Leaderboard</h2>
        </div>
        <div className="flex justify-center items-center h-40 text-red-500">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-sm">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5" />
            <h2 className="text-lg font-bold">Leaderboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded-md px-2 py-1"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
        
        <div className="max-h-[700px] overflow-y-auto">
          <div className="space-y-3">
            {leaderboardData.map((student, index) => (
              <div
                key={student._id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  index % 2 === 1 ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-gray-500">
                    #{student.rank}
                  </span>
                  <span className="font-medium">{student.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-bold">{student.totalPoints}</span>
                  <span className="text-sm text-gray-500">points</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 border-t pt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-gray-100 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTable;