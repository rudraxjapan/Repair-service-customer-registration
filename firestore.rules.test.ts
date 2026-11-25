/**
 * Security Rule Payload Verification Matrix ("Dirty Dozen")
 *
 * Documents the 12 adversarial test cases enforced by firestore.rules.
 * Can be executed against the Firebase Local Emulator Suite when Java is available.
 */
export interface AdversarialPayloadCase {
  id: number;
  name: string;
  targetPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const dirtyDozenCases: AdversarialPayloadCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Customer Create',
    targetPath: 'customers/uid_B',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { uid: 'uid_B', fullName: 'Attacker' }
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Customer Create',
    targetPath: 'customers/uid_A',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { uid: 'uid_A', isAdmin: true }
  },
  {
    id: 3,
    name: 'PII Blanket Read',
    targetPath: 'customers/uid_B',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {}
  },
  {
    id: 4,
    name: 'Unscoped Customer List by Non-Admin',
    targetPath: 'customers',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {}
  },
  {
    id: 5,
    name: 'Orphaned Repair Request Without Customer Profile',
    targetPath: 'repairRequests/REP-1001',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { requestId: 'REP-1001', status: 'Pending' }
  },
  {
    id: 6,
    name: 'Status Shortcutting on Create',
    targetPath: 'repairRequests/REP-1002',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { requestId: 'REP-1002', status: 'Completed' }
  },
  {
    id: 7,
    name: 'Unauthorized Status Escalation by Customer',
    targetPath: 'repairRequests/REP-1002',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { status: 'Accepted' }
  },
  {
    id: 8,
    name: 'Terminal State Modification by Customer',
    targetPath: 'repairRequests/REP-1002',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { status: 'Pending' }
  },
  {
    id: 9,
    name: 'Resource Poisoning via Oversized ID',
    targetPath: `repairRequests/${'A'.repeat(300)}`,
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {}
  },
  {
    id: 10,
    name: 'Timestamp Forgery',
    targetPath: 'customers/uid_A',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { createdAt: '2020-01-01T00:00:00Z' }
  },
  {
    id: 11,
    name: 'Unscoped Repair Request List by Non-Admin',
    targetPath: 'repairRequests',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: {}
  },
  {
    id: 12,
    name: 'Self-Admin Privilege Escalation',
    targetPath: 'admins/uid_A',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    payload: { uid: 'uid_A', role: 'admin' }
  }
];
