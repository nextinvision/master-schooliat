import "dotenv/config";

const BASE_URL = process.env.API_URL || process.env.TEST_API_URL || "http://localhost:3000";
const PLATFORM = "android"; // Mobile platform

let teacherToken = null;
let studentToken = null;
let employeeToken = null;
let testResults = [];
let createdResources = {
  teacher: {},
  student: {},
  employee: {},
};

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const logResult = (endpoint, method, status, message, data = null, userType = "") => {
  const result = {
    endpoint,
    method,
    status,
    message,
    data: data ? JSON.stringify(data).substring(0, 100) : null,
    timestamp: new Date().toISOString(),
    userType,
  };
  testResults.push(result);
  
  const statusIcon = 
    status >= 200 && status < 300 ? "✅" : 
    status >= 400 && status < 500 ? "⚠️" : 
    "❌";
  
  const color = 
    status >= 200 && status < 300 ? colors.green : 
    status >= 400 && status < 500 ? colors.yellow : 
    colors.red;
  
  const prefix = userType ? `[${userType.toUpperCase()}] ` : "";
  console.log(
    `${color}${statusIcon} ${prefix}${method} ${endpoint} - ${status} - ${message}${colors.reset}`
  );
};

const testEndpoint = async (method, endpoint, body = null, headers = {}, userType = "") => {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-platform": PLATFORM,
        ...headers,
      },
    };

    if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json().catch(() => ({}));

    logResult(
      endpoint,
      method,
      response.status,
      responseData.message || response.statusText,
      responseData,
      userType
    );

    return { status: response.status, data: responseData };
  } catch (error) {
    logResult(endpoint, method, 0, `Error: ${error.message}`, null, userType);
    return { status: 0, data: null };
  }
};

const authenticate = async (email, password, userType) => {
  console.log(`\n${colors.cyan}🔐 Authenticating as ${userType.toUpperCase()}...${colors.reset}`);
  
  const response = await testEndpoint(
    "POST",
    "/auth/authenticate",
    {
      request: { email, password },
    },
    {},
    userType
  );

  if (response.data?.token) {
    if (userType === "teacher") teacherToken = response.data.token;
    if (userType === "student") studentToken = response.data.token;
    if (userType === "employee") employeeToken = response.data.token;
    console.log(`${colors.green}✅ ${userType.toUpperCase()} authenticated successfully!${colors.reset}\n`);
    return response.data.token;
  } else {
    console.log(`${colors.red}❌ ${userType.toUpperCase()} authentication failed!${colors.reset}\n`);
    return null;
  }
};

