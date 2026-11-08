// Demo workspace data shown across the Breakout screens (Acme Security / PRODUCTION).

export type Severity = 1 | 2 | 3;
export type ResponseStatus = "Triage" | "Investigating" | "Containing" | "Monitoring";

export interface Incident {
  id: string;
  title: string;
  source: string;
  severity: Severity;
  status: ResponseStatus;
  owner: string;
  age: string;
}

export const incidents: Incident[] = [
  { id: "INC-1042", title: "Ransomware activity on Finance endpoints", source: "CrowdStrike · 8 endpoints", severity: 1, status: "Investigating", owner: "Sarah Chen", age: "46m" },
  { id: "INC-1041", title: "Privileged account compromise", source: "Microsoft Entra ID · 1 identity", severity: 2, status: "Containing", owner: "Alex Morgan", age: "1h 18m" },
  { id: "INC-1039", title: "Suspicious outbound data transfer", source: "Palo Alto · api-prod-03", severity: 2, status: "Monitoring", owner: "James Wilson", age: "2h 05m" },
  { id: "INC-1038", title: "Credential phishing campaign", source: "Proofpoint · 14 mailboxes", severity: 3, status: "Investigating", owner: "Maya Patel", age: "2h 42m" },
  { id: "INC-1037", title: "Unusual service account authentication", source: "Microsoft Entra ID · svc-backup", severity: 3, status: "Triage", owner: "James Wilson", age: "3h 11m" },
];

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  deltaNote: string;
  tone: "danger" | "success";
  trend: number[];
}

export const kpis: Kpi[] = [
  { label: "Active incidents", value: "5", delta: "1 critical", deltaNote: "requires attention", tone: "danger", trend: [2, 4, 3, 5, 4, 6, 7] },
  { label: "Mean time to acknowledge", value: "4m 32s", delta: "↓ 18%", deltaNote: "vs. previous 7 days", tone: "success", trend: [5, 6, 3, 5, 4, 5, 2] },
  { label: "Mean time to contain", value: "32m", delta: "↓ 12%", deltaNote: "vs. previous 7 days", tone: "success", trend: [6, 5, 5.5, 4, 4.2, 2.5, 1.5] },
  { label: "Resolved today", value: "12", delta: "+3", deltaNote: "vs. yesterday by 10:00", tone: "success", trend: [1, 2, 2, 4, 3.5, 5, 7] },
];

export const activity = [
  { time: "09:58", kind: "shield", title: "Account sessions revoked", meta: "Alex Morgan · INC-1041 · 1 identity" },
  { time: "09:56", kind: "approval", title: "Containment approval requested", meta: "Sarah Chen · INC-1042 · 2 endpoints" },
  { time: "09:47", kind: "resolved", title: "Malicious inbox rule removed", meta: "Maya Patel · INC-1036 · Resolved" },
  { time: "09:41", kind: "monitor", title: "Moved to monitoring", meta: "James Wilson · INC-1039 · No further egress" },
] as const;

export type Role = "Administrator" | "Incident commander" | "Responder" | "Observer";
export const roles: Role[] = ["Administrator", "Incident commander", "Responder", "Observer"];

export interface Member {
  name: string;
  email: string;
  role: Role;
  scope: string;
  auth: "SSO + MFA" | "Pending setup";
  status: "Active" | "Invited";
  lastActive: string;
  you?: boolean;
}

export const members: Member[] = [
  { name: "Elena Brooks", email: "elena.brooks@acme.com", role: "Administrator", scope: "All incidents", auth: "SSO + MFA", status: "Active", lastActive: "09:42 UTC" },
  { name: "Alex Morgan", email: "alex.morgan@acme.com", role: "Incident commander", scope: "All incidents", auth: "SSO + MFA", status: "Active", lastActive: "Online now", you: true },
  { name: "Sarah Chen", email: "sarah.chen@acme.com", role: "Responder", scope: "Assigned incidents", auth: "SSO + MFA", status: "Active", lastActive: "09:58 UTC" },
  { name: "James Wilson", email: "james.wilson@acme.com", role: "Responder", scope: "Assigned incidents", auth: "SSO + MFA", status: "Active", lastActive: "09:51 UTC" },
  { name: "Maya Patel", email: "maya.patel@acme.com", role: "Responder", scope: "Assigned incidents", auth: "SSO + MFA", status: "Active", lastActive: "09:47 UTC" },
  { name: "Noah Davis", email: "noah.davis@acme.com", role: "Observer", scope: "Assigned incidents", auth: "Pending setup", status: "Invited", lastActive: "Not yet joined" },
];

/** Least-privilege matrix: per permission, the value for each role in `roles` order. */
export const permissions: { label: string; locked?: boolean; values: string[] }[] = [
  { label: "View incidents & evidence", values: ["All incidents", "All incidents", "Assigned only", "Assigned only"] },
  { label: "Investigate & run playbooks", values: ["Allowed", "Allowed", "Allowed", "Denied"] },
  { label: "Request containment", values: ["Allowed", "Allowed", "Allowed", "Denied"] },
  { label: "Approve containment & isolate assets", locked: true, values: ["Allowed", "Allowed", "Denied", "Denied"] },
  { label: "Export evidence", locked: true, values: ["Allowed", "Allowed", "Denied", "Denied"] },
  { label: "Manage members, roles & integrations", locked: true, values: ["Allowed", "Denied", "Denied", "Denied"] },
];

export const containment = {
  incidentId: "INC-1042",
  requestId: "CTR-1042-02",
  trace: "cs-7f8a2d",
  endpoints: [
    { host: "FIN-WS-023", ip: "10.24.8.23", detection: "Encryption behavior", user: "Finance · j.miller", lastSeen: "09:59:42" },
    { host: "FIN-WS-041", ip: "10.24.8.41", detection: "Lateral movement", user: "Finance · r.ortiz", lastSeen: "09:59:38" },
  ],
  events: [
    { time: "09:56:00", level: "AUDIT", title: "Containment approval requested", detail: "Sarah Chen · Isolate FIN-WS-023 and FIN-WS-041." },
    { time: "09:56:01", level: "INFO", title: "Scope validated", detail: "2 hosts resolved in Acme Security / PRODUCTION." },
    { time: "09:56:02", level: "INFO", title: "Preflight started · no execution", detail: "Checking connector permissions and host availability." },
    { time: "09:56:03", level: "ERROR", title: "CrowdStrike permission check failed", detail: "HTTP 403 · Missing Hosts: Write scope on connector token." },
    { time: "09:56:03", level: "WARN", title: "Execution gate closed", detail: "0 commands sent. Approval pending; preflight must pass." },
    { time: "10:00:00", level: "AUDIT", title: "Review opened by Alex Morgan", detail: "Incident commander · Awaiting remediation and approval." },
  ] as { time: string; level: "AUDIT" | "INFO" | "ERROR" | "WARN"; title: string; detail: string }[],
};
