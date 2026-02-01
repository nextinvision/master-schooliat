/**
 * Comprehensive Seed File for SchooliAt Backend
 * 
 * This seed file populates the database with complete test data including:
 * - Roles with permissions
 * - Regions and Locations
 * - Schools
 * - Classes and Subjects
 * - Users (Super Admin, Employees, School Admins, Teachers, Students, Staff)
 * - Transport Vehicles
 * - Fees and Fee Installments
 * - Exams and Exam Calendars
 * - Events, Holidays, and Notices
 * - Receipts
 * - Licenses
 * - Vendors
 * - Settings
 * - Grievances
 * - Salary Structures and Payments
 * 
 * Usage: node prisma/seed.js
 */

import prisma from "../src/prisma/client.js";
import bcryptjs from "bcryptjs";
import {
  RoleName,
  Permission,
  UserType,
  Gender,
  AccommodationType,
  BloodGroup,
  DateType,
  ExamType,
  FeePaymentStatus,
  GrievanceStatus,
  GrievancePriority,
  LicenseStatus,
  PaymentMethod,
  ReceiptStatus,
  TransportType,
  LeadStatus,
  SalaryComponentType,
  SalaryComponentValueType,
  SalaryComponentFrequency,
} from "../src/prisma/generated/index.js";
import logger from "../src/config/logger.js";

// Helper function to generate random date within a range
const randomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Helper function to generate random number in range
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to generate random string
const randomString = (length) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// Helper function to hash password
const hashPassword = async (password) => {
  return await bcryptjs.hash(password, 10);
};

// Store created IDs for relationships
const seedData = {
  roles: {},
  regions: [],
  locations: [],
  schools: [],
  classes: {},
  subjects: {},
  users: {
    superAdmin: null,
    employees: [],
    schoolAdmins: {},
    teachers: {},
    students: {},
    staff: [],
  },
  transports: {},
  exams: {},
  settings: {},
};

/**
 * Seed Roles with Permissions
 */
async function seedRoles() {
  logger.info("Seeding Roles...");

  const defaultRolePermissionsMap = {
    [RoleName.SUPER_ADMIN]: [
      Permission.CREATE_EMPLOYEE,
      Permission.GET_EMPLOYEES,
      Permission.EDIT_EMPLOYEE,
      Permission.DELETE_EMPLOYEE,
      Permission.CREATE_SCHOOL,
      Permission.GET_SCHOOLS,
      Permission.EDIT_SCHOOL,
      Permission.DELETE_SCHOOL,
      Permission.CREATE_VENDOR,
      Permission.GET_VENDORS,
      Permission.EDIT_VENDOR,
      Permission.DELETE_VENDOR,
      Permission.CREATE_REGION,
      Permission.GET_REGIONS,
      Permission.EDIT_REGION,
      Permission.DELETE_REGION,
      Permission.GET_ROLES,
      Permission.GET_STATISTICS,
      Permission.GET_DASHBOARD_STATS,
      Permission.GET_USERS,
      Permission.CREATE_LICENSE,
      Permission.GET_LICENSES,
      Permission.UPDATE_LICENSE,
      Permission.DELETE_LICENSE,
      Permission.CREATE_RECEIPT,
      Permission.GET_RECEIPTS,
      Permission.UPDATE_RECEIPT,
      Permission.DELETE_RECEIPT,
      Permission.CREATE_LOCATION,
      Permission.GET_LOCATIONS,
      Permission.DELETE_LOCATION,
      Permission.GET_GRIEVANCES,
      Permission.UPDATE_GRIEVANCE,
      Permission.ADD_GRIEVANCE_COMMENT,
      Permission.GET_MY_GRIEVANCES,
      Permission.GET_ID_CARDS,
      Permission.GET_FEES,
      Permission.GET_SETTINGS,
    ],
    [RoleName.EMPLOYEE]: [
      Permission.GET_SCHOOLS,
      Permission.GET_VENDORS,
      Permission.CREATE_VENDOR,
      Permission.EDIT_VENDOR,
      Permission.GET_REGIONS,
      Permission.CREATE_REGION,
      Permission.CREATE_SCHOOL,
      Permission.CREATE_GRIEVANCE,
      Permission.GET_MY_GRIEVANCES,
      Permission.ADD_GRIEVANCE_COMMENT,
    ],
    [RoleName.SCHOOL_ADMIN]: [
      Permission.CREATE_STUDENT,
      Permission.GET_STUDENTS,
      Permission.EDIT_STUDENT,
      Permission.DELETE_STUDENT,
      Permission.CREATE_TEACHER,
      Permission.GET_TEACHERS,
      Permission.EDIT_TEACHER,
      Permission.DELETE_TEACHER,
      Permission.CREATE_CLASSES,
      Permission.GET_CLASSES,
      Permission.EDIT_CLASSES,
      Permission.DELETE_CLASSES,
      Permission.CREATE_TRANSPORT,
      Permission.GET_TRANSPORTS,
      Permission.EDIT_TRANSPORT,
      Permission.DELETE_TRANSPORT,
      Permission.GET_MY_SCHOOL,
      Permission.CREATE_EVENT,
      Permission.GET_EVENTS,
      Permission.EDIT_EVENT,
      Permission.DELETE_EVENT,
      Permission.CREATE_HOLIDAY,
      Permission.GET_HOLIDAYS,
      Permission.EDIT_HOLIDAY,
      Permission.DELETE_HOLIDAY,
      Permission.CREATE_EXAM_CALENDAR,
      Permission.GET_EXAM_CALENDARS,
      Permission.EDIT_EXAM_CALENDAR,
      Permission.DELETE_EXAM_CALENDAR,
      Permission.CREATE_NOTICE,
      Permission.GET_NOTICES,
      Permission.EDIT_NOTICE,
      Permission.DELETE_NOTICE,
      Permission.CREATE_EXAM,
      Permission.GET_EXAMS,
      Permission.EDIT_EXAM,
      Permission.DELETE_EXAM,
      Permission.GET_CALENDAR,
      Permission.MANAGE_ID_CARD_CONFIG,
      Permission.GENERATE_ID_CARDS,
      Permission.GET_ID_CARDS,
      Permission.GET_SETTINGS,
      Permission.EDIT_SETTINGS,
      Permission.GET_FEES,
      Permission.RECORD_FEE_PAYMENT,
      Permission.CREATE_GRIEVANCE,
      Permission.GET_MY_GRIEVANCES,
      Permission.ADD_GRIEVANCE_COMMENT,
      Permission.GET_DASHBOARD_STATS,
    ],
    [RoleName.STUDENT]: [
      Permission.GET_MY_SCHOOL,
      Permission.GET_EVENTS,
      Permission.GET_HOLIDAYS,
      Permission.GET_EXAM_CALENDARS,
      Permission.GET_NOTICES,
      Permission.GET_EXAMS,
      Permission.GET_CALENDAR,
      Permission.GET_DASHBOARD_STATS,
    ],
    [RoleName.TEACHER]: [
      Permission.GET_STUDENTS,
      Permission.GET_CLASSES,
      Permission.GET_MY_SCHOOL,
      Permission.GET_EVENTS,
      Permission.GET_HOLIDAYS,
      Permission.GET_EXAM_CALENDARS,
      Permission.GET_NOTICES,
      Permission.GET_EXAMS,
      Permission.GET_CALENDAR,
      Permission.GET_DASHBOARD_STATS,
    ],
    [RoleName.STAFF]: [
      Permission.GET_MY_SCHOOL,
      Permission.GET_EVENTS,
      Permission.GET_HOLIDAYS,
      Permission.GET_EXAM_CALENDARS,
      Permission.GET_NOTICES,
      Permission.GET_EXAMS,
      Permission.GET_CALENDAR,
      Permission.GET_DASHBOARD_STATS,
    ],
  };

  for (const [roleName, permissions] of Object.entries(defaultRolePermissionsMap)) {
    const existingRole = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!existingRole) {
      const role = await prisma.role.create({
        data: {
          name: roleName,
          permissions: permissions,
          createdBy: "seed",
        },
      });
      seedData.roles[roleName] = role.id;
      logger.info(`Created role: ${roleName}`);
    } else {
      seedData.roles[roleName] = existingRole.id;
      logger.info(`Role already exists: ${roleName}`);
    }
  }
}

