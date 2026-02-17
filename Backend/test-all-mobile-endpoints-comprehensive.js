import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = 'https://api.schooliat.com';
const API_BASE_URL = 'https://api.schooliat.com/api/v1';

// Test credentials for different roles
const CREDENTIALS = {
  teacher: {
    email: 'teacher1@gis001.edu',
    password: 'Teacher@123'
  },
  student: {
    email: 'student1@gis001.edu', // Update if different
    password: 'Student@123' // Update if different
  },
  employee: {
    email: 'john.doe@schooliat.com',
    password: 'Employee@123'
  }
};

// Results storage
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            rawBody: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Login function
async function login(role) {
  const creds = CREDENTIALS[role];
  if (!creds) {
    throw new Error(`No credentials found for role: ${role}`);
  }

  try {
    const response = await makeRequest({
      url: `${BASE_URL}/auth/authenticate`,
      method: 'POST',
      headers: {
        'x-platform': 'android'
      }
    }, {
      request: {
        email: creds.email,
        password: creds.password
      }
    });

    if (response.status === 200 && response.body.token) {
      return response.body.token;
    } else if (response.status === 200 && response.body.data && response.body.data.token) {
      return response.body.data.token;
    } else {
      throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
    }
  } catch (error) {
    throw new Error(`Login error for ${role}: ${error.message}`);
  }
}

