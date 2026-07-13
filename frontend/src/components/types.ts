export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
}

export interface Bale {
  id: string;
  tenantId: string;
  name: string;
  purchasePrice: number;
  status: string;
  createdAt: string;
}
