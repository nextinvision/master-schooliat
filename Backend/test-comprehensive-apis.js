import "dotenv/config";

const BASE_URL = process.env.API_URL || process.env.TEST_API_URL || "http://localhost:3000";
let authToken = null;
let testResults = [];
let createdResources = {
  schoolId: null,
  classId: null,
  subjectId: null,
  teacherId: null,
  studentId: null,
  employeeId: null,
  examId: null,
  leaveTypeId: null,
  regionId: null,
  vendorId: null,
  transportId: null,
  routeId: null,
  stopId: null,
  bookId: null,
  libraryIssueId: null,
  noteId: null,
  galleryId: null,
  imageId: null,
  circularId: null,
  eventId: null,
  holidayId: null,
  examCalendarId: null,
  noticeId: null,
  grievanceId: null,
  feeInstallmentId: null,
  salaryStructureId: null,
  tcId: null,
  emergencyContactId: null,
};

const logResult = (endpoint, method, status, message, data = null, showData = false) => {
  const result = {
    endpoint,
    method,
    status,
    message,
    data: data ? JSON.stringify(data).substring(0, 150) : null,
    hasData: data && data.data !== undefined,
    dataCount: data?.data ? (Array.isArray(data.data) ? data.data.length : 1) : 0,
    timestamp: new Date().toISOString(),
  };
  testResults.push(result);
  const statusIcon = status >= 200 && status < 300 ? "✅" : status >= 400 && status < 500 ? "⚠️" : "❌";
  let logMessage = `${statusIcon} ${method.padEnd(6)} ${endpoint.padEnd(60)} ${status} - ${message}`;
  
  // Show data info for successful responses
  if (status >= 200 && status < 300 && data) {
    if (Array.isArray(data.data)) {
      logMessage += ` [${data.data.length} items]`;
    } else if (data.data && typeof data.data === 'object') {
      logMessage += ` [data returned]`;
    }
  }
  
  if (showData && data) {
    console.log(`   Response: ${JSON.stringify(data).substring(0, 200)}`);
  }
  
  console.log(logMessage);
};

const testEndpoint = async (method, endpoint, body = null, headers = {}) => {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json().catch(() => ({}));

    // Show detailed error for authentication failures
    const showDetails = response.status === 401 || response.status === 500;
    
    logResult(
      endpoint,
      method,
      response.status,
      responseData.message || response.statusText || "OK",
      responseData,
      showDetails,
    );

    return { status: response.status, data: responseData };
  } catch (error) {
    logResult(endpoint, method, 0, `Error: ${error.message}`);
    return { status: 0, data: null, error: error.message };
  }
};

const createTestRequest = (data) => ({ request: data });

