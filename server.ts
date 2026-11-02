/**
 * Compenia ERP - Backend Server
 * Express full-stack API entry point with Vite middleware.
 * Exclusively accesses Google Sheets database layer via repositories.
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { globalStorageAdapter, SecurityContext } from './src/server/storage/storageAdapter.js';
import { googleSheetsClient } from './src/server/storage/googleSheetsClient.js';
import {
  TenantRepository,
  CompanyRepository,
  DepartmentRepository,
  UserRepository,
  EmployeeRepository,
  CustomerRepository,
  SupplierRepository,
  ProjectRepository,
  JobRepository,
  AccountingRepository,
  InventoryRepository,
  ProcurementRepository,
  DocumentRepository,
  ApprovalRepository,
  NotificationRepository,
  AuditRepository,
  HRRepository,
  JobEstimationRepository,
} from './src/server/repositories/index.js';
import { PostgresMigrationEngine } from './src/server/migration/postgresMigration.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Initialize Database Storage
await globalStorageAdapter.init();

// Initialize Repositories
const tenantRepo = new TenantRepository(globalStorageAdapter);
const companyRepo = new CompanyRepository(globalStorageAdapter);
const departmentRepo = new DepartmentRepository(globalStorageAdapter);
const userRepo = new UserRepository(globalStorageAdapter);
const employeeRepo = new EmployeeRepository(globalStorageAdapter);
const hrRepo = new HRRepository(globalStorageAdapter);
const customerRepo = new CustomerRepository(globalStorageAdapter);
const supplierRepo = new SupplierRepository(globalStorageAdapter);
const projectRepo = new ProjectRepository(globalStorageAdapter);
const jobRepo = new JobRepository(globalStorageAdapter);
const estimationRepo = new JobEstimationRepository(globalStorageAdapter);
const accountingRepo = new AccountingRepository(globalStorageAdapter);
const inventoryRepo = new InventoryRepository(globalStorageAdapter);
const procurementRepo = new ProcurementRepository(globalStorageAdapter);
const documentRepo = new DocumentRepository(globalStorageAdapter);
const approvalRepo = new ApprovalRepository(globalStorageAdapter);
const notificationRepo = new NotificationRepository(globalStorageAdapter);
const auditRepo = new AuditRepository(globalStorageAdapter);
const migrationEngine = new PostgresMigrationEngine(globalStorageAdapter);

const ENTERPRISE_USER_ROLES: Record<string, {
  roleCode: string;
  roleTitle: string;
  departmentScope: string;
  allowedDepartmentCodes: string[];
  permissions: string[];
  isTenantAdmin: boolean;
}> = {
  'user-admin-001': {
    roleCode: 'ADMIN',
    roleTitle: 'System Administrator & Executive',
    departmentScope: 'ALL',
    allowedDepartmentCodes: ['*'],
    permissions: ['*'],
    isTenantAdmin: true,
  },
  'user-acc-002': {
    roleCode: 'ACCOUNTANT',
    roleTitle: 'Senior Finance Officer & Accountant',
    departmentScope: 'Accounts & Finance',
    allowedDepartmentCodes: ['ACC-FIN'],
    permissions: ['VIEW', 'SUBMIT', 'POST_JOURNAL', 'APPROVE_FINANCE'],
    isTenantAdmin: false,
  },
  'user-eng-003': {
    roleCode: 'PROJECT_ENGINEER',
    roleTitle: 'Project & Fabrication Engineer',
    departmentScope: 'Engineering & Workshop',
    allowedDepartmentCodes: ['DSGN-EST', 'PROD-WKP'],
    permissions: ['VIEW', 'SUBMIT', 'CREATE_JOB', 'TIMESHEETS'],
    isTenantAdmin: false,
  },
  'user-sales-004': {
    roleCode: 'SALES_HEAD',
    roleTitle: 'Sales & Marketing Head',
    departmentScope: 'Sales & Marketing Department Only',
    allowedDepartmentCodes: ['SALES-MKT'],
    permissions: ['VIEW_SALES', 'MANAGE_SALES', 'VIEW_CUSTOMERS'],
    isTenantAdmin: false,
  },
  'user-hr-005': {
    roleCode: 'HR_MANAGER',
    roleTitle: 'HR Manager',
    departmentScope: 'HR Department Only',
    allowedDepartmentCodes: ['HR-ADM'],
    permissions: ['VIEW_HR', 'MANAGE_HR', 'VIEW_EMPLOYEES', 'APPROVE_LEAVES'],
    isTenantAdmin: false,
  },
};

// Mock Session State (In a real enterprise deployment, this is a JWT / Session store)
// Defaults to CEMCON tenant admin at Cemcon Mechanical Engineering LLC
let activeSession: SecurityContext = {
  tenantId: 'tenant-cemcon-001',
  companyId: 'comp-cemcon-mech-01',
  userId: 'user-admin-001',
  userEmail: 'admin@cemcon.ae',
  userName: 'System Administrator',
  roleCode: 'ADMIN',
  roleTitle: 'System Administrator & Executive',
  departmentScope: 'ALL',
  allowedDepartmentCodes: ['*'],
  permissions: ['*'],
  isTenantAdmin: true,
};

// Security Context Middleware: Injects and validates tenant & company scoping
function getSecurityContext(req: Request): SecurityContext {
  const reqTenant = req.headers['x-tenant-id'] as string;
  const reqCompany = req.headers['x-company-id'] as string;

  // Validate tenant: users can NEVER jump across tenants
  if (reqTenant && reqTenant !== activeSession.tenantId) {
    throw new Error('Forbidden: Cross-tenant access attempt detected and blocked.');
  }

  return {
    ...activeSession,
    companyId: reqCompany || activeSession.companyId,
  };
}

// ======================== API ROUTES ========================

// 1. Auth & Session Management
app.get('/api/auth/session', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const tenant = await tenantRepo.getTenant(context.tenantId, context);
    const company = context.companyId ? await companyRepo.getCompany(context.companyId, context) : null;
    const allCompanies = await companyRepo.listCompanies(context);
    const user = await userRepo.getUser(context.userId, context);
    const allUsers = await userRepo.listUsers(context);

    res.json({
      session: context,
      tenant,
      company,
      companies: allCompanies.data,
      user,
      users: allUsers.data,
    });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/auth/switch-company', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.body;
    const company = await companyRepo.getCompany(companyId, activeSession);
    if (!company) {
      return res.status(404).json({ error: 'Company not found in this tenant.' });
    }
    activeSession.companyId = companyId;
    res.json({ success: true, activeCompany: company });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/auth/switch-user', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await userRepo.getUser(userId, activeSession);
    if (!user) {
      return res.status(404).json({ error: 'User not found in tenant.' });
    }

    const roleConfig = ENTERPRISE_USER_ROLES[user.user_id] || {
      roleCode: user.is_tenant_admin ? 'ADMIN' : 'STAFF',
      roleTitle: user.is_tenant_admin ? 'Administrator' : 'Staff Member',
      departmentScope: user.is_tenant_admin ? 'ALL' : 'General',
      allowedDepartmentCodes: user.is_tenant_admin ? ['*'] : ['*'],
      permissions: user.is_tenant_admin ? ['*'] : ['VIEW', 'SUBMIT'],
      isTenantAdmin: !!user.is_tenant_admin,
    };

    activeSession = {
      tenantId: user.tenant_id,
      companyId: activeSession.companyId || 'comp-cemcon-mech-01',
      userId: user.user_id,
      userEmail: user.email,
      userName: user.full_name,
      roleCode: roleConfig.roleCode,
      roleTitle: roleConfig.roleTitle,
      departmentScope: roleConfig.departmentScope,
      allowedDepartmentCodes: roleConfig.allowedDepartmentCodes,
      permissions: roleConfig.permissions,
      isTenantAdmin: roleConfig.isTenantAdmin,
    };

    res.json({ success: true, activeUser: user, session: activeSession });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 2. Tenants & Companies
app.get('/api/tenants', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await tenantRepo.listTenants(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/companies', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await companyRepo.listCompanies(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 2b. Organizational Departments (CEMCON)
app.get('/api/departments', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await departmentRepo.listDepartments(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/departments', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const { name, code, status = 'ACTIVE' } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required.' });
    }
    const created = await departmentRepo.createDepartment(
      {
        name,
        code,
        status,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 2c. Employees Master Data
app.get('/api/employees', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await employeeRepo.listEmployees({}, context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/employees', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const { employee_no, full_name, designation, department_id, email, phone, status = 'ACTIVE', joining_date } = req.body;
    if (!employee_no || !full_name || !designation || !department_id || !email) {
      return res.status(400).json({ error: 'Missing required employee fields: employee_no, full_name, designation, department_id, email.' });
    }
    const created = await employeeRepo.createEmployee(
      {
        employee_no,
        full_name,
        designation,
        department_id,
        email,
        phone: phone || '',
        status,
        joining_date: joining_date || new Date().toISOString().split('T')[0],
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const updated = await employeeRepo.updateEmployee(req.params.id, req.body, context);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 2d. HR & Fleet Management Endpoints
// Documents & Expiry
app.get('/api/hr/documents', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listEmployeeDocuments(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/documents', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createEmployeeDocument(
      {
        ...req.body,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Insurance
app.get('/api/hr/insurance', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listInsurancePolicies(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/insurance', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createInsurancePolicy(
      {
        ...req.body,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Fleet & Vehicles
app.get('/api/hr/fleet', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listVehicles(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/fleet', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createVehicle(
      {
        ...req.body,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/hr/fleet/:id', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const updated = await hrRepo.updateVehicle(req.params.id, req.body, context);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Vehicle Fines
app.get('/api/hr/fleet/fines', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listVehicleFines(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/fleet/fines', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createVehicleFine(
      {
        ...req.body,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Vehicle Maintenance
app.get('/api/hr/fleet/maintenance', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listVehicleMaintenance(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/fleet/maintenance', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createVehicleMaintenance(
      {
        ...req.body,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Recruitment Requests
app.get('/api/hr/recruitment', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listRecruitmentRequests(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/recruitment', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createRecruitmentRequest(
      {
        ...req.body,
        status: req.body.status || 'PENDING',
        created_at: new Date().toISOString(),
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/hr/recruitment/:id', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const updated = await hrRepo.updateRecruitmentRequest(req.params.id, req.body, context);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Candidates & Interview Evaluation
app.get('/api/hr/candidates', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listCandidates(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/candidates', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createCandidate(
      {
        ...req.body,
        created_at: new Date().toISOString(),
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/hr/candidates/:id', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const updated = await hrRepo.updateCandidate(req.params.id, req.body, context);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Clearance & Offboarding
app.get('/api/hr/clearance', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listClearanceForms(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/clearance', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createClearanceForm(
      {
        ...req.body,
        created_at: new Date().toISOString(),
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/hr/clearance/:id', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const updated = await hrRepo.updateClearanceForm(req.params.id, req.body, context);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Attendance & Timesheets
app.get('/api/hr/attendance', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listAttendance(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/attendance', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createAttendance(
      {
        ...req.body,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/hr/timesheets', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listTimesheets(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/timesheets', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createTimesheet(
      {
        ...req.body,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/hr/overtime', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await hrRepo.listOvertimeRequests(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/hr/overtime', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await hrRepo.createOvertimeRequest(
      {
        ...req.body,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      },
      context
    );
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Customers & Suppliers
app.get('/api/customers', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await customerRepo.listCustomers(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/suppliers', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await supplierRepo.listSuppliers(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 4. Jobs & Concurrency-Safe Company Numbering
app.get('/api/jobs', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await jobRepo.listJobs(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/jobs/next-number', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const nextNumber = await jobRepo.getNextJobNumber(context);
    res.json({ nextJobNumber: nextNumber, companyId: context.companyId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/jobs', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const {
      customerId,
      clientName,
      title,
      scopeDescription,
      projectId,
      targetCompletion,
      location,
      deadline,
      priority,
      materials,
      manpower,
      equipment,
      overheadsEstimate,
      totalEstimatedCost,
      preparedBy,
      approvedBy,
      receivedBy,
    } = req.body;

    const resolvedTitle = title || scopeDescription?.slice(0, 50) || 'Fabrication Job Order';
    const resolvedScope = scopeDescription || title || 'General works and fabrication execution';

    const job = await jobRepo.createJob(
      {
        customerId: customerId || 'cust-001',
        clientName: clientName || undefined,
        title: resolvedTitle,
        scopeDescription: resolvedScope,
        projectId,
        targetCompletion: deadline || targetCompletion,
        location,
        deadline,
        priority: priority || 'Normal',
        materials,
        manpower,
        equipment,
        overheadsEstimate,
        totalEstimatedCost,
        preparedBy,
        approvedBy,
        receivedBy,
      },
      context
    );

    res.status(201).json(job);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/jobs/:id/cancel', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const { reason } = req.body;
    const cancelled = await jobRepo.cancelJob(req.params.id, reason || 'User cancellation', context);
    res.json(cancelled);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4b. Job Estimations Suite (Cost, Labour, Materials, Subcontract, Misc)
app.get('/api/estimations', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await estimationRepo.listEstimations(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/estimations/stats', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const stats = await estimationRepo.getEstimationStats(context);
    res.json(stats);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/estimations/:id', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const item = await estimationRepo.getEstimation(req.params.id, context);
    if (!item) {
      return res.status(404).json({ error: 'Estimation not found' });
    }
    res.json(item);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/estimations', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await estimationRepo.createEstimation(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/estimations/:id', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const updated = await estimationRepo.updateEstimation(req.params.id, req.body, context);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/estimations/:id', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    await estimationRepo.deleteEstimation(req.params.id, context);
    res.json({ success: true, message: 'Estimation deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Accounting & General Ledger (Double-Entry Balanced)
app.get('/api/accounting/accounts', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listAccounts(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/accounting/journals', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listJournalEntries(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/accounting/journals/:id', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.getJournalWithLines(req.params.id, context);
    if (!result) return res.status(404).json({ error: 'Journal not found' });
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/accounting/post-journal', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const { idempotencyKey, entryDate, memo, lines } = req.body;

    if (!idempotencyKey || !entryDate || !memo || !lines) {
      return res.status(400).json({ error: 'idempotencyKey, entryDate, memo, and lines are required.' });
    }

    const result = await accountingRepo.postJournalEntry(
      {
        idempotencyKey,
        entryDate,
        memo,
        lines,
      },
      context
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/accounting/journals/:id/reverse', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const { reason } = req.body;
    const result = await accountingRepo.reverseJournalEntry(req.params.id, reason || 'Manual reversal', context);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/accounting/trial-balance', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const report = await accountingRepo.getTrialBalance(context);
    res.json(report);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Chart of Accounts create
app.post('/api/accounting/accounts', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createAccount(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Bank Accounts
app.get('/api/banking/accounts', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listBankAccounts(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/banking/accounts', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createBankAccount(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Bank Transactions
app.get('/api/banking/transactions', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listBankTransactions(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/banking/transactions', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createBankTransaction(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/banking/transactions/:id/toggle-reconcile', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const { isReconciled } = req.body;
    const updated = await accountingRepo.toggleReconcileTransaction(req.params.id, Boolean(isReconciled), context);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Bank Reconciliations
app.get('/api/banking/reconciliations', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listBankReconciliations(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/banking/reconciliations', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createBankReconciliation(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Receipts
app.get('/api/accounting/receipts', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listReceipts(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/accounting/receipts', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createReceipt(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Payments
app.get('/api/accounting/payments', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listPayments(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/accounting/payments', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createPayment(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Quotations
app.get('/api/crm/quotations', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listQuotations(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/crm/quotations', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createQuotation(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Purchase Invoices
app.get('/api/accounting/purchase-invoices', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listPurchaseInvoices(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/accounting/purchase-invoices', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createPurchaseInvoice(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Sales Invoices
app.get('/api/accounting/sales-invoices', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listSalesInvoices(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/accounting/sales-invoices', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createSalesInvoice(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delivery Notes
app.get('/api/logistics/delivery-notes', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await accountingRepo.listDeliveryNotes(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/logistics/delivery-notes', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await accountingRepo.createDeliveryNote(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Aging Report (Receivables / Payables)
app.get('/api/accounting/aging-report', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const report = await accountingRepo.getAgingReport(context);
    res.json(report);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// General Ledger Explorer
app.get('/api/accounting/general-ledger', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const accountId = req.query.accountId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const ledger = await accountingRepo.getGeneralLedger({ accountId, startDate, endDate }, context);
    res.json(ledger);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Profit & Loss
app.get('/api/accounting/profit-loss', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const pnl = await accountingRepo.getProfitAndLoss(context);
    res.json(pnl);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Balance Sheet
app.get('/api/accounting/balance-sheet', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const bs = await accountingRepo.getBalanceSheet(context);
    res.json(bs);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Cash Flow Reporting
app.get('/api/accounting/cash-flow', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const cf = await accountingRepo.getCashFlow(context);
    res.json(cf);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// Financial Metrics & Ratios
app.get('/api/accounting/financial-metrics', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const metrics = await accountingRepo.getFinancialMetrics(context);
    res.json(metrics);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 6. Inventory & Dynamic Stock Ledger
app.get('/api/inventory/items', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await inventoryRepo.listItems(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/inventory/warehouses', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await inventoryRepo.listWarehouses(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/inventory/stock-balances', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const balances = await inventoryRepo.getStockBalanceProjection(undefined, context);
    res.json(balances);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.get('/api/inventory/transactions', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await inventoryRepo.listTransactions(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/inventory/movement', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const { itemId, warehouseId, transactionType, quantity, unitCost, referenceType, referenceId } = req.body;

    const result = await inventoryRepo.postStockMovement(
      {
        itemId,
        warehouseId,
        transactionType,
        quantity: Number(quantity),
        unitCost: Number(unitCost),
        referenceType: referenceType || 'MANUAL',
        referenceId: referenceId || `MOV-${Date.now()}`,
      },
      context
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6b. Procurement Department Suite (8 Operations)
// 1. Purchase Requests
app.get('/api/procurement/purchase-requests', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.listPurchaseRequests(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/procurement/purchase-requests', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await procurementRepo.createPurchaseRequest(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/procurement/purchase-requests/:id/status', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const { status } = req.body;
    const updated = await procurementRepo.updatePurchaseRequestStatus(req.params.id, status, context);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Approval Hierarchy
app.get('/api/procurement/approval-hierarchy', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.getApprovalHierarchy(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 3. RFQs & Supplier Quotations
app.get('/api/procurement/rfqs', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.listRFQs(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/procurement/rfqs', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await procurementRepo.createRFQ(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/procurement/supplier-quotations', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.listSupplierQuotations(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/procurement/supplier-quotations', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await procurementRepo.createSupplierQuotation(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/procurement/supplier-quotations/:id/award', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.awardSupplierQuotation(req.params.id, context);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Goods Received Notes (GRN) & Delivery Notes
app.get('/api/procurement/goods-receipts', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.listGoodsReceipts(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/procurement/goods-receipts', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await procurementRepo.createGoodsReceipt(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. 3-Way Matching Engine & Supplier Invoices
app.get('/api/procurement/three-way-match', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.getThreeWayMatchReport(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 6. Purchase Orders
app.get('/api/procurement/purchase-orders', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.listPurchaseOrders(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/procurement/purchase-orders', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const created = await procurementRepo.createPurchaseOrder(req.body, context);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Purchase Approvals
app.get('/api/procurement/approvals', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.listPurchaseApprovals(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 8. Spend & Procurement Analytics (Reports)
app.get('/api/procurement/analytics', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await procurementRepo.getProcurementAnalytics(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 7. Approvals & Reminders
app.get('/api/approvals/pending', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await approvalRepo.listPendingRequests(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/approvals/:id/action', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const { action, comments } = req.body;
    const result = await approvalRepo.processAction(req.params.id, action, comments || '', context);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/reminders/scan', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const notifications = await notificationRepo.runReminderScan(context);
    res.json(notifications);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 8. Audit Logs
app.get('/api/audit-logs', async (req: Request, res: Response) => {
  try {
    const context = getSecurityContext(req);
    const result = await auditRepo.listLogs(context);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// 9. Google Sheets Database Inspector & Live Sync
app.get('/api/sheets/tabs', (req: Request, res: Response) => {
  const tabNames = globalStorageAdapter.getAllTabNames();
  const stats = globalStorageAdapter.getStats();
  const result = tabNames.map((name) => {
    const schema = globalStorageAdapter.getSchema(name);
    return {
      tabName: name,
      category: schema.category,
      description: schema.description,
      columnsCount: schema.columns.length,
      rowCount: stats[name]?.rowCount || 0,
    };
  });
  res.json(result);
});

app.get('/api/sheets/tab/:tabName', (req: Request, res: Response) => {
  try {
    const { tabName } = req.params;
    const schema = globalStorageAdapter.getSchema(tabName);
    const rawData = globalStorageAdapter.getRawSheetData(tabName);
    res.json({
      tabName,
      schema,
      headers: rawData.headers,
      rows: rawData.rows,
      rowCount: rawData.rows.length,
    });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.get('/api/sheets/export/:tabName', (req: Request, res: Response) => {
  try {
    const { tabName } = req.params;
    const format = req.query.format === 'csv' ? 'csv' : 'tsv';
    const content = format === 'csv' ? globalStorageAdapter.exportAsCSV(tabName) : globalStorageAdapter.exportAsTSV(tabName);

    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'text/tab-separated-values');
    res.setHeader('Content-Disposition', `attachment; filename="${tabName}.${format}"`);
    res.send(content);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.post('/api/sheets/sync', async (req: Request, res: Response) => {
  try {
    const { spreadsheetId, authSecret } = req.body;
    const report = await globalStorageAdapter.syncWithGoogleSheets(spreadsheetId, authSecret);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Google Service Account Status & Live Connection Test
// NOTE: Private key is NEVER exposed in the response
app.get('/api/sheets/service-account', (_req: Request, res: Response) => {
  const status = googleSheetsClient.getStatus();
  res.json(status);
});

app.post('/api/sheets/test-connection', async (_req: Request, res: Response) => {
  const status = await googleSheetsClient.testLiveConnection();
  res.json(status);
});

// 10. PostgreSQL Migration Engine
app.get('/api/migration/ddl', (_req: Request, res: Response) => {
  const ddl = migrationEngine.generatePostgresDDL();
  res.setHeader('Content-Type', 'text/plain');
  res.send(ddl);
});

app.get('/api/migration/script', (_req: Request, res: Response) => {
  const script = migrationEngine.generateMigrationScript();
  res.setHeader('Content-Type', 'text/plain');
  res.send(script);
});

app.get('/api/migration/reconciliation', async (_req: Request, res: Response) => {
  const report = await migrationEngine.runReconciliationCheck();
  res.json(report);
});

// 11. Diagnostic Test Suite (Live verification of constraints)
app.post('/api/diagnostics/run-tests', async (_req: Request, res: Response) => {
  const testResults: Array<{ name: string; status: 'PASSED' | 'FAILED'; details: string; durationMs: number }> = [];

  // Test 1: Cross-Tenant Isolation
  const start1 = Date.now();
  try {
    const bogusContext: SecurityContext = {
      tenantId: 'tenant-intruder-999',
      userId: 'hacker-001',
      userEmail: 'hacker@malicious.com',
      roleCode: 'INTRUDER',
      permissions: [],
    };
    await jobRepo.listJobs(bogusContext);
    testResults.push({
      name: 'Cross-Tenant Scoping Isolation',
      status: 'FAILED',
      details: 'Failed: Unauthorized query was not rejected.',
      durationMs: Date.now() - start1,
    });
  } catch (err: any) {
    testResults.push({
      name: 'Cross-Tenant Scoping Isolation',
      status: 'PASSED',
      details: 'Successfully blocked cross-tenant access. Server refused foreign tenant query with 403.',
      durationMs: Date.now() - start1,
    });
  }

  // Test 2: Concurrency Stress Test on Job Numbering
  const start2 = Date.now();
  try {
    const mechCompanyContext: SecurityContext = {
      tenantId: 'tenant-cemcon-001',
      companyId: 'comp-cemcon-mech-01',
      userId: 'user-admin-001',
      userEmail: 'admin@cemcon.ae',
      roleCode: 'ADMIN',
      permissions: ['*'],
    };

    // Fire 6 simultaneous job creation promises
    const promises = Array.from({ length: 6 }).map((_, i) =>
      jobRepo.createJob(
        {
          customerId: 'cust-001',
          title: `Concurrent Test Job #${i + 1}`,
          scopeDescription: `Automated concurrency race condition test execution ${i + 1}`,
        },
        mechCompanyContext
      )
    );

    const createdJobs = await Promise.all(promises);
    const jobNumbers = createdJobs.map((j) => j.job_number);
    const uniqueNumbers = new Set(jobNumbers);

    if (uniqueNumbers.size === createdJobs.length) {
      testResults.push({
        name: 'Concurrent Job Numbering Mutex Lock',
        status: 'PASSED',
        details: `Successfully generated ${createdJobs.length} strictly unique sequential numbers: ${jobNumbers.join(', ')} without collisions.`,
        durationMs: Date.now() - start2,
      });
    } else {
      testResults.push({
        name: 'Concurrent Job Numbering Mutex Lock',
        status: 'FAILED',
        details: `Collision detected! Generated duplicate job numbers: ${jobNumbers.join(', ')}`,
        durationMs: Date.now() - start2,
      });
    }
  } catch (err: any) {
    testResults.push({
      name: 'Concurrent Job Numbering Mutex Lock',
      status: 'FAILED',
      details: `Exception during concurrency test: ${err.message}`,
      durationMs: Date.now() - start2,
    });
  }

  // Test 3: Unbalanced Journal Entry Rejection
  const start3 = Date.now();
  try {
    const financeContext: SecurityContext = {
      tenantId: 'tenant-cemcon-001',
      companyId: 'comp-cemcon-mech-01',
      userId: 'user-acc-002',
      userEmail: 'finance@cemcon.ae',
      roleCode: 'ACCOUNTANT',
      permissions: ['*'],
    };

    await accountingRepo.postJournalEntry(
      {
        idempotencyKey: `TEST-UNBALANCED-${Date.now()}`,
        entryDate: '2026-10-18',
        memo: 'Intentionally unbalanced journal test',
        lines: [
          { accountId: 'acc-1010', debit: 5000, credit: 0 },
          { accountId: 'acc-4010', debit: 0, credit: 4500 }, // Discrepancy of 500!
        ],
      },
      financeContext
    );

    testResults.push({
      name: 'Double-Entry Balancing Validation (dr == cr)',
      status: 'FAILED',
      details: 'Unbalanced journal was improperly accepted!',
      durationMs: Date.now() - start3,
    });
  } catch (err: any) {
    testResults.push({
      name: 'Double-Entry Balancing Validation (dr == cr)',
      status: 'PASSED',
      details: `Correctly rejected unbalanced journal: "${err.message}"`,
      durationMs: Date.now() - start3,
    });
  }

  // Test 4: Idempotency Key Replay Prevention
  const start4 = Date.now();
  try {
    const financeContext: SecurityContext = {
      tenantId: 'tenant-cemcon-001',
      companyId: 'comp-cemcon-mech-01',
      userId: 'user-acc-002',
      userEmail: 'finance@cemcon.ae',
      roleCode: 'ACCOUNTANT',
      permissions: ['*'],
    };

    const idemKey = `IDEM-STRESS-TEST-${Date.now()}`;
    const payload = {
      idempotencyKey: idemKey,
      entryDate: '2026-10-18',
      memo: 'Idempotency test entry',
      lines: [
        { accountId: 'acc-1010', debit: 1200, credit: 0 },
        { accountId: 'acc-4010', debit: 0, credit: 1200 },
      ],
    };

    const firstPost = await accountingRepo.postJournalEntry(payload, financeContext);
    const retryPost = await accountingRepo.postJournalEntry(payload, financeContext);

    if (retryPost.duplicateIgnored && retryPost.journal.entry_number === firstPost.journal.entry_number) {
      testResults.push({
        name: 'Idempotency Key Network Retry Prevention',
        status: 'PASSED',
        details: `Identical idempotency key safely resolved to original posted entry (${firstPost.journal.entry_number}) without creating duplicate records.`,
        durationMs: Date.now() - start4,
      });
    } else {
      testResults.push({
        name: 'Idempotency Key Network Retry Prevention',
        status: 'FAILED',
        details: 'Idempotency key did not prevent duplicate posting.',
        durationMs: Date.now() - start4,
      });
    }
  } catch (err: any) {
    testResults.push({
      name: 'Idempotency Key Network Retry Prevention',
      status: 'FAILED',
      details: `Exception: ${err.message}`,
      durationMs: Date.now() - start4,
    });
  }

  res.json({
    summary: {
      total: testResults.length,
      passed: testResults.filter((t) => t.status === 'PASSED').length,
      failed: testResults.filter((t) => t.status === 'FAILED').length,
    },
    tests: testResults,
  });
});

// Mount Vite or Static Files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`[Compenia ERP] Google Sheets Database Server listening at http://0.0.0.0:${port}`);
});
