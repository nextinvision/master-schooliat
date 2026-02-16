import "dotenv/config";

// Test both staging and production
const STAGING_URL = process.env.STAGING_API_URL || process.env.API_URL || "http://localhost:3001";
const PRODUCTION_URL = process.env.PRODUCTION_API_URL || "https://schooliat-backend.onrender.com";
const PLATFORM = "android";

let testResults = {
  staging: [],
  production: [],
};

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const logResult = (endpoint, method, status, message, environment, userType = "") => {
  const result = {
    endpoint,
    method,
    status,
    message,
    timestamp: new Date().toISOString(),
    userType,
    environment,
  };
  testResults[environment].push(result);
  
  const statusIcon = 
    status >= 200 && status < 300 ? "✅" : 
    status >= 400 && status < 500 ? "⚠️" : 
    "❌";
  
  const color = 
    status >= 200 && status < 300 ? colors.green : 
    status >= 400 && status < 500 ? colors.yellow : 
    colors.red;
  
  const envColor = environment === "staging" ? colors.cyan : colors.magenta;
  const prefix = userType ? `[${userType.toUpperCase()}] ` : "";
  console.log(
    `${envColor}[${environment.toUpperCase()}]${colors.reset} ${color}${statusIcon} ${prefix}${method} ${endpoint} - ${status} - ${message}${colors.reset}`
  );
};

const testEndpoint = async (baseUrl, method, endpoint, body = null, headers = {}, environment, userType = "") => {
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

    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const responseData = await response.json().catch(() => ({}));

    logResult(
      endpoint,
      method,
      response.status,
      responseData.message || response.statusText,
      environment,
      userType
    );

    return { status: response.status, data: responseData };
  } catch (error) {
    logResult(endpoint, method, 0, `Error: ${error.message}`, environment, userType);
    return { status: 0, data: null };
  }
};

const testHealthCheck = async (baseUrl, environment) => {
  console.log(`\n${colors.cyan}🏥 Testing Health Check for ${environment.toUpperCase()}...${colors.reset}`);
  await testEndpoint(baseUrl, "GET", "/health", null, {}, environment);
  await testEndpoint(baseUrl, "GET", "/", null, {}, environment);
};

const testAuth = async (baseUrl, environment) => {
  console.log(`\n${colors.cyan}🔐 Testing Authentication for ${environment.toUpperCase()}...${colors.reset}`);
  
  // Test OTP request
  await testEndpoint(
    baseUrl,
    "POST",
    "/auth/request-otp",
    {
      request: {
        email: "test@example.com",
        purpose: "verification",
      },
    },
    {},
    environment,
    "auth"
  );

  // Test forgot password
  await testEndpoint(
    baseUrl,
    "POST",
    "/auth/forgot-password",
    {
      request: {
        email: "test@example.com",
      },
    },
    {},
    environment,
    "auth"
  );
};

