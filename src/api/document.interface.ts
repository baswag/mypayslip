export const DOCUMENT_API_ROUTE = '/api/mobileview2/v1/Document';

export interface DocumentListDocumentInterface {
  itemId: number;
  documentId: number;
  insertTime: string;
  isNew: boolean;
  name: string;
  customFields: {
    name: string;
    type: 'Text' | 'DateTime';
    value: string;
  }[];
}
