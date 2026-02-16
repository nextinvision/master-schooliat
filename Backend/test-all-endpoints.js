import "dotenv/config";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const PLATFORM = "android";

let teacherToken = null;
let studentToken = null;
let employeeToken = null;
let testResults = [];

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const logResult = (endpoint, method, status, message, error = null) => {
  const result = {
    endpoint,
    method,
    status,
    message,
    error: error ? error.substring(0, 200) : null,
    timestamp: new Date().toISOString(),
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
  
  console.log(
    `${color}${statusIcon} ${method} ${endpoint} - ${status} - ${message}${colors.reset}`
  );
  if (error) {
    console.log(`   ${colors.red}Error: ${error.substring(0, 150)}${colors.reset}`);
  }
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
    const responseData = await response.json().catch(() => ({ message: "Invalid JSON response" }));

    const errorMsg = responseData.error || responseData.message || response.statusText;
    logResult(
      endpoint,
      method,
      response.status,
      responseData.message || response.statusText,
      response.status >= 400 ? errorMsg : null
    );

    return { status: response.status, data: responseData };
  } catch (error) {
    logResult(endpoint, method, 0, `Error: ${error.message}`, error.message);
    return { status: 0, data: null };
  }
};

const authenticate = async () => {
  console.log(`\n${colors.cyan}🔐 Authenticating users...${colors.reset}`);
  
  const teacherRes = await testEndpoint(
    "POST",
    "/auth/authenticate",
    { request: { email: "teacher1@gis001.edu", password: "Teacher@123" } },
    {},
    "teacher"
  );
  if (teacherRes.data?.token) teacherToken = teacherRes.data.token;

  const studentRes = await testEndpoint(
    "POST",
    "/auth/authenticate",
    { request: { email: "student1@gis001.edu", password: "Student@123" } },
    {},
    "student"
  );
  if (studentRes.data?.token) studentToken = studentRes.data.token;

  const employeeRes = await testEndpoint(
    "POST",
    "/auth/authenticate",
    { request: { email: "john.doe@schooliat.com", password: "Employee@123" } },
    {},
    "employee"
  );
  if (employeeRes.data?.token) employeeToken = employeeRes.data.token;
};

const testAuthEndpoints = async () => {
  console.log(`\n${colors.cyan}📋 Testing Authentication Endpoints...${colors.reset}`);
  
  await testEndpoint("POST", "/auth/forgot-password", { request: { email: "teacher1@gis001.edu" } });
  await testEndpoint("POST", "/auth/request-otp", { request: { email: "teacher1@gis001.edu", purpose: "verification" } });
};

const testTeacherEndpoints = async () => {
  if (!teacherToken) {
    console.log(`${colors.yellow}⚠️  Teacher token not available${colors.reset}`);
    return;
  }

  console.log(`\n${colors.cyan}👨‍🏫 Testing Teacher Endpoints...${colors.reset}`);
  const headers = { Authorization: `Bearer ${teacherToken}` };

  await testEndpoint("GET", "/statistics/dashboard", null, headers);
  await testEndpoint("GET", "/students?page=1&limit=10", null, headers);
  await testEndpoint("GET", "/attendance", null, headers);
  await testEndpoint("GET", "/attendance/statistics", null, headers);
  await testEndpoint("GET", "/homework", null, headers);
  await testEndpoint("GET", "/marks", null, headers);
  await testEndpoint("GET", "/timetables", null, headers);
  await testEndpoint("GET", "/notes", null, headers);
  await testEndpoint("GET", "/leave/requests", null, headers);
  await testEndpoint("GET", "/leave/balance", null, headers);
};

