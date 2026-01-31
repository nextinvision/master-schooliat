import "dotenv/config";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
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
  console.log("🚀 Starting CRUD API Tests...\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  // Authentication
  console.log("📋 Authenticating...");
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

    if (authData.token) {
      authToken = authData.token;
      console.log("✅ Authentication successful!\n");
    } else {
      console.log("⚠️  Authentication failed\n");
      return;
    }
  } catch (error) {
    console.log("❌ Authentication error:", error.message);
    return;
  }

  const authHeaders = { Authorization: `Bearer ${authToken}` };

  // Test Region CRUD
  console.log("📋 Testing Region CRUD...");
  const regionCreateRes = await testEndpoint("POST", "/regions", {
    request: {
      name: `Test Region ${Date.now()}`,
    },
  }, authHeaders);
  if (regionCreateRes.data?.data?.id) {
    createdResources.regionId = regionCreateRes.data.data.id;
    console.log(`  Created region: ${createdResources.regionId}`);
    
    // Test update
    await testEndpoint("PATCH", `/regions/${createdResources.regionId}`, {
      request: {
        name: `Updated Region ${Date.now()}`,
      },
    }, authHeaders);
    
    // Test delete
    await testEndpoint("DELETE", `/regions/${createdResources.regionId}`, null, authHeaders);
  }
  console.log("");

  // Test Vendor CRUD
  console.log("📋 Testing Vendor CRUD...");
  if (createdResources.regionId) {
    const vendorCreateRes = await testEndpoint("POST", "/vendors", {
      request: {
        name: `Test Vendor ${Date.now()}`,
        regionId: createdResources.regionId,
        contact: "1234567890",
        email: `vendor${Date.now()}@test.com`,
        address: ["123 Test Street", "Test City"],
      },
    }, authHeaders);
    if (vendorCreateRes.data?.data?.id) {
      createdResources.vendorId = vendorCreateRes.data.data.id;
      console.log(`  Created vendor: ${createdResources.vendorId}`);
      
      // Test update
      await testEndpoint("PATCH", `/vendors/${createdResources.vendorId}`, {
        request: {
          name: `Updated Vendor ${Date.now()}`,
        },
      }, authHeaders);
    }
  } else {
    console.log("  ⚠️  Skipping vendor tests - no region available");
  }
  console.log("");

  // Test License CRUD
  console.log("📋 Testing License CRUD...");
  const licenseCreateRes = await testEndpoint("POST", "/licenses", {
    request: {
      name: `Test License ${Date.now()}`,
      issuer: "Test Issuer",
      issueDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      certificateNumber: `CERT-${Date.now()}`,
    },
  }, authHeaders);
  if (licenseCreateRes.data?.data?.id) {
    createdResources.licenseId = licenseCreateRes.data.data.id;
    console.log(`  Created license: ${createdResources.licenseId}`);
    
    // Test update (license uses PUT, not PATCH)
    await testEndpoint("PUT", `/licenses/${createdResources.licenseId}`, {
      request: {
        name: `Updated License ${Date.now()}`,
        issuer: "Updated Issuer",
        issueDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        certificateNumber: `CERT-UPDATED-${Date.now()}`,
      },
    }, authHeaders);
    
    // Test delete
    await testEndpoint("DELETE", `/licenses/${createdResources.licenseId}`, null, authHeaders);
  }
  console.log("");

  // Test Receipt CRUD (requires school)
  console.log("📋 Testing Receipt Endpoints...");
  const receiptsRes = await testEndpoint("GET", "/receipts", null, authHeaders);
  if (receiptsRes.data?.data?.[0]?.id) {
    createdResources.receiptId = receiptsRes.data.data[0].id;
    console.log(`  Found receipt: ${createdResources.receiptId}`);
  }
  console.log("");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 CRUD TEST SUMMARY");
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
    console.log("\n❌ Failed Tests:");
    testResults
      .filter((r) => r.status === 0 || r.status >= 500)
      .forEach((r) => {
        console.log(`  - ${r.method} ${r.endpoint} (${r.status}) - ${r.message}`);
      });
  }

  console.log("\n" + "=".repeat(60));
};

runTests().catch(console.error);