const runTests = async () => {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 COMPREHENSIVE API ENDPOINT TESTING");
  console.log("=".repeat(80));
  console.log(`Base URL: ${BASE_URL}\n`);

  // ============================================
  // 1. HEALTH & ROOT ENDPOINTS
  // ============================================
  console.log("📋 1. Testing Health & Root Endpoints...");
  await testEndpoint("GET", "/");
  await testEndpoint("GET", "/health");
  await testEndpoint("GET", "/api/v1/health");
  console.log("");

  // ============================================
  // 2. AUTHENTICATION ENDPOINTS
  // ============================================
  console.log("📋 2. Testing Authentication Endpoints...");
  
  // Request OTP
  await testEndpoint("POST", "/auth/request-otp", createTestRequest({
    email: process.env.TEST_ADMIN_EMAIL || "admin@schooliat.com",
    purpose: "password-reset",
  }));

  // Authenticate
  try {
    const testEmail = process.env.TEST_ADMIN_EMAIL || "admin@schooliat.com";
    const testPassword = process.env.TEST_ADMIN_PASSWORD || "Admin@123";
    
    console.log(`   Attempting authentication with: ${testEmail}`);
    
    const authResponse = await fetch(`${BASE_URL}/auth/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-platform": "web",
      },
      body: JSON.stringify(createTestRequest({
        email: testEmail,
        password: testPassword,
      })),
    });
    const authData = await authResponse.json().catch(() => ({}));
    logResult("/auth/authenticate", "POST", authResponse.status, authData.message || "OK", authData, true);
    
    if (authData.token) {
      authToken = authData.token;
      console.log("✅ Authentication successful! Token obtained.\n");
    } else {
      console.log("⚠️  Authentication failed - some tests will fail");
      if (authData.errorCode || authData.message) {
        console.log(`   Error: ${authData.message || JSON.stringify(authData)}`);
      }
      console.log("");
    }
  } catch (error) {
    logResult("/auth/authenticate", "POST", 0, `Error: ${error.message}`);
    console.log(`   Connection error: ${error.message}\n`);
  }

  // Verify OTP (will fail with invalid OTP, but tests the endpoint)
  await testEndpoint("POST", "/auth/verify-otp", createTestRequest({
    email: "admin@schooliat.com",
    otp: "000000",
    purpose: "password-reset",
  }));

  // Forgot Password
  await testEndpoint("POST", "/auth/forgot-password", createTestRequest({
    email: "admin@schooliat.com",
  }));

  // Reset Password (will fail with invalid token, but tests the endpoint)
  await testEndpoint("POST", "/auth/reset-password", createTestRequest({
    token: "invalid-token",
    password: "NewPassword@123",
  }));

  const authHeaders = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  console.log("");

  // ============================================
  // 3. USER MANAGEMENT ENDPOINTS
  // ============================================
  console.log("📋 3. Testing User Management Endpoints...");
  
  // Get users
  const studentsRes = await testEndpoint("GET", "/users/students?page=1&limit=10", null, authHeaders);
  if (studentsRes.data?.data?.[0]?.id) {
    createdResources.studentId = studentsRes.data.data[0].id;
  }

  const teachersRes = await testEndpoint("GET", "/users/teachers?page=1&limit=10", null, authHeaders);
  if (teachersRes.data?.data?.[0]?.id) {
    createdResources.teacherId = teachersRes.data.data[0].id;
  }

  const employeesRes = await testEndpoint("GET", "/users/employees?page=1&limit=10", null, authHeaders);
  if (employeesRes.data?.data?.[0]?.id) {
    createdResources.employeeId = employeesRes.data.data[0].id;
  }

  await testEndpoint("GET", "/users/roles", null, authHeaders);
  
  // Get specific user
  if (createdResources.employeeId) {
    await testEndpoint("GET", `/users/employees/${createdResources.employeeId}`, null, authHeaders);
  }
  console.log("");

  // ============================================
  // 4. SCHOOL MANAGEMENT ENDPOINTS
  // ============================================
  console.log("📋 4. Testing School Management Endpoints...");
  
  const schoolsRes = await testEndpoint("GET", "/schools?page=1&limit=10", null, authHeaders);
  if (schoolsRes.data?.data?.[0]?.id) {
    createdResources.schoolId = schoolsRes.data.data[0].id;
    
    await testEndpoint("GET", `/schools/${createdResources.schoolId}`, null, authHeaders);
    await testEndpoint("GET", "/schools/my-school", null, authHeaders);
    
    const classesRes = await testEndpoint("GET", `/schools/${createdResources.schoolId}/classes`, null, authHeaders);
    if (classesRes.data?.data?.[0]?.id) {
      createdResources.classId = classesRes.data.data[0].id;
    }
    
    await testEndpoint("GET", "/schools/classes", null, authHeaders);
  }
  console.log("");

  // ============================================
  // 5. REGION & LOCATION ENDPOINTS
  // ============================================
  console.log("📋 5. Testing Region & Location Endpoints...");
  
  const regionsRes = await testEndpoint("GET", "/regions", null, authHeaders);
  if (regionsRes.data?.data?.[0]?.id) {
    createdResources.regionId = regionsRes.data.data[0].id;
  }
  
  await testEndpoint("GET", "/locations", null, authHeaders);
  if (createdResources.regionId) {
    await testEndpoint("GET", `/locations?regionId=${createdResources.regionId}`, null, authHeaders);
  }
  console.log("");

  // ============================================
  // 6. VENDOR ENDPOINTS
  // ============================================
  console.log("📋 6. Testing Vendor Endpoints...");
  
  await testEndpoint("GET", "/vendors/stats", null, authHeaders);
  const vendorsRes = await testEndpoint("GET", "/vendors?page=1&limit=10", null, authHeaders);
  if (vendorsRes.data?.data?.[0]?.id) {
    createdResources.vendorId = vendorsRes.data.data[0].id;
    await testEndpoint("GET", `/vendors/${createdResources.vendorId}`, null, authHeaders);
  }
  console.log("");

  // ============================================
  // 7. TRANSPORT ENDPOINTS
  // ============================================
  console.log("📋 7. Testing Transport Endpoints...");
  
  const transportsRes = await testEndpoint("GET", "/transports", null, authHeaders);
  if (transportsRes.data?.data?.[0]?.id) {
    createdResources.transportId = transportsRes.data.data[0].id;
    
    await testEndpoint("GET", `/transports/${createdResources.transportId}/routes`, null, authHeaders);
    
    const routesRes = await testEndpoint("GET", `/transports/${createdResources.transportId}/routes`, null, authHeaders);
    if (routesRes.data?.data?.[0]?.id) {
      createdResources.routeId = routesRes.data.data[0].id;
      
      await testEndpoint("GET", `/transports/routes/${createdResources.routeId}/stops`, null, authHeaders);
    }
  }
  
  await testEndpoint("GET", "/transports/vehicles", null, authHeaders);
  await testEndpoint("GET", "/transports/drivers", null, authHeaders);
  console.log("");

  // ============================================
  // 8. LICENSE ENDPOINTS
  // ============================================
  console.log("📋 8. Testing License Endpoints...");
  
  await testEndpoint("GET", "/licenses", null, authHeaders);
  console.log("");

  // ============================================
  // 9. RECEIPT ENDPOINTS
  // ============================================
  console.log("📋 9. Testing Receipt Endpoints...");
  
  await testEndpoint("GET", "/receipts?page=1&limit=10", null, authHeaders);
  console.log("");

  // ============================================
  // 10. STATISTICS ENDPOINTS
  // ============================================
  console.log("📋 10. Testing Statistics Endpoints...");
  
  await testEndpoint("GET", "/statistics", null, authHeaders);
  await testEndpoint("GET", "/statistics/schools", null, authHeaders);
  await testEndpoint("GET", "/statistics/dashboard", null, authHeaders);
  console.log("");

  // ============================================
  // 11. LETTERHEAD ENDPOINTS
  // ============================================
  console.log("📋 11. Testing Letterhead Endpoints...");
  
  await testEndpoint("GET", "/letterhead", null, authHeaders);
  console.log("");

  // ============================================
  // 12. CALENDAR ENDPOINTS
  // ============================================
  console.log("📋 12. Testing Calendar Endpoints...");
  
  // Events
  await testEndpoint("GET", "/calendar/events", null, authHeaders);
  
  // Holidays
  await testEndpoint("GET", "/calendar/holidays", null, authHeaders);
  
  // Exam Calendars
  await testEndpoint("GET", "/calendar/exam-calendars", null, authHeaders);
  
  // Notices
  await testEndpoint("GET", "/calendar/notices", null, authHeaders);
  
  // Get calendar for specific date
  const today = new Date().toISOString().split("T")[0];
  await testEndpoint("GET", `/calendar/${today}`, null, authHeaders);
  console.log("");

  // ============================================
  // 13. EXAM ENDPOINTS
  // ============================================
  console.log("📋 13. Testing Exam Endpoints...");
  
  const examsRes = await testEndpoint("GET", "/exams?page=1&limit=10", null, authHeaders);
  if (examsRes.data?.data?.[0]?.id) {
    createdResources.examId = examsRes.data.data[0].id;
  }
  console.log("");

  // ============================================
  // 14. ID CARD ENDPOINTS
  // ============================================
  console.log("📋 14. Testing ID Card Endpoints...");
  
  await testEndpoint("GET", "/id-cards", null, authHeaders);
  await testEndpoint("GET", "/id-cards/status", null, authHeaders);
  await testEndpoint("GET", "/id-cards/config", null, authHeaders);
  console.log("");

  // ============================================
  // 15. TEMPLATE ENDPOINTS
  // ============================================
  console.log("📋 15. Testing Template Endpoints...");
  
  const templatesRes = await testEndpoint("GET", "/templates", null, authHeaders);
  if (templatesRes.data?.data?.[0]?.id) {
    const templateId = templatesRes.data.data[0].id;
    await testEndpoint("GET", `/templates/${templateId}/default`, null, authHeaders);
  }
  console.log("");

  // ============================================
  // 16. SETTINGS ENDPOINTS
  // ============================================
  console.log("📋 16. Testing Settings Endpoints...");
  
  await testEndpoint("GET", "/settings", null, authHeaders);
  console.log("");

  // ============================================
  // 17. FEE ENDPOINTS
  // ============================================
  console.log("📋 17. Testing Fee Endpoints...");
  
  await testEndpoint("GET", "/fees?page=1&limit=10", null, authHeaders);
  
  if (createdResources.studentId) {
    await testEndpoint("GET", `/fees/student-installments?studentId=${createdResources.studentId}`, null, authHeaders);
  }
  
  await testEndpoint("GET", "/fees/installments?page=1&limit=10", null, authHeaders);
  console.log("");

  // ============================================
  // 18. GRIEVANCE ENDPOINTS
  // ============================================
  console.log("📋 18. Testing Grievance Endpoints...");
  
  const grievancesRes = await testEndpoint("GET", "/grievances?page=1&limit=10", null, authHeaders);
  if (grievancesRes.data?.data?.[0]?.id) {
    createdResources.grievanceId = grievancesRes.data.data[0].id;
    await testEndpoint("GET", `/grievances/${createdResources.grievanceId}`, null, authHeaders);
  }
  console.log("");

  // ============================================
  // 19. SALARY ENDPOINTS
  // ============================================
  console.log("📋 19. Testing Salary Endpoints...");
  
  await testEndpoint("GET", "/salary-structures", null, authHeaders);
  await testEndpoint("GET", "/salary-payments", null, authHeaders);
  await testEndpoint("GET", "/salaries", null, authHeaders);
  console.log("");

  // ============================================
  // 20. ATTENDANCE ENDPOINTS
  // ============================================
  console.log("📋 20. Testing Attendance Endpoints...");
  
  await testEndpoint("GET", "/attendance", null, authHeaders);
  await testEndpoint("GET", "/attendance/statistics", null, authHeaders);
  await testEndpoint("GET", "/attendance/periods", null, authHeaders);
  
  if (createdResources.studentId && createdResources.classId) {
    const today = new Date().toISOString().split("T")[0];
    await testEndpoint("GET", `/attendance?studentId=${createdResources.studentId}&startDate=${today}&endDate=${today}`, null, authHeaders);
    await testEndpoint("GET", `/attendance?classId=${createdResources.classId}&date=${today}`, null, authHeaders);
  }
  
  await testEndpoint("GET", "/attendance/report?startDate=2024-01-01&endDate=2024-12-31", null, authHeaders);
  console.log("");

  // ============================================
  // 21. TIMETABLE ENDPOINTS
  // ============================================
  console.log("📋 21. Testing Timetable Endpoints...");
  
  if (createdResources.classId) {
    await testEndpoint("GET", `/timetables?classId=${createdResources.classId}`, null, authHeaders);
  }
  
  if (createdResources.teacherId) {
    await testEndpoint("GET", `/timetables?teacherId=${createdResources.teacherId}`, null, authHeaders);
  }
  
  await testEndpoint("GET", "/timetables", null, authHeaders);
  console.log("");

  // ============================================
  // 22. HOMEWORK ENDPOINTS
  // ============================================
  console.log("📋 22. Testing Homework Endpoints...");
  
  await testEndpoint("GET", "/homework?page=1&limit=10", null, authHeaders);
  
  if (createdResources.studentId) {
    await testEndpoint("GET", `/homework?studentId=${createdResources.studentId}`, null, authHeaders);
  }
  console.log("");

  // ============================================
  // 23. MARKS ENDPOINTS
  // ============================================
  console.log("📋 23. Testing Marks Endpoints...");
  
  await testEndpoint("GET", "/marks?page=1&limit=10", null, authHeaders);
  
  if (createdResources.studentId) {
    await testEndpoint("GET", `/marks?studentId=${createdResources.studentId}`, null, authHeaders);
  }
  
  await testEndpoint("GET", "/marks/results", null, authHeaders);
  console.log("");

  // ============================================
  // 24. LEAVE ENDPOINTS
  // ============================================
  console.log("📋 24. Testing Leave Endpoints...");
  
  await testEndpoint("GET", "/leave/balance", null, authHeaders);
  await testEndpoint("GET", "/leave/history", null, authHeaders);
  await testEndpoint("GET", "/leave/types", null, authHeaders);
  console.log("");

  // ============================================
  // 25. COMMUNICATION ENDPOINTS
  // ============================================
  console.log("📋 25. Testing Communication Endpoints...");
  
  await testEndpoint("GET", "/communication/conversations", null, authHeaders);
  await testEndpoint("GET", "/communication/notifications", null, authHeaders);
  await testEndpoint("GET", "/communication/notifications/unread-count", null, authHeaders);
  console.log("");

  // ============================================
  // 26. LIBRARY ENDPOINTS
  // ============================================
  console.log("📋 26. Testing Library Endpoints...");
  
  await testEndpoint("GET", "/library/books?page=1&limit=10", null, authHeaders);
  await testEndpoint("GET", "/library/dashboard", null, authHeaders);
  await testEndpoint("GET", "/library/history?page=1&limit=10", null, authHeaders);
  console.log("");

  // ============================================
  // 27. NOTES ENDPOINTS
  // ============================================
  console.log("📋 27. Testing Notes Endpoints...");
  
  await testEndpoint("GET", "/notes?page=1&limit=10", null, authHeaders);
  console.log("");

  // ============================================
  // 28. GALLERY ENDPOINTS
  // ============================================
  console.log("📋 28. Testing Gallery Endpoints...");
  
  const galleriesRes = await testEndpoint("GET", "/gallery?page=1&limit=10", null, authHeaders);
  if (galleriesRes.data?.data?.[0]?.id) {
    createdResources.galleryId = galleriesRes.data.data[0].id;
    await testEndpoint("GET", `/gallery/${createdResources.galleryId}`, null, authHeaders);
  }
  console.log("");

  // ============================================
  // 29. CIRCULAR ENDPOINTS
  // ============================================
  console.log("📋 29. Testing Circular Endpoints...");
  
  await testEndpoint("GET", "/circulars?page=1&limit=10", null, authHeaders);
  console.log("");

  // ============================================
  // 30. PARENT ENDPOINTS
  // ============================================
  console.log("📋 30. Testing Parent Endpoints...");
  
  await testEndpoint("GET", "/parent/children", null, authHeaders);
  await testEndpoint("GET", "/parent/children/attendance", null, authHeaders);
  await testEndpoint("GET", "/parent/children/fees", null, authHeaders);
  console.log("");

  // ============================================
  // 31. REPORTS ENDPOINTS
  // ============================================
  console.log("📋 31. Testing Reports Endpoints...");
  
  await testEndpoint("GET", "/reports/students", null, authHeaders);
  await testEndpoint("GET", "/reports/teachers", null, authHeaders);
  await testEndpoint("GET", "/reports/fees", null, authHeaders);
  await testEndpoint("GET", "/reports/attendance", null, authHeaders);
  console.log("");

  // ============================================
  // 32. AI ENDPOINTS
  // ============================================
  console.log("📋 32. Testing AI Endpoints...");
  
  await testEndpoint("GET", "/ai/conversations", null, authHeaders);
  await testEndpoint("GET", "/ai/conversations/history", null, authHeaders);
  console.log("");

  // ============================================
  // 33. AUDIT ENDPOINTS
  // ============================================
  console.log("📋 33. Testing Audit Endpoints...");
  
  await testEndpoint("GET", "/audit?page=1&limit=10", null, authHeaders);
  await testEndpoint("GET", "/audit/logs?page=1&limit=10", null, authHeaders);
  console.log("");

  // ============================================
  // 34. DELETION OTP ENDPOINTS
  // ============================================
  console.log("📋 34. Testing Deletion OTP Endpoints...");
  
  await testEndpoint("POST", "/deletion-otp/request", createTestRequest({
    email: "admin@schooliat.com",
  }), authHeaders);
  console.log("");

  // ============================================
  // 35. TRANSFER CERTIFICATE ENDPOINTS
  // ============================================
  console.log("📋 35. Testing Transfer Certificate Endpoints...");
  
  const tcRes = await testEndpoint("GET", "/transfer-certificates?page=1&limit=10", null, authHeaders);
  if (tcRes.data?.data?.[0]?.id) {
    createdResources.tcId = tcRes.data.data[0].id;
    await testEndpoint("GET", `/transfer-certificates/${createdResources.tcId}`, null, authHeaders);
  }
  console.log("");

  // ============================================
  // 36. EMERGENCY CONTACT ENDPOINTS
  // ============================================
  console.log("📋 36. Testing Emergency Contact Endpoints...");
  
  await testEndpoint("GET", "/emergency-contacts", null, authHeaders);
  if (createdResources.studentId) {
    await testEndpoint("GET", `/emergency-contacts?studentId=${createdResources.studentId}`, null, authHeaders);
  }
  console.log("");

  // ============================================
  // TEST SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(80));
  console.log("📊 COMPREHENSIVE API TEST SUMMARY");
  console.log("=".repeat(80));
  
  const total = testResults.length;
  const passed = testResults.filter((r) => r.status >= 200 && r.status < 300).length;
  const warnings = testResults.filter((r) => r.status >= 400 && r.status < 500).length;
  const failed = testResults.filter((r) => r.status === 0 || r.status >= 500).length;

  // Count endpoints that returned actual data
  const withData = testResults.filter((r) => r.hasData && r.status >= 200 && r.status < 300).length;
  
  console.log(`\nTotal Tests Executed: ${total}`);
  console.log(`✅ Passed (2xx): ${passed} (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`   └─ With Data: ${withData} endpoints returned data`);
  console.log(`⚠️  Warnings (4xx): ${warnings} (${((warnings/total)*100).toFixed(1)}%)`);
  console.log(`❌ Failed (5xx/Errors): ${failed} (${((failed/total)*100).toFixed(1)}%)`);

  // Failed tests details
  if (failed > 0) {
    console.log("\n❌ Failed Tests (Need Investigation):");
    testResults
      .filter((r) => r.status === 0 || r.status >= 500)
      .slice(0, 20) // Limit to first 20
      .forEach((r) => {
        console.log(`  - ${r.method} ${r.endpoint} (${r.status}) - ${r.message}`);
      });
    if (failed > 20) {
      console.log(`  ... and ${failed - 20} more failed tests`);
    }
  }

  // Module coverage breakdown
  console.log("\n📋 Module Coverage:");
  const modules = {
    "Health": testResults.filter((r) => r.endpoint.includes("/health") || r.endpoint === "/").length,
    "Authentication": testResults.filter((r) => r.endpoint.includes("/auth")).length,
    "Users": testResults.filter((r) => r.endpoint.includes("/users")).length,
    "Schools": testResults.filter((r) => r.endpoint.includes("/schools")).length,
    "Regions/Locations": testResults.filter((r) => r.endpoint.includes("/regions") || r.endpoint.includes("/locations")).length,
    "Vendors": testResults.filter((r) => r.endpoint.includes("/vendors")).length,
    "Transport": testResults.filter((r) => r.endpoint.includes("/transports")).length,
    "Licenses": testResults.filter((r) => r.endpoint.includes("/licenses")).length,
    "Receipts": testResults.filter((r) => r.endpoint.includes("/receipts")).length,
    "Statistics": testResults.filter((r) => r.endpoint.includes("/statistics")).length,
    "Letterhead": testResults.filter((r) => r.endpoint.includes("/letterhead")).length,
    "Calendar": testResults.filter((r) => r.endpoint.includes("/calendar")).length,
    "Exams": testResults.filter((r) => r.endpoint.includes("/exams")).length,
    "ID Cards": testResults.filter((r) => r.endpoint.includes("/id-cards")).length,
    "Templates": testResults.filter((r) => r.endpoint.includes("/templates")).length,
    "Settings": testResults.filter((r) => r.endpoint.includes("/settings")).length,
    "Fees": testResults.filter((r) => r.endpoint.includes("/fees")).length,
    "Grievances": testResults.filter((r) => r.endpoint.includes("/grievances")).length,
    "Salary": testResults.filter((r) => r.endpoint.includes("/salary")).length,
    "Attendance": testResults.filter((r) => r.endpoint.includes("/attendance")).length,
    "Timetable": testResults.filter((r) => r.endpoint.includes("/timetable")).length,
    "Homework": testResults.filter((r) => r.endpoint.includes("/homework")).length,
    "Marks": testResults.filter((r) => r.endpoint.includes("/marks")).length,
    "Leave": testResults.filter((r) => r.endpoint.includes("/leave")).length,
    "Communication": testResults.filter((r) => r.endpoint.includes("/communication")).length,
    "Library": testResults.filter((r) => r.endpoint.includes("/library")).length,
    "Notes": testResults.filter((r) => r.endpoint.includes("/notes")).length,
    "Gallery": testResults.filter((r) => r.endpoint.includes("/gallery")).length,
    "Circulars": testResults.filter((r) => r.endpoint.includes("/circulars")).length,
    "Parent": testResults.filter((r) => r.endpoint.includes("/parent")).length,
    "Reports": testResults.filter((r) => r.endpoint.includes("/reports")).length,
    "AI": testResults.filter((r) => r.endpoint.includes("/ai")).length,
    "Audit": testResults.filter((r) => r.endpoint.includes("/audit")).length,
    "Deletion OTP": testResults.filter((r) => r.endpoint.includes("/deletion-otp")).length,
    "Transfer Certificates": testResults.filter((r) => r.endpoint.includes("/transfer-certificates")).length,
    "Emergency Contacts": testResults.filter((r) => r.endpoint.includes("/emergency-contacts")).length,
  };

  Object.entries(modules)
    .sort((a, b) => b[1] - a[1])
    .forEach(([module, count]) => {
      if (count > 0) {
        const modulePassed = testResults.filter(
          (r) => (r.endpoint.includes(module.toLowerCase()) || 
                  (module === "Health" && (r.endpoint.includes("/health") || r.endpoint === "/")) ||
                  (module === "Authentication" && r.endpoint.includes("/auth")) ||
                  (module === "Users" && r.endpoint.includes("/users")) ||
                  (module === "Schools" && r.endpoint.includes("/schools"))) &&
                 r.status >= 200 && r.status < 300
        ).length;
        const status = modulePassed === count ? "✅" : modulePassed > 0 ? "⚠️" : "❌";
        console.log(`  ${status} ${module.padEnd(25)} ${count.toString().padStart(3)} tests`);
      }
    });

  console.log("\n" + "=".repeat(80));
  console.log("✨ Testing Complete!");
  console.log("=".repeat(80) + "\n");
};

runTests().catch((error) => {
  console.error("Fatal error during testing:", error);
  process.exit(1);
});

