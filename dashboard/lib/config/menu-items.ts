export interface MenuItem {
  name: string;
  icon: string; // Lucide icon name
  route: string;
  hasSubmenu?: boolean;
}

export interface SubMenuItem {
  name: string;
  route: string;
}

// Submenu items for Finance
export const FINANCE_SUBMENU: SubMenuItem[] = [
  { name: "Fees Management", route: "/admin/finance/fees" },
  { name: "Salary Distribution", route: "/admin/finance/salary" },
];

// Submenu items for Attendance
export const ATTENDANCE_SUBMENU: SubMenuItem[] = [
  { name: "Mark Attendance", route: "/admin/attendance" },
  { name: "Reports", route: "/admin/attendance/reports" },
];

// Submenu items for Leave
export const LEAVE_SUBMENU: SubMenuItem[] = [
  { name: "My Leaves", route: "/admin/leave" },
  { name: "Approvals", route: "/admin/leave/approvals" },
];

// Submenu items for Library
export const LIBRARY_SUBMENU: SubMenuItem[] = [
  { name: "Books", route: "/admin/library" },
  { name: "Operations", route: "/admin/library/operations" },
];

// Submenu items for Results
export const RESULTS_SUBMENU: SubMenuItem[] = [
  { name: "Results", route: "/admin/results" },
  { name: "Marks Entry", route: "/admin/marks/entry" },
];

// Submenu items for Students (if needed in future)
export const STUDENTS_SUBMENU: SubMenuItem[] = [
  { name: "All Students", route: "/admin/students" },
  { name: "Add Student", route: "/admin/students/add" },
  { name: "Transfer Certificates", route: "/admin/transfer-certificates" },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    name: "Dashboard",
    icon: "LayoutDashboard",
    route: "/admin/dashboard",
  },
  {
    name: "Classes",
    icon: "GraduationCap",
    route: "/admin/classes",
  },
  {
    name: "Teachers",
    icon: "Users",
    route: "/admin/teachers",
  },
  {
    name: "Students",
    icon: "UserCheck",
    route: "/admin/students",
  },
  {
    name: "Attendance",
    icon: "UserCheck",
    route: "/admin/attendance",
    hasSubmenu: true,
  },
  {
    name: "Homework",
    icon: "FileText",
    route: "/admin/homework",
  },
  {
    name: "Leave Management",
    icon: "Calendar",
    route: "/admin/leave",
    hasSubmenu: true,
  },
  {
    name: "Finance",
    icon: "DollarSign",
    route: "/admin/finance",
    hasSubmenu: true,
  },
  {
    name: "Calendar",
    icon: "Calendar",
    route: "/admin/calendar",
  },
  {
    name: "Time Table",
    icon: "CalendarDays",
    route: "/admin/timetable",
  },
  {
    name: "Transport",
    icon: "Bus",
    route: "/admin/transport",
  },
  {
    name: "Library",
    icon: "BookOpen",
    route: "/admin/library",
    hasSubmenu: true,
  },
  {
    name: "Notes & Syllabus",
    icon: "FileText",
    route: "/admin/notes",
  },
  {
    name: "Gallery",
    icon: "Image",
    route: "/admin/gallery",
  },
  {
    name: "Inventory",
    icon: "Package",
    route: "/admin/inventory",
  },
  {
    name: "Result Management",
    icon: "Award",
    route: "/admin/results",
    hasSubmenu: true,
  },
  {
    name: "ID Cards",
    icon: "CreditCard",
    route: "/admin/id-cards",
  },
  {
    name: "Circular/Notice",
    icon: "FileText",
    route: "/admin/circulars",
  },
  {
    name: "Reports & Analytics",
    icon: "BarChart3",
    route: "/admin/reports",
  },
  {
    name: "Settings",
    icon: "ShieldCheck",
    route: "/admin/settings",
  },
  {
    name: "Help",
    icon: "Info",
    route: "/admin/help",
  },
  {
    name: "Contact Schooliat",
    icon: "MessageCircle",
    route: "/admin/contact-schooliat",
  },
];

export const SUPER_ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    name: "Dashboard",
    icon: "LayoutDashboard",
    route: "/super-admin/dashboard",
  },
  {
    name: "Schools",
    icon: "School",
    route: "/super-admin/schools",
  },
  {
    name: "Receipts",
    icon: "Receipt",
    route: "/super-admin/receipts",
  },
  {
    name: "Licenses",
    icon: "ShieldCheck",
    route: "/super-admin/licenses",
  },
  {
    name: "Statistics",
    icon: "BarChart3",
    route: "/super-admin/statistics",
  },
  {
    name: "Employees",
    icon: "Users",
    route: "/super-admin/employees",
  },
  {
    name: "Vendors",
    icon: "Store",
    route: "/super-admin/vendors",
  },
  {
    name: "Master Data",
    icon: "Database",
    route: "/super-admin/master-data",
    hasSubmenu: true,
  },
  {
    name: "Templates",
    icon: "FileText",
    route: "/super-admin/templates",
  },
  {
    name: "Audit Logs",
    icon: "ScrollText",
    route: "/super-admin/audit-logs",
  },
  {
    name: "System Health",
    icon: "Activity",
    route: "/super-admin/system-health",
  },
  {
    name: "About Us",
    icon: "Info",
    route: "/super-admin/about-us",
  },
  {
    name: "Letter Head",
    icon: "FileText",
    route: "/super-admin/letter-head",
  },
  {
    name: "Grievances",
    icon: "MessageSquare",
    route: "/super-admin/grievances",
  },
  {
    name: "Reports & Analytics",
    icon: "BarChart3",
    route: "/super-admin/reports",
  },
  {
    name: "Settings",
    icon: "ShieldCheck",
    route: "/super-admin/settings",
  },
  {
    name: "Help",
    icon: "Info",
    route: "/super-admin/help",
  },
];

// Submenu items for Master Data
export const MASTER_DATA_SUBMENU: SubMenuItem[] = [
  { name: "Regions", route: "/super-admin/master-data/regions" },
  { name: "Locations", route: "/super-admin/master-data/locations" },
];