const testTeacherAPIs = async () => {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}📚 TESTING TEACHER APIs${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  if (!teacherToken) {
    console.log(`${colors.yellow}⚠️  Teacher token not available. Skipping teacher tests.${colors.reset}\n`);
    return;
  }

  const headers = { Authorization: `Bearer ${teacherToken}` };

  // Dashboard
  console.log(`${colors.cyan}📊 Testing Dashboard...${colors.reset}`);
  await testEndpoint("GET", "/statistics/dashboard", null, headers, "teacher");

  // Students
  console.log(`\n${colors.cyan}👥 Testing Students...${colors.reset}`);
  const studentsResponse = await testEndpoint("GET", "/students", null, headers, "teacher");
  if (studentsResponse.data?.data?.length > 0) {
    const studentId = studentsResponse.data.data[0].id;
    createdResources.teacher.studentId = studentId;
    await testEndpoint("GET", `/students/${studentId}`, null, headers, "teacher");
  }

  // Attendance
  console.log(`\n${colors.cyan}📅 Testing Attendance...${colors.reset}`);
  const today = new Date().toISOString().split("T")[0];
  if (createdResources.teacher.studentId) {
    await testEndpoint(
      "POST",
      "/attendance/mark",
      {
        request: {
          studentId: createdResources.teacher.studentId,
          classId: "test-class-id", // Would need actual class ID
          date: today,
          status: "PRESENT",
        },
      },
      headers,
      "teacher"
    );
  }
  await testEndpoint("GET", "/attendance", null, headers, "teacher");
  await testEndpoint("GET", "/attendance/statistics", null, headers, "teacher");

  // Homework
  console.log(`\n${colors.cyan}📝 Testing Homework...${colors.reset}`);
  await testEndpoint("GET", "/homework", null, headers, "teacher");
  const homeworkResponse = await testEndpoint(
    "POST",
    "/homework",
    {
      request: {
        title: "Test Homework",
        description: "Test homework description",
        classIds: ["test-class-id"],
        subjectId: "test-subject-id",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isMCQ: false,
        attachments: [],
      },
    },
    headers,
    "teacher"
  );
  if (homeworkResponse.data?.data?.id) {
    createdResources.teacher.homeworkId = homeworkResponse.data.data.id;
  }

  // Marks
  console.log(`\n${colors.cyan}📊 Testing Marks...${colors.reset}`);
  await testEndpoint("GET", "/marks", null, headers, "teacher");
  if (createdResources.teacher.studentId) {
    await testEndpoint(
      "POST",
      "/marks",
      {
        request: {
          examId: "test-exam-id",
          studentId: createdResources.teacher.studentId,
          subjectId: "test-subject-id",
          classId: "test-class-id",
          marksObtained: 85,
          maxMarks: 100,
        },
      },
      headers,
      "teacher"
    );
  }

  // Timetable
  console.log(`\n${colors.cyan}📅 Testing Timetable...${colors.reset}`);
  await testEndpoint("GET", "/timetables", null, headers, "teacher");
  const timetableResponse = await testEndpoint("GET", "/timetables", null, headers, "teacher");
  if (timetableResponse.data?.data?.length > 0) {
    const timetableId = timetableResponse.data.data[0].id;
    await testEndpoint("GET", `/timetables/${timetableId}`, null, headers, "teacher");
  }

  // Notes
  console.log(`\n${colors.cyan}📄 Testing Notes...${colors.reset}`);
  await testEndpoint("GET", "/notes", null, headers, "teacher");

  // Leave
  console.log(`\n${colors.cyan}🏖️  Testing Leave Management...${colors.reset}`);
  await testEndpoint("GET", "/leave/requests", null, headers, "teacher");
  await testEndpoint("GET", "/leave/balance", null, headers, "teacher");
};

const testStudentAPIs = async () => {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}🎓 TESTING STUDENT APIs${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  if (!studentToken) {
    console.log(`${colors.yellow}⚠️  Student token not available. Skipping student tests.${colors.reset}\n`);
    return;
  }

  const headers = { Authorization: `Bearer ${studentToken}` };

  // Dashboard
  console.log(`${colors.cyan}📊 Testing Dashboard...${colors.reset}`);
  await testEndpoint("GET", "/statistics/dashboard", null, headers, "student");

  // Profile
  console.log(`\n${colors.cyan}👤 Testing Profile...${colors.reset}`);
  const studentsResponse = await testEndpoint("GET", "/students", null, headers, "student");
  if (studentsResponse.data?.data?.length > 0) {
    const studentId = studentsResponse.data.data[0].id;
    createdResources.student.studentId = studentId;
    await testEndpoint("GET", `/students/${studentId}`, null, headers, "student");
  }

  // Attendance
  console.log(`\n${colors.cyan}📅 Testing Attendance...${colors.reset}`);
  await testEndpoint("GET", "/attendance", null, headers, "student");
  await testEndpoint("GET", "/attendance/statistics", null, headers, "student");

  // Homework
  console.log(`\n${colors.cyan}📝 Testing Homework...${colors.reset}`);
  const homeworkResponse = await testEndpoint("GET", "/homework", null, headers, "student");
  if (homeworkResponse.data?.data?.length > 0) {
    const homeworkId = homeworkResponse.data.data[0].id;
    createdResources.student.homeworkId = homeworkId;
    await testEndpoint(
      "POST",
      `/homework/${homeworkId}/submit`,
      {
        request: {
          files: [],
          answers: [],
        },
      },
      headers,
      "student"
    );
  }

  // Marks & Results
  console.log(`\n${colors.cyan}📊 Testing Marks & Results...${colors.reset}`);
  await testEndpoint("GET", "/marks", null, headers, "student");
  await testEndpoint("GET", "/marks/results", null, headers, "student");

  // Timetable
  console.log(`\n${colors.cyan}📅 Testing Timetable...${colors.reset}`);
  await testEndpoint("GET", "/timetables", null, headers, "student");

  // Notes & Syllabus
  console.log(`\n${colors.cyan}📄 Testing Notes & Syllabus...${colors.reset}`);
  await testEndpoint("GET", "/notes", null, headers, "student");
  await testEndpoint("GET", "/syllabus", null, headers, "student");

  // Fees
  console.log(`\n${colors.cyan}💰 Testing Fees...${colors.reset}`);
  await testEndpoint("GET", "/fees", null, headers, "student");
  await testEndpoint("GET", "/fees/status", null, headers, "student");
};