// Test endpoint function
async function testEndpoint(name, options, token, role) {
  results.total++;
  const startTime = Date.now();

  try {
    const headers = {
      'x-platform': 'android',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`;
    
    const response = await makeRequest({
      url: url,
      method: options.method || 'GET',
      headers: headers
    }, options.body);

    const duration = Date.now() - startTime;
    const isSuccess = response.status >= 200 && response.status < 300;

    if (isSuccess) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push({
        endpoint: name,
        role: role,
        status: response.status,
        error: response.body
      });
    }

    results.details.push({
      endpoint: name,
      role: role,
      method: options.method || 'GET',
      url: url,
      status: response.status,
      success: isSuccess,
      duration: duration,
      response: response.body
    });

    return {
      success: isSuccess,
      status: response.status,
      response: response.body
    };
  } catch (error) {
    results.failed++;
    const duration = Date.now() - startTime;
    results.errors.push({
      endpoint: name,
      role: role,
      error: error.message
    });
    results.details.push({
      endpoint: name,
      role: role,
      method: options.method || 'GET',
      url: options.url,
      status: 'ERROR',
      success: false,
      duration: duration,
      error: error.message
    });
    return {
      success: false,
      error: error.message
    };
  }
}

// Extract endpoints from Postman collection
function extractEndpoints() {
  const collectionPath = path.join(__dirname, '..', 'Mobile_api.json');
  const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
  
  const endpoints = {
    auth: [],
    teacher: [],
    student: [],
    employee: [],
    shared: []
  };

  function processItems(items, category) {
    items.forEach(item => {
      if (item.request) {
        const url = item.request.url?.raw || item.request.url || '';
        const method = item.request.method || 'GET';
        const body = item.request.body?.raw ? JSON.parse(item.request.body.raw) : null;
        const headers = {};
        
        if (item.request.header) {
          item.request.header.forEach(h => {
            if (h.key !== 'Content-Type') {
              headers[h.key] = h.value;
            }
          });
        }

        endpoints[category].push({
          name: item.name,
          method: method,
          url: url,
          body: body,
          headers: headers
        });
      }
      
      if (item.item) {
        processItems(item.item, category);
      }
    });
  }

  collection.item.forEach(section => {
    const sectionName = section.name.toLowerCase();
    if (sectionName === 'authentication') {
      processItems(section.item, 'auth');
    } else if (sectionName === 'teacher') {
      processItems(section.item, 'teacher');
    } else if (sectionName === 'student') {
      processItems(section.item, 'student');
    } else if (sectionName === 'employee') {
      processItems(section.item, 'employee');
    } else if (sectionName === 'shared') {
      processItems(section.item, 'shared');
    }
  });

  return endpoints;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Comprehensive Mobile API Endpoint Tests\n');
  console.log('='.repeat(80));
  
  const endpoints = extractEndpoints();
  
  // Test authentication endpoints first
  console.log('\n📋 Testing Authentication Endpoints...');
  for (const endpoint of endpoints.auth) {
    if (endpoint.name === 'Login') {
      // Skip login tests as we'll do them separately for each role
      continue;
    }
    await testEndpoint(`Auth: ${endpoint.name}`, {
      method: endpoint.method,
      url: endpoint.url.replace('{{base_url}}', BASE_URL),
      body: endpoint.body,
      headers: endpoint.headers
    }, null, 'public');
  }

  // Test Teacher endpoints
  console.log('\n👨‍🏫 Testing Teacher Endpoints...');
  let teacherToken;
  try {
    teacherToken = await login('teacher');
    console.log('✅ Teacher login successful');
  } catch (error) {
    console.log(`❌ Teacher login failed: ${error.message}`);
    console.log('⚠️  Skipping Teacher endpoints...');
  }

  if (teacherToken) {
    for (const endpoint of endpoints.teacher) {
      // Replace variables in URL
      let url = endpoint.url.replace('{{base_url}}', BASE_URL);
      url = url.replace('{{api_base_url}}', API_BASE_URL);
      
      // If URL starts with base URL but doesn't have /api/v1, add it (except for /auth routes)
      if (url.startsWith(BASE_URL) && !url.includes('/api/v1') && !url.includes('/auth')) {
        url = url.replace(BASE_URL, API_BASE_URL);
      }
      
      await testEndpoint(`Teacher: ${endpoint.name}`, {
        method: endpoint.method,
        url: url,
        body: endpoint.body,
        headers: endpoint.headers
      }, teacherToken, 'teacher');
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Test Student endpoints
  console.log('\n👨‍🎓 Testing Student Endpoints...');
  let studentToken;
  try {
    studentToken = await login('student');
    console.log('✅ Student login successful');
  } catch (error) {
    console.log(`❌ Student login failed: ${error.message}`);
    console.log('⚠️  Skipping Student endpoints...');
  }

  if (studentToken) {
    for (const endpoint of endpoints.student) {
      let url = endpoint.url.replace('{{base_url}}', BASE_URL);
      url = url.replace('{{api_base_url}}', API_BASE_URL);
      
      // If URL starts with base URL but doesn't have /api/v1, add it (except for /auth routes)
      if (url.startsWith(BASE_URL) && !url.includes('/api/v1') && !url.includes('/auth')) {
        url = url.replace(BASE_URL, API_BASE_URL);
      }
      
      await testEndpoint(`Student: ${endpoint.name}`, {
        method: endpoint.method,
        url: url,
        body: endpoint.body,
        headers: endpoint.headers
      }, studentToken, 'student');
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Test Employee endpoints
  console.log('\n👔 Testing Employee Endpoints...');
  let employeeToken;
  try {
    employeeToken = await login('employee');
    console.log('✅ Employee login successful');
  } catch (error) {
    console.log(`❌ Employee login failed: ${error.message}`);
    console.log('⚠️  Skipping Employee endpoints...');
  }

  if (employeeToken) {
    for (const endpoint of endpoints.employee) {
      let url = endpoint.url.replace('{{base_url}}', BASE_URL);
      url = url.replace('{{api_base_url}}', API_BASE_URL);
      
      // If URL starts with base URL but doesn't have /api/v1, add it (except for /auth routes)
      if (url.startsWith(BASE_URL) && !url.includes('/api/v1') && !url.includes('/auth')) {
        url = url.replace(BASE_URL, API_BASE_URL);
      }
      
      await testEndpoint(`Employee: ${endpoint.name}`, {
        method: endpoint.method,
        url: url,
        body: endpoint.body,
        headers: endpoint.headers
      }, employeeToken, 'employee');
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Test Shared endpoints (with all tokens)
  console.log('\n🔗 Testing Shared Endpoints...');
  const tokens = { teacher: teacherToken, student: studentToken, employee: employeeToken };
  
  for (const endpoint of endpoints.shared) {
    // Test with first available token
    const token = teacherToken || studentToken || employeeToken;
    const role = teacherToken ? 'teacher' : (studentToken ? 'student' : 'employee');
    
    let url = endpoint.url.replace('{{base_url}}', BASE_URL);
    url = url.replace('{{api_base_url}}', API_BASE_URL);
    
    // If URL starts with base URL but doesn't have /api/v1, add it (except for /auth routes)
    if (url.startsWith(BASE_URL) && !url.includes('/api/v1') && !url.includes('/auth')) {
      url = url.replace(BASE_URL, API_BASE_URL);
    }
    
    await testEndpoint(`Shared: ${endpoint.name}`, {
      method: endpoint.method,
      url: url,
      body: endpoint.body,
      headers: endpoint.headers
    }, token, role);
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);

  // Print errors
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    console.log('='.repeat(80));
    results.errors.slice(0, 20).forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.endpoint} (${error.role})`);
      console.log(`   Status: ${error.status || 'N/A'}`);
      console.log(`   Error: ${JSON.stringify(error.error || error).substring(0, 200)}`);
    });
    if (results.errors.length > 20) {
      console.log(`\n... and ${results.errors.length - 20} more errors`);
    }
  }

  // Save detailed results to file
  const reportPath = path.join(__dirname, 'MOBILE_API_TEST_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: ((results.passed / results.total) * 100).toFixed(2) + '%'
    },
    errors: results.errors,
    details: results.details
  }, null, 2));

  console.log(`\n📄 Detailed results saved to: ${reportPath}`);

  // Generate markdown report
  const markdownReport = generateMarkdownReport();
  const markdownPath = path.join(__dirname, 'MOBILE_API_TEST_RESULTS.md');
  fs.writeFileSync(markdownPath, markdownReport);
  console.log(`📄 Markdown report saved to: ${markdownPath}`);
}

