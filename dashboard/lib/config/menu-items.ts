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
    name: "Register Schools",
    icon: "School",
    route: "/super-admin/schools/register",
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
];