/**
 * Seed Regions and Locations
 */
async function seedRegionsAndLocations() {
  logger.info("Seeding Regions and Locations...");

  const regionsData = [
    { name: "North Region" },
    { name: "South Region" },
    { name: "East Region" },
    { name: "West Region" },
    { name: "Central Region" },
  ];

  for (const regionData of regionsData) {
    const existingRegion = await prisma.region.findFirst({
      where: { name: regionData.name, deletedAt: null },
    });

    let region;
    if (!existingRegion) {
      region = await prisma.region.create({
        data: {
          ...regionData,
          createdBy: "seed",
        },
      });
      logger.info(`Created region: ${regionData.name}`);
    } else {
      region = existingRegion;
      logger.info(`Region already exists: ${regionData.name}`);
    }

    seedData.regions.push(region.id);

    // Create 2-3 locations per region
    const locationCount = randomInt(2, 3);
    for (let i = 1; i <= locationCount; i++) {
      const location = await prisma.location.create({
        data: {
          name: `${regionData.name} - Location ${i}`,
          regionId: region.id,
          createdBy: "seed",
        },
      });
      seedData.locations.push(location.id);
      logger.info(`Created location: ${location.name}`);
    }
  }
}

/**
 * Seed Schools
 */
async function seedSchools() {
  logger.info("Seeding Schools...");

  const schoolsData = [
    {
      name: "Greenwood International School",
      code: "GIS001",
      email: "admin@greenwood.edu",
      phone: "+91-9876543210",
      address: ["123 Education Street", "Greenwood City", "State - 123456"],
      gstNumber: "29ABCDE1234F1Z5",
      principalName: "Dr. Sarah Johnson",
      principalEmail: "principal@greenwood.edu",
      principalPhone: "+91-9876543211",
      establishedYear: 1995,
      boardAffiliation: "CBSE",
      studentStrength: 1200,
    },
    {
      name: "Sunshine Public School",
      code: "SPS002",
      email: "admin@sunshine.edu",
      phone: "+91-9876543220",
      address: ["456 Learning Avenue", "Sunshine Town", "State - 123457"],
      gstNumber: "29FGHIJ5678K2L6",
      principalName: "Mr. Rajesh Kumar",
      principalEmail: "principal@sunshine.edu",
      principalPhone: "+91-9876543221",
      establishedYear: 2000,
      boardAffiliation: "ICSE",
      studentStrength: 800,
    },
    {
      name: "Bright Future Academy",
      code: "BFA003",
      email: "admin@brightfuture.edu",
      phone: "+91-9876543230",
      address: ["789 Knowledge Road", "Bright City", "State - 123458"],
      gstNumber: "29MNOPQ9012R3S7",
      principalName: "Mrs. Priya Sharma",
      principalEmail: "principal@brightfuture.edu",
      principalPhone: "+91-9876543231",
      establishedYear: 2010,
      boardAffiliation: "State Board",
      studentStrength: 600,
    },
  ];

  for (const schoolData of schoolsData) {
    const existingSchool = await prisma.school.findUnique({
      where: { code: schoolData.code },
    });

    let school;
    if (!existingSchool) {
      school = await prisma.school.create({
        data: {
          ...schoolData,
          createdBy: "seed",
        },
      });
      logger.info(`Created school: ${schoolData.name}`);
    } else {
      school = existingSchool;
      logger.info(`School already exists: ${schoolData.name}`);
    }

    seedData.schools.push(school.id);
  }
}

/**
 * Seed Classes and Subjects
 */
