export type ClientStatus = "Active" | "Pending" | "Inactive";

export type Client = {
  id: string;
  name: string;
  clientNumber: string;
  externalId: string;
  status: ClientStatus;
  officeName: string;
  activationDate: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  isStaff?: boolean;
  // Fineract's numeric client id — needed as the loanOfficerId filter value
  // when this client is staff (loan officers are modeled as staff clients).
  fineractClientId?: number;
  // Extra fields carried for edit-mode prefill (not shown on read-only views).
  officeCode?: string;
  genderCode?: string;
  dateOfBirth?: string;
  submittedOnDate?: string;
};
