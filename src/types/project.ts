// OrgProject types (formerly companies/organisations)
export interface OrgProject {
  id: string; // z_id in database
  projectId: string;
  name: string;
  url?: string;
  sipUrl?: string;
  lkUrl?: string;
  lkApiKey: string;
  lkApiSecret: string;
  isActive: boolean;
  address?: string;
  email?: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateOrgProjectInput {
  projectId: string;
  name: string;
  url?: string;
  sipUrl?: string;
  lkUrl?: string;
  lkApiKey: string;
  lkApiSecret: string;
  address?: string;
  email?: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
}

export interface UpdateOrgProjectInput {
  name?: string;
  url?: string;
  sipUrl?: string;
  lkUrl?: string;
  isActive?: boolean;
  address?: string;
  email?: string;
  phoneNumber1?: string;
  phoneNumber2?: string;
}
