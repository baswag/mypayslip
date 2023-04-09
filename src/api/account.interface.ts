export const ACCOUNT_API_ROUTE = '/api/mobileview2/v1/Account';

export interface AccountResponseInterface {
  receiverKey: string;
  hasPrivacyDocument: boolean;
  hasOptInQuestions: boolean;
  lastName: string;
  firstName: string;
  street: string;
  zipCode: string;
  city: string;
}
