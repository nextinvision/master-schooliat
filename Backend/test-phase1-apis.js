import "dotenv/config";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
let authToken = null;
let testResults = [];
let createdResources = {
  classId: null,
  subjectId: null,
  teacherId: null,
  studentId: null,
  examId: null,
  leaveTypeId: null,
};

const logResult = (endpoint, method, status, message, data = null) => {
  const result = {
    endpoint,
    method,
    status,
    message,
    data: data ? JSON.stringify(data).substring(0, 200) : null,
    timestamp: new Date().toISOString(),
  };
  testResults.push(result);
  const statusIcon = status >= 200 && status < 300 ? "✅" : status >= 400 && status < 500 ? "⚠️" : "❌";
  console.log(
    `${statusIcon} ${method} ${endpoint} - ${status} - ${message}`,
  );
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

    logResult(
      endpoint,
      method,
      response.status,
      responseData.message || response.statusText,
      responseData,
    );

    return { status: response.status, data: responseData };
  } catch (error) {
    logResult(endpoint, method, 0, `Error: ${error.message}`);
    return { status: 0, data: null };
  }
};

const runTests = async () => {
  console.log("🚀 Starting Phase 1 API Tests...\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  // 1. Health Check
  console.log("📋 Testing Health Endpoint...");
  await testEndpoint("GET", "/");
  console.log("");

  // 2. Authentication
  console.log("📋 Testing Authentication Endpoints...");
  try {
    // Test OTP request
    await testEndpoint("POST", "/auth/request-otp", {
      request: {
        email: "test@schooliat.com",
        purpose: "REGISTRATION",
      },
    });

    // Test authentication
    const authOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-platform": "web",
      },
      body: JSON.stringify({
        request: {
          email: process.env.TEST_EMAIL || "admin@schooliat.com",
          password: process.env.TEST_PASSWORD || "Admin@123",
        },
      }),
    };

    const authResponse = await fetch(`${BASE_URL}/auth/authenticate`, authOptions);
    const authData = await authResponse.json().catch(() => ({}));

    logResult(
      "/auth/authenticate",
      "POST",
      authResponse.status,
      authData.message || authResponse.statusText,
      authData,
    );

    if (authData.token) {
      authToken = authData.token;
      console.log("✅ Authentication successful!\n");
    } else {
      console.log("⚠️  Authentication failed - some tests will fail\n");
    }
  } catch (error) {
    logResult("/auth/authenticate", "POST", 0, `Error: ${error.message}`);
  }

  const authHeaders = authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {};

  // Get user info to extract IDs
  const userInfo = await testEndpoint("GET", "/users/me", null, authHeaders);
  if (userInfo.data?.data) {
    const user = userInfo.data.data;
    if (user.role?.name === "TEACHER") createdResources.teacherId = user.id;
    if (user.role?.name === "STUDENT") createdResources.studentId = user.id;
  }

  // Get school resources
  const schoolsRes = await testEndpoint("GET", "/schools", null, authHeaders);
  if (schoolsRes.data?.data?.[0]) {
    const school = schoolsRes.data.data[0];
    // Get classes
    const classesRes = await testEndpoint("GET", `/schools/${school.id}/classes`, null, authHeaders);
    if (classesRes.data?.data?.[0]?.id) {
      createdResources.classId = classesRes.data.data[0].id;
    }
    // Get subjects
    const subjectsRes = await testEndpoint("GET", `/schools/${school.id}/subjects`, null, authHeaders);
    if (subjectsRes.data?.data?.[0]?.id) {
      createdResources.subjectId = subjectsRes.data.data[0].id;
    }
  }

  // Get exams
  const examsRes = await testEndpoint("GET", "/exams", null, authHeaders);
  if (examsRes.data?.data?.[0]?.id) {
    createdResources.examId = examsRes.data.data[0].id;
  }

  console.log("\n📋 Testing Phase 1 Modules...\n");

  // 3. Attendance Management
  console.log("📋 Testing Attendance Management...");
  if (createdResources.studentId && createdResources.classId) {
    const today = new Date().toISOString().split("T")[0];
    await testEndpoint("POST", "/attendance", {
      request: {
        studentId: createdResources.studentId,
        classId: createdResources.classId,
        date: today,
        status: "PRESENT",
        markedBy: createdResources.teacherId || "system",
      },
    }, authHeaders);

    await testEndpoint("GET", `/attendance/student/${createdResources.studentId}?startDate=${today}&endDate=${today}`, null, authHeaders);
    await testEndpoint("GET", `/attendance/class/${createdResources.classId}?date=${today}`, null, authHeaders);
    await testEndpoint("GET", `/attendance/reports/daily?date=${today}`, null, authHeaders);
  } else {
    console.log("⚠️  Skipping attendance tests - missing studentId or classId");
  }
  console.log("");

  // 4. Timetable Management
  console.log("📋 Testing Timetable Management...");
  if (createdResources.classId && createdResources.subjectId && createdResources.teacherId) {
    // Check conflicts
    await testEndpoint("POST", "/timetables/check-conflicts", {
      request: {
        slots: [
          {
            dayOfWeek: 1,
            periodNumber: 1,
            subjectId: createdResources.subjectId,
            teacherId: createdResources.teacherId,
            startTime: "09:00",
            endTime: "09:45",
          },
        ],
        classId: createdResources.classId,
      },
    }, authHeaders);

    // Get class timetable
    await testEndpoint("GET", `/timetables?classId=${createdResources.classId}`, null, authHeaders);
    await testEndpoint("GET", `/timetables?teacherId=${createdResources.teacherId}`, null, authHeaders);
  } else {
    console.log("⚠️  Skipping timetable tests - missing classId, subjectId, or teacherId");
  }
  console.log("");

  // 5. Homework & Assignments
  console.log("📋 Testing Homework & Assignments...");
  if (createdResources.classId && createdResources.subjectId) {
    // Create homework
    const homeworkRes = await testEndpoint("POST", "/homework", {
      request: {
        title: "Test Homework",
        description: "This is a test homework assignment",
        classIds: [createdResources.classId],
        subjectId: createdResources.subjectId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isMCQ: false,
        attachments: [],
      },
    }, authHeaders);

    const homeworkId = homeworkRes.data?.data?.id;

    if (homeworkId) {
      await testEndpoint("GET", `/homework?homeworkId=${homeworkId}`, null, authHeaders);
      await testEndpoint("GET", `/homework?studentId=${createdResources.studentId}`, null, authHeaders);
    }

    // Create MCQ homework
    await testEndpoint("POST", "/homework", {
      request: {
        title: "MCQ Test",
        description: "Multiple choice questions",
        classIds: [createdResources.classId],
        subjectId: createdResources.subjectId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isMCQ: true,
        mcqQuestions: [
          {
            question: "What is 2+2?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 1,
            marks: 1,
          },
        ],
      },
    }, authHeaders);
  } else {
    console.log("⚠️  Skipping homework tests - missing classId or subjectId");
  }
  console.log("");

  // 6. Marks & Results
  console.log("📋 Testing Marks & Results...");
  if (createdResources.examId && createdResources.studentId && createdResources.subjectId && createdResources.classId) {
    // Enter marks
    await testEndpoint("POST", "/marks", {
      request: {
        examId: createdResources.examId,
        studentId: createdResources.studentId,
        subjectId: createdResources.subjectId,
        classId: createdResources.classId,
        marksObtained: 85,
        maxMarks: 100,
      },
    }, authHeaders);

    // Get student marks
    await testEndpoint("GET", `/marks?studentId=${createdResources.studentId}&examId=${createdResources.examId}`, null, authHeaders);

    // Calculate result
    await testEndpoint("POST", "/marks/calculate-result", {
      request: {
        examId: createdResources.examId,
        studentId: createdResources.studentId,
        classId: createdResources.classId,
        gradeConfig: {
          passingPercentage: 33,
          calculateRank: false,
        },
      },
    }, authHeaders);

    // Get results
    await testEndpoint("GET", `/marks/results?studentId=${createdResources.studentId}`, null, authHeaders);
  } else {
    console.log("⚠️  Skipping marks tests - missing examId, studentId, subjectId, or classId");
  }
  console.log("");

  // 7. Leave Management
  console.log("📋 Testing Leave Management...");
  // Get leave types
  const leaveTypesRes = await testEndpoint("GET", "/leave/types", null, authHeaders);
  if (leaveTypesRes.data?.data?.[0]?.id) {
    createdResources.leaveTypeId = leaveTypesRes.data.data[0].id;
  }

  // Create leave type if none exists
  if (!createdResources.leaveTypeId) {
    const leaveTypeRes = await testEndpoint("POST", "/leave/types", {
      request: {
        name: "Sick Leave",
        maxLeaves: 10,
      },
    }, authHeaders);
    if (leaveTypeRes.data?.data?.id) {
      createdResources.leaveTypeId = leaveTypeRes.data.data.id;
    }
  }

  if (createdResources.leaveTypeId) {
    // Create leave request
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    await testEndpoint("POST", "/leave/request", {
      request: {
        leaveTypeId: createdResources.leaveTypeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: "Medical appointment",
      },
    }, authHeaders);

    // Get leave balance
    await testEndpoint("GET", "/leave/balance", null, authHeaders);

    // Get leave history
    await testEndpoint("GET", "/leave/history", null, authHeaders);

    // Get leave calendar
    const calendarStart = new Date();
    const calendarEnd = new Date();
    calendarEnd.setMonth(calendarEnd.getMonth() + 1);
    await testEndpoint("GET", `/leave/calendar?startDate=${calendarStart.toISOString()}&endDate=${calendarEnd.toISOString()}`, null, authHeaders);
  }
  console.log("");

  // 8. Communication & Notifications
  console.log("📋 Testing Communication & Notifications...");
  
  // Get conversations
  await testEndpoint("GET", "/communication/conversations", null, authHeaders);

  // Get notifications
  await testEndpoint("GET", "/communication/notifications", null, authHeaders);
  await testEndpoint("GET", "/communication/notifications/unread-count", null, authHeaders);

  // Create announcement (admin only)
  await testEndpoint("POST", "/communication/announcements", {
    request: {
      title: "Test Announcement",
      content: "This is a test announcement",
      targetUserIds: [],
      targetRoles: [],
    },
  }, authHeaders);
  console.log("");

  // 9. Fees (Enhanced)
  console.log("📋 Testing Enhanced Fee Management...");
  if (createdResources.studentId) {
    // Get fee installments
    await testEndpoint("GET", `/fees/installments?studentId=${createdResources.studentId}`, null, authHeaders);
    
    // Get student installments
    await testEndpoint("GET", `/fees/student-installments?studentId=${createdResources.studentId}`, null, authHeaders);
  }
  console.log("");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 PHASE 1 API TEST SUMMARY");
  console.log("=".repeat(60));
  const total = testResults.length;
  const passed = testResults.filter(
    (r) => r.status >= 200 && r.status < 300,
  ).length;
  const failed = testResults.filter((r) => r.status === 0 || r.status >= 500)
    .length;
  const warnings = testResults.filter((r) => r.status >= 400 && r.status < 500)
    .length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings (4xx): ${warnings}`);
  console.log(`❌ Failed (5xx/Errors): ${failed}`);

  // Failed tests details
  if (failed > 0) {
    console.log("\n❌ Failed Tests (Need Fixing):");
    testResults
      .filter((r) => r.status === 0 || r.status >= 500)
      .forEach((r) => {
        console.log(`  - ${r.method} ${r.endpoint} (${r.status}) - ${r.message}`);
      });
  }

  // Warning tests details
  if (warnings > 0) {
    console.log("\n⚠️  Warning Tests (May be expected):");
    const warningTests = testResults.filter((r) => r.status >= 400 && r.status < 500);
    const uniqueWarnings = new Map();
    warningTests.forEach((r) => {
      const key = `${r.method} ${r.endpoint}`;
      if (!uniqueWarnings.has(key)) {
        uniqueWarnings.set(key, r);
      }
    });
    Array.from(uniqueWarnings.values()).forEach((r) => {
      console.log(`  - ${r.method} ${r.endpoint} (${r.status}) - ${r.message}`);
    });
  }

  // Module coverage
  console.log("\n📋 Module Coverage:");
  const modules = {
    "Authentication": testResults.filter((r) => r.endpoint.includes("/auth")).length,
    "Attendance": testResults.filter((r) => r.endpoint.includes("/attendance")).length,
    "Timetable": testResults.filter((r) => r.endpoint.includes("/timetable")).length,
    "Homework": testResults.filter((r) => r.endpoint.includes("/homework")).length,
    "Marks": testResults.filter((r) => r.endpoint.includes("/marks")).length,
    "Leave": testResults.filter((r) => r.endpoint.includes("/leave")).length,
    "Communication": testResults.filter((r) => r.endpoint.includes("/communication")).length,
    "Fees": testResults.filter((r) => r.endpoint.includes("/fees")).length,
  };

  Object.entries(modules).forEach(([module, count]) => {
    console.log(`  ${module}: ${count} tests`);
  });

  console.log("\n" + "=".repeat(60));
};

runTests().catch(console.error);

