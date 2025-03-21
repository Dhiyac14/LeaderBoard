const Student = require('../models/student.model');
const Event = require('../models/event.model');
const Class = require('../models/class.model');
const Teacher = require('../models/teacher.model');
const mongoose = require('mongoose');

class RoleBasedEventReportsService {
  /**
   * Get role-based filters based on teacher's role and department
   */
  static async getRoleBasedFilters(teacher) {
    console.log("Teacher role:", teacher.role);
    console.log("Teacher department:", teacher.department);
    
    // Base filters - only include approved events
    let filters = { status: 'Approved' };
    
    // Different filtering logic based on role
    switch(teacher.role) {
      case 'HOD':
        // HOD can see all classes in their department
        console.log("Using HOD filters for", teacher.department);
        filters.department = teacher.department;
        break;
        
      case 'Academic Advisor':
        // Academic advisor sees classes they advise
        console.log("Using Academic Advisor filters");
        
        // Get classes where teacher is academic advisor
        const advisorClasses = await Class.find({ 
          academicAdvisors: teacher._id 
        }).select('_id');
        
        if (advisorClasses.length === 0) {
          console.log("Warning: No classes found for Academic Advisor");
        } else {
          console.log(`Found ${advisorClasses.length} classes for advisor`);
          filters.classIds = advisorClasses.map(c => c._id);
        }
        break;
        
      case 'Faculty':
      default:
        // Faculty sees only their assigned classes
        console.log("Using Faculty filters");
        
        // Get classes where teacher is assigned
        const facultyClasses = await Class.find({ 
          facultyAssigned: teacher._id 
        }).select('_id');
        
        // If teacher has no classes, they see nothing
        if (facultyClasses.length === 0) {
          console.log("Warning: No classes found for Faculty member");
          
          // Fallback: check if teacher has classes in the teacher.classes array
          if (teacher.classes && teacher.classes.length > 0) {
            console.log(`Using ${teacher.classes.length} classes from teacher's classes array`);
            filters.classIds = teacher.classes;
          } else {
            // Return dummy filter that won't match anything if no classes found
            console.log("No classes found, using dummy filter");
            return { _id: mongoose.Types.ObjectId("000000000000000000000000") };
          }
        } else {
          console.log(`Found ${facultyClasses.length} classes for faculty`);
          filters.classIds = facultyClasses.map(c => c._id);
        }
    }
    
    return filters;
  }

  /**
   * Apply user filters to base filters
   */
  static applyUserFilters(baseFilters, userFilters = {}) {
    const filters = { ...baseFilters };
    
    // Add year filter
    if (userFilters.year && !isNaN(parseInt(userFilters.year))) {
      filters.studentYear = parseInt(userFilters.year);
      console.log(`Applied year filter: ${filters.studentYear}`);
    }
    
    // Add specific class filter if provided
    if (userFilters.classId) {
      filters.specificClassId = userFilters.classId;
    }
    
    // Add date range filter if provided
    if (userFilters.startDate && userFilters.endDate) {
      filters.dateRange = {
        $gte: new Date(userFilters.startDate),
        $lte: new Date(userFilters.endDate)
      };
    }
    
    // Add category filter
    if (userFilters.category) {
      filters.category = userFilters.category;
    }
    
    // Add department filter
    if (userFilters.department) {
      filters.department = userFilters.department;
    }
    
    return filters;
  }

  /**
   * Get student-class mapping based on filters
   */
  static async getStudentClassMap(filters) {
    try {
      // Get accessible classes based on role
      let classQuery = {};
      
      if (filters.specificClassId) {
        // Looking for a specific class
        classQuery._id = filters.specificClassId;
      } else if (filters.accessibleClassIds && filters.accessibleClassIds.length > 0) {
        // Filter to role-accessible classes
        classQuery._id = { $in: filters.accessibleClassIds };
      }
      
      // Apply year filter if provided
      if (filters.studentYear) {
        classQuery.year = filters.studentYear;
        console.log(`Filtering classes by year: ${filters.studentYear}`);
      }
      
      // Apply department filter if provided
      if (filters.department) {
        classQuery.department = filters.department;
      }
      
      console.log('Class query:', JSON.stringify(classQuery));
      
      // Get filtered classes
      const classes = await Class.find(classQuery).lean();
      console.log(`Found ${classes.length} classes matching criteria`);
      
      // Continue with the rest of your method...
    } catch (error) {
      console.error('Error getting student-class map:', error);
      return [];
    }
  }

