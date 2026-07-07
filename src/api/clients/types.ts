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
  // Extra fields carried for edit-mode prefill (not shown on read-only views).
  officeCode?: string;
  genderCode?: string;
  dateOfBirth?: string;
  submittedOnDate?: string;
};
