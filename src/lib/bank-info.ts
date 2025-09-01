export const BANK_INFO = {
  company: 'SAFETAP SpA',
  rut: '78.238.689-1',
  bank: 'Banco de Chile',
  accountType: 'Cuenta Vista',
  accountNumber: '00-025-23252-41',
  email: 'pagos@safetap.cl',
} as const;

export interface PaymentReference {
  reference: string;
  amount: number;
  description?: string;
}

export const getBankInfoText = () => {
  return `Datos Bancarios SAFETAP:
Empresa: ${BANK_INFO.company}
RUT: ${BANK_INFO.rut}
Banco: ${BANK_INFO.bank}
Tipo de Cuenta: ${BANK_INFO.accountType}
Número de Cuenta: ${BANK_INFO.accountNumber}
Email: ${BANK_INFO.email}`;
};
