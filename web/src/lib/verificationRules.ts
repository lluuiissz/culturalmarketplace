// Deterministic rule-based artisan verification (study Objective 2).
// Fixed, published rules evaluated from stored data — the same evidence always
// yields the same verdict. A human admin makes the final call, but the
// checklist below is computed server-side and recorded in the audit log with
// every decision so approvals are traceable.
//
//   R1  Valid ID submitted (front + back)          — hard
//   R2  Government ID number on record             — advisory
//   R3  Selfie matches ID photo (face service)     — hard (service-down → warn)
//   R4  Proof of craft production uploaded         — hard
//   R5  Product sample 1 uploaded                  — hard
//   R6  Product sample 2 uploaded                  — hard

export interface VerificationEvidence {
  id_document_path?: string | null;
  id_document_back_path?: string | null;
  proof_of_craft_path?: string | null;
  product_sample_1_path?: string | null;
  product_sample_2_path?: string | null;
  selfie_path?: string | null;
  face_matched?: boolean | null;
  face_confidence?: number | null;
  id_number?: string | null;
}

export interface RuleResult {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export function evaluateVerificationRules(a: VerificationEvidence): RuleResult[] {
  const pct = a.face_confidence != null ? ` (${Math.round(Number(a.face_confidence) * 100)}% confidence)` : '';
  return [
    {
      id: 'R1', label: 'Valid ID submitted (front & back)',
      status: a.id_document_path && a.id_document_back_path ? 'pass' : 'fail',
      detail: a.id_document_path && a.id_document_back_path ? 'Both sides uploaded' : 'Front/back image missing',
    },
    {
      id: 'R2', label: 'Government ID number on record',
      status: a.id_number ? 'pass' : 'warn',
      detail: a.id_number ?? 'Not provided — OCR cross-check unavailable',
    },
    {
      id: 'R3', label: 'Selfie matches ID photo',
      status: a.face_matched === true ? 'pass' : a.face_matched === false ? 'fail' : 'warn',
      detail:
        a.face_matched === true ? `Face matched${pct}` :
        a.face_matched === false ? 'Face did not match — manual review required' :
        'Face check unavailable — manual review required',
    },
    {
      id: 'R4', label: 'Proof of craft production',
      status: a.proof_of_craft_path ? 'pass' : 'fail',
      detail: a.proof_of_craft_path ? 'Uploaded' : 'Not submitted',
    },
    {
      id: 'R5', label: 'Product sample 1 of 2',
      status: a.product_sample_1_path ? 'pass' : 'fail',
      detail: a.product_sample_1_path ? 'Uploaded' : 'Not submitted',
    },
    {
      id: 'R6', label: 'Product sample 2 of 2',
      status: a.product_sample_2_path ? 'pass' : 'fail',
      detail: a.product_sample_2_path ? 'Uploaded' : 'Not submitted',
    },
  ];
}

export function rulesSummary(rules: RuleResult[]): { canApprove: boolean; text: string } {
  const fails = rules.filter((r) => r.status === 'fail').length;
  const warns = rules.filter((r) => r.status === 'warn').length;
  return {
    canApprove: fails === 0,
    text: fails === 0
      ? warns > 0
        ? `All required rules satisfied — ${warns} item(s) need human judgement`
        : 'All rules satisfied — recommended: approve'
      : `Cannot approve: ${fails} required item(s) missing`,
  };
}

/** Compact snapshot for audit-log descriptions, e.g. "R1✓ R2✓ R3✓(pass) R4✗" style. */
export function rulesSnapshot(rules: RuleResult[]): string {
  const mark = { pass: '✓', warn: '⚠', fail: '✗' } as const;
  return rules.map((r) => `${r.id}${mark[r.status]}`).join(' ');
}