const testStudentEndpoints = async () => {
  if (!studentToken) {
    console.log(`${colors.yellow}⚠️  Student token not available${colors.reset}`);
    return;
  }

  console.log(`\n${colors.cyan}🎓 Testing Student Endpoints...${colors.reset}`);
  const headers = { Authorization: `Bearer ${studentToken}` };

  await testEndpoint("GET", "/statistics/dashboard", null, headers);
  await testEndpoint("GET", "/attendance", null, headers);
  await testEndpoint("GET", "/attendance/statistics", null, headers);
  await testEndpoint("GET", "/homework", null, headers);
  await testEndpoint("GET", "/marks", null, headers);
  await testEndpoint("GET", "/marks/results", null, headers);
  await testEndpoint("GET", "/timetables", null, headers);
  await testEndpoint("GET", "/notes", null, headers);
  await testEndpoint("GET", "/syllabus", null, headers);
  await testEndpoint("GET", "/fees", null, headers);
  await testEndpoint("GET", "/fees/status", null, headers);
};

const testEmployeeEndpoints = async () => {
  if (!employeeToken) {
    console.log(`${colors.yellow}⚠️  Employee token not available${colors.reset}`);
    return;
  }

  console.log(`\n${colors.cyan}🏢 Testing Employee Endpoints...${colors.reset}`);
  const headers = { Authorization: `Bearer ${employeeToken}` };

  await testEndpoint("GET", "/statistics/dashboard", null, headers);
  await testEndpoint("GET", "/schools?page=1&limit=10", null, headers);
  await testEndpoint("GET", "/employees?page=1&limit=10", null, headers);
  await testEndpoint("GET", "/vendors?page=1&limit=10", null, headers);
  await testEndpoint("GET", "/licenses?page=1&limit=10", null, headers);
  await testEndpoint("GET", "/receipts?page=1&limit=10", null, headers);
  await testEndpoint("GET", "/statistics/schools", null, headers);
};

const testSharedEndpoints = async () => {
  const token = teacherToken || studentToken || employeeToken;
  if (!token) {
    console.log(`${colors.yellow}⚠️  No token available${colors.reset}`);
    return;
  }

  console.log(`\n${colors.cyan}🔗 Testing Shared Endpoints...${colors.reset}`);
  const headers = { Authorization: `Bearer ${token}` };

  await testEndpoint("GET", "/notifications?page=1&limit=10", null, headers);
  await testEndpoint("GET", "/communication/announcements", null, headers);
  await testEndpoint("GET", "/circulars", null, headers);
  await testEndpoint("GET", "/calendar/events", null, headers);
  await testEndpoint("GET", "/calendar", null, headers);
  await testEndpoint("GET", "/gallery", null, headers);
};

const printSummary = () => {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}📊 TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  const total = testResults.length;
  const success = testResults.filter((r) => r.status >= 200 && r.status < 300).length;
  const warning = testResults.filter((r) => r.status >= 400 && r.status < 500).length;
  const error = testResults.filter((r) => r.status === 0 || r.status >= 500).length;

  console.log(`${colors.green}✅ Successful: ${success}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings (4xx): ${warning}${colors.reset}`);
  console.log(`${colors.red}❌ Errors: ${error}${colors.reset}`);
  console.log(`${colors.cyan}📊 Total: ${total}${colors.reset}\n`);

  if (error > 0 || warning > 0) {
    console.log(`${colors.yellow}⚠️  Failed/Problematic Endpoints:${colors.reset}`);
    testResults
      .filter((r) => r.status >= 400 || r.status === 0)
      .forEach((r) => {
        console.log(`  ${r.method} ${r.endpoint} - ${r.status} - ${r.message}`);
        if (r.error) console.log(`    Error: ${r.error.substring(0, 100)}`);
      });
  }
};

const runTests = async () => {
  console.log(`${colors.cyan}`);
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║     Complete Mobile API Endpoint Test Suite             ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Platform: ${PLATFORM}\n`);

  try {
    await authenticate();
    await testAuthEndpoints();
    await testTeacherEndpoints();
    await testStudentEndpoints();
    await testEmployeeEndpoints();
    await testSharedEndpoints();
    printSummary();
  } catch (error) {
    console.error(`${colors.red}❌ Test suite failed: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
};

runTests();