function generateMarkdownReport() {
  let report = '# Mobile API Test Results\n\n';
  report += `**Test Date:** ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${results.total}\n`;
  report += `- **Passed:** ${results.passed} ✅\n`;
  report += `- **Failed:** ${results.failed} ❌\n`;
  report += `- **Success Rate:** ${((results.passed / results.total) * 100).toFixed(2)}%\n\n`;

  // Group by role
  const byRole = {};
  results.details.forEach(detail => {
    const role = detail.role || 'unknown';
    if (!byRole[role]) {
      byRole[role] = { passed: 0, failed: 0, endpoints: [] };
    }
    if (detail.success) {
      byRole[role].passed++;
    } else {
      byRole[role].failed++;
    }
    byRole[role].endpoints.push(detail);
  });

  report += `## Results by Role\n\n`;
  Object.keys(byRole).forEach(role => {
    const roleData = byRole[role];
    report += `### ${role.toUpperCase()}\n\n`;
    report += `- Passed: ${roleData.passed}\n`;
    report += `- Failed: ${roleData.failed}\n\n`;

    // Failed endpoints
    const failed = roleData.endpoints.filter(e => !e.success);
    if (failed.length > 0) {
      report += `#### Failed Endpoints:\n\n`;
      failed.forEach(endpoint => {
        report += `- **${endpoint.endpoint}** (${endpoint.method} ${endpoint.url})\n`;
        report += `  - Status: ${endpoint.status}\n`;
        if (endpoint.error) {
          report += `  - Error: ${endpoint.error}\n`;
        }
        report += `\n`;
      });
    }
  });

  return report;
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