async function seedClassesAndSubjects() {
  logger.info("Seeding Classes and Subjects...");

  const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const divisions = ["A", "B", "C"];
  const commonSubjects = [
    "Mathematics",
    "English",
    "Science",
    "Social Studies",
    "Hindi",
    "Physical Education",
    "Art",
    "Music",
  ];

  for (const schoolId of seedData.schools) {
    seedData.classes[schoolId] = [];
    seedData.subjects[schoolId] = [];

    // Create subjects for the school
    for (const subjectName of commonSubjects) {
      const existingSubject = await prisma.subject.findFirst({
        where: {
          name: subjectName,
          schoolId: schoolId,
          deletedAt: null,
        },
      });

      if (!existingSubject) {
        const subject = await prisma.subject.create({
          data: {
            name: subjectName,
            schoolId: schoolId,
            createdBy: "seed",
          },
        });
        seedData.subjects[schoolId].push(subject.id);
      }
    }

    // Create classes for the school
    for (const grade of grades) {
      // Create 1-2 divisions per grade
      const divisionCount = grade <= "5" ? 1 : randomInt(1, 2);
      for (let i = 0; i < divisionCount; i++) {
        const division = divisions[i] || null;
        const existingClass = await prisma.class.findFirst({
          where: {
            grade: grade,
            division: division,
            schoolId: schoolId,
            deletedAt: null,
          },
        });

        if (!existingClass) {
          const classData = await prisma.class.create({
            data: {
              grade: grade,
              division: division,
              schoolId: schoolId,
              createdBy: "seed",
            },
          });
          seedData.classes[schoolId].push(classData.id);
        }
      }
    }

    logger.info(`Created classes and subjects for school: ${schoolId}`);
  }
}

/**
 * Seed Users
 */