  /**
   * Get available classes for the given teacher's role/department
   */
  static async getAvailableClasses(teacher, yearFilter = null) {
    try {
      // Get role-based access filters
      const baseFilters = await this.getRoleBasedFilters(teacher);
      
      // Build query based on teacher's role
      let query = {};
      
      // Apply year filter if provided
      if (yearFilter && !isNaN(parseInt(yearFilter))) {
        query.year = parseInt(yearFilter);
      }
      
      // Apply department filter for HOD/faculty
      if (teacher.role === 'HOD' && teacher.department) {
        query.department = teacher.department;
      }
      
      // Apply class restrictions for faculty
      if (teacher.role === 'faculty' && teacher.classes && teacher.classes.length > 0) {
        query._id = { $in: teacher.classes };
      }
      
      // Get classes
      const classes = await Class.find(query)
        .sort({ year: 1, section: 1, department: 1 })
        .lean();
      
      return classes;
    } catch (error) {
      console.error('Error getting available classes:', error);
      return [];
    }
  }

  /**
   * Get top students based on teacher's role/department
   */
  static async getTopStudents(teacher, limit = 10, userFilters = {}) {
    try {
      // Get role-based access filters with user filters applied
      const baseFilters = await this.getRoleBasedFilters(teacher);
      const filters = this.applyUserFilters(baseFilters, userFilters);
      
      // Get student-class map based on filters (now includes year filter)
      const studentClassMap = await this.getStudentClassMap(filters);
      
      // Convert student IDs to ObjectIds
      const accessibleStudentIds = Array.from(studentClassMap.keys()).map(id => 
        mongoose.Types.ObjectId(id)
      );
      
      // If no students found, return empty array
      if (accessibleStudentIds.length === 0) {
        console.log("No accessible students found");
        return [];
      }
      
      // Get events submitted by these students
      const pipeline = [
        {
          $match: {
            submittedBy: { $in: accessibleStudentIds },
            status: 'Approved'
          }
        },
        {
          $group: {
            _id: '$submittedBy',
            totalPoints: { $sum: '$points' },
            eventCount: { $sum: 1 }
          }
        },
        {
          $sort: { totalPoints: -1 }
        },
        {
          $limit: limit
        }
      ];
      
      const studentStats = await Event.aggregate(pipeline);
      
      // Get student details
      const topStudents = await Promise.all(
        studentStats.map(async (stat) => {
          const student = await Student.findById(stat._id)
            .select('name registerNo totalPoints department currentClass')
            .lean();
            
          if (!student) return null;
          
          return {
            _id: student._id,
            name: student.name,
            registerNo: student.registerNo,
            totalPoints: stat.totalPoints,
            activityCount: stat.eventCount,
            department: student.department,
            className: studentClassMap.get(student._id.toString()) || 'Unknown'
          };
        })
      );
      
      // Filter out nulls and return results
      return topStudents.filter(Boolean);
    } catch (error) {
      console.error('Error getting top students:', error);
      return [];
    }
  }

