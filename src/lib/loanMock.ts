export type AppStage =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "To Disburse"
  | "Rejected";

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

export const APPLICATIONS: LoanApplication[] = [
  { id: "LN-20451", client: "Kwame Mensah",   product: "SME Working Capital", amount: 85000,  stage: "Under Review", officer: "A.Owusu",   submitted: "25 May", avatar: "#3B5BDB" },
  { id: "LN-20450", client: "Nana Addai",     product: "Asset Finance",       amount: 64000,  stage: "Under Review", officer: "K.Asante",  submitted: "25 May", avatar: "#7C3AED" },
  { id: "LN-20448", client: "Abena Boateng",  product: "Salary Advance",      amount: 12500,  stage: "Approved",     officer: "K.Asante",  submitted: "24 May", avatar: "#059669" },
  { id: "LN-20439", client: "Fiifi Brown",    product: "Group Loan",          amount: 18000,  stage: "To Disburse",  officer: "V.Yeboah",  submitted: "23 May", avatar: "#B45309" },
  { id: "LN-20445", client: "Ama Owusu",      product: "Mortgage",            amount: 320000, stage: "Submitted",    officer: "V.Yeboah",  submitted: "25 May", avatar: "#1565C0" },
  { id: "LN-20444", client: "Esi Tetteh",     product: "Salary Advance",      amount: 9500,   stage: "Submitted",    officer: "A.Owusu",   submitted: "25 May", avatar: "#0F6E56" },
  { id: "LN-20441", client: "Kofi Asare",     product: "Micro Group Loan",    amount: 6000,   stage: "Rejected",     officer: "K.Asante",  submitted: "22 May", avatar: "#DC2626" },
];

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

export const ACTIVE_LOANS: ActiveLoan[] = [
  { id: "LN-20310", client: "Kwame Mensah", product: "SME Working Capital", outstanding: 62400,  nextDue: "02 Jun",       repaid: 42,  status: "Current",    avatar: "#3B5BDB" },
  { id: "LN-20288", client: "Yaw Darko",    product: "Asset Finance",       outstanding: 118900, nextDue: "28 May",       repaid: 18,  status: "Due Soon",   avatar: "#7C3AED" },
  { id: "LN-20142", client: "Adwoa Mensa",  product: "Group Loan",          outstanding: 4200,   nextDue: "14d overdue",  repaid: 71,  status: "In Arrears", avatar: "#DC2626" },
  { id: "LN-20097", client: "Ama Owusu",    product: "Mortgage",            outstanding: 298000, nextDue: "05 Jun",       repaid: 9,   status: "Current",    avatar: "#1565C0" },
  { id: "LN-19980", client: "Kojo Baah",    product: "Salary Advance",      outstanding: 0,      nextDue: "—",            repaid: 100, status: "Closed",     avatar: "#475467" },
];

export const PRODUCTS = [
  { name: "SME Working Capital", type: "Declining balance", typeColor: "#3B5BDB", rate: "24% p.a.", term: "3–24mo", max: "GH₵250K",  extra: "Processing fee 2.5%",    active: true,  count: 412 },
  { name: "Salary Advance",      type: "Flat rate",         typeColor: "#059669", rate: "5% flat", term: "1–6mo",  max: "GH₵30K",   extra: "Processing fee GH₵50",   active: true,  count: 538 },
  { name: "Asset Finance",       type: "Declining balance", typeColor: "#B45309", rate: "21% p.a.",term: "6–36mo", max: "GH₵500K",  extra: "Collateral Required",    active: true,  count: 176 },
  { name: "Group Micro Loan",    type: "Flat rate",         typeColor: "#7C3AED", rate: "8% flat", term: "2–12mo", max: "GH₵20K",   extra: "Group size 5–15",        active: false, count: 0   },
  { name: "Home Mortgage",       type: "Declining balance", typeColor: "#DC2626", rate: "18% p.a.",term: "5–20yr", max: "GH₵2M",    extra: "Collateral Property",    active: true,  count: 58  },
];

export const WIZARD_PRODUCTS = [
  { name: "SME Working Capital", rate: "24% p.a.",  tenure: 12,  rateValue: 24,  secured: true,  max: 250000 },
  { name: "Asset Finance",       rate: "21% p.a.",  tenure: 24,  rateValue: 21,  secured: true,  max: 500000 },
  { name: "Salary Advance",      rate: "5% flat",   tenure: 4,   rateValue: 5,   secured: false, max: 30000 },
  { name: "Group Micro Loan",    rate: "8% flat",   tenure: 10,  rateValue: 8,   secured: false, max: 20000 },
  { name: "Mortgage",            rate: "18% p.a.",  tenure: 180, rateValue: 18,  secured: true,  max: 2000000 },
];

export const fmtGHS = (n: number) =>
  "GH₵" + n.toLocaleString("en-GH", { maximumFractionDigits: 0 });
