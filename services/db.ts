
import { Customer, Product, Quotation, Invoice, AppSettings, TaxType, WorkflowStatus, User, UserRole } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const DB_KEYS = {
  CUSTOMERS: 'crm_customers',
  PRODUCTS: 'crm_products',
  QUOTES: 'crm_quotes',
  INVOICES: 'crm_invoices',
  SETTINGS: 'crm_settings',
  USERS: 'crm_users',
  USER_SESSION: 'crm_session'
};

// --- User Management ---
export const getUsers = (): User[] => {
  const data = localStorage.getItem(DB_KEYS.USERS);
  const users: User[] = data ? JSON.parse(data) : [];
  
  // Seed Master Admin if empty
  if (users.length === 0) {
    const admin: User = {
      id: 'SCPL-EMP-001',
      name: 'Principal Admin',
      email: 'admin@scpl.com',
      role: UserRole.ADMIN,
      password: 'baloch@SCPL-007'
    };
    users.push(admin);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  }
  return users;
};

export const saveUser = (user: User) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
};

export const deleteUser = (id: string) => {
  if (id === 'SCPL-EMP-001') return; // Cannot delete master admin
  const users = getUsers().filter(u => u.id !== id);
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
};

// --- Session Management ---
export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(DB_KEYS.USER_SESSION);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(DB_KEYS.USER_SESSION, JSON.stringify(user));
  } else {
    localStorage.removeItem(DB_KEYS.USER_SESSION);
  }
};

export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(DB_KEYS.SETTINGS);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
};

export const getCustomers = (): Customer[] => {
  const data = localStorage.getItem(DB_KEYS.CUSTOMERS);
  return data ? JSON.parse(data) : [];
};

export const saveCustomer = (customer: Customer) => {
  const customers = getCustomers();
  const index = customers.findIndex(c => c.id === customer.id);
  if (index >= 0) {
    customers[index] = customer;
  } else {
    customers.push(customer);
  }
  localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(customers));
};

export const getProducts = (): Product[] => {
  const data = localStorage.getItem(DB_KEYS.PRODUCTS);
  return data ? JSON.parse(data) : [];
};

export const saveProduct = (product: Product) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === product.id);
  if (index >= 0) {
    products[index] = product;
  } else {
    products.push(product);
  }
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
};

export const bulkUpsertProducts = (mappings: Partial<Product>[]) => {
  const products = [...getProducts()];
  let updatedCount = 0;
  let addedCount = 0;

  mappings.forEach(mapping => {
    if (!mapping.name) return;
    const existingIndex = products.findIndex(p => p.name.trim().toLowerCase() === mapping.name!.trim().toLowerCase());
    
    if (existingIndex >= 0) {
      products[existingIndex] = {
        ...products[existingIndex],
        ...mapping,
        id: products[existingIndex].id
      };
      updatedCount++;
    } else {
      const newProduct: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name: mapping.name!,
        basePrice: mapping.basePrice || 0,
        category: mapping.category || 'General',
        uom: mapping.uom || 'Units',
        packaging: mapping.packaging || 'Standard',
        description: mapping.description || ''
      };
      products.push(newProduct);
      addedCount++;
    }
  });

  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
  return { updatedCount, addedCount };
};

export const getQuotations = (): Quotation[] => {
  const data = localStorage.getItem(DB_KEYS.QUOTES);
  return data ? JSON.parse(data) : [];
};

export const saveQuotation = (quote: Quotation) => {
  const quotes = getQuotations();
  const index = quotes.findIndex(q => q.id === quote.id);
  if (index >= 0) {
    quotes[index] = quote;
  } else {
    quotes.push(quote);
  }
  localStorage.setItem(DB_KEYS.QUOTES, JSON.stringify(quotes));
};

export const generateSerialNumber = (docType: 'Qt' | 'Inv', customerName: string, taxType: TaxType): string => {
  const settings = getSettings();
  const clientShort = customerName.substring(0, 4).toUpperCase();
  const year = new Date().getFullYear().toString().slice(-2);
  
  const existing = docType === 'Qt' ? getQuotations() : getInvoices();
  const count = existing.filter(d => 
    d.serialNumber.includes(`-${year}-`) && 
    d.serialNumber.includes(`-${taxType}-`)
  ).length + 1;
  const seq = count.toString().padStart(3, '0');
  
  return `${docType}-${clientShort}/${settings.companyShortName}-${taxType}-${year}-${seq}`;
};

export const getInvoices = (): Invoice[] => {
  const data = localStorage.getItem(DB_KEYS.INVOICES);
  return data ? JSON.parse(data) : [];
};

export const saveInvoice = (invoice: Invoice) => {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.id === invoice.id);
  if (index >= 0) {
    invoices[index] = invoice;
  } else {
    invoices.push(invoice);
  }
  localStorage.setItem(DB_KEYS.INVOICES, JSON.stringify(invoices));
};

export const createInvoiceFromQuotation = (quote: Quotation, customer: Customer) => {
  const newInvoice: Invoice = {
    id: Math.random().toString(36).substr(2, 9),
    serialNumber: generateSerialNumber('Inv', customer.name, quote.taxType),
    quotationId: quote.id,
    customerId: customer.id,
    buyerNtn: quote.buyerNtn,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    lineItems: [...quote.lineItems],
    taxType: quote.taxType,
    taxRate: quote.taxRate,
    taxAmount: quote.taxAmount,
    grandTotal: quote.grandTotal,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  saveInvoice(newInvoice);
  
  const updatedQuote = { 
    ...quote, 
    status: WorkflowStatus.INVOICE_GENERATED,
    updatedAt: new Date().toISOString()
  };
  saveQuotation(updatedQuote);
  
  return newInvoice;
};
