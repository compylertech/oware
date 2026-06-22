export type AppStage = "Submitted" | "Under Review" | "Approved" | "To Disburse" | "Rejected";

export type LoanApplication = {
  id: string;
  client: string;
  product: string;
  amount: number;
  stage: AppStage;
  officer: string;
  submitted: string;
  avatar: string;
};

export type ActiveLoanStatus = "Current" | "Due Soon" | "In Arrears" | "Closed";

export type ActiveLoan = {
  id: string;
  client: string;
  product: string;
  outstanding: number;
  nextDue: string;
  repaid: number;
  status: ActiveLoanStatus;
  avatar: string;
};

export type LoanProduct = {
  name: string;
  type: string;
  typeColor: string;
  rate: string;
  term: string;
  max: string;
  extra: string;
  active: boolean;
  count: number;
};

export type WizardProduct = {
  name: string;
  rate: string;
  tenure: number;
  rateValue: number;
  secured: boolean;
  max: number;
};
