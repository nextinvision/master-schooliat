import {
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/api/client";

// Statistics
export function useSchoolStatistics(search?: string) {
  return useQuery({
    queryKey: ["schoolStatistics", search],
    queryFn: () =>
      get("/statistics/schools", search ? { search } : {}),
    staleTime: 30 * 1000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => get("/statistics/dashboard"),
    staleTime: 30 * 1000,
  });
}

// Schools
export function useSchools(search?: string) {
  return useQuery({
    queryKey: ["schools", search],
    queryFn: () => get("/schools", search ? { search } : {}),
    staleTime: 30 * 1000,
  });
}

export function useSchool(id: string) {
  return useQuery({
    queryKey: ["school", id],
    queryFn: async () => {
      // Get school from list and find by ID
      const response = await get("/schools");
      const schools = response?.data || [];
      return schools.find((s: School) => s.id === id) || null;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: CreateSchoolData) =>
      post("/schools", { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["schoolStatistics"] });
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...formData }: { id: string } & Partial<CreateSchoolData>) =>
      patch(`/schools/${id}`, { request: formData }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      queryClient.invalidateQueries({ queryKey: ["school", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["schoolStatistics"] });
    },
  });
}

export function useDeleteSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/schools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["schoolStatistics"] });
    },
  });
}

// Employees
export function useEmployees(search?: string) {
  return useQuery({
    queryKey: ["employees", search],
    queryFn: () =>
      get("/users/employees", search ? { search } : {}),
    staleTime: 30 * 1000,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => get(`/users/employees/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: CreateEmployeeData) =>
      post("/users/employees", { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

// Receipts
export function useReceipts(schoolId?: string, status?: string) {
  return useQuery({
    queryKey: ["receipts", schoolId, status],
    queryFn: () => get("/receipts", { schoolId, status }),
    staleTime: 30 * 1000,
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: CreateReceiptData) =>
      post("/receipts", { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
    },
  });
}

export function useGenerateReceipt() {
  return useMutation({
    mutationFn: (receiptId: string) =>
      post(`/receipts/${receiptId}/generate`),
  });
}

export function useReceipt(id: string) {
  return useQuery({
    queryKey: ["receipt", id],
    queryFn: () => get(`/receipts/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...formData }: { id: string } & Partial<CreateReceiptData & { amount?: number }>) =>
      patch(`/receipts/${id}`, { request: formData }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["receipt", variables.id] });
    },
  });
}

// Licenses
export function useLicenses() {
  return useQuery({
    queryKey: ["licenses"],
    queryFn: () => get("/licenses"),
    staleTime: 30 * 1000,
  });
}

export function useCreateLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: CreateLicenseData) =>
      post("/licenses", { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
  });
}

// Regions
export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: () => get("/regions"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: { name: string }) =>
      post("/regions", { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });
}

// Vendors
export function useVendorStats() {
  return useQuery({
    queryKey: ["vendorStats"],
    queryFn: () => get("/vendors/stats"),
    staleTime: 30 * 1000,
  });
}

export function useVendors(params?: { status?: string; search?: string; employeeId?: string }) {
  return useQuery({
    queryKey: ["vendors", params],
    queryFn: () => get("/vendors", params),
    staleTime: 30 * 1000,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: CreateVendorData) =>
      post("/vendors", { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendorStats"] });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...formData }: { id: string } & Partial<CreateVendorData & { status?: string }>) =>
      patch(`/vendors/${id}`, { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendorStats"] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendorStats"] });
    },
  });
}

// Letterhead
export function useGenerateLetterhead() {
  return useMutation({
    mutationFn: (formData: GenerateLetterheadData) =>
      post("/letterhead/generate", { request: formData }),
  });
}

// Types
export interface School {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string[];
  status?: string;
  createdAt: string;
  userCount?: number;
  gstNumber?: string;
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  establishedYear?: number;
  boardAffiliation?: string;
  studentStrength?: number;
  certificateLink?: string;
  regionId?: string;
}