const testWithAuth = async (baseUrl, email, password, userType, environment) => {
  console.log(`\n${colors.cyan}🔑 Authenticating as ${userType.toUpperCase()} on ${environment.toUpperCase()}...${colors.reset}`);
  
  const authResponse = await testEndpoint(
    baseUrl,
    "POST",
    "/auth/authenticate",
    {
      request: { email, password },
    },
    {},
    environment,
    userType
  );

  if (!authResponse.data?.token) {
    console.log(`${colors.yellow}⚠️  ${userType.toUpperCase()} authentication failed on ${environment.toUpperCase()}${colors.reset}\n`);
    return null;
  }

  const token = authResponse.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  console.log(`${colors.green}✅ ${userType.toUpperCase()} authenticated on ${environment.toUpperCase()}${colors.reset}\n`);

  // Test dashboard
  await testEndpoint(baseUrl, "GET", "/statistics/dashboard", null, headers, environment, userType);

  // Test common endpoints based on user type
  if (userType === "teacher") {
    await testEndpoint(baseUrl, "GET", "/students", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/attendance", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/homework", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/timetables", null, headers, environment, userType);
  } else if (userType === "student") {
    await testEndpoint(baseUrl, "GET", "/attendance", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/homework", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/marks", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/timetables", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/fees", null, headers, environment, userType);
  } else if (userType === "employee") {
    await testEndpoint(baseUrl, "GET", "/schools", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/employees", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/vendors", null, headers, environment, userType);
    await testEndpoint(baseUrl, "GET", "/licenses", null, headers, environment, userType);
  }

  // Test shared endpoints
  await testEndpoint(baseUrl, "GET", "/notifications", null, headers, environment, "shared");
  await testEndpoint(baseUrl, "GET", "/communication/announcements", null, headers, environment, "shared");
  await testEndpoint(baseUrl, "GET", "/circulars", null, headers, environment, "shared");
  await testEndpoint(baseUrl, "GET", "/calendar/events", null, headers, environment, "shared");

  return token;
};

const printSummary = (environment) => {
  const results = testResults[environment];
  if (results.length === 0) return;

  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}📊 ${environment.toUpperCase()} TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  const total = results.length;
  const success = results.filter((r) => r.status >= 200 && r.status < 300).length;
  const warning = results.filter((r) => r.status >= 400 && r.status < 500).length;
  const error = results.filter((r) => r.status === 0 || r.status >= 500).length;

  console.log(`${colors.green}✅ Successful: ${success}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings (4xx): ${warning}${colors.reset}`);
  console.log(`${colors.red}❌ Errors: ${error}${colors.reset}`);
  console.log(`${colors.cyan}📊 Total: ${total}${colors.reset}\n`);

  // Group by user type
  const byUserType = {};
  results.forEach((result) => {
    const type = result.userType || "other";
    if (!byUserType[type]) {
      byUserType[type] = { success: 0, warning: 0, error: 0, total: 0 };
    }
    byUserType[type].total++;
    if (result.status >= 200 && result.status < 300) byUserType[type].success++;
    else if (result.status >= 400 && result.status < 500) byUserType[type].warning++;
    else byUserType[type].error++;
  });

  if (Object.keys(byUserType).length > 0) {
    console.log(`${colors.bright}Breakdown by User Type:${colors.reset}`);
    Object.entries(byUserType).forEach(([type, stats]) => {
      console.log(
        `  ${type.toUpperCase()}: ${colors.green}${stats.success}${colors.reset} success, ` +
        `${colors.yellow}${stats.warning}${colors.reset} warnings, ` +
        `${colors.red}${stats.error}${colors.reset} errors (${stats.total} total)`
      );
    });
  }
};

const runTests = async () => {
  console.log(`${colors.bright}${colors.blue}`);
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║  SchooliAt Mobile API Test - Staging & Production        ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}`);
  console.log(`Staging URL: ${STAGING_URL}`);
  console.log(`Production URL: ${PRODUCTION_URL}`);
  console.log(`Platform: ${PLATFORM}`);
  console.log(`Test started at: ${new Date().toISOString()}\n`);

  // Get credentials from environment or use defaults
  const teacherEmail = process.env.TEACHER_EMAIL || "teacher@example.com";
  const teacherPassword = process.env.TEACHER_PASSWORD || "password123";
  const studentEmail = process.env.STUDENT_EMAIL || "student@example.com";
  const studentPassword = process.env.STUDENT_PASSWORD || "password123";
  const employeeEmail = process.env.EMPLOYEE_EMAIL || "employee@example.com";
  const employeePassword = process.env.EMPLOYEE_PASSWORD || "password123";

  // Test Staging
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🧪 TESTING STAGING API${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);

  await testHealthCheck(STAGING_URL, "staging");
  await testAuth(STAGING_URL, "staging");
  
  await testWithAuth(STAGING_URL, teacherEmail, teacherPassword, "teacher", "staging");
  await testWithAuth(STAGING_URL, studentEmail, studentPassword, "student", "staging");
  await testWithAuth(STAGING_URL, employeeEmail, employeePassword, "employee", "staging");

  printSummary("staging");

  // Test Production
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}🚀 TESTING PRODUCTION API${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════════════════════════${colors.reset}`);

  await testHealthCheck(PRODUCTION_URL, "production");
  await testAuth(PRODUCTION_URL, "production");
  
  await testWithAuth(PRODUCTION_URL, teacherEmail, teacherPassword, "teacher", "production");
  await testWithAuth(PRODUCTION_URL, studentEmail, studentPassword, "student", "production");
  await testWithAuth(PRODUCTION_URL, employeeEmail, employeePassword, "employee", "production");

  printSummary("production");

  // Overall Summary
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}📊 OVERALL SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  const stagingTotal = testResults.staging.length;
  const stagingSuccess = testResults.staging.filter((r) => r.status >= 200 && r.status < 300).length;
  const productionTotal = testResults.production.length;
  const productionSuccess = testResults.production.filter((r) => r.status >= 200 && r.status < 300).length;

  console.log(`${colors.cyan}STAGING:${colors.reset} ${colors.green}${stagingSuccess}${colors.reset}/${stagingTotal} successful`);
  console.log(`${colors.magenta}PRODUCTION:${colors.reset} ${colors.green}${productionSuccess}${colors.reset}/${productionTotal} successful`);
  console.log(`\n${colors.cyan}Test completed at: ${new Date().toISOString()}${colors.reset}\n`);
};

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}❌ Test suite failed: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});

