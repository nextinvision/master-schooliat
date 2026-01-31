import "dotenv/config";

const BASE_URL = process.env.PRODUCTION_API_URL || "https://schooliat-backend.onrender.com";
let authToken = null;
let testResults = [];
let createdResources = {};

const logResult = (endpoint, method, status, message, data = null) => {
  const result = {
    endpoint,
    method,
    status,
    message,
    data: data ? JSON.stringify(data).substring(0, 100) : null,
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
  console.log("🚀 Testing Production API on Render...\n");
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log("=".repeat(60));

  // 1. Health Check
  console.log("\n📋 Testing Health Endpoints...");
  await testEndpoint("GET", "/");
  await testEndpoint("HEAD", "/");
  await testEndpoint("GET", "/health");
  await testEndpoint("HEAD", "/health");
  console.log("");

  // 2. Authentication
  console.log("📋 Testing Authentication...");
  try {
    const authOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-platform": "web",
      },
      body: JSON.stringify({
        request: {
          email: "admin@schooliat.com",
          password: "Admin@123",
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
      console.log("Response:", JSON.stringify(authData, null, 2));
    }
  } catch (error) {
    logResult("/auth/authenticate", "POST", 0, `Error: ${error.message}`);
  }

  const authHeaders = authToken
    ? { Authorization: `Bearer ${authToken}` }
    : {};

  // 3. User Endpoints
  console.log("📋 Testing User Endpoints...");
  await testEndpoint("GET", "/users/students", null, authHeaders);
  await testEndpoint("GET", "/users/teachers", null, authHeaders);
  await testEndpoint("GET", "/users/employees", null, authHeaders);
  await testEndpoint("GET", "/users/roles", null, authHeaders);
  console.log("");

  // 4. School Endpoints
  console.log("📋 Testing School Endpoints...");
  const schoolsRes = await testEndpoint("GET", "/schools", null, authHeaders);
  if (schoolsRes.data?.data?.[0]?.id) {
    createdResources.schoolId = schoolsRes.data.data[0].id;
  }
  await testEndpoint("GET", "/schools/my-school", null, authHeaders);
  await testEndpoint("GET", "/schools/classes", null, authHeaders);
  console.log("");

  // 5. Region Endpoints
  console.log("📋 Testing Region Endpoints...");
  const regionsRes = await testEndpoint("GET", "/regions", null, authHeaders);
  if (regionsRes.data?.data?.[0]?.id) {
    createdResources.regionId = regionsRes.data.data[0].id;
  }
  console.log("");

  // 6. Vendor Endpoints
  console.log("📋 Testing Vendor Endpoints...");
  await testEndpoint("GET", "/vendors/stats", null, authHeaders);
  await testEndpoint("GET", "/vendors", null, authHeaders);
  console.log("");

  // 7. Transport Endpoints
  console.log("📋 Testing Transport Endpoints...");
  await testEndpoint("GET", "/transports", null, authHeaders);
  console.log("");

  // 8. License Endpoints
  console.log("📋 Testing License Endpoints...");
  await testEndpoint("GET", "/licenses", null, authHeaders);
  console.log("");

  // 9. Receipt Endpoints
  console.log("📋 Testing Receipt Endpoints...");
  await testEndpoint("GET", "/receipts", null, authHeaders);
  console.log("");

  // 10. Statistics Endpoints
  console.log("📋 Testing Statistics Endpoints...");
  await testEndpoint("GET", "/statistics", null, authHeaders);
  await testEndpoint("GET", "/statistics/schools", null, authHeaders);
  await testEndpoint("GET", "/statistics/dashboard", null, authHeaders);
  console.log("");

  // 11. Location Endpoints
  console.log("📋 Testing Location Endpoints...");
  await testEndpoint("GET", "/locations", null, authHeaders);
  if (createdResources.regionId) {
    await testEndpoint("GET", `/locations?regionId=${createdResources.regionId}`, null, authHeaders);
  }
  console.log("");

  // 12. Letterhead Endpoints
  console.log("📋 Testing Letterhead Endpoints...");
  await testEndpoint("GET", "/letterhead", null, authHeaders);
  console.log("");

  // 13. Calendar Endpoints
  console.log("📋 Testing Calendar Endpoints...");
  await testEndpoint("GET", "/calendar/events", null, authHeaders);
  await testEndpoint("GET", "/calendar/holidays", null, authHeaders);
  await testEndpoint("GET", "/calendar/exam-calendars", null, authHeaders);
  await testEndpoint("GET", "/calendar/notices", null, authHeaders);
  const today = new Date().toISOString().split("T")[0];
  await testEndpoint("GET", `/calendar/${today}`, null, authHeaders);
  console.log("");

  // 14. Exam Endpoints
  console.log("📋 Testing Exam Endpoints...");
  await testEndpoint("GET", "/exams", null, authHeaders);
  console.log("");

  // 15. ID Card Endpoints
  console.log("📋 Testing ID Card Endpoints...");
  await testEndpoint("GET", "/id-cards", null, authHeaders);
  await testEndpoint("GET", "/id-cards/status", null, authHeaders);
  await testEndpoint("GET", "/id-cards/config", null, authHeaders);
  console.log("");

  // 16. Template Endpoints
  console.log("📋 Testing Template Endpoints...");
  await testEndpoint("GET", "/templates", null, authHeaders);
  console.log("");

  // 17. Settings Endpoints
  console.log("📋 Testing Settings Endpoints...");
  await testEndpoint("GET", "/settings", null, authHeaders);
  console.log("");

  // 18. Fee Endpoints
  console.log("📋 Testing Fee Endpoints...");
  await testEndpoint("GET", "/fees", null, authHeaders);
  console.log("");

  // 19. Grievance Endpoints
  console.log("📋 Testing Grievance Endpoints...");
  await testEndpoint("GET", "/grievances", null, authHeaders);
  console.log("");

  // 20. Salary Endpoints
  console.log("📋 Testing Salary Endpoints...");
  await testEndpoint("GET", "/salary-structures", null, authHeaders);
  await testEndpoint("GET", "/salary-payments", null, authHeaders);
  await testEndpoint("GET", "/salaries", null, authHeaders);
  console.log("");

  // 21. API Versioning Test
  console.log("📋 Testing API Versioning...");
  await testEndpoint("GET", "/api/v1/health", null, authHeaders);
  await testEndpoint("GET", "/api/v1/users/roles", null, authHeaders);
  console.log("");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 PRODUCTION API TEST SUMMARY");
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

  if (failed > 0) {
    console.log("\n❌ Failed Tests (Need Investigation):");
    testResults
      .filter((r) => r.status === 0 || r.status >= 500)
      .forEach((r) => {
        console.log(`  - ${r.method} ${r.endpoint} (${r.status}) - ${r.message}`);
      });
  }

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

  console.log("\n" + "=".repeat(60));
  console.log(`🌐 Production API: ${BASE_URL}`);
  console.log(`📅 Test completed at: ${new Date().toISOString()}`);
  console.log("=".repeat(60) + "\n");
};

runTests().catch(console.error);

