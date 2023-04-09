export const LOGIN_API_ROUTE = '/api/mobileview2/v1/Account/Login';

export interface LoginRequestInterface {
  accountKey: string;
  password: string;
  persistToken: 'true' | 'false';
  projectName: string;
}

export interface LoginResponseProjectInterface {
  name: string;
  friendlyName: string;
  backColor: string;
  headerBackColor: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundImage: string;
  logo: string;
  publicChatUrl: string;
  datenschutzUrl: string;
  impressumUrl: string;
  phone: string;
  email: string;
  archiveActive: boolean;
  collectArchive: boolean;
  allowDeactivation: boolean;
  emailFromAddress: string;
  emailFromName: string;
  emailSenderAddress: string;
  emailReplyToAddress: string;
  searchIconColor: string;
  menuIconColor: string;
  enableMenuItemMyAccount: boolean;
  readOnlyMyAccount: boolean;
  privateChatActive: boolean;
  optInActive: boolean;
  isSavedCollectioNDataEditable: boolean;
  deactivateRegistration: boolean;
  deactivateForgotPassword: boolean;
  loginWithoutEmailConfirmation: boolean;
  deactivateChangePassword: boolean;
  deactivateChangeEmail: boolean;
  enableMenuItemDeleteAccount: boolean;
  availableLanguages: {
    Name: string;
    Value: string;
    Active: boolean;
  }[];
}

export interface LoginResponseInterface {
  twoFactorRequired: boolean;
  twoFactorEnabled: boolean;
  emailNotConfirmed: boolean;
}
