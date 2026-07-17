export type BusinessApplicantType = 'INDIVIDUAL' | 'ORGANIZATION';
export type BusinessApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BusinessDocument {
  id: string;
  name: string;
  type: 'IDENTITY_FRONT' | 'IDENTITY_BACK' | 'BUSINESS_LICENSE' | 'TAX_DOCUMENT' | 'OTHER';
  url: string;
  mimeType: string;
}

export interface BusinessApplication {
  id: string;
  applicantType: BusinessApplicantType;
  businessName: string;
  businessCategory: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  identityNumber: string | null;
  identityIssuedAt: string | null;
  identityIssuedPlace: string | null;
  legalName: string | null;
  taxCode: string | null;
  representativeName: string | null;
  representativeTitle: string | null;
  website: string | null;
  description: string | null;
  documents: BusinessDocument[];
  status: BusinessApplicationStatus;
  rejectionReason: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessApplicationAdminQuery {
  page: number;
  limit: number;
  status?: BusinessApplicationStatus;
  applicantType?: BusinessApplicantType;
  search?: string;
}

export interface ApproveBusinessApplicationInput {
  displayName: string;
  email: string;
  initialPassword: string;
}

export const BUSINESS_APPLICANT_TYPE_LABEL: Record<BusinessApplicantType, string> = {
  INDIVIDUAL: 'Cá nhân',
  ORGANIZATION: 'Doanh nghiệp',
};

export const BUSINESS_APPLICATION_STATUS_LABEL: Record<BusinessApplicationStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

export const BUSINESS_APPLICATION_STATUS_COLOR: Record<BusinessApplicationStatus, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
};

export const BUSINESS_DOCUMENT_TYPE_LABEL: Record<BusinessDocument['type'], string> = {
  IDENTITY_FRONT: 'CCCD mặt trước',
  IDENTITY_BACK: 'CCCD mặt sau',
  BUSINESS_LICENSE: 'Giấy phép kinh doanh',
  TAX_DOCUMENT: 'Giấy tờ mã số thuế',
  OTHER: 'Tài liệu khác',
};
