const BANK_CODE_ALIASES: Record<string, string> = {
  acb: 'ACB',
  agribank: 'AGRIBANK',
  bidv: 'BIDV',
  eximbank: 'EIB',
  hdbank: 'HDB',
  mb: 'MB',
  mbbank: 'MB',
  militarybank: 'MB',
  msb: 'MSB',
  ocb: 'OCB',
  sacombank: 'STB',
  scb: 'SCB',
  seabank: 'SEAB',
  shb: 'SHB',
  techcombank: 'TCB',
  tcb: 'TCB',
  tpbank: 'TPB',
  tpb: 'TPB',
  vcb: 'VCB',
  vietcombank: 'VCB',
  vba: 'AGRIBANK',
  vib: 'VIB',
  vietinbank: 'ICB',
  viettinbank: 'ICB',
  vietin: 'ICB',
  icb: 'ICB',
  vpbank: 'VPB',
  vpb: 'VPB',
};

function normalizeBankKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

export function resolveVietQrBankCode(bank?: string | null) {
  if (!bank) return '';
  const trimmed = bank.trim();
  if (!trimmed) return '';

  const normalized = normalizeBankKey(trimmed);
  const exactCode = BANK_CODE_ALIASES[normalized];
  if (exactCode) return exactCode;

  const containedAlias = Object.keys(BANK_CODE_ALIASES)
    .filter((alias) => alias.length >= 3)
    .sort((first, second) => second.length - first.length)
    .find((alias) => normalized.includes(alias));

  return containedAlias ? BANK_CODE_ALIASES[containedAlias] : trimmed.toUpperCase();
}

export function buildVietQrUrl({
  bank,
  account,
  accountName,
  memo,
  amount = 0,
}: {
  bank?: string | null;
  account?: string | null;
  accountName?: string | null;
  memo: string;
  amount?: number;
}) {
  const bankCode = resolveVietQrBankCode(bank);
  const accountNumber = account?.trim();

  if (!bankCode || !accountNumber) return '';

  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName || '')}`;
}
