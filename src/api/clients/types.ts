export type ClientStatus = "Active" | "Pending";

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
};

export const OFFICES = ["Accra Main", "Kumasi", "Takoradi", "Head Office"];
