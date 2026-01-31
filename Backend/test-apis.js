import "dotenv/config";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
let authToken = null;
let testResults = [];

// Test result tracking
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
  const statusIcon = status >= 200 && status < 300 ? "✅" : "❌";
  console.log(
    `${statusIcon} ${method} ${endpoint} - ${status} - ${message}`,
  );
};

// Test function
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

// Main test function
const runTests = async () => {
  console.log("🚀 Starting API Tests...\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  // 1. Health Check
  console.log("📋 Testing Health Endpoint...");
  await testEndpoint("GET", "/health");
  console.log("");

  // 2. Authentication (need super admin credentials)
  console.log("📋 Testing Authentication...");
  // Try to authenticate with known test credentials
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
  await testEndpoint("GET", "/schools", null, authHeaders);
  await testEndpoint("GET", "/schools/my-school", null, authHeaders);
  await testEndpoint("GET", "/schools/classes", null, authHeaders);
  console.log("");

  // 5. Calendar Endpoints
  console.log("📋 Testing Calendar Endpoints...");
  await testEndpoint("GET", "/calendar/events", null, authHeaders);
  await testEndpoint("GET", "/calendar/holidays", null, authHeaders);
  await testEndpoint("GET", "/calendar/exam-calendars", null, authHeaders);
  await testEndpoint("GET", "/calendar/notices", null, authHeaders);
  const today = new Date().toISOString().split("T")[0];
  await testEndpoint("GET", `/calendar/${today}`, null, authHeaders);
  console.log("");

  // 6. File Endpoints
  console.log("📋 Testing File Endpoints...");
  // File upload requires multipart/form-data, skip for now
  console.log("⚠️  File upload skipped (requires multipart/form-data)");
  console.log("");

  // 7. Region Endpoints
  console.log("📋 Testing Region Endpoints...");
  await testEndpoint("GET", "/regions", null, authHeaders);
  console.log("");

  // 8. Vendor Endpoints
  console.log("📋 Testing Vendor Endpoints...");
  await testEndpoint("GET", "/vendors/stats", null, authHeaders);
  await testEndpoint("GET", "/vendors", null, authHeaders);
  console.log("");

  // 9. Transport Endpoints
  console.log("📋 Testing Transport Endpoints...");
  await testEndpoint("GET", "/transports", null, authHeaders);
  console.log("");

  // 10. License Endpoints
  console.log("📋 Testing License Endpoints...");
  await testEndpoint("GET", "/licenses", null, authHeaders);
  console.log("");

  // 11. Receipt Endpoints
  console.log("📋 Testing Receipt Endpoints...");
  await testEndpoint("GET", "/receipts", null, authHeaders);
  console.log("");

  // 12. Statistics Endpoints
  console.log("📋 Testing Statistics Endpoints...");
  await testEndpoint("GET", "/statistics", null, authHeaders);
  await testEndpoint("GET", "/statistics/dashboard", null, authHeaders);
  console.log("");

  // 13. Location Endpoints
  console.log("📋 Testing Location Endpoints...");
  await testEndpoint("GET", "/locations", null, authHeaders);
  console.log("");

  // 14. Letterhead Endpoints
  console.log("📋 Testing Letterhead Endpoints...");
  await testEndpoint("GET", "/letterhead", null, authHeaders);
  console.log("");

  // 15. Exam Endpoints
  console.log("📋 Testing Exam Endpoints...");
  await testEndpoint("GET", "/exams", null, authHeaders);
  console.log("");

  // 16. ID Card Endpoints
  console.log("📋 Testing ID Card Endpoints...");
  await testEndpoint("GET", "/id-cards", null, authHeaders);
  console.log("");

  // 17. Template Endpoints
  console.log("📋 Testing Template Endpoints...");
  await testEndpoint("GET", "/templates", null, authHeaders);
  console.log("");

  // 18. Settings Endpoints
  console.log("📋 Testing Settings Endpoints...");
  await testEndpoint("GET", "/settings", null, authHeaders);
  console.log("");

  // 19. Fee Endpoints
  console.log("📋 Testing Fee Endpoints...");
  await testEndpoint("GET", "/fees", null, authHeaders);
  console.log("");

  // 20. Grievance Endpoints
  console.log("📋 Testing Grievance Endpoints...");
  await testEndpoint("GET", "/grievances", null, authHeaders);
  console.log("");

  // 21. Salary Endpoints
  console.log("📋 Testing Salary Endpoints...");
  await testEndpoint("GET", "/salary-structures", null, authHeaders);
  await testEndpoint("GET", "/salary-payments", null, authHeaders);
  await testEndpoint("GET", "/salaries", null, authHeaders);
  console.log("");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  const total = testResults.length;
  const passed = testResults.filter(
    (r) => r.status >= 200 && r.status < 300,
  ).length;
  const failed = testResults.filter((r) => r.status === 0 || r.status >= 400)
    .length;
  const skipped = total - passed - failed;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped/Other: ${skipped}`);

  // Failed tests details
  if (failed > 0) {
    console.log("\n❌ Failed Tests:");
    testResults
      .filter((r) => r.status === 0 || r.status >= 400)
      .forEach((r) => {
        console.log(`  - ${r.method} ${r.endpoint} (${r.status})`);
      });
  }

  console.log("\n" + "=".repeat(60));
};

// Run tests
runTests().catch(console.error);

