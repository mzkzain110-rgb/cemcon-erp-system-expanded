/**
 * Compenia ERP - Google Sheets Database Schema Definitions
 * Covers all 54 production tabs specified in Compenia ERP architecture.
 * Specifies column names, data types, required fields, foreign-key relationships,
 * uniqueness rules, and allowed statuses.
 */

export interface ColumnDefinition {
  name: string;
  type: 'uuid' | 'string' | 'number' | 'decimal' | 'boolean' | 'date-iso' | 'json';
  required: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  foreignKey?: {
    targetTab: string;
    targetColumn: string;
  };
  allowedValues?: string[];
  description?: string;
}

export interface TabSchema {
  tabName: string;
  description: string;
  category: 'core' | 'hr' | 'crm_projects' | 'procurement' | 'inventory' | 'accounting' | 'banking' | 'governance' | 'system';
  columns: ColumnDefinition[];
}

export const ERP_TAB_SCHEMAS: Record<string, TabSchema> = {
  // 1. Core & Multi-Tenant
  Tenants: {
    tabName: 'Tenants',
    description: 'Top-level multi-tenant isolation unit',
    category: 'core',
    columns: [
      { name: 'tenant_id', type: 'uuid', required: true, primaryKey: true, unique: true },
      { name: 'tenant_code', type: 'string', required: true, unique: true },
      { name: 'tenant_name', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'] },
      { name: 'created_at', type: 'date-iso', required: true },
      { name: 'updated_at', type: 'date-iso', required: true },
    ]
  },
  Companies: {
    tabName: 'Companies',
    description: 'Legal operating entities within a tenant',
    category: 'core',
    columns: [
      { name: 'company_id', type: 'uuid', required: true, primaryKey: true, unique: true },
      { name: 'tenant_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Tenants', targetColumn: 'tenant_id' } },
      { name: 'company_code', type: 'string', required: true, unique: true },
      { name: 'company_name', type: 'string', required: true },
      { name: 'legal_type', type: 'string', required: true, allowedValues: ['LLC', 'FZE', 'BRANCH', 'CORP'] },
      { name: 'currency', type: 'string', required: true },
      { name: 'country', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'INACTIVE'] },
      { name: 'created_at', type: 'date-iso', required: true },
      { name: 'updated_at', type: 'date-iso', required: true },
    ]
  },
  Users: {
    tabName: 'Users',
    description: 'System user accounts',
    category: 'core',
    columns: [
      { name: 'user_id', type: 'uuid', required: true, primaryKey: true, unique: true },
      { name: 'tenant_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Tenants', targetColumn: 'tenant_id' } },
      { name: 'email', type: 'string', required: true, unique: true },
      { name: 'full_name', type: 'string', required: true },
      { name: 'is_tenant_admin', type: 'boolean', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'INVITED', 'DEACTIVATED'] },
      { name: 'created_at', type: 'date-iso', required: true },
      { name: 'updated_at', type: 'date-iso', required: true },
    ]
  },
  UserCompanies: {
    tabName: 'UserCompanies',
    description: 'User access grants to specific companies within tenant',
    category: 'core',
    columns: [
      { name: 'user_company_id', type: 'uuid', required: true, primaryKey: true, unique: true },
      { name: 'tenant_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Tenants', targetColumn: 'tenant_id' } },
      { name: 'user_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Users', targetColumn: 'user_id' } },
      { name: 'company_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Companies', targetColumn: 'company_id' } },
      { name: 'role_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Roles', targetColumn: 'role_id' } },
      { name: 'is_default', type: 'boolean', required: true },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  Roles: {
    tabName: 'Roles',
    description: 'Role-based access control roles',
    category: 'core',
    columns: [
      { name: 'role_id', type: 'uuid', required: true, primaryKey: true, unique: true },
      { name: 'tenant_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Tenants', targetColumn: 'tenant_id' } },
      { name: 'role_code', type: 'string', required: true },
      { name: 'role_name', type: 'string', required: true },
      { name: 'description', type: 'string', required: false },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  Permissions: {
    tabName: 'Permissions',
    description: 'System-wide atomic permissions',
    category: 'core',
    columns: [
      { name: 'permission_id', type: 'uuid', required: true, primaryKey: true, unique: true },
      { name: 'permission_code', type: 'string', required: true, unique: true },
      { name: 'module', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
    ]
  },
  RolePermissions: {
    tabName: 'RolePermissions',
    description: 'Mapping of roles to atomic permissions',
    category: 'core',
    columns: [
      { name: 'role_permission_id', type: 'uuid', required: true, primaryKey: true, unique: true },
      { name: 'role_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Roles', targetColumn: 'role_id' } },
      { name: 'permission_code', type: 'string', required: true, foreignKey: { targetTab: 'Permissions', targetColumn: 'permission_code' } },
    ]
  },

  // 2. HR & Workforce
  Departments: {
    tabName: 'Departments',
    description: 'Company organizational departments',
    category: 'hr',
    columns: [
      { name: 'department_id', type: 'uuid', required: true, primaryKey: true, unique: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'code', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'INACTIVE'] },
    ]
  },
  Employees: {
    tabName: 'Employees',
    description: 'Employee personnel master data',
    category: 'hr',
    columns: [
      { name: 'employee_id', type: 'uuid', required: true, primaryKey: true, unique: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'employee_no', type: 'string', required: true, unique: true },
      { name: 'full_name', type: 'string', required: true },
      { name: 'designation', type: 'string', required: true },
      { name: 'department_id', type: 'uuid', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'phone', type: 'string', required: false },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'PROBATION', 'TERMINATED'] },
      { name: 'joining_date', type: 'date-iso', required: true },
      { name: 'cancellation_date', type: 'date-iso', required: false },
      { name: 'passport_no', type: 'string', required: false },
      { name: 'passport_issue_date', type: 'date-iso', required: false },
      { name: 'passport_expiry_date', type: 'date-iso', required: false },
      { name: 'passport_country', type: 'string', required: false },
      { name: 'passport_place_of_issue', type: 'string', required: false },
      { name: 'nationality', type: 'string', required: false },
      { name: 'profile_photo', type: 'string', required: false },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  EmployeeDocuments: {
    tabName: 'EmployeeDocuments',
    description: 'Passports, Visas, Emirates IDs and expiry tracking',
    category: 'hr',
    columns: [
      { name: 'doc_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'employee_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Employees', targetColumn: 'employee_id' } },
      { name: 'doc_type', type: 'string', required: true, allowedValues: ['PASSPORT', 'VISA', 'EMIRATES_ID', 'LABOR_CARD', 'INSURANCE'] },
      { name: 'doc_number', type: 'string', required: true },
      { name: 'issue_date', type: 'date-iso', required: true },
      { name: 'expiry_date', type: 'date-iso', required: true },
      { name: 'file_url', type: 'string', required: false },
      { name: 'status', type: 'string', required: true, allowedValues: ['VALID', 'EXPIRING_SOON', 'EXPIRED'] },
    ]
  },
  Attendance: {
    tabName: 'Attendance',
    description: 'Daily workforce attendance logs (P=Present 8h, A=Absent 0h, V=Vacation, Trade & OT)',
    category: 'hr',
    columns: [
      { name: 'attendance_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'employee_id', type: 'uuid', required: true },
      { name: 'date', type: 'date-iso', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['P', 'A', 'V', 'PRESENT', 'ABSENT', 'VACATION', 'LATE', 'HALF_DAY'] },
      { name: 'code', type: 'string', required: false },
      { name: 'trade', type: 'string', required: false },
      { name: 'shift_hours', type: 'number', required: false },
      { name: 'ot_hours', type: 'number', required: false },
      { name: 'check_in', type: 'string', required: false },
      { name: 'check_out', type: 'string', required: false },
      { name: 'notes', type: 'string', required: false },
    ]
  },
  LeaveRequests: {
    tabName: 'LeaveRequests',
    description: 'Employee leave and vacation workflow',
    category: 'hr',
    columns: [
      { name: 'leave_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'employee_id', type: 'uuid', required: true },
      { name: 'leave_type', type: 'string', required: true, allowedValues: ['ANNUAL', 'SICK', 'EMERGENCY', 'UNPAID'] },
      { name: 'start_date', type: 'date-iso', required: true },
      { name: 'end_date', type: 'date-iso', required: true },
      { name: 'days_count', type: 'number', required: true },
      { name: 'reason', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] },
      { name: 'approved_by', type: 'uuid', required: false },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  Timesheets: {
    tabName: 'Timesheets',
    description: 'Job-specific time logging for labour costing',
    category: 'hr',
    columns: [
      { name: 'timesheet_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'employee_id', type: 'uuid', required: true },
      { name: 'job_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Jobs', targetColumn: 'job_id' } },
      { name: 'date', type: 'date-iso', required: true },
      { name: 'hours_spent', type: 'decimal', required: true },
      { name: 'task_description', type: 'string', required: true },
      { name: 'billable', type: 'boolean', required: true },
    ]
  },
  OvertimeRequests: {
    tabName: 'OvertimeRequests',
    description: 'Overtime authorization and hours verification',
    category: 'hr',
    columns: [
      { name: 'overtime_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'employee_id', type: 'uuid', required: true },
      { name: 'job_id', type: 'uuid', required: false },
      { name: 'date', type: 'date-iso', required: true },
      { name: 'hours', type: 'decimal', required: true },
      { name: 'multiplier', type: 'decimal', required: true },
      { name: 'reason', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['PENDING', 'APPROVED', 'REJECTED'] },
    ]
  },
  InsurancePolicies: {
    tabName: 'InsurancePolicies',
    description: 'Corporate medical, workmen compensation, unemployment and fleet insurance policies',
    category: 'hr',
    columns: [
      { name: 'policy_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'policy_type', type: 'string', required: true, allowedValues: ['MEDICAL', 'WORKMEN_COMP', 'UNEMPLOYMENT', 'FLEET'] },
      { name: 'provider_name', type: 'string', required: true },
      { name: 'policy_number', type: 'string', required: true },
      { name: 'start_date', type: 'date-iso', required: true },
      { name: 'end_date', type: 'date-iso', required: true },
      { name: 'coverage_summary', type: 'string', required: true },
      { name: 'total_premium', type: 'decimal', required: false },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] },
    ]
  },
  Vehicles: {
    tabName: 'Vehicles',
    description: 'Company fleet vehicles, registration, driver and insurance assignments',
    category: 'hr',
    columns: [
      { name: 'vehicle_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'plate_number', type: 'string', required: true },
      { name: 'make_model', type: 'string', required: true },
      { name: 'year', type: 'number', required: true },
      { name: 'vehicle_type', type: 'string', required: true },
      { name: 'driver_name', type: 'string', required: false },
      { name: 'assigned_driver_id', type: 'uuid', required: false },
      { name: 'registration_expiry', type: 'date-iso', required: true },
      { name: 'insurance_company', type: 'string', required: true },
      { name: 'insurance_expiry_date', type: 'date-iso', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'MAINTENANCE', 'RETIRED'] },
    ]
  },
  VehicleFines: {
    tabName: 'VehicleFines',
    description: 'Traffic violation fines tracking and payroll deductions',
    category: 'hr',
    columns: [
      { name: 'fine_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'vehicle_id', type: 'uuid', required: true },
      { name: 'plate_number', type: 'string', required: true },
      { name: 'fine_number', type: 'string', required: true },
      { name: 'date', type: 'date-iso', required: true },
      { name: 'amount', type: 'decimal', required: true },
      { name: 'location', type: 'string', required: true },
      { name: 'reason', type: 'string', required: true },
      { name: 'driver_name', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['UNPAID', 'PAID', 'DEDUCTED'] },
    ]
  },
  VehicleMaintenance: {
    tabName: 'VehicleMaintenance',
    description: 'Service, repair, and inspection logs for company fleet',
    category: 'hr',
    columns: [
      { name: 'maintenance_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'vehicle_id', type: 'uuid', required: true },
      { name: 'plate_number', type: 'string', required: true },
      { name: 'service_type', type: 'string', required: true },
      { name: 'date', type: 'date-iso', required: true },
      { name: 'cost', type: 'decimal', required: true },
      { name: 'odometer_km', type: 'number', required: true },
      { name: 'garage_vendor', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['SCHEDULED', 'COMPLETED'] },
    ]
  },
  RecruitmentRequests: {
    tabName: 'RecruitmentRequests',
    description: 'Manpower requisitions from departments to HR',
    category: 'hr',
    columns: [
      { name: 'request_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'department_id', type: 'uuid', required: true },
      { name: 'department_name', type: 'string', required: true },
      { name: 'designation_requested', type: 'string', required: true },
      { name: 'quantity', type: 'number', required: true },
      { name: 'job_type', type: 'string', required: true, allowedValues: ['FULL_TIME', 'CONTRACT', 'TEMPORARY'] },
      { name: 'required_by_date', type: 'date-iso', required: true },
      { name: 'justification', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'FULFILLED'] },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  Candidates: {
    tabName: 'Candidates',
    description: 'Candidate applications, pre-interview info, interview evaluation and joining',
    category: 'hr',
    columns: [
      { name: 'candidate_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'request_id', type: 'uuid', required: false },
      { name: 'full_name', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'phone', type: 'string', required: true },
      { name: 'designation', type: 'string', required: true },
      { name: 'experience_years', type: 'number', required: true },
      { name: 'expected_salary', type: 'decimal', required: true },
      { name: 'notice_period', type: 'string', required: true },
      { name: 'interview_status', type: 'string', required: true, allowedValues: ['APPLIED', 'SCREENED', 'INTERVIEW_SCHEDULED', 'EVALUATED', 'OFFERED', 'HIRED', 'REJECTED'] },
      { name: 'evaluation_score', type: 'number', required: false },
      { name: 'interview_notes', type: 'string', required: false },
      { name: 'joining_date', type: 'date-iso', required: false },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  ClearanceForms: {
    tabName: 'ClearanceForms',
    description: 'Employee resignation, clearance sign-offs and offboarding workflow',
    category: 'hr',
    columns: [
      { name: 'clearance_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'employee_id', type: 'uuid', required: true },
      { name: 'employee_name', type: 'string', required: true },
      { name: 'designation', type: 'string', required: true },
      { name: 'department_name', type: 'string', required: true },
      { name: 'resignation_date', type: 'date-iso', required: true },
      { name: 'last_working_day', type: 'date-iso', required: true },
      { name: 'reason', type: 'string', required: true },
      { name: 'it_cleared', type: 'boolean', required: true },
      { name: 'accounts_cleared', type: 'boolean', required: true },
      { name: 'store_cleared', type: 'boolean', required: true },
      { name: 'admin_cleared', type: 'boolean', required: true },
      { name: 'hr_cleared', type: 'boolean', required: true },
      { name: 'handover_notes', type: 'string', required: false },
      { name: 'status', type: 'string', required: true, allowedValues: ['IN_PROGRESS', 'COMPLETED'] },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },

  // 3. CRM, Projects & Job Numbering
  Customers: {
    tabName: 'Customers',
    description: 'Clients, contractors and commercial buyers',
    category: 'crm_projects',
    columns: [
      { name: 'customer_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'customer_code', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'trn_vat_number', type: 'string', required: false },
      { name: 'contact_person', type: 'string', required: false },
      { name: 'email', type: 'string', required: true },
      { name: 'phone', type: 'string', required: false },
      { name: 'credit_limit', type: 'decimal', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'HOLD', 'INACTIVE'] },
    ]
  },
  Suppliers: {
    tabName: 'Suppliers',
    description: 'Vendors, raw material fabricators, and sub-contractors',
    category: 'procurement',
    columns: [
      { name: 'supplier_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'supplier_code', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'trn_vat_number', type: 'string', required: false },
      { name: 'email', type: 'string', required: true },
      { name: 'phone', type: 'string', required: false },
      { name: 'payment_terms_days', type: 'number', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'BLOCKED'] },
    ]
  },
  Leads: {
    tabName: 'Leads',
    description: 'Tenders and sales inquiry pipeline',
    category: 'crm_projects',
    columns: [
      { name: 'lead_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'client_name', type: 'string', required: true },
      { name: 'estimated_value', type: 'decimal', required: true },
      { name: 'stage', type: 'string', required: true, allowedValues: ['NEW', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'] },
    ]
  },
  Quotations: {
    tabName: 'Quotations',
    description: 'Formal commercial bids submitted to customers',
    category: 'crm_projects',
    columns: [
      { name: 'quotation_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'quotation_no', type: 'string', required: true },
      { name: 'customer_id', type: 'uuid', required: true },
      { name: 'total_amount', type: 'decimal', required: true },
      { name: 'vat_amount', type: 'decimal', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] },
      { name: 'issue_date', type: 'date-iso', required: true },
      { name: 'valid_until', type: 'date-iso', required: true },
    ]
  },
  Projects: {
    tabName: 'Projects',
    description: 'Top-level contract projects',
    category: 'crm_projects',
    columns: [
      { name: 'project_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'project_code', type: 'string', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'customer_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Customers', targetColumn: 'customer_id' } },
      { name: 'contract_value', type: 'decimal', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD'] },
      { name: 'start_date', type: 'date-iso', required: true },
      { name: 'end_date', type: 'date-iso', required: false },
    ]
  },
  ProjectBudgets: {
    tabName: 'ProjectBudgets',
    description: 'Budget allocations per project',
    category: 'crm_projects',
    columns: [
      { name: 'budget_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'project_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Projects', targetColumn: 'project_id' } },
      { name: 'cost_center', type: 'string', required: true },
      { name: 'budgeted_amount', type: 'decimal', required: true },
      { name: 'actual_amount', type: 'decimal', required: true },
    ]
  },
  Jobs: {
    tabName: 'Jobs',
    description: 'Controlled Job Orders with company-specific sequential numbering',
    category: 'crm_projects',
    columns: [
      { name: 'job_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'job_number', type: 'string', required: true, unique: true }, // e.g. 0011, 0046, 0022
      { name: 'sequence_val', type: 'number', required: true },
      { name: 'project_id', type: 'uuid', required: false, foreignKey: { targetTab: 'Projects', targetColumn: 'project_id' } },
      { name: 'customer_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Customers', targetColumn: 'customer_id' } },
      { name: 'title', type: 'string', required: true },
      { name: 'scope_description', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['OPEN', 'IN_PROGRESS', 'QUALITY_CHECK', 'COMPLETED', 'CANCELLED'] },
      { name: 'target_completion', type: 'date-iso', required: false },
      { name: 'client_name', type: 'string', required: false },
      { name: 'location', type: 'string', required: false },
      { name: 'deadline', type: 'string', required: false },
      { name: 'priority', type: 'string', required: false, allowedValues: ['Normal', 'Urgent', 'Critical', 'NORMAL', 'URGENT', 'CRITICAL'] },
      { name: 'materials_json', type: 'string', required: false },
      { name: 'manpower_json', type: 'string', required: false },
      { name: 'equipment_json', type: 'string', required: false },
      { name: 'overheads_estimate', type: 'decimal', required: false },
      { name: 'total_estimated_cost', type: 'decimal', required: false },
      { name: 'prepared_by', type: 'string', required: false },
      { name: 'approved_by', type: 'string', required: false },
      { name: 'received_by', type: 'string', required: false },
      { name: 'created_by', type: 'uuid', required: true },
      { name: 'created_at', type: 'date-iso', required: true },
      { name: 'updated_at', type: 'date-iso', required: true },
    ]
  },
  JobCards: {
    tabName: 'JobCards',
    description: 'Shop floor traveler cards and fabrication routing',
    category: 'crm_projects',
    columns: [
      { name: 'job_card_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'job_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Jobs', targetColumn: 'job_id' } },
      { name: 'card_no', type: 'string', required: true },
      { name: 'work_station', type: 'string', required: true },
      { name: 'assigned_to_employee_id', type: 'uuid', required: false },
      { name: 'status', type: 'string', required: true, allowedValues: ['PENDING', 'RUNNING', 'PASSED', 'REWORK'] },
    ]
  },
  JobEstimations: {
    tabName: 'JobEstimations',
    description: 'Detailed multi-category job cost estimations with labour manhours, material, subcontract, and misc expenses',
    category: 'crm_projects',
    columns: [
      { name: 'estimation_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'estimation_no', type: 'string', required: true, unique: true },
      { name: 'job_id', type: 'uuid', required: false },
      { name: 'job_number', type: 'string', required: true },
      { name: 'project_name', type: 'string', required: true },
      { name: 'client_name', type: 'string', required: true },
      { name: 'location', type: 'string', required: false },
      { name: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REVISED', 'REJECTED'] },
      { name: 'revision', type: 'string', required: true },
      { name: 'estimation_date', type: 'date-iso', required: true },
      { name: 'valid_until', type: 'date-iso', required: false },
      // Cost summary & pricing
      { name: 'currency', type: 'string', required: true },
      { name: 'contract_target_price', type: 'decimal', required: false },
      { name: 'total_job_cost', type: 'decimal', required: true },
      { name: 'markup_margin_percent', type: 'decimal', required: false },
      { name: 'selling_price', type: 'decimal', required: false },
      { name: 'estimated_gross_profit', type: 'decimal', required: false },
      // Labour manhours manpower cost
      { name: 'total_manhours', type: 'decimal', required: true },
      { name: 'total_labour_cost', type: 'decimal', required: true },
      { name: 'labour_breakdown_json', type: 'string', required: true },
      // Material cost
      { name: 'total_material_cost', type: 'decimal', required: true },
      { name: 'materials_breakdown_json', type: 'string', required: true },
      // Sub contractor expenses
      { name: 'total_subcontract_cost', type: 'decimal', required: true },
      { name: 'subcontract_breakdown_json', type: 'string', required: true },
      // Misc expenses
      { name: 'total_misc_cost', type: 'decimal', required: true },
      { name: 'misc_breakdown_json', type: 'string', required: true },
      // Signatures & metadata
      { name: 'prepared_by', type: 'string', required: true },
      { name: 'reviewed_by', type: 'string', required: false },
      { name: 'approved_by', type: 'string', required: false },
      { name: 'notes', type: 'string', required: false },
      { name: 'created_at', type: 'date-iso', required: true },
      { name: 'updated_at', type: 'date-iso', required: true },
    ]
  },
  DeliveryNotes: {
    tabName: 'DeliveryNotes',
    description: 'Material delivery notes linked to sales invoices and client job orders',
    category: 'inventory',
    columns: [
      { name: 'delivery_note_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'dn_number', type: 'string', required: true, unique: true },
      { name: 'job_id', type: 'uuid', required: false },
      { name: 'customer_id', type: 'uuid', required: true },
      { name: 'customer_name', type: 'string', required: true },
      { name: 'delivery_date', type: 'date-iso', required: true },
      { name: 'vehicle_number', type: 'string', required: true },
      { name: 'driver_name', type: 'string', required: true },
      { name: 'site_location', type: 'string', required: true },
      { name: 'items_json', type: 'string', required: true },
      { name: 'receiver_name', type: 'string', required: false },
      { name: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'DISPATCHED', 'DELIVERED', 'CANCELLED'] },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },

  // 4. Procurement
  PurchaseRequests: {
    tabName: 'PurchaseRequests',
    description: 'Material and service requisitions requiring approval',
    category: 'procurement',
    columns: [
      { name: 'pr_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'pr_no', type: 'string', required: true, unique: true },
      { name: 'title', type: 'string', required: false },
      { name: 'requested_by', type: 'string', required: true },
      { name: 'job_id', type: 'uuid', required: false },
      { name: 'job_number', type: 'string', required: false },
      { name: 'priority', type: 'string', required: false, allowedValues: ['NORMAL', 'URGENT', 'CRITICAL'] },
      { name: 'required_by_date', type: 'date-iso', required: false },
      { name: 'estimated_amount', type: 'decimal', required: false },
      { name: 'items_json', type: 'string', required: false },
      { name: 'justification', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ORDERED'] },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  RFQs: {
    tabName: 'RFQs',
    description: 'Requests for Quotations issued to suppliers',
    category: 'procurement',
    columns: [
      { name: 'rfq_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'rfq_no', type: 'string', required: true },
      { name: 'title', type: 'string', required: false },
      { name: 'pr_id', type: 'uuid', required: false },
      { name: 'items_json', type: 'string', required: false },
      { name: 'deadline', type: 'date-iso', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['OPEN', 'CLOSED', 'AWARDED'] },
      { name: 'created_at', type: 'date-iso', required: false },
    ]
  },
  SupplierQuotations: {
    tabName: 'SupplierQuotations',
    description: 'Bids received from suppliers for comparison',
    category: 'procurement',
    columns: [
      { name: 'supplier_quotation_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'rfq_id', type: 'uuid', required: true },
      { name: 'supplier_id', type: 'uuid', required: true },
      { name: 'supplier_name', type: 'string', required: false },
      { name: 'quote_reference', type: 'string', required: false },
      { name: 'total_quoted', type: 'decimal', required: true },
      { name: 'delivery_lead_days', type: 'number', required: true },
      { name: 'payment_terms', type: 'string', required: false },
      { name: 'compliance_status', type: 'string', required: false },
      { name: 'items_json', type: 'string', required: false },
      { name: 'selected', type: 'boolean', required: true },
      { name: 'created_at', type: 'date-iso', required: false },
    ]
  },
  PurchaseOrders: {
    tabName: 'PurchaseOrders',
    description: 'Approved PO contracts sent to suppliers',
    category: 'procurement',
    columns: [
      { name: 'po_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'po_number', type: 'string', required: true, unique: true },
      { name: 'supplier_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Suppliers', targetColumn: 'supplier_id' } },
      { name: 'job_id', type: 'uuid', required: false, foreignKey: { targetTab: 'Jobs', targetColumn: 'job_id' } },
      { name: 'order_date', type: 'date-iso', required: true },
      { name: 'expected_delivery', type: 'date-iso', required: true },
      { name: 'subtotal', type: 'decimal', required: true },
      { name: 'vat_amount', type: 'decimal', required: true },
      { name: 'total_amount', type: 'decimal', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'PARTIAL', 'RECEIVED', 'CANCELLED'] },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  PurchaseOrderItems: {
    tabName: 'PurchaseOrderItems',
    description: 'Individual line items on purchase orders',
    category: 'procurement',
    columns: [
      { name: 'po_item_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'po_id', type: 'uuid', required: true, foreignKey: { targetTab: 'PurchaseOrders', targetColumn: 'po_id' } },
      { name: 'item_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Items', targetColumn: 'item_id' } },
      { name: 'quantity', type: 'decimal', required: true },
      { name: 'unit_price', type: 'decimal', required: true },
      { name: 'line_total', type: 'decimal', required: true },
      { name: 'received_qty', type: 'decimal', required: true },
    ]
  },

  // 5. Inventory & Warehousing
  Items: {
    tabName: 'Items',
    description: 'Material master catalog, equipment, parts and consumables',
    category: 'inventory',
    columns: [
      { name: 'item_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'item_code', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'category', type: 'string', required: true, allowedValues: ['RAW_STEEL', 'FASTENERS', 'PIPING', 'ELECTRICAL', 'CONSUMABLES', 'TOOLS'] },
      { name: 'unit_of_measure', type: 'string', required: true, allowedValues: ['PCS', 'KG', 'MTR', 'LTR', 'SET'] },
      { name: 'min_stock_level', type: 'decimal', required: true },
      { name: 'reorder_point', type: 'decimal', required: true },
      { name: 'standard_cost', type: 'decimal', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['ACTIVE', 'OBSOLETE'] },
    ]
  },
  Warehouses: {
    tabName: 'Warehouses',
    description: 'Storage yards, fabrication plants and tool cribs',
    category: 'inventory',
    columns: [
      { name: 'warehouse_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'code', type: 'string', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'location', type: 'string', required: true },
      { name: 'is_active', type: 'boolean', required: true },
    ]
  },
  GoodsReceipts: {
    tabName: 'GoodsReceipts',
    description: 'GRN inspection and warehouse intake',
    category: 'inventory',
    columns: [
      { name: 'grn_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'grn_number', type: 'string', required: true, unique: true },
      { name: 'po_id', type: 'uuid', required: false, foreignKey: { targetTab: 'PurchaseOrders', targetColumn: 'po_id' } },
      { name: 'po_number', type: 'string', required: false },
      { name: 'supplier_id', type: 'uuid', required: false },
      { name: 'supplier_name', type: 'string', required: false },
      { name: 'vendor_delivery_note_no', type: 'string', required: false },
      { name: 'warehouse_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Warehouses', targetColumn: 'warehouse_id' } },
      { name: 'items_json', type: 'string', required: false },
      { name: 'total_value', type: 'decimal', required: false },
      { name: 'vehicle_number', type: 'string', required: false },
      { name: 'inspected_by', type: 'string', required: false },
      { name: 'mtc_number', type: 'string', required: false },
      { name: 'receipt_date', type: 'date-iso', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['INSPECTED', 'ACCEPTED', 'REJECTED'] },
    ]
  },
  StockIssues: {
    tabName: 'StockIssues',
    description: 'Material requisitions issued directly to production jobs',
    category: 'inventory',
    columns: [
      { name: 'issue_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'issue_number', type: 'string', required: true, unique: true },
      { name: 'job_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Jobs', targetColumn: 'job_id' } },
      { name: 'warehouse_id', type: 'uuid', required: true },
      { name: 'issued_date', type: 'date-iso', required: true },
    ]
  },
  InventoryTransactions: {
    tabName: 'InventoryTransactions',
    description: 'Immutable ledger of every physical stock movement. On-hand is projected from this.',
    category: 'inventory',
    columns: [
      { name: 'transaction_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'item_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Items', targetColumn: 'item_id' } },
      { name: 'warehouse_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Warehouses', targetColumn: 'warehouse_id' } },
      { name: 'transaction_type', type: 'string', required: true, allowedValues: ['PURCHASE_RECEIPT', 'JOB_ISSUE', 'SCRAP', 'RETURN', 'ADJUSTMENT'] },
      { name: 'quantity', type: 'decimal', required: true }, // positive for receipt, negative for issue
      { name: 'unit_cost', type: 'decimal', required: true },
      { name: 'total_cost', type: 'decimal', required: true },
      { name: 'reference_type', type: 'string', required: true }, // 'GRN', 'JOB', 'STOCK_COUNT'
      { name: 'reference_id', type: 'string', required: true },
      { name: 'timestamp', type: 'date-iso', required: true },
      { name: 'created_by', type: 'uuid', required: true },
    ]
  },

  // 6. Accounting & General Ledger
  Accounts: {
    tabName: 'Accounts',
    description: 'Chart of accounts according to standard financial classification',
    category: 'accounting',
    columns: [
      { name: 'account_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'account_code', type: 'string', required: true },
      { name: 'account_name', type: 'string', required: true },
      { name: 'account_type', type: 'string', required: true, allowedValues: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] },
      { name: 'normal_balance', type: 'string', required: true, allowedValues: ['DEBIT', 'CREDIT'] },
      { name: 'is_active', type: 'boolean', required: true },
    ]
  },
  FiscalYears: {
    tabName: 'FiscalYears',
    description: 'Statutory accounting years',
    category: 'accounting',
    columns: [
      { name: 'fiscal_year_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'year_name', type: 'string', required: true },
      { name: 'start_date', type: 'date-iso', required: true },
      { name: 'end_date', type: 'date-iso', required: true },
      { name: 'is_closed', type: 'boolean', required: true },
    ]
  },
  AccountingPeriods: {
    tabName: 'AccountingPeriods',
    description: 'Monthly sub-periods for ledger closing',
    category: 'accounting',
    columns: [
      { name: 'period_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'fiscal_year_id', type: 'uuid', required: true },
      { name: 'period_number', type: 'number', required: true },
      { name: 'period_name', type: 'string', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['OPEN', 'CLOSED', 'LOCKED'] },
    ]
  },
  JournalEntries: {
    tabName: 'JournalEntries',
    description: 'Double-entry balanced transaction header. Cannot be deleted once posted.',
    category: 'accounting',
    columns: [
      { name: 'journal_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'entry_number', type: 'string', required: true, unique: true },
      { name: 'idempotency_key', type: 'string', required: true, unique: true }, // Prevents duplicate posting on network retry
      { name: 'entry_date', type: 'date-iso', required: true },
      { name: 'memo', type: 'string', required: true },
      { name: 'total_debit', type: 'decimal', required: true },
      { name: 'total_credit', type: 'decimal', required: true },
      { name: 'is_balanced', type: 'boolean', required: true },
      { name: 'voucher_type', type: 'string', required: false, allowedValues: ['JV', 'PV', 'RV', 'EV', 'AV'] },
      { name: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'POSTED', 'REVERSED'] },
      { name: 'reversal_of_id', type: 'uuid', required: false },
      { name: 'created_by', type: 'uuid', required: true },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  JournalLines: {
    tabName: 'JournalLines',
    description: 'Individual debits and credits of a balanced journal',
    category: 'accounting',
    columns: [
      { name: 'line_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'journal_id', type: 'uuid', required: true, foreignKey: { targetTab: 'JournalEntries', targetColumn: 'journal_id' } },
      { name: 'account_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Accounts', targetColumn: 'account_id' } },
      { name: 'debit', type: 'decimal', required: true },
      { name: 'credit', type: 'decimal', required: true },
      { name: 'line_memo', type: 'string', required: false },
      { name: 'job_id', type: 'uuid', required: false },
    ]
  },
  SalesInvoices: {
    tabName: 'SalesInvoices',
    description: 'Tax sales invoices billed to customers',
    category: 'accounting',
    columns: [
      { name: 'invoice_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'invoice_number', type: 'string', required: true, unique: true },
      { name: 'customer_id', type: 'uuid', required: true },
      { name: 'job_id', type: 'uuid', required: false },
      { name: 'issue_date', type: 'date-iso', required: true },
      { name: 'due_date', type: 'date-iso', required: true },
      { name: 'subtotal', type: 'decimal', required: true },
      { name: 'tax_amount', type: 'decimal', required: true },
      { name: 'total_amount', type: 'decimal', required: true },
      { name: 'paid_amount', type: 'decimal', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'POSTED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'] },
    ]
  },
  PurchaseInvoices: {
    tabName: 'PurchaseInvoices',
    description: 'Bills and payable invoices received from suppliers',
    category: 'accounting',
    columns: [
      { name: 'purchase_invoice_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'bill_number', type: 'string', required: true },
      { name: 'supplier_id', type: 'uuid', required: true },
      { name: 'po_id', type: 'uuid', required: false },
      { name: 'bill_date', type: 'date-iso', required: true },
      { name: 'due_date', type: 'date-iso', required: true },
      { name: 'subtotal', type: 'decimal', required: true },
      { name: 'tax_amount', type: 'decimal', required: true },
      { name: 'total_amount', type: 'decimal', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['PENDING', 'APPROVED', 'PAID', 'DISPUTED'] },
    ]
  },
  Receipts: {
    tabName: 'Receipts',
    description: 'Cash / Bank / Cheque customer collections',
    category: 'accounting',
    columns: [
      { name: 'receipt_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'receipt_number', type: 'string', required: true, unique: true },
      { name: 'customer_id', type: 'uuid', required: true },
      { name: 'amount', type: 'decimal', required: true },
      { name: 'payment_method', type: 'string', required: true, allowedValues: ['BANK_TRANSFER', 'CHEQUE', 'PDC', 'CASH'] },
      { name: 'received_date', type: 'date-iso', required: true },
      { name: 'reference', type: 'string', required: false },
    ]
  },
  Payments: {
    tabName: 'Payments',
    description: 'Disbursements to vendors and operational expenses',
    category: 'accounting',
    columns: [
      { name: 'payment_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'payment_number', type: 'string', required: true, unique: true },
      { name: 'supplier_id', type: 'uuid', required: false },
      { name: 'amount', type: 'decimal', required: true },
      { name: 'payment_method', type: 'string', required: true, allowedValues: ['BANK_TRANSFER', 'CHEQUE', 'PDC', 'CASH'] },
      { name: 'payment_date', type: 'date-iso', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['PENDING', 'EXECUTED', 'CANCELLED'] },
    ]
  },
  PaymentAllocations: {
    tabName: 'PaymentAllocations',
    description: 'Settlement link between payments/receipts and specific invoices',
    category: 'accounting',
    columns: [
      { name: 'allocation_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'payment_or_receipt_id', type: 'uuid', required: true },
      { name: 'invoice_id', type: 'uuid', required: true },
      { name: 'amount_settled', type: 'decimal', required: true },
      { name: 'allocation_date', type: 'date-iso', required: true },
    ]
  },
  Expenses: {
    tabName: 'Expenses',
    description: 'Employee petty cash and operational expense claims',
    category: 'accounting',
    columns: [
      { name: 'expense_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'expense_number', type: 'string', required: true },
      { name: 'claimant_employee_id', type: 'uuid', required: true },
      { name: 'category', type: 'string', required: true, allowedValues: ['TRAVEL', 'SITE_SUPPLIES', 'MEALS', 'FUEL', 'UTILITIES'] },
      { name: 'amount', type: 'decimal', required: true },
      { name: 'vat_amount', type: 'decimal', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REIMBURSED', 'REJECTED'] },
      { name: 'claim_date', type: 'date-iso', required: true },
    ]
  },

  // 7. Banking & Post-Dated Cheques
  BankAccounts: {
    tabName: 'BankAccounts',
    description: 'Corporate bank accounts with UAE IBANs',
    category: 'banking',
    columns: [
      { name: 'bank_account_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'bank_name', type: 'string', required: true },
      { name: 'account_number', type: 'string', required: true },
      { name: 'iban', type: 'string', required: true },
      { name: 'currency', type: 'string', required: true },
      { name: 'gl_account_id', type: 'uuid', required: true },
    ]
  },
  BankTransactions: {
    tabName: 'BankTransactions',
    description: 'Bank statement line feed for reconciliation',
    category: 'banking',
    columns: [
      { name: 'bank_tx_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'bank_account_id', type: 'uuid', required: true },
      { name: 'statement_date', type: 'date-iso', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'amount', type: 'decimal', required: true },
      { name: 'is_reconciled', type: 'boolean', required: true },
    ]
  },
  BankReconciliations: {
    tabName: 'BankReconciliations',
    description: 'Monthly bank reconciliation sign-offs',
    category: 'banking',
    columns: [
      { name: 'rec_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'bank_account_id', type: 'uuid', required: true },
      { name: 'statement_balance', type: 'decimal', required: true },
      { name: 'gl_balance', type: 'decimal', required: true },
      { name: 'variance', type: 'decimal', required: true },
      { name: 'reconciled_date', type: 'date-iso', required: true },
      { name: 'reconciled_by', type: 'uuid', required: true },
    ]
  },
  PDCRegister: {
    tabName: 'PDCRegister',
    description: 'Post-dated cheque register for receivable and payable maturities',
    category: 'banking',
    columns: [
      { name: 'pdc_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'type', type: 'string', required: true, allowedValues: ['RECEIVABLE', 'PAYABLE'] },
      { name: 'cheque_number', type: 'string', required: true },
      { name: 'bank_name', type: 'string', required: true },
      { name: 'party_name', type: 'string', required: true },
      { name: 'amount', type: 'decimal', required: true },
      { name: 'cheque_date', type: 'date-iso', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['IN_SAFE', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'RETURNED'] },
      { name: 'reminder_alert_days', type: 'number', required: true },
    ]
  },

  // 8. Documents & Governance
  Documents: {
    tabName: 'Documents',
    description: 'Contracts, trade licenses, engineering drawings with Google Drive URLs',
    category: 'governance',
    columns: [
      { name: 'document_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'category', type: 'string', required: true, allowedValues: ['TRADE_LICENSE', 'ESTABLISHMENT_CARD', 'TAX_CERTIFICATE', 'CONTRACT', 'DRAWING'] },
      { name: 'google_drive_file_id', type: 'string', required: false },
      { name: 'google_drive_url', type: 'string', required: false },
      { name: 'expiry_date', type: 'date-iso', required: false },
      { name: 'uploaded_by', type: 'uuid', required: true },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  DocumentLinks: {
    tabName: 'DocumentLinks',
    description: 'Polymorphic association between uploaded documents and ERP records',
    category: 'governance',
    columns: [
      { name: 'link_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'document_id', type: 'uuid', required: true, foreignKey: { targetTab: 'Documents', targetColumn: 'document_id' } },
      { name: 'entity_type', type: 'string', required: true }, // 'JOB', 'PO', 'EMPLOYEE', 'COMPANY'
      { name: 'entity_id', type: 'uuid', required: true },
    ]
  },
  ApprovalWorkflows: {
    tabName: 'ApprovalWorkflows',
    description: 'Approval pipeline templates per entity',
    category: 'governance',
    columns: [
      { name: 'workflow_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'module', type: 'string', required: true, allowedValues: ['PURCHASE_ORDER', 'PURCHASE_REQUEST', 'LEAVE', 'OVERTIME', 'EXPENSE', 'PAYMENT'] },
      { name: 'threshold_amount', type: 'decimal', required: false },
      { name: 'is_active', type: 'boolean', required: true },
    ]
  },
  ApprovalSteps: {
    tabName: 'ApprovalSteps',
    description: 'Sequential steps inside an approval workflow',
    category: 'governance',
    columns: [
      { name: 'step_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'workflow_id', type: 'uuid', required: true, foreignKey: { targetTab: 'ApprovalWorkflows', targetColumn: 'workflow_id' } },
      { name: 'step_order', type: 'number', required: true },
      { name: 'required_role_code', type: 'string', required: true },
    ]
  },
  ApprovalRequests: {
    tabName: 'ApprovalRequests',
    description: 'Active approval tickets awaiting manager decisions',
    category: 'governance',
    columns: [
      { name: 'request_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'module', type: 'string', required: true },
      { name: 'record_id', type: 'uuid', required: true },
      { name: 'record_reference', type: 'string', required: true },
      { name: 'requested_by', type: 'uuid', required: true },
      { name: 'current_step', type: 'number', required: true },
      { name: 'status', type: 'string', required: true, allowedValues: ['PENDING', 'APPROVED', 'REJECTED'] },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  ApprovalActions: {
    tabName: 'ApprovalActions',
    description: 'Audited log of approvals, rejections and comments',
    category: 'governance',
    columns: [
      { name: 'action_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'request_id', type: 'uuid', required: true, foreignKey: { targetTab: 'ApprovalRequests', targetColumn: 'request_id' } },
      { name: 'action_by_user_id', type: 'uuid', required: true },
      { name: 'action', type: 'string', required: true, allowedValues: ['APPROVE', 'REJECT'] },
      { name: 'comments', type: 'string', required: true },
      { name: 'action_timestamp', type: 'date-iso', required: true },
    ]
  },
  Notifications: {
    tabName: 'Notifications',
    description: 'System alerts dispatched to users',
    category: 'governance',
    columns: [
      { name: 'notification_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'user_id', type: 'uuid', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'message', type: 'string', required: true },
      { name: 'priority', type: 'string', required: true, allowedValues: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      { name: 'is_read', type: 'boolean', required: true },
      { name: 'created_at', type: 'date-iso', required: true },
    ]
  },
  ReminderRules: {
    tabName: 'ReminderRules',
    description: 'Scheduled trigger definitions for expiring documents, PDCs, low stock',
    category: 'governance',
    columns: [
      { name: 'rule_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'rule_name', type: 'string', required: true },
      { name: 'event_trigger', type: 'string', required: true, allowedValues: ['DOC_EXPIRY', 'PDC_MATURITY', 'LOW_STOCK', 'OVERDUE_INVOICE'] },
      { name: 'days_in_advance', type: 'number', required: true },
      { name: 'is_active', type: 'boolean', required: true },
    ]
  },
  AuditLogs: {
    tabName: 'AuditLogs',
    description: 'Append-only audit trail. Logs every mutation with user, tenant, company, before/after values.',
    category: 'governance',
    columns: [
      { name: 'audit_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'user_id', type: 'uuid', required: true },
      { name: 'user_email', type: 'string', required: true },
      { name: 'action', type: 'string', required: true },
      { name: 'entity_name', type: 'string', required: true },
      { name: 'record_id', type: 'string', required: true },
      { name: 'before_values', type: 'json', required: false },
      { name: 'after_values', type: 'json', required: false },
      { name: 'ip_address', type: 'string', required: false },
      { name: 'timestamp', type: 'date-iso', required: true },
    ]
  },
  ReportDefinitions: {
    tabName: 'ReportDefinitions',
    description: 'Saved financial, project and inventory report queries',
    category: 'system',
    columns: [
      { name: 'report_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'title', type: 'string', required: true },
      { name: 'report_type', type: 'string', required: true, allowedValues: ['TRIAL_BALANCE', 'P_AND_L', 'JOB_COSTING', 'STOCK_VALUATION'] },
      { name: 'parameters_json', type: 'json', required: true },
    ]
  },
  AIQueries: {
    tabName: 'AIQueries',
    description: 'Natural language report history and analytical queries',
    category: 'system',
    columns: [
      { name: 'query_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'user_id', type: 'uuid', required: true },
      { name: 'query_text', type: 'string', required: true },
      { name: 'response_summary', type: 'string', required: true },
      { name: 'timestamp', type: 'date-iso', required: true },
    ]
  },
  Settings: {
    tabName: 'Settings',
    description: 'Company-specific configuration, Google Sheets sync settings, and environment toggles',
    category: 'system',
    columns: [
      { name: 'setting_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true },
      { name: 'key', type: 'string', required: true },
      { name: 'value', type: 'string', required: true },
      { name: 'is_system', type: 'boolean', required: true },
      { name: 'updated_at', type: 'date-iso', required: true },
    ]
  },
  // Dedicated controlled sequence tracker
  JobSequences: {
    tabName: 'JobSequences',
    description: 'Concurrency-safe serialized sequence counters per company',
    category: 'core',
    columns: [
      { name: 'sequence_id', type: 'uuid', required: true, primaryKey: true },
      { name: 'tenant_id', type: 'uuid', required: true },
      { name: 'company_id', type: 'uuid', required: true, unique: true },
      { name: 'prefix', type: 'string', required: false },
      { name: 'current_sequence', type: 'number', required: true },
      { name: 'pad_digits', type: 'number', required: true },
      { name: 'updated_at', type: 'date-iso', required: true },
    ]
  }
};
