import { useEffect, useState } from "react";
import { X, Search, ArrowDownCircle, ArrowUpCircle, CheckCircle2, Loader2 } from "lucide-react";

export type CashTxType = "deposit" | "withdraw";

interface Props {
  type: CashTxType | null;
  onClose: () => void;
}

interface AccountInfo {
  name: string;
  account: string;
  type: string;
  balance: string;
  status: "active" | "inactive";
}

const MOCK_ACCOUNTS: Record<string, AccountInfo> = {
  "1001234567": { name: "Pearl Adzoko", account: "1001234567", type: "Savings", balance: "GHS 12,500.00", status: "active" },
  "1009876543": { name: "Kwame Mensah", account: "1009876543", type: "Current", balance: "GHS 38,210.50", status: "active" },
};

export function CashTransactionDrawer({ type, onClose }: Props) {
  const open = type !== null;
  const isDeposit = type === "deposit";

  const [accountNumber, setAccountNumber] = useState("");
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setAccountNumber("");
      setAccount(null);
      setLookupError(null);
      setAmount("");
      setNarration("");
      setAmountError(null);
      setSubmitting(false);
      setSuccess(false);
    }
  }, [type, open]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => onClose(), 1800);
      return () => clearTimeout(t);
    }
  }, [success, onClose]);

  if (!open) return null;

  const handleLookup = () => {
    const found = MOCK_ACCOUNTS[accountNumber.trim()] ?? (accountNumber.trim().length >= 6
      ? { name: "John Doe", account: accountNumber.trim(), type: "Savings", balance: "GHS 12,500.00", status: "active" as const }
      : null);
    if (found) {
      setAccount(found);
      setLookupError(null);
    } else {
      setAccount(null);
      setLookupError("Account not found.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) {
      setAmountError("Enter a valid amount.");
      return;
    }
    setAmountError(null);
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
    }, 900);
  };

  const canSubmit = account && amount && Number(amount) > 0 && !submitting;
  const accentBg = isDeposit ? "bg-emerald-50" : "bg-red-50";
  const accentText = isDeposit ? "text-emerald-600" : "text-red-600";
  const submitColor = isDeposit ? "#059669" : "#DC2626";
  const title = isDeposit ? "Cash Deposit" : "Cash Withdrawal";
  const subtitle = isDeposit ? "Credit funds into an account" : "Debit funds from an account";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[448px] bg-white border border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
          <div className={`h-11 w-11 rounded-xl ${accentBg} flex items-center justify-center shrink-0`}>
            {isDeposit ? <ArrowDownCircle className={`h-5 w-5 ${accentText}`} /> : <ArrowUpCircle className={`h-5 w-5 ${accentText}`} />}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-[#101828]">{title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="text-base font-bold text-[#101828]">
              {isDeposit ? "Deposit Successful" : "Withdrawal Successful"}
            </div>
            <div className="text-sm text-gray-500 mt-1">Transaction has been posted.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Account number */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Account Number</label>
                <div className="flex gap-2">
                  <input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="100..."
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#002663]/20 focus:border-[#002663]"
                  />
                  <button
                    type="button"
                    onClick={handleLookup}
                    className="h-10 px-3 rounded-lg bg-[#002663] text-white text-sm font-medium flex items-center gap-1.5 hover:opacity-90"
                  >
                    <Search className="h-4 w-4" /> Search
                  </button>
                </div>
                {lookupError && <div className="text-xs text-red-500 mt-1.5">{lookupError}</div>}
              </div>

              {account && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1.5 text-sm">
                  <Row label="Name" value={account.name} />
                  <Row label="Account" value={<span className="font-mono">{account.account}</span>} />
                  <Row label="Type" value={account.type} />
                  <Row label="Balance" value={account.balance} />
                  <Row label="Status" value={
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-600 capitalize">{account.status}</span>
                    </span>
                  } />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Amount (GHS)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!account}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 font-mono text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#002663]/20 focus:border-[#002663]"
                />
                {amountError && <div className="text-xs text-red-500 mt-1.5">{amountError}</div>}
              </div>

              {/* Narration */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Narration <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  disabled={!account}
                  rows={3}
                  placeholder="Reference or description"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#002663]/20 focus:border-[#002663] resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-5 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                style={{ backgroundColor: submitColor }}
                className="flex-1 h-10 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : (
                  isDeposit ? "Post Deposit" : "Post Withdrawal"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-[#101828]">{value}</span>
    </div>
  );
}
