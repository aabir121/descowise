import { Account, AccountInfo } from '../types';

export const createAccountToSave = (
 verifiedData: Partial<AccountInfo> & Pick<AccountInfo, 'accountNo'>,
 displayName: string,
 aiInsightsEnabled: boolean,
 banglaEnabled: boolean,
): Account => ({
  ...verifiedData,
  accountNo: verifiedData.accountNo,
  customerName: verifiedData.customerName || '',
  contactNo: verifiedData.contactNo || '',
  feederName: verifiedData.feederName || '',
  installationAddress: verifiedData.installationAddress || '',
  meterNo: verifiedData.meterNo || '',
  tariffSolution: verifiedData.tariffSolution || '',
  sanctionLoad: verifiedData.sanctionLoad || '',
  displayName: displayName.trim() || null,
  dateAdded: new Date().toISOString(),
  aiInsightsEnabled,
  banglaEnabled,
});
