import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, CartesianGrid
} from 'recharts';
import { 
  TrendingUp, Award, PieChart as PieChartIcon, 
  BarChart2, Users, Download
} from 'lucide-react';

import LeaderboardTable from '../components/LeaderBoard';
import ReportsDownloadSection from '../components/ReportsDownloadSection';

const ReportsPage = () => {
  const [totalPrizeMoney, setTotalPrizeMoney] = useState(0);
  const [topStudents, setTopStudents] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [approvalRates, setApprovalRates] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classPerformance, setClassPerformance] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [categoryByClass, setCategoryByClass] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [inactiveStudents, setInactiveStudents] = useState([]);
  const [classParticipation, setClassParticipation] = useState([]);

  const baseURL = import.meta.env.VITE_BASE_URL;

  // Color schemes for charts
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp size={20} /> },
    { id: 'performance', label: 'Performance', icon: <Award size={20} /> },
    { id: 'categories', label: 'Categories', icon: <PieChartIcon size={20} /> },
    { id: 'class-analysis', label: 'Class Analysis', icon: <BarChart2 size={20} /> },
    { id: 'students', label: 'Students', icon: <Users size={20} /> },
    { id: 'downloads', label: 'Downloads', icon: <Download size={20} /> }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state
        
        // Fetch prize money
        const prizeMoneyResponse = await axios.get(`${baseURL}/reports/total-prize-money`);
        setTotalPrizeMoney(prizeMoneyResponse.data.totalPrizeMoney);

        // Fetch top students
        const topStudentsResponse = await axios.get(`${baseURL}/reports/top-students`);
        const formattedStudentData = topStudentsResponse.data.topStudents.map(student => ({
          submittedBy: student._id,
          totalPoints: student.totalPoints,
        }));
        setTopStudents(formattedStudentData);

        // Fetch and format categories
        const categoriesResponse = await axios.get(`${baseURL}/reports/popular-categories`);
        const formattedCategories = categoriesResponse.data.popularCategories.map(category => ({
          name: category._id,
          value: category.count
        }));
        setPopularCategories(formattedCategories);

        // Fetch approval rates
        const approvalResponse = await axios.get(`${baseURL}/reports/approval-rates`);
        const formattedApprovalRates = approvalResponse.data.approvalRates.map(rate => ({
          name: rate.status,
          value: rate.count
        }));
        setApprovalRates(formattedApprovalRates);

        // Fetch trends
        const trendsResponse = await axios.get(`${baseURL}/reports/trends/monthly`);
        setTrends(trendsResponse.data.trends);

        // Fetch class performance
        const classPerformanceResponse = await axios.get(`${baseURL}/reports/class-performance`);
        console.log('Class Performance Response:', classPerformanceResponse.data); // Add logging
        setClassPerformance(classPerformanceResponse.data.performance || []);

        // Fetch detailed student performance
        const studentPerformanceResponse = await axios.get(`${baseURL}/reports/detailed-student-performance`);
        console.log('Student Performance Response:', studentPerformanceResponse.data); // Add logging
        setStudentPerformance(studentPerformanceResponse.data.performance || []);

        // Fetch category performance by class
        const categoryResponse = await axios.get(`${baseURL}/reports/category-performance-by-class`);
        console.log('Category Performance Response:', categoryResponse.data); // Add logging
        setCategoryByClass(categoryResponse.data.performance || []);

        // Fetch inactive students
        const inactiveStudentsResponse = await axios.get(`${baseURL}/reports/inactive-students`);
        setInactiveStudents(inactiveStudentsResponse.data.inactiveStudents || []);

        // Fetch class participation data
        const classParticipationResponse = await axios.get(`${baseURL}/reports/class-participation`);
        setClassParticipation(classParticipationResponse.data.participation || []);

      } catch (err) {
        console.error('Error details:', err.response?.data || err.message); // Add detailed error logging
        setError(err.response?.data?.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseURL]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-gray-600">
            {label ? `${label}: ${payload[0].value}` : `${payload[0].name}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  const formatDataForChart = (data) => {
    if (!data || data.length === 0) return [];
    
    // Get unique categories across all classes
    const allCategories = [...new Set(
      data.flatMap(item => item.categories.map(cat => cat.category))
    )];

    // Format data for the chart
    return data.map(classData => {
      const formattedData = {
        className: classData.className,
        totalPoints: classData.totalPoints,
      };

      // Add each category's points
      allCategories.forEach(category => {
        const categoryData = classData.categories.find(cat => cat.category === category);
        formattedData[category] = categoryData ? categoryData.points : 0;
      });

      return formattedData;
    });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Total Prize Money</h2>
              <span className="text-3xl font-bold text-green-600">
                ₹{totalPrizeMoney.toLocaleString()}
              </span>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <LeaderboardTable />
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Class Performance</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformance}>
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalPoints" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Student Performance</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentPerformance}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalPoints" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Popular Categories</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={popularCategories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      labelLine={false}
                      label={renderCustomizedLabel}
                    >
                      {popularCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Category Performance by Class</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Points
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categories Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {categoryByClass.map((classData, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {classData.className || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {classData.totalPoints}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {classData.categories.map((cat, idx) => (
                            <div key={idx} className="mb-2">
                              <span className="font-medium">{cat.category}:</span>{' '}
                              {cat.points} points{' '}
                              <span className="text-gray-400">
                                ({cat.participationCount} participation{cat.participationCount !== 1 ? 's' : ''})
                              </span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </div>
        );

      case 'class-analysis':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Class Participation by Category</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={formatDataForChart(classParticipation)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="className" 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis label={{ value: 'Points', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      {Object.keys(formatDataForChart(classParticipation)[0] || {})
                        .filter(key => !['className', 'totalPoints'].includes(key))
                        .map((category, index) => (
                          <Bar 
                            key={category}
                            dataKey={category}
                            fill={COLORS[index % COLORS.length]}
                            name={category}
                          />
                        ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Inactive Students</h2>
                <div className="overflow-y-auto max-h-80">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inactiveStudents.map((student, index) => (
                        <tr key={student._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.className}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.lastActivity ? new Date(student.lastActivity).toLocaleDateString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'downloads':
        return <ReportsDownloadSection baseURL={baseURL} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg fixed h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-6">Reports Dashboard</h1>
          <nav className="space-y-2">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg text-gray-600">Loading reports...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-lg text-red-600">{error}</div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default ReportsPage;