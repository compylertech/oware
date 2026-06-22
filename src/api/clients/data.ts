import type { Client, ClientStatus } from "./types";
import { OFFICES } from "./types";

export const SEED_CLIENTS: Client[] = [
  ["Kwame Mensah", "Active", 0],
  ["Akosua Owusu", "Active", 1],
  ["Yaw Boateng", "Pending", 2],
  ["Ama Asantewaa", "Active", 3],
  ["Kojo Annan", "Active", 0],
  ["Efua Sutherland", "Pending", 1],
  ["Kwesi Appiah", "Active", 2],
  ["Adwoa Safo", "Active", 3],
  ["Nana Akufo", "Pending", 0],
  ["Abena Pokuaa", "Active", 1],
  ["Kofi Nyantakyi", "Active", 2],
  ["Esi Bondzie", "Pending", 3],
].map(([name, status, off], i) => {
  const n = String(i + 1).padStart(4, "0");
  const d = new Date(2024, (i * 2) % 12, ((i * 5) % 27) + 1);
  return {
    id: `clt-${n}`,
    name: name as string,
    clientNumber: `CLT-${n}`,
    externalId: `EXT-${n}`,
    status: status as ClientStatus,
    officeName: OFFICES[off as number],
    activationDate: d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
});