async function seedUsers() {
  logger.info("Seeding Users...");

  // 1. Create Super Admin
  const superAdminRoleId = seedData.roles[RoleName.SUPER_ADMIN];
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { roleId: superAdminRoleId, deletedAt: null },
  });

  if (!existingSuperAdmin) {
    const superAdmin = await prisma.user.create({
      data: {
        publicUserId: "ADMIN001",
        userType: UserType.APP,
        email: "admin@schooliat.com",
        password: await hashPassword("Admin@123"),
        firstName: "Super",
        lastName: "Admin",
        contact: "+91-9999999999",
        gender: Gender.MALE,
        dateOfBirth: new Date("1980-01-01"),
        address: ["Admin Office", "SchooliAt Headquarters"],
        roleId: superAdminRoleId,
        createdBy: "seed",
      },
    });
    seedData.users.superAdmin = superAdmin.id;
    logger.info("Created Super Admin: admin@schooliat.com / Admin@123");
  } else {
    seedData.users.superAdmin = existingSuperAdmin.id;
    logger.info("Super Admin already exists");
  }

  // 2. Create Employees
  const employeeRoleId = seedData.roles[RoleName.EMPLOYEE];
  const employeeData = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@schooliat.com",
      contact: "+91-9876543001",
      gender: Gender.MALE,
      dateOfBirth: new Date("1990-05-15"),
      assignedRegionId: seedData.regions[0],
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@schooliat.com",
      contact: "+91-9876543002",
      gender: Gender.FEMALE,
      dateOfBirth: new Date("1992-08-20"),
      assignedRegionId: seedData.regions[1],
    },
    {
      firstName: "Mike",
      lastName: "Johnson",
      email: "mike.johnson@schooliat.com",
      contact: "+91-9876543003",
      gender: Gender.MALE,
      dateOfBirth: new Date("1988-03-10"),
      assignedRegionId: seedData.regions[2],
    },
  ];

  for (let i = 0; i < employeeData.length; i++) {
    const emp = employeeData[i];
    const existingEmployee = await prisma.user.findFirst({
      where: { email: emp.email, deletedAt: null },
    });

    if (!existingEmployee) {
      const employee = await prisma.user.create({
        data: {
          publicUserId: `APPE${String(i + 1).padStart(4, "0")}`,
          userType: UserType.APP,
          email: emp.email,
          password: await hashPassword("Employee@123"),
          firstName: emp.firstName,
          lastName: emp.lastName,
          contact: emp.contact,
          gender: emp.gender,
          dateOfBirth: emp.dateOfBirth,
          address: ["Employee Address", "City"],
          roleId: employeeRoleId,
          assignedRegionId: emp.assignedRegionId,
          createdBy: seedData.users.superAdmin || "seed",
        },
      });
      seedData.users.employees.push(employee.id);
      logger.info(`Created Employee: ${emp.email} / Employee@123`);
    }
  }

  // 3. Create School Admins, Teachers, Students, and Staff for each school
  const schoolAdminRoleId = seedData.roles[RoleName.SCHOOL_ADMIN];
  const teacherRoleId = seedData.roles[RoleName.TEACHER];
  const studentRoleId = seedData.roles[RoleName.STUDENT];
  const staffRoleId = seedData.roles[RoleName.STAFF];

  for (let schoolIndex = 0; schoolIndex < seedData.schools.length; schoolIndex++) {
    const schoolId = seedData.schools[schoolIndex];
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    seedData.users.schoolAdmins[schoolId] = null;
    seedData.users.teachers[schoolId] = [];
    seedData.users.students[schoolId] = [];

    // Create School Admin
    const schoolAdminEmail = `admin@${school.code.toLowerCase()}.edu`;
    const existingSchoolAdmin = await prisma.user.findFirst({
      where: { email: schoolAdminEmail, deletedAt: null },
    });

    if (!existingSchoolAdmin) {
      const schoolAdmin = await prisma.user.create({
        data: {
          publicUserId: `${school.code}A0001`,
          userType: UserType.SCHOOL,
          email: schoolAdminEmail,
          password: await hashPassword("Admin@123"),
          firstName: school.code,
          lastName: "Admin",
          contact: school.phone,
          gender: Gender.MALE,
          dateOfBirth: new Date("1985-01-01"),
          address: school.address,
          roleId: schoolAdminRoleId,
          schoolId: schoolId,
          createdBy: seedData.users.superAdmin || "seed",
        },
      });
      seedData.users.schoolAdmins[schoolId] = schoolAdmin.id;
      logger.info(`Created School Admin: ${schoolAdminEmail} / Admin@123`);
    } else {
      seedData.users.schoolAdmins[schoolId] = existingSchoolAdmin.id;
    }

    const schoolAdminId = seedData.users.schoolAdmins[schoolId];

    // Create Teachers (5-8 per school)
    const teacherCount = randomInt(5, 8);
    const teacherNames = [
      ["Rajesh", "Kumar"],
      ["Priya", "Sharma"],
      ["Amit", "Patel"],
      ["Sneha", "Singh"],
      ["Vikram", "Reddy"],
      ["Anjali", "Gupta"],
      ["Rahul", "Mehta"],
      ["Kavita", "Joshi"],
    ];

    for (let i = 0; i < teacherCount; i++) {
      const name = teacherNames[i % teacherNames.length];
      const teacherEmail = `teacher${i + 1}@${school.code.toLowerCase()}.edu`;
      const existingTeacher = await prisma.user.findFirst({
        where: { email: teacherEmail, deletedAt: null },
      });

      if (!existingTeacher) {
        const teacher = await prisma.user.create({
          data: {
            publicUserId: `${school.code}T${String(i + 1).padStart(4, "0")}`,
            userType: UserType.SCHOOL,
            email: teacherEmail,
            password: await hashPassword("Teacher@123"),
            firstName: name[0],
            lastName: name[1],
            contact: `+91-98765${String(40000 + schoolIndex * 100 + i).slice(-5)}`,
            gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
            dateOfBirth: randomDate(new Date("1980-01-01"), new Date("1995-01-01")),
            address: school.address,
            aadhaarId: `1234${String(567890 + schoolIndex * 1000 + i).padStart(6, "0")}`,
            roleId: teacherRoleId,
            schoolId: schoolId,
            createdBy: schoolAdminId || "seed",
            teacherProfile: {
              create: {
                designation: i === 0 ? "Senior Teacher" : "Teacher",
                highestQualification: ["B.Ed", "M.Ed", "M.Sc", "B.Sc"][i % 4],
                university: ["Delhi University", "Mumbai University", "Bangalore University"][i % 3],
                yearOfPassing: 2010 + (i % 10),
                grade: ["A+", "A", "B+", "B"][i % 4],
                panCardNumber: `ABCDE${String(1000 + schoolIndex * 100 + i).padStart(4, "0")}F`,
                bloodGroup: Object.values(BloodGroup)[i % Object.values(BloodGroup).length],
                createdBy: schoolAdminId || "seed",
              },
            },
          },
        });
        seedData.users.teachers[schoolId].push(teacher.id);
        logger.info(`Created Teacher: ${teacherEmail} / Teacher@123`);
      }
    }

    // Create Students (20-30 per school, distributed across classes)
    const studentCount = randomInt(20, 30);
    const studentNames = [
      ["Arjun", "Kumar"],
      ["Sita", "Sharma"],
      ["Krishna", "Patel"],
      ["Radha", "Singh"],
      ["Ravi", "Reddy"],
      ["Meera", "Gupta"],
      ["Sohan", "Mehta"],
      ["Lakshmi", "Joshi"],
      ["Vishal", "Verma"],
      ["Pooja", "Yadav"],
    ];

    const classIds = seedData.classes[schoolId] || [];
    let rollNumber = 1;

    for (let i = 0; i < studentCount; i++) {
      const name = studentNames[i % studentNames.length];
      const studentEmail = `student${i + 1}@${school.code.toLowerCase()}.edu`;
      const existingStudent = await prisma.user.findFirst({
        where: { email: studentEmail, deletedAt: null },
      });

      if (!existingStudent && classIds.length > 0) {
        const classId = classIds[i % classIds.length];
        const classData = await prisma.class.findUnique({ where: { id: classId } });
        const apaarId = `APAAR${school.code}${String(rollNumber).padStart(6, "0")}`;
        
        // Check if student profile with this apaar_id already exists
        const existingProfile = await prisma.studentProfile.findFirst({
          where: { apaarId: apaarId },
        });

        if (!existingProfile) {
          try {
            const student = await prisma.user.create({
              data: {
                publicUserId: `${school.code}S${String(rollNumber).padStart(4, "0")}`,
                userType: UserType.SCHOOL,
                email: studentEmail,
                password: await hashPassword("Student@123"),
                firstName: name[0],
                lastName: name[1],
                contact: `+91-98765${String(50000 + schoolIndex * 1000 + i).slice(-5)}`,
                gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
                dateOfBirth: randomDate(new Date("2010-01-01"), new Date("2015-01-01")),
                address: school.address,
                aadhaarId: `5678${String(901234 + schoolIndex * 10000 + i).padStart(6, "0")}`,
                roleId: studentRoleId,
                schoolId: schoolId,
                createdBy: schoolAdminId || "seed",
                studentProfile: {
                  create: {
                    rollNumber: rollNumber,
                    apaarId: apaarId,
                    classId: classId,
                    fatherName: `${name[0]}'s Father`,
                    motherName: `${name[0]}'s Mother`,
                    fatherContact: `+91-98765${String(60000 + schoolIndex * 1000 + i).slice(-5)}`,
                    motherContact: `+91-98765${String(70000 + schoolIndex * 1000 + i).slice(-5)}`,
                    fatherOccupation: ["Engineer", "Doctor", "Teacher", "Business"][i % 4],
                    annualIncome: randomInt(300000, 1500000),
                    accommodationType: i % 3 === 0 ? AccommodationType.HOSTELLER : AccommodationType.DAY_SCHOLAR,
                    bloodGroup: Object.values(BloodGroup)[i % Object.values(BloodGroup).length],
                    createdBy: schoolAdminId || "seed",
                  },
                },
              },
            });
            seedData.users.students[schoolId].push(student.id);
            logger.info(`Created Student: ${studentEmail} / Student@123`);
          } catch (error) {
            // Skip if student already exists (unique constraint)
            if (error.code === 'P2002') {
              logger.info(`Student with email ${studentEmail} or apaar_id ${apaarId} already exists, skipping...`);
            } else {
              throw error;
            }
          }
        } else {
          logger.info(`Student profile with apaar_id ${apaarId} already exists, skipping...`);
        }
        rollNumber++;
      }
    }

    // Create Staff (2-3 per school)
    const staffCount = randomInt(2, 3);
    for (let i = 0; i < staffCount; i++) {
      const staffEmail = `staff${i + 1}@${school.code.toLowerCase()}.edu`;
      const existingStaff = await prisma.user.findFirst({
        where: { email: staffEmail, deletedAt: null },
      });

      if (!existingStaff) {
        const staff = await prisma.user.create({
          data: {
            publicUserId: `${school.code}ST${String(i + 1).padStart(4, "0")}`,
            userType: UserType.SCHOOL,
            email: staffEmail,
            password: await hashPassword("Staff@123"),
            firstName: ["Ramesh", "Sunita", "Mohan"][i],
            lastName: ["Yadav", "Devi", "Sharma"][i],
            contact: `+91-98765${String(80000 + i).slice(-5)}`,
            gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
            dateOfBirth: randomDate(new Date("1985-01-01"), new Date("1995-01-01")),
            address: school.address,
            roleId: staffRoleId,
            schoolId: schoolId,
            createdBy: schoolAdminId || "seed",
          },
        });
        seedData.users.staff.push(staff.id);
        logger.info(`Created Staff: ${staffEmail} / Staff@123`);
      }
    }
  }
}

