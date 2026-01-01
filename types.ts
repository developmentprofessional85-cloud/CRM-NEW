
export enum UserRole {
  ADMIN = 'Admin',
  SALES = 'Sales',
  TECHNICAL = 'Technical',
  COMMERCIAL = 'Commercial',
  VIEWER = 'Viewer'
}

export interface User {
  id: string; // Employee ID format: SCPL-EMP-XXX
  name: string;
  email: string;
  role: UserRole;
  password?: string; // Stored for admin visibility as requested
  avatar?: string;
}

export enum CustomerType {
  COMMERCIAL = 'Commercial',
  RESIDENTIAL = 'Residential',
  CORPORATE = 'Corporate',
  MEGA_CORPORATE = 'Mega Corporate'
}

export enum InterestType {
  SALES = 'Sales',
  SERVICES = 'Services',
  NOLIFT = 'NoLift'
}

export enum TaxType {
  GST = 'GST',
  SRB = 'SRB',
  CASH = 'CASH'
}

export enum WorkflowStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  PO_GRANTED = 'PO Granted',
  JOB_IN_PROGRESS = 'Job in Progress',
  JOB_COMPLETED = 'Job Completed',
  INVOICE_GENERATED = 'Invoice Generated'
}

export interface VisitLog {
  id: string;
  timestamp: string;
  lat: number;
  lng: number;
  userName: string;
  notes: string;
  meetingMinutes?: string;
}

export interface Customer {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  contactPerson: string;
  designation: string;
  email: string;
  alternatePhone: string;
  customerType: CustomerType;
  interestType: InterestType;
  messageConsent: boolean;
  visitHistory: VisitLog[];
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  uom: string;
  packaging: string;
  basePrice: number;
  description?: string;
}

export interface LineItem {
  id: string;
  productId?: string;
  name: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Quotation {
  id: string;
  serialNumber: string;
  type: 'Sales' | 'Services';
  customerId: string;
  buyerNtn?: string;
  poNumber?: string;
  subject: string;
  commercialOffer: string;
  terms: string;
  scopeOfWork?: string;
  technicalData?: string;
  clientResponsibilities?: string;
  scplResponsibilities?: string;
  lineItems: LineItem[];
  taxType: TaxType;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: WorkflowStatus;
  isLocked?: boolean; 
  logs: StatusLog[];
  technicalSignature?: Signature;
  commercialSignature?: Signature;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  serialNumber: string;
  quotationId: string;
  customerId: string;
  buyerNtn?: string;
  dueDate: string;
  lineItems: LineItem[];
  taxType: TaxType;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  createdAt: string;
}

export interface StatusLog {
  status: WorkflowStatus;
  timestamp: string;
  user: string;
  remarks?: string;
}

export interface Signature {
  name: string;
  designation: string;
  date: string;
}

export interface AppSettings {
  companyName: string;
  companyShortName: string;
  scplNtn: string;
  logoUrl: string;
  gstRate: number;
  srbRate: number;
  categories: string[];
}