const testEmployeeAPIs = async () => {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}🏢 TESTING EMPLOYEE (COMPANY) APIs${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  if (!employeeToken) {
    console.log(`${colors.yellow}⚠️  Employee token not available. Skipping employee tests.${colors.reset}\n`);
    return;
  }

  const headers = { Authorization: `Bearer ${employeeToken}` };

  // Dashboard
  console.log(`${colors.cyan}📊 Testing Dashboard...${colors.reset}`);
  await testEndpoint("GET", "/statistics/dashboard", null, headers, "employee");

  // Schools
  console.log(`\n${colors.cyan}🏫 Testing Schools...${colors.reset}`);
  const schoolsResponse = await testEndpoint("GET", "/schools", null, headers, "employee");
  if (schoolsResponse.data?.data?.length > 0) {
    const schoolId = schoolsResponse.data.data[0].id;
    createdResources.employee.schoolId = schoolId;
    await testEndpoint("GET", `/schools/${schoolId}`, null, headers, "employee");
  }

  // Employees
  console.log(`\n${colors.cyan}👔 Testing Employees...${colors.reset}`);
  await testEndpoint("GET", "/employees", null, headers, "employee");
  const employeesResponse = await testEndpoint("GET", "/employees", null, headers, "employee");
  if (employeesResponse.data?.data?.length > 0) {
    const employeeId = employeesResponse.data.data[0].id;
    await testEndpoint("GET", `/employees/${employeeId}`, null, headers, "employee");
  }

  // Vendors
  console.log(`\n${colors.cyan}🏪 Testing Vendors...${colors.reset}`);
  await testEndpoint("GET", "/vendors", null, headers, "employee");
  const vendorsResponse = await testEndpoint("GET", "/vendors", null, headers, "employee");
  if (vendorsResponse.data?.data?.length > 0) {
    const vendorId = vendorsResponse.data.data[0].id;
    await testEndpoint("GET", `/vendors/${vendorId}`, null, headers, "employee");
  }

  // Licenses
  console.log(`\n${colors.cyan}📜 Testing Licenses...${colors.reset}`);
  await testEndpoint("GET", "/licenses", null, headers, "employee");
  const licensesResponse = await testEndpoint("GET", "/licenses", null, headers, "employee");
  if (licensesResponse.data?.data?.length > 0) {
    const licenseId = licensesResponse.data.data[0].id;
    await testEndpoint("GET", `/licenses/${licenseId}`, null, headers, "employee");
  }

  // Receipts
  console.log(`\n${colors.cyan}🧾 Testing Receipts...${colors.reset}`);
  await testEndpoint("GET", "/receipts", null, headers, "employee");

  // Statistics
  console.log(`\n${colors.cyan}📈 Testing Statistics...${colors.reset}`);
  await testEndpoint("GET", "/statistics/schools", null, headers, "employee");
};