/**
 * Seed Transport Vehicles
 */
async function seedTransport() {
  logger.info("Seeding Transport Vehicles...");

  const transportTypes = [TransportType.BUS, TransportType.VAN, TransportType.CAR];
  const vehicleNumbers = ["KA01AB1234", "KA02CD5678", "KA03EF9012", "KA04GH3456", "KA05IJ7890"];

  for (let schoolIndex = 0; schoolIndex < seedData.schools.length; schoolIndex++) {
    const schoolId = seedData.schools[schoolIndex];
    seedData.transports[schoolId] = [];
    const transportCount = randomInt(2, 4);

    for (let i = 0; i < transportCount; i++) {
      const licenseNumber = `LIC${String(1000 + schoolIndex * 1000 + i).padStart(6, "0")}`;
      const existingTransport = await prisma.transport.findUnique({
        where: { licenseNumber: licenseNumber },
      });

      if (!existingTransport) {
        const transport = await prisma.transport.create({
          data: {
            type: transportTypes[i % transportTypes.length],
            licenseNumber: licenseNumber,
            vehicleNumber: vehicleNumbers[i % vehicleNumbers.length],
            schoolId: schoolId,
          ownerFirstName: ["Ramesh", "Suresh", "Mahesh"][i % 3],
          ownerLastName: "Kumar",
          driverFirstName: ["Rajesh", "Vijay", "Ajay"][i % 3],
          driverLastName: "Singh",
          driverDateOfBirth: randomDate(new Date("1980-01-01"), new Date("1990-01-01")),
          driverContact: `+91-98765${String(90000 + i).slice(-5)}`,
          driverGender: Gender.MALE,
          conductorFirstName: ["Sunil", "Anil", "Ramesh", "Kumar"][i % 4],
          conductorLastName: "Yadav",
          conductorDateOfBirth: randomDate(new Date("1985-01-01"), new Date("1995-01-01")),
          conductorContact: `+91-98765${String(91000 + i).slice(-5)}`,
          conductorGender: Gender.MALE,
          createdBy: seedData.users.schoolAdmins[schoolId] || "seed",
        },
      });
      seedData.transports[schoolId].push(transport.id);
      logger.info(`Created Transport: ${transport.vehicleNumber} for school ${schoolId}`);
      } else {
        seedData.transports[schoolId].push(existingTransport.id);
        logger.info(`Transport already exists: ${licenseNumber}`);
      }
    }
  }
}

/**
 * Seed Fees and Fee Installments
 */
async function seedFees() {
  logger.info("Seeding Fees and Fee Installments...");

  const currentYear = new Date().getFullYear();
  const installmentCount = 12;
  const baseFeeAmount = 50000; // Annual fee in paise (₹500.00)

  for (const schoolId of seedData.schools) {
    const students = seedData.users.students[schoolId] || [];
    const schoolAdminId = seedData.users.schoolAdmins[schoolId];

    for (const studentId of students) {
      // Create fee record
      const fee = await prisma.fee.create({
        data: {
          schoolId: schoolId,
          studentId: studentId,
          year: currentYear,
          totalAmount: baseFeeAmount,
          totalPaidAmount: 0,
          totalRemainingAmount: baseFeeAmount,
          createdBy: schoolAdminId || "seed",
        },
      });

      // Create fee installments
      const installmentAmount = Math.floor(baseFeeAmount / installmentCount);
      const remainder = baseFeeAmount % installmentCount;

      for (let i = 1; i <= installmentCount; i++) {
        const amount = i === installmentCount ? installmentAmount + remainder : installmentAmount;
        const paymentStatus =
          i <= 6 ? FeePaymentStatus.PAID : i <= 9 ? FeePaymentStatus.PARTIALLY_PAID : FeePaymentStatus.PENDING;

        await prisma.feeInstallements.create({
          data: {
            feeId: fee.id,
            schoolId: schoolId,
            studentId: studentId,
            installementNumber: i,
            paymentStatus: paymentStatus,
            amount: amount,
            remainingAmount: paymentStatus === FeePaymentStatus.PAID ? 0 : amount,
            paidAmount: paymentStatus === FeePaymentStatus.PAID ? amount : paymentStatus === FeePaymentStatus.PARTIALLY_PAID ? Math.floor(amount / 2) : 0,
            paidAt: paymentStatus === FeePaymentStatus.PAID ? randomDate(new Date(`${currentYear}-01-01`), new Date()) : null,
            createdBy: schoolAdminId || "seed",
          },
        });
      }

      logger.info(`Created fees for student: ${studentId}`);
    }
  }
}

/**
 * Seed Exams and Exam Calendars
 */
