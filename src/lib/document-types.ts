export const REQUIRED_DOCUMENTS = [
  {
    id: 'business_registration',
    label: 'Proof of Business Registration',
    description: 'Upload your business registration certificate, license, or incorporation documents',
    required: true,
    icon: '🏢'
  },
  {
    id: 'founder_details',
    label: 'Founder Details',
    description: 'Upload ID proof, passport, or any document proving business ownership',
    required: true,
    icon: '👤'
  },
  {
    id: 'nda_signed',
    label: 'Signed NDA',
    description: 'Upload the signed Non-Disclosure Agreement',
    required: true,
    icon: '📄'
  }
] as const;

export type DocumentType = typeof REQUIRED_DOCUMENTS[number]['id'];

export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface ClientDocument {
  id: string;
  clientId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: any;
  status: DocumentStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}