const testSharedAPIs = async () => {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}🔗 TESTING SHARED APIs${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  // Use teacher token for shared APIs (any authenticated user can access)
  const token = teacherToken || studentToken || employeeToken;
  if (!token) {
    console.log(`${colors.yellow}⚠️  No token available. Skipping shared tests.${colors.reset}\n`);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  // Notifications
  console.log(`${colors.cyan}🔔 Testing Notifications...${colors.reset}`);
  await testEndpoint("GET", "/notifications", null, headers, "shared");
  const notificationsResponse = await testEndpoint("GET", "/notifications", null, headers, "shared");
  if (notificationsResponse.data?.data?.length > 0) {
    const notificationId = notificationsResponse.data.data[0].id;
    await testEndpoint("PUT", `/notifications/${notificationId}/read`, null, headers, "shared");
  }

  // Announcements
  console.log(`\n${colors.cyan}📢 Testing Announcements...${colors.reset}`);
  await testEndpoint("GET", "/communication/announcements", null, headers, "shared");

  // Circulars
  console.log(`\n${colors.cyan}📋 Testing Circulars...${colors.reset}`);
  await testEndpoint("GET", "/circulars", null, headers, "shared");

  // Events
  console.log(`\n${colors.cyan}📅 Testing Events...${colors.reset}`);
  await testEndpoint("GET", "/calendar/events", null, headers, "shared");
  await testEndpoint("GET", "/calendar", null, headers, "shared");

  // Gallery
  console.log(`\n${colors.cyan}🖼️  Testing Gallery...${colors.reset}`);
  await testEndpoint("GET", "/gallery", null, headers, "shared");
};

const testAuthAPIs = async () => {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}🔐 TESTING AUTHENTICATION APIs${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  // Request OTP
  console.log(`${colors.cyan}📧 Testing OTP...${colors.reset}`);
  await testEndpoint(
    "POST",
    "/auth/request-otp",
    {
      request: {
        email: "test@example.com",
        purpose: "verification",
      },
    },
    {},
    "auth"
  );

  // Forgot Password
  console.log(`\n${colors.cyan}🔑 Testing Forgot Password...${colors.reset}`);
  await testEndpoint(
    "POST",
    "/auth/forgot-password",
    {
      request: {
        email: "test@example.com",
      },
    },
    {},
    "auth"
  );
};

const printSummary = () => {
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}📊 TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  const total = testResults.length;
  const success = testResults.filter((r) => r.status >= 200 && r.status < 300).length;
  const warning = testResults.filter((r) => r.status >= 400 && r.status < 500).length;
  const error = testResults.filter((r) => r.status === 0 || r.status >= 500).length;

  console.log(`${colors.green}✅ Successful: ${success}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings (4xx): ${warning}${colors.reset}`);
  console.log(`${colors.red}❌ Errors: ${error}${colors.reset}`);
  console.log(`${colors.cyan}📊 Total: ${total}${colors.reset}\n`);

  // Group by user type
  const byUserType = {};
  testResults.forEach((result) => {
    const type = result.userType || "other";
    if (!byUserType[type]) {
      byUserType[type] = { success: 0, warning: 0, error: 0, total: 0 };
    }
    byUserType[type].total++;
    if (result.status >= 200 && result.status < 300) byUserType[type].success++;
    else if (result.status >= 400 && result.status < 500) byUserType[type].warning++;
    else byUserType[type].error++;
  });

  console.log(`${colors.bright}Breakdown by User Type:${colors.reset}`);
  Object.entries(byUserType).forEach(([type, stats]) => {
    console.log(
      `  ${type.toUpperCase()}: ${colors.green}${stats.success}${colors.reset} success, ` +
      `${colors.yellow}${stats.warning}${colors.reset} warnings, ` +
      `${colors.red}${stats.error}${colors.reset} errors (${stats.total} total)`
    );
  });

  console.log(`\n${colors.cyan}Test completed at: ${new Date().toISOString()}${colors.reset}\n`);
};

const runTests = async () => {
  console.log(`${colors.bright}${colors.blue}`);
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║     SchooliAt Mobile API Test Suite                     ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Platform: ${PLATFORM}`);
  console.log(`Test started at: ${new Date().toISOString()}\n`);

  try {
    // Test Authentication APIs (no auth required)
    await testAuthAPIs();

    // Authenticate as different user types
    // Note: You'll need to provide actual credentials or use environment variables
    const teacherEmail = process.env.TEACHER_EMAIL || "teacher@example.com";
    const teacherPassword = process.env.TEACHER_PASSWORD || "password123";
    await authenticate(teacherEmail, teacherPassword, "teacher");

    const studentEmail = process.env.STUDENT_EMAIL || "student@example.com";
    const studentPassword = process.env.STUDENT_PASSWORD || "password123";
    await authenticate(studentEmail, studentPassword, "student");

    const employeeEmail = process.env.EMPLOYEE_EMAIL || "employee@example.com";
    const employeePassword = process.env.EMPLOYEE_PASSWORD || "password123";
    await authenticate(employeeEmail, employeePassword, "employee");

    // Test APIs for each user type
    await testTeacherAPIs();
    await testStudentAPIs();
    await testEmployeeAPIs();
    await testSharedAPIs();

    // Print summary
    printSummary();
  } catch (error) {
    console.error(`${colors.red}❌ Test suite failed: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run tests
runTests();