async function seedExams() {
  logger.info("Seeding Exams and Exam Calendars...");

  const currentYear = new Date().getFullYear();
  const examTypes = [ExamType.UNIT_TEST, ExamType.SEMESTER, ExamType.FINAL];
  const examNames = ["First Unit Test", "Second Unit Test", "First Semester", "Second Semester", "Annual Exam"];

  for (const schoolId of seedData.schools) {
    seedData.exams[schoolId] = [];

    // Create exams
    for (let i = 0; i < examNames.length; i++) {
      const exam = await prisma.exam.create({
        data: {
          schoolId: schoolId,
          year: currentYear,
          name: examNames[i],
          type: examTypes[i % examTypes.length],
        },
      });
      seedData.exams[schoolId].push(exam.id);
    }

    // Create exam calendars for each class
    const classIds = seedData.classes[schoolId] || [];
    const subjects = ["Mathematics", "English", "Science", "Social Studies", "Hindi"];

    for (const classId of classIds) {
      const examId = seedData.exams[schoolId][0]; // Use first exam
      const examCalendar = await prisma.examCalendar.create({
        data: {
          classId: classId,
          examId: examId,
          title: `Exam Calendar for ${examNames[0]}`,
          visibleFrom: new Date(`${currentYear}-01-01`),
          visibleTill: new Date(`${currentYear}-12-31`),
          schoolId: schoolId,
          createdBy: seedData.users.schoolAdmins[schoolId] || "seed",
        },
      });

      // Create exam calendar items
      for (let i = 0; i < subjects.length; i++) {
        await prisma.examCalendarItem.create({
          data: {
            examCalendarId: examCalendar.id,
            subject: subjects[i],
            date: randomDate(new Date(`${currentYear}-03-01`), new Date(`${currentYear}-03-31`)),
            createdBy: seedData.users.schoolAdmins[schoolId] || "seed",
          },
        });
      }

      logger.info(`Created exam calendar for class: ${classId}`);
    }
  }
}

/**
 * Seed Events, Holidays, and Notices
 */
async function seedCalendarItems() {
  logger.info("Seeding Events, Holidays, and Notices...");

  const currentYear = new Date().getFullYear();

  for (const schoolId of seedData.schools) {
    const schoolAdminId = seedData.users.schoolAdmins[schoolId];

    // Create Events
    const events = [
      {
        title: "Annual Sports Day",
        description: "School annual sports day with various competitions",
        dateType: DateType.SINGLE_DATE,
        from: new Date(`${currentYear}-02-15`),
        till: new Date(`${currentYear}-02-15`),
        visibleFrom: new Date(`${currentYear}-01-01`),
        visibleTill: new Date(`${currentYear}-02-20`),
      },
      {
        title: "Science Exhibition",
        description: "Students showcase their science projects",
        dateType: DateType.DATE_RANGE,
        from: new Date(`${currentYear}-03-10`),
        till: new Date(`${currentYear}-03-12`),
        visibleFrom: new Date(`${currentYear}-02-01`),
        visibleTill: new Date(`${currentYear}-03-15`),
      },
      {
        title: "Annual Day Celebration",
        description: "School annual day with cultural programs",
        dateType: DateType.SINGLE_DATE,
        from: new Date(`${currentYear}-12-20`),
        till: new Date(`${currentYear}-12-20`),
        visibleFrom: new Date(`${currentYear}-11-01`),
        visibleTill: new Date(`${currentYear}-12-25`),
      },
    ];

    for (const eventData of events) {
      await prisma.event.create({
        data: {
          ...eventData,
          schoolId: schoolId,
          createdBy: schoolAdminId || "seed",
        },
      });
    }

    // Create Holidays
    const holidays = [
      {
        title: "Republic Day",
        dateType: DateType.SINGLE_DATE,
        from: new Date(`${currentYear}-01-26`),
        till: new Date(`${currentYear}-01-26`),
        visibleFrom: new Date(`${currentYear}-01-01`),
        visibleTill: new Date(`${currentYear}-01-31`),
      },
      {
        title: "Summer Vacation",
        dateType: DateType.DATE_RANGE,
        from: new Date(`${currentYear}-05-15`),
        till: new Date(`${currentYear}-06-15`),
        visibleFrom: new Date(`${currentYear}-04-01`),
        visibleTill: new Date(`${currentYear}-06-20`),
      },
      {
        title: "Diwali Holidays",
        dateType: DateType.DATE_RANGE,
        from: new Date(`${currentYear}-11-10`),
        till: new Date(`${currentYear}-11-15`),
        visibleFrom: new Date(`${currentYear}-10-01`),
        visibleTill: new Date(`${currentYear}-11-20`),
      },
    ];

    for (const holidayData of holidays) {
      await prisma.holiday.create({
        data: {
          ...holidayData,
          schoolId: schoolId,
          createdBy: schoolAdminId || "seed",
        },
      });
    }

    // Create Notices
    const notices = [
      {
        title: "Parent-Teacher Meeting",
        content: "All parents are requested to attend the parent-teacher meeting scheduled for next week.",
        visibleFrom: new Date(`${currentYear}-01-01`),
        visibleTill: new Date(`${currentYear}-12-31`),
      },
      {
        title: "Fee Payment Reminder",
        content: "Please ensure all fee payments are completed by the end of this month.",
        visibleFrom: new Date(`${currentYear}-01-01`),
        visibleTill: new Date(`${currentYear}-12-31`),
      },
      {
        title: "Library Book Return",
        content: "Students are reminded to return library books before the end of the semester.",
        visibleFrom: new Date(`${currentYear}-01-01`),
        visibleTill: new Date(`${currentYear}-12-31`),
      },
    ];

    for (const noticeData of notices) {
      await prisma.notice.create({
        data: {
          ...noticeData,
          schoolId: schoolId,
          createdBy: schoolAdminId || "seed",
        },
      });
    }

    logger.info(`Created calendar items for school: ${schoolId}`);
  }
}

/**
 * Seed Receipts
 */
