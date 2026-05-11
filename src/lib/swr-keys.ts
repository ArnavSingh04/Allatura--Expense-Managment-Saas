export const keys = {
  // dashboards
  companyDashboard: () => 'dashboards/company',
  companyCalendar: (q: { from: string; to: string; projectId?: string }) => {
    const p = new URLSearchParams();
    p.set('from', q.from);
    p.set('to', q.to);
    if (q.projectId) p.set('projectId', q.projectId);
    return `dashboards/calendar?${p.toString()}`;
  },
  projectDashboard: (projectId: string) => `dashboards/projects/${projectId}`,

  // projects
  projects: (q: { status?: string; q?: string } = {}) => {
    const p = new URLSearchParams();
    if (q.status) p.set('status', q.status);
    if (q.q) p.set('q', q.q);
    const s = p.toString();
    return s ? `projects?${s}` : 'projects';
  },
  project: (id: string) => `projects/${id}`,
  projectFinancials: (id: string) => `projects/${id}/financials`,
  projectMembers: (id: string) => `projects/${id}/members`,

  // contracts
  contractsByProject: (projectId: string) => `projects/${projectId}/contracts`,
  contract: (id: string) => `contracts/${id}`,

  // variations
  variationsByContract: (contractId: string) =>
    `contracts/${contractId}/variations`,
  variationsInbox: (q: { status?: string; projectId?: string } = {}) => {
    const p = new URLSearchParams();
    if (q.status) p.set('status', q.status);
    if (q.projectId) p.set('projectId', q.projectId);
    const s = p.toString();
    return s ? `variations?${s}` : 'variations';
  },
  variation: (id: string) => `variations/${id}`,

  // expenses
  expensesByProject: (
    projectId: string,
    q: {
      deptId?: string;
      kind?: string;
      status?: string;
      from?: string;
      to?: string;
      q?: string;
    } = {},
  ) => {
    const p = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    const s = p.toString();
    return s
      ? `projects/${projectId}/expenses?${s}`
      : `projects/${projectId}/expenses`;
  },
  costLedger: (projectId: string) => `projects/${projectId}/cost-ledger`,
  expense: (id: string) => `expenses/${id}`,

  // payment claims
  claimsByContract: (contractId: string) =>
    `contracts/${contractId}/payment-claims`,
  claimsByProject: (projectId: string) =>
    `projects/${projectId}/payment-claims`,
  claim: (id: string) => `payment-claims/${id}`,

  // documents
  documents: (
    q: {
      projectId?: string;
      contractId?: string;
      entityType?: string;
      entityId?: string;
      category?: string;
      tag?: string;
      q?: string;
    } = {},
  ) => {
    const p = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v) p.set(k, v);
    });
    const s = p.toString();
    return s ? `documents?${s}` : 'documents';
  },
  document: (id: string) => `documents/${id}`,

  // subbies / suppliers
  subbies: (q: { trade?: string; q?: string; preferredOnly?: boolean } = {}) => {
    const p = new URLSearchParams();
    if (q.trade) p.set('trade', q.trade);
    if (q.q) p.set('q', q.q);
    if (q.preferredOnly) p.set('preferredOnly', 'true');
    const s = p.toString();
    return s ? `subcontractors?${s}` : 'subcontractors';
  },
  subbie: (id: string) => `subcontractors/${id}`,
  subbieContracts: (id: string) => `subcontractors/${id}/contracts`,
  subbieCompliance: (id: string) => `subcontractors/${id}/compliance`,
  suppliers: (q: { category?: string; q?: string } = {}) => {
    const p = new URLSearchParams();
    if (q.category) p.set('category', q.category);
    if (q.q) p.set('q', q.q);
    const s = p.toString();
    return s ? `suppliers?${s}` : 'suppliers';
  },
  supplier: (id: string) => `suppliers/${id}`,

  // progress + sitelogs
  progressByProject: (projectId: string) => `projects/${projectId}/progress`,
  milestonesByProject: (projectId: string) => `projects/${projectId}/milestones`,
  siteLogsByProject: (projectId: string) => `projects/${projectId}/site-logs`,
  siteLog: (id: string) => `site-logs/${id}`,

  // audit (legacy)
  audit: () => 'audit',
};
