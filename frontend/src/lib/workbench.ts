export type Api = {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: string[];
  keywords: string[];
};
export type Requirement = {
  id: string;
  title: string;
  evidence: string;
  apis: string[];
  fields: string[];
};
export type Analysis = {
  id: string;
  filename: string;
  title: string;
  text: string;
  requirements: Requirement[];
  mode: "sample" | "local" | "backend";
  created: string;
  raw?: any;
};
export const registry: Api[] = [
  {
    id: "kyc-pro",
    name: "Identity verification",
    category: "Compliance",
    description:
      "Match identity and onboarding requirements to PAN and Aadhaar verification fields.",
    fields: ["full_name", "pan_number", "aadhar_number", "date_of_birth"],
    keywords: ["kyc", "identity", "pan", "aadhaar", "aadhar", "verification"],
  },
  {
    id: "cibil",
    name: "Credit assessment",
    category: "Risk",
    description:
      "Map credit report and risk assessment requirements to the CIBIL adapter.",
    fields: ["pan_number", "credit_score", "date_of_birth"],
    keywords: ["cibil", "credit", "risk", "score"],
  },
  {
    id: "loan-origination",
    name: "Loan origination",
    category: "Lending",
    description:
      "Connect loan applications, amounts and repayment terms to the origination adapter.",
    fields: ["loan_amount", "loan_type", "tenure", "interest_rate"],
    keywords: ["loan", "lending", "tenure", "origination", "interest"],
  },
  {
    id: "bank-disbursal",
    name: "Bank disbursement",
    category: "Banking",
    description:
      "Map beneficiary details and fund transfers to the bank disbursement adapter.",
    fields: ["account_number", "ifsc_code", "bank_name", "loan_amount"],
    keywords: ["bank", "disbur", "account", "ifsc", "transfer"],
  },
  {
    id: "esign",
    name: "Electronic signature",
    category: "Documents",
    description:
      "Connect document signing and agreements to the e-sign adapter.",
    fields: ["document_id", "signer_name", "signature_date"],
    keywords: ["sign", "agreement", "contract"],
  },
  {
    id: "upi-gateway",
    name: "UPI payments",
    category: "Payments",
    description:
      "Map UPI transaction and payment requirements to the payment gateway adapter.",
    fields: ["upi_id", "amount", "transaction_id"],
    keywords: ["upi", "payment", "transaction"],
  },
  {
    id: "twilio",
    name: "SMS notifications",
    category: "Communication",
    description:
      "Connect SMS alerts and customer notifications to the messaging adapter.",
    fields: ["phone_number", "message", "notification_type"],
    keywords: ["sms", "notification", "alert", "message"],
  },
  {
    id: "salesforce",
    name: "Customer records",
    category: "CRM",
    description:
      "Map customer record and relationship management requirements to the CRM adapter.",
    fields: ["customer_id", "contact_name", "email"],
    keywords: ["crm", "customer record", "salesforce", "relationship"],
  },
];
export const sampleText = `INSTANT LOAN ORIGINATION
Business requirements · Sample specification

01 / Identity & onboarding
Verify customer identity using PAN and Aadhaar before onboarding. Collect full name and date of birth.

02 / Credit & eligibility
Retrieve a CIBIL credit report and assess the applicant's credit score before a lending decision.

03 / Loan application
Create a loan application with loan amount, tenure and interest rate.

04 / Agreement execution
Obtain an electronic signature on the approved loan agreement. Record document ID and signer name.

05 / Fund disbursement
Transfer funds to the verified bank account using account number and IFSC code.

06 / Customer notification
Send an SMS notification to the customer's phone number when the workflow completes.`;

const fieldAliases: Record<string, string[]> = {
  pan_number: ["pan"],
  aadhar_number: ["aadhaar", "aadhar"],
  notification_type: ["notification"],
  document_id: ["document id"],
  phone_number: ["phone number"],
  ifsc_code: ["ifsc"],
  credit_score: ["credit score"],
  full_name: ["full name"],
  signer_name: ["signer name"],
};
const sampleNames = [
  "Identity & onboarding",
  "Credit & eligibility",
  "Loan application",
  "Agreement execution",
  "Fund disbursement",
  "Customer notification",
];
export function analyzeText(
  text: string,
  filename: string,
  sample = false,
): Analysis {
  const blocks = sample
    ? text.split(/\n\n/).slice(1)
    : text
        .split(/\n+/)
        .map((x) => x.trim())
        .filter((x) => x.length > 12);
  const requirements = blocks.map((block, i) => {
    const evidence = sample ? block.split("\n").slice(1).join(" ") : block;
    const lower = evidence.toLowerCase();
    const apis = registry
      .filter((api) => api.keywords.some((keyword) => lower.includes(keyword)))
      .map((api) => api.id);
    const fields = [
      ...new Set(
        registry
          .filter((api) => apis.includes(api.id))
          .flatMap((api) => api.fields)
          .filter((field) =>
            (fieldAliases[field] || [field.replaceAll("_", " ")]).some(
              (alias) => lower.includes(alias),
            ),
          ),
      ),
    ];
    return {
      id: `REQ-${String(i + 1).padStart(2, "0")}`,
      title: sample ? sampleNames[i] : evidence.slice(0, 75),
      evidence,
      apis,
      fields,
    };
  });
  return {
    id: crypto.randomUUID(),
    filename,
    title: sample
      ? "Instant loan origination"
      : filename.replace(/\.[^.]+$/, ""),
    text,
    requirements,
    mode: sample ? "sample" : "local",
    created: new Date().toISOString(),
  };
}
export function normalizeBackend(raw: any, filename: string): Analysis {
  const result = raw.results?.[0];
  if (!result) throw new Error("The backend returned no document analysis.");
  const data = result.result ?? {};
  const sections: string[] = data.step_1_document_parsing?.sections ?? [];
  const mappings: Record<string, string | string[]> =
    result.field_to_api_mapping ??
    raw.intelligent_analysis?.field_mappings_auto_generated ??
    {};
  const requirements = Object.entries(mappings).map(([field, ids], i) => ({
    id: `REQ-${String(i + 1).padStart(2, "0")}`,
    title: field.replaceAll("_", " "),
    fields: [field],
    evidence:
      sections.find((section) =>
        section
          .toLowerCase()
          .includes(field.replaceAll("_", " ").toLowerCase()),
      ) ??
      "Extracted by the backend. No matching source sentence was returned.",
    apis: (Array.isArray(ids) ? ids : [ids]).filter((id) =>
      registry.some((api) => api.id === id),
    ),
  }));
  return {
    id: crypto.randomUUID(),
    filename,
    title: filename.replace(/\.[^.]+$/, ""),
    text: sections.join("\n\n"),
    requirements,
    mode: "backend",
    created: new Date().toISOString(),
    raw,
  };
}
export const initialSample = () =>
  analyzeText(sampleText, "instant-loan-brd.txt", true);
export function download(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