async function seedReceipts() {
  logger.info("Seeding Receipts...");

  for (const schoolId of seedData.schools) {
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    const schoolAdminId = seedData.users.schoolAdmins[schoolId];

    // Create 5-10 receipts per school
    const receiptCount = randomInt(5, 10);

    for (let i = 0; i < receiptCount; i++) {
      const receiptNumber = `REC${school.code}${String(i + 1).padStart(6, "0")}`;
      
      // Check if receipt already exists
      const existingReceipt = await prisma.receipt.findUnique({
        where: { receiptNumber: receiptNumber },
      });

      if (!existingReceipt) {
        const baseAmount = randomInt(10000, 100000); // ₹100 to ₹1000
        const sgstPercent = 9;
        const cgstPercent = 9;
        const sgstAmount = Math.floor((baseAmount * sgstPercent) / 100);
        const cgstAmount = Math.floor((baseAmount * cgstPercent) / 100);
        const totalGst = sgstAmount + cgstAmount;
        const amount = baseAmount + totalGst;

        try {
          const receipt = await prisma.receipt.create({
            data: {
              receiptNumber: receiptNumber,
              schoolId: schoolId,
              amount: amount,
              baseAmount: baseAmount,
              sgstPercent: sgstPercent,
              cgstPercent: cgstPercent,
              sgstAmount: sgstAmount,
              cgstAmount: cgstAmount,
              totalGst: totalGst,
              description: `Payment for services - Receipt ${i + 1}`,
              paymentMethod: Object.values(PaymentMethod)[i % Object.values(PaymentMethod).length],
              status: i < 7 ? ReceiptStatus.PAID : ReceiptStatus.PENDING,
              createdBy: schoolAdminId || "seed",
            },
          });

          logger.info(`Created receipt: ${receipt.receiptNumber}`);
        } catch (error) {
          // Skip if receipt already exists (unique constraint)
          if (error.code === 'P2002') {
            logger.info(`Receipt with number ${receiptNumber} already exists, skipping...`);
          } else {
            throw error;
          }
        }
      } else {
        logger.info(`Receipt with number ${receiptNumber} already exists, skipping...`);
      }
    }
  }
}

/**
 * Seed Licenses
 */
async function seedLicenses() {
  logger.info("Seeding Licenses...");

  const licensesData = [
    {
      name: "Educational License",
      issuer: "State Education Department",
      issueDate: new Date("2020-01-01"),
      expiryDate: new Date("2025-12-31"),
      certificateNumber: "EDU-LIC-2020-001",
      status: LicenseStatus.ACTIVE,
    },
    {
      name: "Fire Safety Certificate",
      issuer: "Fire Department",
      issueDate: new Date("2021-06-01"),
      expiryDate: new Date("2024-05-31"),
      certificateNumber: "FIRE-2021-002",
      status: LicenseStatus.EXPIRING_SOON,
    },
    {
      name: "Health License",
      issuer: "Health Department",
      issueDate: new Date("2019-01-01"),
      expiryDate: new Date("2023-12-31"),
      certificateNumber: "HLTH-2019-003",
      status: LicenseStatus.EXPIRED,
    },
  ];

  for (const licenseData of licensesData) {
    const existingLicense = await prisma.license.findUnique({
      where: { certificateNumber: licenseData.certificateNumber },
    });

    if (!existingLicense) {
      await prisma.license.create({
        data: {
          ...licenseData,
          createdBy: seedData.users.superAdmin || "seed",
        },
      });
      logger.info(`Created license: ${licenseData.name}`);
    }
  }
}

/**
 * Seed Vendors
 */
async function seedVendors() {
  logger.info("Seeding Vendors...");

  const vendorsData = [
    {
      name: "ABC Stationery Supplies",
      email: "contact@abcstationery.com",
      contact: "+91-9876544001",
      address: ["123 Supply Street", "City"],
      status: LeadStatus.CONVERTED,
      comments: "Regular supplier of stationery items",
      regionId: seedData.regions[0],
      employeeId: seedData.users.employees[0] || null,
    },
    {
      name: "XYZ Uniform Manufacturers",
      email: "info@xyzuniforms.com",
      contact: "+91-9876544002",
      address: ["456 Uniform Road", "City"],
      status: LeadStatus.HOT,
      comments: "Potential supplier for school uniforms",
      regionId: seedData.regions[1],
      employeeId: seedData.users.employees[1] || null,
    },
    {
      name: "Tech Solutions Pvt Ltd",
      email: "sales@techsolutions.com",
      contact: "+91-9876544003",
      address: ["789 Tech Avenue", "City"],
      status: LeadStatus.FOLLOW_UP,
      comments: "IT equipment supplier",
      regionId: seedData.regions[2],
      employeeId: seedData.users.employees[2] || null,
    },
  ];

  for (const vendorData of vendorsData) {
    const existingVendor = await prisma.vendor.findFirst({
      where: { name: vendorData.name, deletedAt: null },
    });

    if (!existingVendor) {
      await prisma.vendor.create({
        data: {
          ...vendorData,
          createdBy: seedData.users.superAdmin || "seed",
        },
      });
      logger.info(`Created vendor: ${vendorData.name}`);
    }
  }
}

/**
 * Seed Settings
 */
async function seedSettings() {
  logger.info("Seeding Settings...");

  for (const schoolId of seedData.schools) {
    const existingSettings = await prisma.settings.findFirst({
      where: { schoolId: schoolId, deletedAt: null },
    });

    if (!existingSettings) {
      await prisma.settings.create({
        data: {
          schoolId: schoolId,
          studentFeeInstallments: 12,
          studentFeeAmount: 50000, // ₹500.00 in paise
          currentInstallmentNumber: 6,
          createdBy: seedData.users.schoolAdmins[schoolId] || "seed",
        },
      });
      logger.info(`Created settings for school: ${schoolId}`);
    }
  }
}

/**
 * Seed Grievances
 */
