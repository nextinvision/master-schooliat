import https from "https";
import http from "http";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const PLATFORM = "android";

// Test credentials
const CREDENTIALS = {
  teacher: {
    email: process.env.TEACHER_EMAIL || "teacher1@gis001.edu",
    password: process.env.TEACHER_PASSWORD || "Teacher@123",
  },
  student: {
    email: process.env.STUDENT_EMAIL || "student1@gis001.edu",
    password: process.env.STUDENT_PASSWORD || "Student@123",
  },
  employee: {
    email: process.env.EMPLOYEE_EMAIL || "john.doe@schooliat.com",
    password: process.env.EMPLOYEE_PASSWORD || "Employee@123",
  },
};

const tokens = {
  teacher: null,
  student: null,
  employee: null,
};

// Helper function to make HTTP requests
const makeRequest = (method, path, token = null, body = null, queryParams = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    // Add query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.append(key, value);
      }
    });

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-platform": PLATFORM,
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    if (body) {
      options.headers["Content-Type"] = "application/json";
    }

    const protocol = BASE_URL.startsWith("https") ? https : http;
    const req = protocol.request(url.toString(), options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = { raw: data };
        }
        resolve({
          status: res.statusCode,
          data: parsedData,
          headers: res.headers,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

// Authenticate users
const authenticate = async (email, password, role) => {
  try {
    const response = await makeRequest("POST", "/auth/authenticate", null, {
      request: { email, password },
    });

    if (response.status === 200 && response.data.token) {
      tokens[role] = response.data.token;
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Authentication failed for ${role}:`, error.message);
    return false;
  }
};

// Test endpoint
const testEndpoint = async (name, method, path, role, body = null, queryParams = {}) => {
  const token = tokens[role];
  if (!token && role !== "none") {
    return { success: false, error: "No token available" };
  }

  try {
    const response = await makeRequest(method, path, token, body, queryParams);
    
    const isSuccess = response.status >= 200 && response.status < 300;
    const hasData = response.data && (response.data.data !== undefined || response.data.message !== undefined);
    
    return {
      success: isSuccess && hasData,
      status: response.status,
      message: response.data?.message || response.data?.error || "No message",
      error: isSuccess && !hasData ? "Invalid JSON response" : null,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message,
    };
  }
};

// Color codes for terminal
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
};

// Test results storage
const results = {
  teacher: { success: [], failed: [] },
  student: { success: [], failed: [] },
  employee: { success: [], failed: [] },
  shared: { success: [], failed: [] },
};

// Test all endpoints
const runTests = async () => {
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
  console.log(`║     Complete Mobile API Endpoint Test Suite             ║`);
  console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Platform: ${PLATFORM}\n`);

  // Authenticate all users
  log.section("🔐 Authenticating users...");
  const teacherAuth = await authenticate(CREDENTIALS.teacher.email, CREDENTIALS.teacher.password, "teacher");
  const studentAuth = await authenticate(CREDENTIALS.student.email, CREDENTIALS.student.password, "student");
  const employeeAuth = await authenticate(CREDENTIALS.employee.email, CREDENTIALS.employee.password, "employee");

  if (teacherAuth) log.success(`Teacher authenticated`);
  else log.error(`Teacher authentication failed`);

  if (studentAuth) log.success(`Student authenticated`);
  else log.error(`Student authentication failed`);

  if (employeeAuth) log.success(`Employee authenticated`);
  else log.error(`Employee authentication failed`);

  if (!teacherAuth && !studentAuth && !employeeAuth) {
    console.log("\n❌ All authentications failed. Cannot proceed with tests.");
    return;
  }

  // ========== TEACHER ENDPOINTS ==========
  log.section("\n👨‍🏫 Testing Teacher Endpoints...");

  // Dashboard
  const teacherDashboard = await testEndpoint("Dashboard", "GET", "/statistics/dashboard", "teacher");
  if (teacherDashboard.success) {
    results.teacher.success.push("GET /statistics/dashboard");
    log.success(`GET /statistics/dashboard - ${teacherDashboard.status} - ${teacherDashboard.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /statistics/dashboard", ...teacherDashboard });
    log.error(`GET /statistics/dashboard - ${teacherDashboard.status || "Error"} - ${teacherDashboard.error || teacherDashboard.message}`);
  }

  // Students (Note: This endpoint might not exist, testing anyway)
  const teacherStudents = await testEndpoint("Get Students", "GET", "/students", "teacher", null, { page: 1, limit: 10 });
  if (teacherStudents.success) {
    results.teacher.success.push("GET /students");
    log.success(`GET /students - ${teacherStudents.status} - ${teacherStudents.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /students", ...teacherStudents });
    log.warning(`GET /students - ${teacherStudents.status || "Error"} - ${teacherStudents.error || teacherStudents.message}`);
  }

  // Attendance
  const teacherAttendance = await testEndpoint("Get Attendance", "GET", "/attendance", "teacher");
  if (teacherAttendance.success) {
    results.teacher.success.push("GET /attendance");
    log.success(`GET /attendance - ${teacherAttendance.status} - ${teacherAttendance.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /attendance", ...teacherAttendance });
    log.warning(`GET /attendance - ${teacherAttendance.status || "Error"} - ${teacherAttendance.error || teacherAttendance.message}`);
  }

  const teacherAttendanceStats = await testEndpoint("Get Attendance Statistics", "GET", "/attendance/statistics", "teacher");
  if (teacherAttendanceStats.success) {
    results.teacher.success.push("GET /attendance/statistics");
    log.success(`GET /attendance/statistics - ${teacherAttendanceStats.status} - ${teacherAttendanceStats.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /attendance/statistics", ...teacherAttendanceStats });
    log.warning(`GET /attendance/statistics - ${teacherAttendanceStats.status || "Error"} - ${teacherAttendanceStats.error || teacherAttendanceStats.message}`);
  }

  // Homework
  const teacherHomework = await testEndpoint("Get Homework", "GET", "/homework", "teacher");
  if (teacherHomework.success) {
    results.teacher.success.push("GET /homework");
    log.success(`GET /homework - ${teacherHomework.status} - ${teacherHomework.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /homework", ...teacherHomework });
    log.warning(`GET /homework - ${teacherHomework.status || "Error"} - ${teacherHomework.error || teacherHomework.message}`);
  }

  // Marks
  const teacherMarks = await testEndpoint("Get Marks", "GET", "/marks", "teacher");
  if (teacherMarks.success) {
    results.teacher.success.push("GET /marks");
    log.success(`GET /marks - ${teacherMarks.status} - ${teacherMarks.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /marks", ...teacherMarks });
    log.warning(`GET /marks - ${teacherMarks.status || "Error"} - ${teacherMarks.error || teacherMarks.message}`);
  }

  // Timetables
  const teacherTimetables = await testEndpoint("Get Timetables", "GET", "/timetables", "teacher");
  if (teacherTimetables.success) {
    results.teacher.success.push("GET /timetables");
    log.success(`GET /timetables - ${teacherTimetables.status} - ${teacherTimetables.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /timetables", ...teacherTimetables });
    log.warning(`GET /timetables - ${teacherTimetables.status || "Error"} - ${teacherTimetables.error || teacherTimetables.message}`);
  }

  // Notes
  const teacherNotes = await testEndpoint("Get Notes", "GET", "/notes", "teacher");
  if (teacherNotes.success) {
    results.teacher.success.push("GET /notes");
    log.success(`GET /notes - ${teacherNotes.status} - ${teacherNotes.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /notes", ...teacherNotes });
    log.warning(`GET /notes - ${teacherNotes.status || "Error"} - ${teacherNotes.error || teacherNotes.message}`);
  }

  // Leave
  const teacherLeaveRequests = await testEndpoint("Get Leave Requests", "GET", "/leave/requests", "teacher");
  if (teacherLeaveRequests.success) {
    results.teacher.success.push("GET /leave/requests");
    log.success(`GET /leave/requests - ${teacherLeaveRequests.status} - ${teacherLeaveRequests.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /leave/requests", ...teacherLeaveRequests });
    log.warning(`GET /leave/requests - ${teacherLeaveRequests.status || "Error"} - ${teacherLeaveRequests.error || teacherLeaveRequests.message}`);
  }

  const teacherLeaveBalance = await testEndpoint("Get Leave Balance", "GET", "/leave/balance", "teacher");
  if (teacherLeaveBalance.success) {
    results.teacher.success.push("GET /leave/balance");
    log.success(`GET /leave/balance - ${teacherLeaveBalance.status} - ${teacherLeaveBalance.message}`);
  } else {
    results.teacher.failed.push({ endpoint: "GET /leave/balance", ...teacherLeaveBalance });
    log.warning(`GET /leave/balance - ${teacherLeaveBalance.status || "Error"} - ${teacherLeaveBalance.error || teacherLeaveBalance.message}`);
  }

  // ========== STUDENT ENDPOINTS ==========
  log.section("\n🎓 Testing Student Endpoints...");

  // Dashboard
  const studentDashboard = await testEndpoint("Dashboard", "GET", "/statistics/dashboard", "student");
  if (studentDashboard.success) {
    results.student.success.push("GET /statistics/dashboard");
    log.success(`GET /statistics/dashboard - ${studentDashboard.status} - ${studentDashboard.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /statistics/dashboard", ...studentDashboard });
    log.error(`GET /statistics/dashboard - ${studentDashboard.status || "Error"} - ${studentDashboard.error || studentDashboard.message}`);
  }

  // Attendance
  const studentAttendance = await testEndpoint("Get Attendance", "GET", "/attendance", "student");
  if (studentAttendance.success) {
    results.student.success.push("GET /attendance");
    log.success(`GET /attendance - ${studentAttendance.status} - ${studentAttendance.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /attendance", ...studentAttendance });
    log.warning(`GET /attendance - ${studentAttendance.status || "Error"} - ${studentAttendance.error || studentAttendance.message}`);
  }

  const studentAttendanceStats = await testEndpoint("Get Attendance Statistics", "GET", "/attendance/statistics", "student");
  if (studentAttendanceStats.success) {
    results.student.success.push("GET /attendance/statistics");
    log.success(`GET /attendance/statistics - ${studentAttendanceStats.status} - ${studentAttendanceStats.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /attendance/statistics", ...studentAttendanceStats });
    log.warning(`GET /attendance/statistics - ${studentAttendanceStats.status || "Error"} - ${studentAttendanceStats.error || studentAttendanceStats.message}`);
  }

  // Homework
  const studentHomework = await testEndpoint("Get Homework", "GET", "/homework", "student");
  if (studentHomework.success) {
    results.student.success.push("GET /homework");
    log.success(`GET /homework - ${studentHomework.status} - ${studentHomework.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /homework", ...studentHomework });
    log.warning(`GET /homework - ${studentHomework.status || "Error"} - ${studentHomework.error || studentHomework.message}`);
  }

  // Marks
  const studentMarks = await testEndpoint("Get Marks", "GET", "/marks", "student");
  if (studentMarks.success) {
    results.student.success.push("GET /marks");
    log.success(`GET /marks - ${studentMarks.status} - ${studentMarks.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /marks", ...studentMarks });
    log.warning(`GET /marks - ${studentMarks.status || "Error"} - ${studentMarks.error || studentMarks.message}`);
  }

  const studentResults = await testEndpoint("Get Results", "GET", "/marks/results", "student");
  if (studentResults.success) {
    results.student.success.push("GET /marks/results");
    log.success(`GET /marks/results - ${studentResults.status} - ${studentResults.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /marks/results", ...studentResults });
    log.warning(`GET /marks/results - ${studentResults.status || "Error"} - ${studentResults.error || studentResults.message}`);
  }

  // Timetables
  const studentTimetables = await testEndpoint("Get Timetables", "GET", "/timetables", "student");
  if (studentTimetables.success) {
    results.student.success.push("GET /timetables");
    log.success(`GET /timetables - ${studentTimetables.status} - ${studentTimetables.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /timetables", ...studentTimetables });
    log.warning(`GET /timetables - ${studentTimetables.status || "Error"} - ${studentTimetables.error || studentTimetables.message}`);
  }

  // Notes
  const studentNotes = await testEndpoint("Get Notes", "GET", "/notes", "student");
  if (studentNotes.success) {
    results.student.success.push("GET /notes");
    log.success(`GET /notes - ${studentNotes.status} - ${studentNotes.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /notes", ...studentNotes });
    log.warning(`GET /notes - ${studentNotes.status || "Error"} - ${studentNotes.error || studentNotes.message}`);
  }

  // Syllabus
  const studentSyllabus = await testEndpoint("Get Syllabus", "GET", "/syllabus", "student");
  if (studentSyllabus.success) {
    results.student.success.push("GET /syllabus");
    log.success(`GET /syllabus - ${studentSyllabus.status} - ${studentSyllabus.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /syllabus", ...studentSyllabus });
    log.warning(`GET /syllabus - ${studentSyllabus.status || "Error"} - ${studentSyllabus.error || studentSyllabus.message}`);
  }

  // Fees
  const studentFees = await testEndpoint("Get Fees", "GET", "/fees", "student");
  if (studentFees.success) {
    results.student.success.push("GET /fees");
    log.success(`GET /fees - ${studentFees.status} - ${studentFees.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /fees", ...studentFees });
    log.warning(`GET /fees - ${studentFees.status || "Error"} - ${studentFees.error || studentFees.message}`);
  }

  const studentFeeStatus = await testEndpoint("Get Fee Status", "GET", "/fees/status", "student");
  if (studentFeeStatus.success) {
    results.student.success.push("GET /fees/status");
    log.success(`GET /fees/status - ${studentFeeStatus.status} - ${studentFeeStatus.message}`);
  } else {
    results.student.failed.push({ endpoint: "GET /fees/status", ...studentFeeStatus });
    log.warning(`GET /fees/status - ${studentFeeStatus.status || "Error"} - ${studentFeeStatus.error || studentFeeStatus.message}`);
  }

  // ========== EMPLOYEE ENDPOINTS ==========
  log.section("\n🏢 Testing Employee Endpoints...");

  // Dashboard
  const employeeDashboard = await testEndpoint("Dashboard", "GET", "/statistics/dashboard", "employee");
  if (employeeDashboard.success) {
    results.employee.success.push("GET /statistics/dashboard");
    log.success(`GET /statistics/dashboard - ${employeeDashboard.status} - ${employeeDashboard.message}`);
  } else {
    results.employee.failed.push({ endpoint: "GET /statistics/dashboard", ...employeeDashboard });
    log.error(`GET /statistics/dashboard - ${employeeDashboard.status || "Error"} - ${employeeDashboard.error || employeeDashboard.message}`);
  }

  // Schools
  const employeeSchools = await testEndpoint("Get Schools", "GET", "/schools", "employee", null, { page: 1, limit: 10 });
  if (employeeSchools.success) {
    results.employee.success.push("GET /schools");
    log.success(`GET /schools - ${employeeSchools.status} - ${employeeSchools.message}`);
  } else {
    results.employee.failed.push({ endpoint: "GET /schools", ...employeeSchools });
    log.warning(`GET /schools - ${employeeSchools.status || "Error"} - ${employeeSchools.error || employeeSchools.message}`);
  }

  // Employees
  const employeeEmployees = await testEndpoint("Get Employees", "GET", "/employees", "employee", null, { page: 1, limit: 10 });
  if (employeeEmployees.success) {
    results.employee.success.push("GET /employees");
    log.success(`GET /employees - ${employeeEmployees.status} - ${employeeEmployees.message}`);
  } else {
    results.employee.failed.push({ endpoint: "GET /employees", ...employeeEmployees });
    log.warning(`GET /employees - ${employeeEmployees.status || "Error"} - ${employeeEmployees.error || employeeEmployees.message}`);
  }

  // Vendors
  const employeeVendors = await testEndpoint("Get Vendors", "GET", "/vendors", "employee", null, { page: 1, limit: 10 });
  if (employeeVendors.success) {
    results.employee.success.push("GET /vendors");
    log.success(`GET /vendors - ${employeeVendors.status} - ${employeeVendors.message}`);
  } else {
    results.employee.failed.push({ endpoint: "GET /vendors", ...employeeVendors });
    log.warning(`GET /vendors - ${employeeVendors.status || "Error"} - ${employeeVendors.error || employeeVendors.message}`);
  }

  // Licenses
  const employeeLicenses = await testEndpoint("Get Licenses", "GET", "/licenses", "employee", null, { page: 1, limit: 10 });
  if (employeeLicenses.success) {
    results.employee.success.push("GET /licenses");
    log.success(`GET /licenses - ${employeeLicenses.status} - ${employeeLicenses.message}`);
  } else {
    results.employee.failed.push({ endpoint: "GET /licenses", ...employeeLicenses });
    log.warning(`GET /licenses - ${employeeLicenses.status || "Error"} - ${employeeLicenses.error || employeeLicenses.message}`);
  }

  // Receipts
  const employeeReceipts = await testEndpoint("Get Receipts", "GET", "/receipts", "employee", null, { page: 1, limit: 10 });
  if (employeeReceipts.success) {
    results.employee.success.push("GET /receipts");
    log.success(`GET /receipts - ${employeeReceipts.status} - ${employeeReceipts.message}`);
  } else {
    results.employee.failed.push({ endpoint: "GET /receipts", ...employeeReceipts });
    log.warning(`GET /receipts - ${employeeReceipts.status || "Error"} - ${employeeReceipts.error || employeeReceipts.message}`);
  }

  // Statistics
  const employeeStats = await testEndpoint("Get School Statistics", "GET", "/statistics/schools", "employee");
  if (employeeStats.success) {
    results.employee.success.push("GET /statistics/schools");
    log.success(`GET /statistics/schools - ${employeeStats.status} - ${employeeStats.message}`);
  } else {
    results.employee.failed.push({ endpoint: "GET /statistics/schools", ...employeeStats });
    log.warning(`GET /statistics/schools - ${employeeStats.status || "Error"} - ${employeeStats.error || employeeStats.message}`);
  }

  // ========== SHARED ENDPOINTS ==========
  log.section("\n🔗 Testing Shared Endpoints...");

  // Notifications (using teacher token)
  const notifications = await testEndpoint("Get Notifications", "GET", "/notifications", "teacher", null, { page: 1, limit: 10 });
  if (notifications.success) {
    results.shared.success.push("GET /notifications");
    log.success(`GET /notifications - ${notifications.status} - ${notifications.message}`);
  } else {
    results.shared.failed.push({ endpoint: "GET /notifications", ...notifications });
    log.warning(`GET /notifications - ${notifications.status || "Error"} - ${notifications.error || notifications.message}`);
  }

  // Announcements
  const announcements = await testEndpoint("Get Announcements", "GET", "/communication/announcements", "teacher");
  if (announcements.success) {
    results.shared.success.push("GET /communication/announcements");
    log.success(`GET /communication/announcements - ${announcements.status} - ${announcements.message}`);
  } else {
    results.shared.failed.push({ endpoint: "GET /communication/announcements", ...announcements });
    log.warning(`GET /communication/announcements - ${announcements.status || "Error"} - ${announcements.error || announcements.message}`);
  }

  // Circulars
  const circulars = await testEndpoint("Get Circulars", "GET", "/circulars", "teacher");
  if (circulars.success) {
    results.shared.success.push("GET /circulars");
    log.success(`GET /circulars - ${circulars.status} - ${circulars.message}`);
  } else {
    results.shared.failed.push({ endpoint: "GET /circulars", ...circulars });
    log.warning(`GET /circulars - ${circulars.status || "Error"} - ${circulars.error || circulars.message}`);
  }

  // Calendar Events
  const calendarEvents = await testEndpoint("Get Calendar Events", "GET", "/calendar/events", "teacher");
  if (calendarEvents.success) {
    results.shared.success.push("GET /calendar/events");
    log.success(`GET /calendar/events - ${calendarEvents.status} - ${calendarEvents.message}`);
  } else {
    results.shared.failed.push({ endpoint: "GET /calendar/events", ...calendarEvents });
    log.warning(`GET /calendar/events - ${calendarEvents.status || "Error"} - ${calendarEvents.error || calendarEvents.message}`);
  }

  // Calendar
  const calendar = await testEndpoint("Get Calendar", "GET", "/calendar", "teacher");
  if (calendar.success) {
    results.shared.success.push("GET /calendar");
    log.success(`GET /calendar - ${calendar.status} - ${calendar.message}`);
  } else {
    results.shared.failed.push({ endpoint: "GET /calendar", ...calendar });
    log.warning(`GET /calendar - ${calendar.status || "Error"} - ${calendar.error || calendar.message}`);
  }

  // Gallery
  const gallery = await testEndpoint("Get Gallery", "GET", "/gallery", "teacher");
  if (gallery.success) {
    results.shared.success.push("GET /gallery");
    log.success(`GET /gallery - ${gallery.status} - ${gallery.message}`);
  } else {
    results.shared.failed.push({ endpoint: "GET /gallery", ...gallery });
    log.warning(`GET /gallery - ${gallery.status || "Error"} - ${gallery.error || gallery.message}`);
  }

  // ========== SUMMARY ==========
  log.section("\n═══════════════════════════════════════════════════════════");
  log.section("📊 TEST SUMMARY");
  log.section("═══════════════════════════════════════════════════════════\n");

  const totalSuccess = 
    results.teacher.success.length +
    results.student.success.length +
    results.employee.success.length +
    results.shared.success.length;

  const totalFailed = 
    results.teacher.failed.length +
    results.student.failed.length +
    results.employee.failed.length +
    results.shared.failed.length;

  const total = totalSuccess + totalFailed;

  console.log(`${colors.green}✅ Successful: ${totalSuccess}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings (4xx): ${totalFailed}${colors.reset}`);
  console.log(`${colors.cyan}📊 Total: ${total}${colors.reset}\n`);

  if (totalFailed > 0) {
    log.section("⚠️  Failed/Problematic Endpoints:\n");
    
    [...results.teacher.failed, ...results.student.failed, ...results.employee.failed, ...results.shared.failed].forEach((item) => {
      console.log(`  ${item.endpoint} - ${item.status || "Error"} - ${item.error || item.message}`);
    });
  }

  console.log("\n");
};

// Run tests
runTests().catch((error) => {
  console.error("Test execution failed:", error);
  process.exit(1);
});