export interface CreateSchoolData {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string[];
  gstNumber?: string;
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  establishedYear?: string;
  boardAffiliation?: string;
  studentStrength?: string;
  certificateLink?: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assignedRegionId?: string;
  assignedRegion?: Region;
  totalLocations?: number;
  totalVendors?: number;
  status: string;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  contact?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  address?: string[];
  aadhaarId?: string;
  assignedRegionId?: string;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  schoolId: string;
  school?: School;
  amount: number;
  status: string;
  description?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface CreateReceiptData {
  schoolId: string;
  baseAmount: number;
  description?: string;
  paymentMethod?: string;
  sgstPercent?: number | null;
  cgstPercent?: number | null;
  igstPercent?: number | null;
  ugstPercent?: number | null;
}

export interface License {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
  certificateNumber: string;
  documentUrl?: string;
}

export interface CreateLicenseData {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  certificateNumber: string;
  documentId?: string;
}

export interface Region {
  id: string;
  name: string;
}

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  contact: string;
  address: string[];
  comments?: string;
  status: "NEW" | "HOT" | "COLD" | "FOLLOW_UP" | "CONVERTED";
  regionId: string;
  region?: Region;
  employeeId?: string;
}

export interface CreateVendorData {
  name: string;
  email?: string;
  contact: string;
  address: string[];
  comments?: string;
  regionId: string;
  employeeId?: string;
}

export interface VendorStats {
  total: number;
  new: number;
  hot: number;
  cold: number;
  followUp: number;
  converted: number;
}

export interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalEmployees: number;
  recentSchools: School[];
}

export interface SchoolStatistics {
  schools: Array<{
    id: string;
    name: string;
    code: string;
    totalStudents: number;
    totalStaff: number;
    teachers: number;
    adminStaff: number;
    status: string;
  }>;
  totals: {
    totalStudents: number;
    totalStaff: number;
    totalTeachers: number;
    totalAdminStaff: number;
  };
}

export interface GenerateLetterheadData {
  content: string;
  subject?: string | null;
  date: string;
  signatureName?: string | null;
  signatureDesignation?: string | null;
}

// Locations
export function useLocations(params?: { employeeId?: string; regionId?: string }) {
  return useQuery({
    queryKey: ["locations", params],
    queryFn: () => get("/locations", params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: CreateLocationData) =>
      post("/locations", { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...formData }: { id: string } & Partial<CreateLocationData>) =>
      patch(`/locations/${id}`, { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });
}

export function useUpdateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...formData }: { id: string } & Partial<{ name: string }>) =>
      patch(`/regions/${id}`, { request: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });
}

export function useDeleteRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/regions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });
}

// Templates
export function useTemplates(type?: string) {
  return useQuery({
    queryKey: ["templates", type],
    queryFn: () => get("/templates", type ? { type } : {}),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTemplateDefaults(templateId: string) {
  return useQuery({
    queryKey: ["templateDefaults", templateId],
    queryFn: () => get(`/templates/${templateId}/default`),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
}

// Audit Logs
export function useAuditLogs(params?: {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["auditLogs", params],
    queryFn: async () => {
      // Filter out empty values to avoid sending empty query params
      const cleanParams: Record<string, any> = {};
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            cleanParams[key] = value;
          }
        });
      }
      return get("/audit", cleanParams);
    },
    staleTime: 30 * 1000,
  });
}

// System Health
export function useSystemHealth() {
  return useQuery({
    queryKey: ["systemHealth"],
    queryFn: () => get("/health"),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10 * 1000,
  });
}

// Types
export interface Location {
  id: string;
  name: string;
  regionId: string;
  region?: Region;
  employeeId?: string;
  employee?: Employee;
  createdAt: string;
}

export interface CreateLocationData {
  name: string;
  regionId: string;
  employeeId: string;
}

export interface Template {
  id: string;
  name: string;
  type: string;
  description?: string;
  imageId?: string;
  imageUrl?: string;
  sampleId?: string;
  sampleUrl?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  action: string;
  entityType: string;
  entityId?: string;
  result: "SUCCESS" | "FAILURE";
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
  errorMessage?: string;
  timestamp: string; // Backend uses 'timestamp' not 'createdAt'
}