async function seedGrievances() {
  logger.info("Seeding Grievances...");

  const grievancesData = [
    {
      title: "Internet Connectivity Issue",
      description: "Facing frequent internet disconnections affecting online classes",
      status: GrievanceStatus.OPEN,
      priority: GrievancePriority.HIGH,
      schoolId: seedData.schools[0],
      createdById: seedData.users.schoolAdmins[seedData.schools[0]] || seedData.users.superAdmin,
    },
    {
      title: "Request for Additional Staff",
      description: "Need additional teaching staff for mathematics department",
      status: GrievanceStatus.IN_PROGRESS,
      priority: GrievancePriority.MEDIUM,
      schoolId: seedData.schools[1],
      createdById: seedData.users.schoolAdmins[seedData.schools[1]] || seedData.users.superAdmin,
    },
    {
      title: "Software Update Required",
      description: "Requesting update to latest version of SchooliAt platform",
      status: GrievanceStatus.RESOLVED,
      priority: GrievancePriority.LOW,
      schoolId: null,
      createdById: seedData.users.employees[0] || seedData.users.superAdmin,
    },
  ];

  for (const grievanceData of grievancesData) {
    const grievance = await prisma.grievance.create({
      data: {
        title: grievanceData.title,
        description: grievanceData.description,
        status: grievanceData.status,
        priority: grievanceData.priority,
        createdById: grievanceData.createdById,
        schoolId: grievanceData.schoolId,
        resolvedById: grievanceData.status === GrievanceStatus.RESOLVED ? seedData.users.superAdmin : null,
        resolvedAt: grievanceData.status === GrievanceStatus.RESOLVED ? new Date() : null,
      },
    });

    // Add comments to some grievances
    if (grievanceData.status === GrievanceStatus.IN_PROGRESS) {
      await prisma.grievanceComment.create({
        data: {
          grievanceId: grievance.id,
          authorId: seedData.users.superAdmin || grievanceData.createdById,
          content: "We are looking into this matter and will update you soon.",
        },
      });
    }

    logger.info(`Created grievance: ${grievanceData.title}`);
  }
}

/**
 * Seed Salary Structures and Payments
 */
async function seedSalaries() {
  logger.info("Seeding Salary Structures and Payments...");

  for (const schoolId of seedData.schools) {
    const schoolAdminId = seedData.users.schoolAdmins[schoolId];
    const teachers = seedData.users.teachers[schoolId] || [];

    // Create salary structure
    const salaryStructure = await prisma.salaryStructure.create({
      data: {
        name: "Standard Teacher Salary",
        schoolId: schoolId,
        grossMonthlyAmount: 50000, // ₹50,000
        netMonthlyAmount: 40000, // ₹40,000
        createdBy: schoolAdminId || "seed",
      },
    });

    // Create salary structure components
    const components = [
      {
        name: "Basic Pay",
        type: SalaryComponentType.GROSS,
        value: 30000,
        valueType: SalaryComponentValueType.ABSOLUTE,
        frequency: SalaryComponentFrequency.MONTHLY,
        isBasePayComponent: true,
      },
      {
        name: "HRA",
        type: SalaryComponentType.GROSS,
        value: 40,
        valueType: SalaryComponentValueType.PERCENTAGE,
        frequency: SalaryComponentFrequency.MONTHLY,
        isBasePayComponent: false,
      },
      {
        name: "Transport Allowance",
        type: SalaryComponentType.GROSS,
        value: 5000,
        valueType: SalaryComponentValueType.ABSOLUTE,
        frequency: SalaryComponentFrequency.MONTHLY,
        isBasePayComponent: false,
      },
      {
        name: "Income Tax",
        type: SalaryComponentType.NET,
        value: 10,
        valueType: SalaryComponentValueType.PERCENTAGE,
        frequency: SalaryComponentFrequency.MONTHLY,
        isBasePayComponent: false,
      },
    ];

    for (const componentData of components) {
      await prisma.salaryStructureComponent.create({
        data: {
          ...componentData,
          salaryStructureId: salaryStructure.id,
          schoolId: schoolId,
          createdBy: schoolAdminId || "seed",
        },
      });
    }

    // Create salary records for teachers
    for (const teacherId of teachers.slice(0, 3)) {
      const salary = await prisma.salary.create({
        data: {
          schoolId: schoolId,
          userId: teacherId,
          salaryStructureId: salaryStructure.id,
          from: new Date(`${new Date().getFullYear()}-01-01`),
          till: new Date(`${new Date().getFullYear()}-12-31`),
          createdBy: schoolAdminId || "seed",
        },
      });

      // Create salary payments for last 3 months
      const currentMonth = new Date();
      for (let i = 0; i < 3; i++) {
        const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
        const monthString = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

        await prisma.salaryPayments.create({
          data: {
            schoolId: schoolId,
            userId: teacherId,
            month: monthString,
            totalAmount: 40000,
            componentAmounts: {
              basic: 30000,
              hra: 12000,
              transport: 5000,
              tax: 5000,
            },
            createdBy: schoolAdminId || "seed",
          },
        });
      }

      logger.info(`Created salary for teacher: ${teacherId}`);
    }
  }
}

/**
 * Main seed function
 */
async function main() {
  try {
    logger.info("Starting database seeding...");
    logger.info("=".repeat(60));

    await seedRoles();
    await seedRegionsAndLocations();
    await seedSchools();
    await seedClassesAndSubjects();
    await seedUsers();
    await seedTransport();
    await seedFees();
    await seedExams();
    await seedCalendarItems();
    await seedReceipts();
    await seedLicenses();
    await seedVendors();
    await seedSettings();
    await seedGrievances();
    await seedSalaries();

    logger.info("=".repeat(60));
    logger.info("Database seeding completed successfully!");
    logger.info("");
    logger.info("Default Login Credentials:");
    logger.info("Super Admin: admin@schooliat.com / Admin@123");
    logger.info("Employee: john.doe@schooliat.com / Employee@123");
    logger.info("School Admin: admin@gis001.edu / Admin@123");
    logger.info("Teacher: teacher1@gis001.edu / Teacher@123");
    logger.info("Student: student1@gis001.edu / Student@123");
    logger.info("Staff: staff1@gis001.edu / Staff@123");
  } catch (error) {
    logger.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