  /**
   * Get popular categories based on event submissions
   */
  static async getPopularCategories(teacher, limit = 5, userFilters = {}) {
    try {
      // Pass the year filter to getAvailableClasses
      const yearFilter = userFilters.year ? parseInt(userFilters.year) : null;
      const classes = await this.getAvailableClasses(teacher, yearFilter);
      
      if (classes.length === 0) {
        console.log("No classes found, returning empty result");
        return [];
      }
      
      // Get class IDs
      const classIds = classes.map(c => c._id);
      
      // Find students in those classes
      const students = await Student.find({
        $or: [
          { 'currentClass.ref': { $in: classIds } },
          { 'class': { $in: classIds } }
        ]
      }).select('_id').lean();
      
      const studentIds = students.map(s => s._id);
      
      if (studentIds.length === 0) {
        console.log("No students found, returning empty result");
        return [];
      }
      
      // Find approved events submitted by these students
      const categoryAggregation = await Event.aggregate([
        {
          $match: {
            submittedBy: { $in: studentIds },
            status: 'Approved'
          }
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalPoints: { $sum: "$pointsEarned" }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            category: "$_id",
            count: 1,
            totalPoints: 1,
            _id: 0
          }
        }
      ]);
      
      console.log(`Found ${categoryAggregation.length} popular categories`);
      
      // If no categories found, create a placeholder
      if (categoryAggregation.length === 0) {
        return [
          { 
            category: "No Data", 
            count: 0, 
            totalPoints: 0 
          }
        ];
      }
      
      return categoryAggregation;
    } catch (error) {
      console.error('Error getting popular categories:', error);
      // Return placeholder data
      return [
        { 
          category: "Error occurred", 
          count: 0, 
          totalPoints: 0 
        }
      ];
    }
  }

  /**
   * Get class performance metrics
   */
  static async getClassPerformance(teacher, userFilters = {}) {
    try {
      // Pass the year filter to getAvailableClasses
      const yearFilter = userFilters.year ? parseInt(userFilters.year) : null;
      const classes = await this.getAvailableClasses(teacher, yearFilter);
      
      if (classes.length === 0) {
        console.log("No classes found, returning empty result");
        return [];
      }
      
      // Create a map of classId -> className for reference
      const classMap = classes.reduce((map, cls) => {
        map[cls._id.toString()] = cls.className;
        return map;
      }, {});
      
      // Initialize performance data for each class
      const classPerformance = classes.map(cls => ({
        className: cls.className,
        totalPoints: 0,
        totalActivities: 0,
        averagePoints: 0,
        studentCount: 0
      }));
      
      // Get class IDs
      const classIds = classes.map(c => c._id);
      
      // Get students for each class and count them
      for (const [index, cls] of classes.entries()) {
        const students = await Student.find({
          $or: [
            { 'currentClass.ref': cls._id },
            { 'class': cls._id }
          ]
        }).select('_id totalPoints').lean();
        
        classPerformance[index].studentCount = students.length;
        
        // Calculate total points from student records
        const totalPoints = students.reduce((sum, student) => 
          sum + (student.totalPoints || 0), 0);
          
        classPerformance[index].totalPoints = totalPoints;
        
        // Get event count by students in this class
        const studentIds = students.map(s => s._id);
        if (studentIds.length > 0) {
          const activities = await Event.countDocuments({
            submittedBy: { $in: studentIds },
            status: 'Approved'
          });
          
          classPerformance[index].totalActivities = activities;
          
          // Calculate average points per student (if there are students)
          if (students.length > 0) {
            classPerformance[index].averagePoints = Math.round(totalPoints / students.length);
          }
        }
      }
      
      // Sort by total points descending
      return classPerformance.sort((a, b) => b.totalPoints - a.totalPoints);
    } catch (error) {
      console.error('Error getting class performance:', error);
      return [];
    }
  }

  /**
   * Get approval rates statistics
   */
  static async getApprovalRates(teacher, userFilters = {}) {
    try {
      // Pass the year filter to getAvailableClasses
      const yearFilter = userFilters.year ? parseInt(userFilters.year) : null;
      const classes = await this.getAvailableClasses(teacher, yearFilter);
      
      if (classes.length === 0) {
        console.log("No classes found, returning empty result");
        return [];
      }
      
      // Get class IDs
      const classIds = classes.map(c => c._id);
      
      // Find students in those classes
      const students = await Student.find({
        $or: [
          { 'currentClass.ref': { $in: classIds } },
          { 'class': { $in: classIds } }
        ]
      }).select('_id').lean();
      
      const studentIds = students.map(s => s._id);
      
      if (studentIds.length === 0) {
        console.log("No students found, returning empty result");
        return [];
      }
      
      // Get status counts for events
      const statusCounts = await Event.aggregate([
        {
          $match: {
            submittedBy: { $in: studentIds }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Transform to expected format
      const result = statusCounts.map(item => ({
        status: item._id,
        count: item.count
      }));
      
      // Calculate totals for percentages
      const total = result.reduce((sum, item) => sum + item.count, 0);
      
      // Add percentage to each status
      result.forEach(item => {
        item.percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
      });
      
      // If no data found, return placeholder
      if (result.length === 0) {
        return [
          { status: 'Approved', count: 0, percentage: 0 },
          { status: 'Pending', count: 0, percentage: 0 },
          { status: 'Rejected', count: 0, percentage: 0 }
        ];
      }
      
      // Ensure all statuses are present
      const statuses = ['Approved', 'Pending', 'Rejected'];
      statuses.forEach(status => {
        if (!result.some(item => item.status === status)) {
          result.push({ status, count: 0, percentage: 0 });
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting approval rates:', error);
      return [
        { status: 'Approved', count: 0, percentage: 0 },
        { status: 'Pending', count: 0, percentage: 0 },
        { status: 'Rejected', count: 0, percentage: 0 }
      ];
    }
  }

  /**
   * Get inactive students (students with no recent activity)
   */
  static async getInactiveStudents(teacher, inactiveDays = 30, userFilters = {}) {
    try {
      // Pass the year filter to getAvailableClasses
      const yearFilter = userFilters.year ? parseInt(userFilters.year) : null;
      const classes = await this.getAvailableClasses(teacher, yearFilter);
      
      if (classes.length === 0) {
        console.log("No classes found, returning empty result");
        return [];
      }
      
      // Get class IDs
      const classIds = classes.map(c => c._id);
      
      // Create a map of classId -> className for reference
      const classMap = classes.reduce((map, cls) => {
        map[cls._id.toString()] = cls.className;
        return map;
      }, {});
      
      // Find students in those classes
      const students = await Student.find({
        $or: [
          { 'currentClass.ref': { $in: classIds } },
          { 'class': { $in: classIds } }
        ]
      }).select('name registerNo currentClass class department updatedAt')
      .lean();
      
      const studentIds = students.map(s => s._id);
      
      if (studentIds.length === 0) {
        console.log("No students found, returning empty result");
        return [];
      }
      
      // Get latest event date for each student
      const now = new Date();
      const latestEvents = await Event.aggregate([
        {
          $match: {
            submittedBy: { $in: studentIds }
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: "$submittedBy",
            lastActivity: { $first: "$createdAt" }
          }
        }
      ]);
      
      // Create map of student ID to last activity date
      const lastActivityMap = latestEvents.reduce((map, item) => {
        map[item._id.toString()] = item.lastActivity;
        return map;
      }, {});
      
      // Calculate inactive days for each student
      const inactiveStudents = await Promise.all(students.map(async student => {
        // Get the class name
        let className = "Unknown";
        const classId = student.currentClass?.ref || student.class;
        
        if (classId) {
          className = classMap[classId.toString()] || "Unknown";
        }
        
        // Get the last activity date (from events or account updates)
        const lastEventDate = lastActivityMap[student._id.toString()];
        const lastUpdateDate = student.updatedAt;
        
        // Use the most recent date
        let lastActivity = lastEventDate;
        if (!lastActivity || (lastUpdateDate && lastUpdateDate > lastActivity)) {
          lastActivity = lastUpdateDate;
        }
        
        // If no activity at all, use a placeholder date from 60 days ago
        if (!lastActivity) {
          const placeholder = new Date();
          placeholder.setDate(placeholder.getDate() - 60);
          lastActivity = placeholder;
        }
        
        // Calculate days since last activity
        const diffTime = Math.abs(now - new Date(lastActivity));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          _id: student._id,
          name: student.name,
          registerNo: student.registerNo,
          className,
          department: student.department,
          lastActivity,
          inactiveDays: diffDays
        };
      }));
      
      // Filter to students inactive for more than the specified days
      const filteredInactive = inactiveStudents
        .filter(student => student.inactiveDays >= inactiveDays)
        .sort((a, b) => b.inactiveDays - a.inactiveDays);
      
      return filteredInactive;
    } catch (error) {
      console.error('Error getting inactive students:', error);
      return [];
    }
  }

  /**
   * Get detailed student performance data
   */
  static async getDetailedStudentPerformance(teacher, userFilters = {}) {
    try {
      // Pass the year filter to getAvailableClasses
      const yearFilter = userFilters.year ? parseInt(userFilters.year) : null;
      const classes = await this.getAvailableClasses(teacher, yearFilter);
      
      if (classes.length === 0) {
        console.log("No classes found, returning empty result");
        return [];
      }
      
      // Get class IDs
      const classIds = classes.map(c => c._id);
      
      // Create a map of classId -> className for reference
      const classMap = classes.reduce((map, cls) => {
        map[cls._id.toString()] = cls.className;
        return map;
      }, {});
      
      // Find students in those classes
      const students = await Student.find({
        $or: [
          { 'currentClass.ref': { $in: classIds } },
          { 'class': { $in: classIds } }
        ]
      }).select('name registerNo totalPoints currentClass class department')
      .lean();
      
      // Enhanced student data with activity counts and class names
      const enhancedStudents = await Promise.all(students.map(async student => {
        // Get the class name
        let className = "Unknown";
        const classId = student.currentClass?.ref || student.class;
        
        if (classId) {
          className = classMap[classId.toString()] || "Unknown";
        }
        
        // Get activity count
        const activityCount = await Event.countDocuments({
          submittedBy: student._id,
          status: 'Approved'
        });
        
        // Get category breakdown
        const categoryBreakdown = await Event.aggregate([
          {
            $match: {
              submittedBy: student._id,
              status: 'Approved'
            }
          },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              points: { $sum: "$pointsEarned" }
            }
          },
          {
            $project: {
              category: "$_id",
              count: 1,
              points: 1,
              _id: 0
            }
          }
        ]);
        
        return {
          _id: student._id,
          name: student.name,
          registerNo: student.registerNo,
          className,
          department: student.department,
          totalPoints: student.totalPoints || 0,
          activityCount,
          categoryBreakdown
        };
      }));
      
      // Sort by total points descending
      return enhancedStudents.sort((a, b) => b.totalPoints - a.totalPoints);
    } catch (error) {
      console.error('Error getting detailed student performance:', error);
      return [];
    }
  }

  /**
   * Get category performance by class
   */
  static async getCategoryPerformanceByClass(teacher, userFilters = {}) {
    try {
      // Pass the year filter to getAvailableClasses
      const yearFilter = userFilters.year ? parseInt(userFilters.year) : null;
      const classes = await this.getAvailableClasses(teacher, yearFilter);
      
      if (classes.length === 0) {
        console.log("No classes found, returning empty result");
        return [];
      }
      
      // Create result structure
      const result = [];
      
      // Process each class
      for (const cls of classes) {
        // Find students in this class
        const students = await Student.find({
          $or: [
            { 'currentClass.ref': cls._id },
            { 'class': cls._id }
          ]
        }).select('_id').lean();
        
        const studentIds = students.map(s => s._id);
        
        if (studentIds.length === 0) continue;
        
        // Get category breakdown for this class
        const categoryBreakdown = await Event.aggregate([
          {
            $match: {
              submittedBy: { $in: studentIds },
              status: 'Approved'
            }
          },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
              points: { $sum: "$pointsEarned" }
            }
          },
          {
            $project: {
              category: "$_id",
              count: 1,
              points: 1,
              _id: 0
            }
          }
        ]);
        
        // Skip classes with no activities
        if (categoryBreakdown.length === 0) continue;
        
        // Add to result
        result.push({
          className: cls.className,
          categories: categoryBreakdown
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error getting category performance by class:', error);
      return [];
    }
  }

  /**
   * Get participation trends over time
   */
  static async getTrends(teacher, userFilters = {}) {
    try {
      // Pass the year filter to getAvailableClasses
      const yearFilter = userFilters.year ? parseInt(userFilters.year) : null;
      const classes = await this.getAvailableClasses(teacher, yearFilter);
      if (classes.length === 0) {
        console.log("No classes found, returning empty result");
        return [];
      }
      
      // Get class IDs
      const classIds = classes.map(c => c._id);
      
      // Find students in those classes
      const students = await Student.find({
        $or: [
          { 'currentClass.ref': { $in: classIds } },
          { 'class': { $in: classIds } }
        ]
      }).select('_id').lean();
      
      const studentIds = students.map(s => s._id);
      
      if (studentIds.length === 0) {
        console.log("No students found, returning empty result");
        return [];
      }
      
      // Get trends for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const trends = await Event.aggregate([
        {
          $match: {
            submittedBy: { $in: studentIds },
            status: 'Approved',
            date: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              month: { $month: "$date" },
              year: { $year: "$date" }
            },
            count: { $sum: 1 },
            points: { $sum: "$pointsEarned" }
          }
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1
          }
        },
        {
          $project: {
            month: "$_id.month",
            year: "$_id.year",
            date: {
              $dateToString: {
                format: "%Y-%m",
                date: {
                  $dateFromParts: {
                    year: "$_id.year",
                    month: "$_id.month",
                    day: 1
                  }
                }
              }
            },
            count: 1,
            points: 1,
            _id: 0
          }
        }
      ]);
      
      // If no trends found, create placeholder data for the last 6 months
      if (trends.length === 0) {
        const placeholderTrends = [];
        const currentDate = new Date();
        
        for (let i = 0; i < 6; i++) {
          const date = new Date();
          date.setMonth(currentDate.getMonth() - i);
          
          placeholderTrends.push({
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            date: date.toISOString().slice(0, 7),
            count: 0,
            points: 0
          });
        }
        
        return placeholderTrends.reverse();
      }
      
      return trends;
    } catch (error) {
      console.error('Error getting trends:', error);
      return [];
    }
  }

  /**
   * Get class participation data
   */
  static async getClassParticipation(teacher, userFilters = {}) {
    try {
      // Pass the year filter to getAvailableClasses
      const yearFilter = userFilters.year ? parseInt(userFilters.year) : null;
      const classes = await this.getAvailableClasses(teacher, yearFilter);
      
      if (classes.length === 0) {
        console.log("No classes found, returning empty result");
        return [];
      }
      
      // Get participation data for each month in the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Create a result structure with one entry per month
      const monthlyData = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(currentDate.getMonth() - i);
        
        monthlyData.push({
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          date: date.toISOString().slice(0, 7),
          classes: {}
        });
      }
      
      // Process each class
      for (const cls of classes) {
        // Find students in this class
        const students = await Student.find({
          $or: [
            { 'currentClass.ref': cls._id },
            { 'class': cls._id }
          ]
        }).select('_id').lean();
        
        const studentIds = students.map(s => s._id);
        
        if (studentIds.length === 0) continue;
        
        // Get monthly activity counts for this class
        const monthlyActivities = await Event.aggregate([
          {
            $match: {
              submittedBy: { $in: studentIds },
              status: 'Approved',
              date: { $gte: sixMonthsAgo }
            }
          },
          {
            $group: {
              _id: {
                month: { $month: "$date" },
                year: { $year: "$date" }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1
            }
          }
        ]);
        
        // Add this class's data to the monthly structure
        monthlyActivities.forEach(item => {
          const monthData = monthlyData.find(
            md => md.month === item._id.month && md.year === item._id.year
          );
          
          if (monthData) {
            monthData.classes[cls.className] = item.count;
          }
        });
      }
      
      // Ensure all classes are represented in all months (with 0 if no activity)
      const classNames = classes.map(c => c.className);
      
      monthlyData.forEach(monthData => {
        classNames.forEach(className => {
          if (!monthData.classes[className]) {
            monthData.classes[className] = 0;
          }
        });
      });
      
      // Convert to format expected by frontend
      const result = monthlyData.map(monthData => ({
        date: monthData.date,
        ...monthData.classes
      }));
      
      return result.reverse(); // Most recent first
    } catch (error) {
      console.error('Error getting class participation:', error);
      return [];
    }
  }
}

module.exports = RoleBasedEventReportsService;