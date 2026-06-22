export type CoopMember = {
  id: string;
  clientId: string;
  commonBondGroup: string;
  shareClass: string;
  initialShares: number;
  status: "Pending" | "Active";
};
