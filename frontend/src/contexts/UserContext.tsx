import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { fetchFounderProjects, type FounderProject } from "@/lib/api/projects";
import { fetchHackathonRegistrations } from "@/lib/api/hackathon";
import { useAuth, type Profile as AuthProfile } from "@/contexts/AuthContext";

export interface PortfolioCompany {
  id: string;
  name: string;
  stage: string;
  outcome: "Active" | "Exited" | "Failed" | "Acquired";
}

export interface InvestorProfile {
  // Step 1
  investorType: string;
  location: string;
  fundSize: string;
  yearsInvesting: number;

  // Step 2
  industries: string[];
  stage: string;
  checkSize: string;

  // Step 3
  portfolio: PortfolioCompany[];

  // Step 4
  riskAppetite: string;

  // Step 5
  dashboardMetrics: string[];
}

export type OrgVerificationStatus = "unverified" | "pending" | "verified";

export interface OrgTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type OrgPlan = "free" | "growth" | "enterprise";

export interface OrgProfile {
  // Step 1 — Identity
  orgName: string;
  orgType: string;
  location: string;
  registrationNumber: string;
  foundingYear: number;
  website: string;

  // Step 2 — Verification
  verificationStatus: OrgVerificationStatus;
  verificationDocs: string[]; // file names (mock — no real upload)
  businessEmailDomain: string;

  // Step 3 — Programmes & Focus
  programmes: string[]; // e.g. ["Hackathons", "Accelerator", "Grants", "Mentorship"]
  sectors: string[];
  geographies: string[];

  // Step 4 — Team
  teamMembers: OrgTeamMember[];

  // Step 5 — Plan
  plan: OrgPlan;
}

export type CollaboratorDiscipline =
  | "Engineering"
  | "Design"
  | "Product"
  | "Data & ML"
  | "DevOps"
  | "Security"
  | "Marketing"
  | "Research";

export type Role = "founder" | "collaborator" | "investor" | "org";

export interface NotificationPrefs {
  opportunities: { email: boolean; inApp: boolean };
  deadlines:     { email: boolean; inApp: boolean };
  payments:      { email: boolean; inApp: boolean };
  equityEvents:  { email: boolean; inApp: boolean };
  quietHours:    "off" | "10pm-8am" | "weekends";
}

export interface CollaboratorProfile {
  // Step 1 — Identity
  name: string;
  title: string;
  location: string;
  yearsExperience: number;
  headline: string;
  avatarUrl: string;

  // Step 2 — Discipline & sub-skills
  discipline: CollaboratorDiscipline | "";
  subSkills: string[];

  // Step 3 — Tech stack
  techStack: string[];

  // Step 4 — Availability
  weeklyHours: number;
  timezone: string;
  earliestStart: "this-week" | "2-weeks" | "1-month";
  commitmentStyle: "deep" | "parallel" | "many";

  // Step 5 — Mission: Building for Equity
  equityPreference: number;
  minCashFloor: number;
  vestingComfort: "standard" | "1y-cliff-4y" | "custom";

  // Step 6 — Portfolio & goals
  links: { github: string; linkedin: string; portfolio: string; twitter: string };
  whyHere: string;
  pinnedWork: string[];

  // Status / settings
  onboardingComplete: boolean;
  notifications: NotificationPrefs;
}

export type FounderStage = "Idea" | "MVP" | "Beta" | "Launch" | "Growth";
export type FounderExperience = "first-time" | "some-experience" | "serial";
export type LaunchStatus = "pre-launch" | "private-beta" | "public";
export type CompModel = "equity-heavy" | "cash-equity-mix" | "cash-heavy";
export type OwnershipPhilosophy = "equity-day-one" | "cash-first-equity-later" | "custom";
export type OpenRole =
  | "Frontend Engineer" | "Backend Engineer" | "Full-stack Engineer"
  | "ML Engineer" | "Designer (Product)" | "Designer (Visual)"
  | "Product Manager" | "Data Scientist" | "DevOps Engineer"
  | "Growth Marketer" | "Content / Copy" | "Founder Associate";

export interface FounderVerification {
  twitter:      { handle: string;   verified: boolean };
  linkedin:     { url: string;      verified: boolean };
  personalSite: { url: string;      verified: boolean };
  github:       { username: string; verified: boolean };
  nin: {
    country: string;
    docType: "nin" | "passport" | "driver-license";
    docNumber: string;
    status: "unverified" | "pending" | "verified";
  };
}

export interface FounderNotificationPrefs {
  applications:  { email: boolean; inApp: boolean };
  investors:     { email: boolean; inApp: boolean };
  workspace:     { email: boolean; inApp: boolean };
  opportunities: { email: boolean; inApp: boolean };
  quietHours:    "off" | "10pm-8am" | "weekends";
}

export interface HackathonTeamMember {
  collaboratorId: string;
  name: string;
  role: string;
  acceptedAt: string;
}

export interface IdeaBrief {
  problem:        string;  // 7 fields, all required, validated min 20 chars each
  targetUser:     string;
  solutionSketch: string;
  whyNow:         string;
  differentiator: string;
  risk:           string;
  successMetric:  string;
  submittedAt:    string;  // ISO timestamp; presence = locked (read-only)
}

export interface BriefScore {
  problemClarity: number;  // 0-100, three sub-scores
  innovationGap:  number;
  initialImpact:  number;
  overall:        number;  // weighted avg: 0.4*problemClarity + 0.3*innovationGap + 0.3*initialImpact
  critiques: {
    problemClarity: string[];
    innovationGap:  string[];
    initialImpact:  string[];
  };
  computedAt: string;       // pinned at submit; never re-runs
}

export interface CheckIn {
  id:        string;        // crypto-token (8-char base32, same pattern as invite tokens)
  loggedAt:  string;        // ISO timestamp
  status:    "on-track" | "blocked" | "pivoted";
  update:    string;        // 1-line, max 140 chars
  blocker?:  string;        // optional, only if status = "blocked"
}

export interface FinalSubmission {
  demoUrl:     string;   // validated http(s) URL
  deckUrl:     string;   // validated http(s) URL
  videoUrl:    string;   // validated http(s) URL
  summary:     string;   // min 40 chars
  submittedAt: string;   // ISO timestamp; presence ⇒ locked + stage advanced
}

export interface JudgeFeedback {
  placement:  number;    // 1..cohortSize (deterministic mock rank)
  cohortSize: number;    // mock cohort size
  comments:   string[];  // canned judge strings keyed to score signals
  judgedAt:   string;    // ISO timestamp, pinned at submit
}

export interface TeamWorkspaceIdea {
  problem: string; targetUser: string; solutionSketch: string; whyNow: string;
  differentiator: string; risk: string; successMetric: string;
}
export interface TeamWorkspaceMemberRef { collaboratorId: string; name: string; role: string; }
export interface TeamWorkspaceArtifacts { demoUrl: string; deckUrl: string; videoUrl: string; }
export interface TeamWorkspace {
  id: string;
  hackathonId: string;
  teamId: string;
  teamName: string;
  createdAt: string;
  idea: TeamWorkspaceIdea | null;
  team: TeamWorkspaceMemberRef[];
  artifacts: TeamWorkspaceArtifacts | null;
  projectId?: string;
}

export interface HackathonRegistration {
  hackathonId: string;
  teamId: string;
  teamName: string;
  teamSize: number;
  role: "leader" | "member";
  inviteToken: string;
  registeredAt: string;
  members: HackathonTeamMember[];
  openRoles: OpenRole[];
  stage: "registered" | "submitted" | "building" | "submitted-final";
  rosterClosed?: boolean;
  brief?:      IdeaBrief;     // present once submitted; absence gates Build stage
  briefScore?: BriefScore;    // pinned at submit
  checkIns:    CheckIn[];     // default []
  finalSubmission?: FinalSubmission;  // present once final pitch submitted
  judgeFeedback?:   JudgeFeedback;    // pinned at submit, never re-runs
  workspaceId?: string;
  promotedProjectId?: string;
}

export interface FounderProfile {
  // Step 1
  name: string;
  title: string;
  location: string;
  yearsBuilding: number;
  founderType: FounderExperience;
  headline: string;
  avatarUrl: string;
  // Step 2
  startupName: string;
  oneLiner: string;
  stage: FounderStage;
  industries: string[];
  foundingYear: number;
  website: string;
  logoEmoji: string;
  // Step 3
  currentTeamSize: number;
  openRoles: OpenRole[];
  compensationOffered: CompModel;
  equityRangeMin: number;
  equityRangeMax: number;
  // Step 4
  launchStatus: LaunchStatus;
  users: number;
  revenueMonthly: number;
  fundingRaised: number;
  leadInvestor: string;
  nextMilestone: string;
  // Step 5
  whyBuilding: string;
  winningIn3Years: string;
  unfairAdvantage: string;
  ownershipPhilosophy: OwnershipPhilosophy;
  // Step 6
  links: { github: string; linkedin: string; twitter: string; personal: string };
  needsFromTechIT: string[];
  pinnedWork: string[];
  // Status
  onboardingComplete: boolean;
  verification: FounderVerification;
  notifications: FounderNotificationPrefs;
  // Hackathon participation (PR-B)
  hackathonRegistrations: HackathonRegistration[];
  founderProjects: FounderProject[];
  teamWorkspaces: TeamWorkspace[];
}

interface UserContextType {
  investorProfile: InvestorProfile;
  updateInvestorProfile: (updates: Partial<InvestorProfile>) => void;
  orgProfile: OrgProfile;
  updateOrgProfile: (updates: Partial<OrgProfile>) => void;
  collaboratorProfile: CollaboratorProfile;
  updateCollaboratorProfile: (updates: Partial<CollaboratorProfile>) => void;
  founderProfile: FounderProfile;
  updateFounderProfile: (updates: Partial<FounderProfile>) => void;
  registerForHackathon: (reg: HackathonRegistration) => void;
  updateHackathonRegistration: (
    teamId: string,
    updates: Partial<Omit<HackathonRegistration, "hackathonId" | "teamId" | "registeredAt">>,
  ) => void;
  submitBrief: (teamId: string, brief: IdeaBrief, score: BriefScore) => void;
  addCheckIn: (teamId: string, checkIn: CheckIn) => void;
  submitFinal: (teamId: string, submission: FinalSubmission, feedback: JudgeFeedback) => void;
  addFounderProject: (project: FounderProject) => void;
  addTeamWorkspace: (ws: TeamWorkspace) => void;
  bindTeamWorkspaceProject: (workspaceId: string, projectId: string) => void;
}

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  opportunities: { email: true, inApp: true },
  deadlines:     { email: true, inApp: true },
  payments:      { email: true, inApp: true },
  equityEvents:  { email: true, inApp: true },
  quietHours:    "off",
};

const DEFAULT_FOUNDER_NOTIFICATIONS: FounderNotificationPrefs = {
  applications:  { email: true, inApp: true },
  investors:     { email: true, inApp: true },
  workspace:     { email: true, inApp: true },
  opportunities: { email: true, inApp: true },
  quietHours:    "off",
};

function displayName(profile: AuthProfile | null): string {
  if (!profile) return "";
  const fullName = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  return fullName || profile.username || profile.email?.split("@")[0] || "";
}

function hasRole(profile: AuthProfile | null, role: Role): boolean {
  if (!profile) return false;
  const authRole = role === "org" ? "organisation" : role;
  return profile.role === authRole || profile.secondaryRoles.includes(authRole as AuthProfile["role"]);
}

function normalizedFounderStage(stage: string | null | undefined): FounderStage {
  if (stage === "Idea" || stage === "MVP" || stage === "Beta" || stage === "Launch" || stage === "Growth") return stage;
  const lower = String(stage ?? "").toLowerCase();
  if (lower === "mvp") return "MVP";
  if (lower === "beta") return "Beta";
  if (lower === "launch") return "Launch";
  if (lower === "growth") return "Growth";
  return "Idea";
}

function emptyInvestorProfile(profile: AuthProfile | null = null): InvestorProfile {
  return {
    investorType: "",
    location: profile?.country ?? "",
    fundSize: "",
    yearsInvesting: 0,
    industries: profile?.investmentFocus ?? [],
    stage: "",
    checkSize: profile?.ticketSize ?? "",
    portfolio: [],
    riskAppetite: profile?.riskTolerance ?? "",
    dashboardMetrics: [],
  };
}

function emptyOrgProfile(profile: AuthProfile | null = null): OrgProfile {
  return {
    orgName: profile?.orgName ?? "",
    orgType: profile?.orgType ?? "",
    location: profile?.country ?? "",
    registrationNumber: "",
    foundingYear: new Date().getFullYear(),
    website: profile?.website ?? "",
    verificationStatus: profile?.isVerified ? "verified" : "unverified",
    verificationDocs: [],
    businessEmailDomain: profile?.website ? profile.website.replace(/^https?:\/\//, "").split("/")[0] : "",
    programmes: [],
    sectors: profile?.industries ?? [],
    geographies: profile?.country ? [profile.country] : [],
    teamMembers: [],
    plan: "free",
  };
}

function emptyCollaboratorProfile(profile: AuthProfile | null = null): CollaboratorProfile {
  return {
    name: displayName(profile),
    title: "",
    location: profile?.country ?? "",
    yearsExperience: 0,
    headline: profile?.bio ?? "",
    avatarUrl: profile?.avatarUrl ?? "",
    discipline: "",
    subSkills: profile?.skills ?? [],
    techStack: profile?.skills ?? [],
    weeklyHours: profile?.weeklyHours ?? 0,
    timezone: profile?.timezone ?? "",
    earliestStart: "this-week",
    commitmentStyle: "deep",
    equityPreference: 0,
    minCashFloor: 0,
    vestingComfort: "standard",
    links: {
      github: profile?.githubUrl ?? "",
      linkedin: profile?.linkedinUrl ?? "",
      portfolio: profile?.portfolioUrl ?? "",
      twitter: "",
    },
    whyHere: "",
    pinnedWork: [],
    onboardingComplete: Boolean(profile?.isOnboarded && hasRole(profile, "collaborator")),
    notifications: DEFAULT_NOTIFICATIONS,
  };
}

function emptyFounderProfile(profile: AuthProfile | null = null): FounderProfile {
  return {
    name: displayName(profile),
    title: "",
    location: profile?.country ?? "",
    yearsBuilding: 0,
    founderType: "first-time",
    headline: profile?.bio ?? "",
    avatarUrl: profile?.avatarUrl ?? "",
    startupName: profile?.orgName ?? "",
    oneLiner: "",
    stage: normalizedFounderStage(profile?.startupStage),
    industries: profile?.industries ?? [],
    foundingYear: new Date().getFullYear(),
    website: profile?.website ?? "",
    logoEmoji: "",
    currentTeamSize: 0,
    openRoles: [],
    compensationOffered: "equity-heavy",
    equityRangeMin: 0,
    equityRangeMax: 0,
    launchStatus: "pre-launch",
    users: 0,
    revenueMonthly: 0,
    fundingRaised: 0,
    leadInvestor: "",
    nextMilestone: "",
    whyBuilding: "",
    winningIn3Years: "",
    unfairAdvantage: "",
    ownershipPhilosophy: "equity-day-one",
    links: {
      github: profile?.githubUrl ?? "",
      linkedin: profile?.linkedinUrl ?? "",
      twitter: "",
      personal: profile?.website ?? "",
    },
    needsFromTechIT: [],
    pinnedWork: [],
    onboardingComplete: Boolean(profile?.isOnboarded && hasRole(profile, "founder")),
    verification: {
      twitter:      { handle: "", verified: false },
      linkedin:     { url: profile?.linkedinUrl ?? "", verified: Boolean(profile?.linkedinUrl && profile.isVerified) },
      personalSite: { url: profile?.website ?? "", verified: Boolean(profile?.website && profile.isVerified) },
      github:       { username: profile?.githubUrl ?? "", verified: Boolean(profile?.githubUrl && profile.isVerified) },
      nin: { country: profile?.country ?? "", docType: "nin", docNumber: "", status: "unverified" },
    },
    notifications: DEFAULT_FOUNDER_NOTIFICATIONS,
    hackathonRegistrations: [],
    founderProjects: [],
    teamWorkspaces: [],
  };
}

function mergeAuthFounderProfile(prev: FounderProfile, profile: AuthProfile): FounderProfile {
  const base = emptyFounderProfile(profile);
  return {
    ...prev,
    name: prev.name || base.name,
    location: prev.location || base.location,
    headline: prev.headline || base.headline,
    avatarUrl: prev.avatarUrl || base.avatarUrl,
    startupName: prev.startupName || base.startupName,
    stage: prev.stage || base.stage,
    industries: prev.industries.length ? prev.industries : base.industries,
    website: prev.website || base.website,
    links: {
      github: prev.links.github || base.links.github,
      linkedin: prev.links.linkedin || base.links.linkedin,
      twitter: prev.links.twitter,
      personal: prev.links.personal || base.links.personal,
    },
    onboardingComplete: prev.onboardingComplete || base.onboardingComplete,
    verification: {
      ...prev.verification,
      linkedin: {
        url: prev.verification.linkedin.url || base.verification.linkedin.url,
        verified: prev.verification.linkedin.verified || base.verification.linkedin.verified,
      },
      personalSite: {
        url: prev.verification.personalSite.url || base.verification.personalSite.url,
        verified: prev.verification.personalSite.verified || base.verification.personalSite.verified,
      },
      github: {
        username: prev.verification.github.username || base.verification.github.username,
        verified: prev.verification.github.verified || base.verification.github.verified,
      },
      nin: { ...prev.verification.nin, country: prev.verification.nin.country || base.verification.nin.country },
    },
  };
}

function mergeAuthCollaboratorProfile(prev: CollaboratorProfile, profile: AuthProfile): CollaboratorProfile {
  const base = emptyCollaboratorProfile(profile);
  return {
    ...prev,
    name: prev.name || base.name,
    location: prev.location || base.location,
    headline: prev.headline || base.headline,
    avatarUrl: prev.avatarUrl || base.avatarUrl,
    subSkills: prev.subSkills.length ? prev.subSkills : base.subSkills,
    techStack: prev.techStack.length ? prev.techStack : base.techStack,
    weeklyHours: prev.weeklyHours || base.weeklyHours,
    timezone: prev.timezone || base.timezone,
    links: {
      github: prev.links.github || base.links.github,
      linkedin: prev.links.linkedin || base.links.linkedin,
      portfolio: prev.links.portfolio || base.links.portfolio,
      twitter: prev.links.twitter,
    },
    onboardingComplete: prev.onboardingComplete || base.onboardingComplete,
  };
}

function mergeAuthInvestorProfile(prev: InvestorProfile, profile: AuthProfile): InvestorProfile {
  const base = emptyInvestorProfile(profile);
  return {
    ...prev,
    location: prev.location || base.location,
    industries: prev.industries.length ? prev.industries : base.industries,
    checkSize: prev.checkSize || base.checkSize,
    riskAppetite: prev.riskAppetite || base.riskAppetite,
  };
}

function mergeAuthOrgProfile(prev: OrgProfile, profile: AuthProfile): OrgProfile {
  const base = emptyOrgProfile(profile);
  return {
    ...prev,
    orgName: prev.orgName || base.orgName,
    orgType: prev.orgType || base.orgType,
    location: prev.location || base.location,
    website: prev.website || base.website,
    verificationStatus: prev.verificationStatus !== "unverified" ? prev.verificationStatus : base.verificationStatus,
    businessEmailDomain: prev.businessEmailDomain || base.businessEmailDomain,
    sectors: prev.sectors.length ? prev.sectors : base.sectors,
    geographies: prev.geographies.length ? prev.geographies : base.geographies,
  };
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile>(() => emptyInvestorProfile(profile));

  const updateInvestorProfile = (updates: Partial<InvestorProfile>) => {
    setInvestorProfile((prev) => ({ ...prev, ...updates }));
  };

  const [orgProfile, setOrgProfile] = useState<OrgProfile>(() => emptyOrgProfile(profile));

  const updateOrgProfile = (updates: Partial<OrgProfile>) => {
    setOrgProfile((prev) => ({ ...prev, ...updates }));
  };

  const [collaboratorProfile, setCollaboratorProfile] = useState<CollaboratorProfile>(() => emptyCollaboratorProfile(profile));

  /**
   * Shallow merge — for nested fields like `notifications` or `links`, callers must spread the
   * existing sub-object themselves, e.g. `updateCollaboratorProfile({ notifications: { ...prev.notifications, quietHours: "weekends" } })`.
   */
  const updateCollaboratorProfile = (updates: Partial<CollaboratorProfile>) => {
    setCollaboratorProfile((prev) => ({ ...prev, ...updates }));
  };

  const [founderProfile, setFounderProfile] = useState<FounderProfile>(() => emptyFounderProfile(profile));

  useEffect(() => {
    if (!user) {
      setInvestorProfile(emptyInvestorProfile());
      setOrgProfile(emptyOrgProfile());
      setCollaboratorProfile(emptyCollaboratorProfile());
      setFounderProfile(emptyFounderProfile());
      return;
    }
    if (!profile) return;

    setInvestorProfile((prev) => mergeAuthInvestorProfile(prev, profile));
    setOrgProfile((prev) => mergeAuthOrgProfile(prev, profile));
    setCollaboratorProfile((prev) => mergeAuthCollaboratorProfile(prev, profile));
    setFounderProfile((prev) => mergeAuthFounderProfile(prev, profile));
  }, [user, profile]);

  useEffect(() => {
    if (!user || !profile || !hasRole(profile, "founder")) return;
    let alive = true;
    fetchFounderProjects()
      .then((projects) => {
        if (alive) setFounderProfile((prev) => ({ ...prev, founderProjects: projects }));
      })
      .catch((error) => {
        if (typeof console !== "undefined") console.warn("[UserContext] founder projects unavailable", error);
      });
    return () => { alive = false; };
  }, [user, profile]);

  useEffect(() => {
    if (!user || !profile) return;
    let alive = true;
    fetchHackathonRegistrations()
      .then((registrations) => {
        if (alive) {
          setFounderProfile((prev) => ({ ...prev, hackathonRegistrations: registrations }));
        }
      })
      .catch((error) => {
        if (typeof console !== "undefined") {
          console.warn("[UserContext] hackathon registrations unavailable", error);
        }
      });
    return () => { alive = false; };
  }, [user, profile]);

  /**
   * Shallow merge — for nested fields like `verification`, `notifications`, or `links`,
   * callers must spread the existing sub-object themselves,
   * e.g. updateFounderProfile({ notifications: { ...prev.notifications, quietHours: "weekends" } }).
   */
  const updateFounderProfile = (updates: Partial<FounderProfile>) => {
    setFounderProfile((prev) => ({ ...prev, ...updates }));
  };

  const registerForHackathon = (reg: HackathonRegistration) => {
    setFounderProfile((prev) => ({
      ...prev,
      hackathonRegistrations: [
        ...prev.hackathonRegistrations.filter((item) => item.teamId !== reg.teamId),
        { ...reg, checkIns: reg.checkIns ?? [] },
      ],
    }));
  };

  const submitBrief = (teamId: string, brief: IdeaBrief, score: BriefScore) => {
    setFounderProfile((prev) => ({
      ...prev,
      hackathonRegistrations: prev.hackathonRegistrations.map((r) =>
        r.teamId === teamId
          ? { ...r, brief, briefScore: score, stage: "submitted" as const }
          : r,
      ),
    }));
  };

  const addCheckIn = (teamId: string, checkIn: CheckIn) => {
    setFounderProfile((prev) => ({
      ...prev,
      hackathonRegistrations: prev.hackathonRegistrations.map((r) =>
        r.teamId === teamId
          ? { ...r, checkIns: [...(r.checkIns ?? []), checkIn], stage: "building" as const }
          : r,
      ),
    }));
  };

  const submitFinal = (teamId: string, submission: FinalSubmission, feedback: JudgeFeedback) => {
    setFounderProfile((prev) => ({
      ...prev,
      hackathonRegistrations: prev.hackathonRegistrations.map((r) =>
        r.teamId === teamId
          ? { ...r, finalSubmission: submission, judgeFeedback: feedback, stage: "submitted-final" as const }
          : r,
      ),
    }));
  };

  const addFounderProject = (project: FounderProject) => {
    setFounderProfile((prev) => ({ ...prev, founderProjects: [...prev.founderProjects, project] }));
  };

  const addTeamWorkspace = (ws: TeamWorkspace) => {
    setFounderProfile((prev) => ({ ...prev, teamWorkspaces: [...prev.teamWorkspaces, ws] }));
  };

  const bindTeamWorkspaceProject = (workspaceId: string, projectId: string) => {
    setFounderProfile((prev) => ({
      ...prev,
      teamWorkspaces: prev.teamWorkspaces.map((w) => (w.id === workspaceId ? { ...w, projectId } : w)),
    }));
  };

  const updateHackathonRegistration = (
    teamId: string,
    updates: Partial<Omit<HackathonRegistration, "hackathonId" | "teamId" | "registeredAt">>,
  ) => {
    setFounderProfile((prev) => ({
      ...prev,
      hackathonRegistrations: prev.hackathonRegistrations.map((r) =>
        r.teamId === teamId ? { ...r, ...updates } : r,
      ),
    }));
  };

  return (
    <UserContext.Provider
      value={{
        investorProfile,
        updateInvestorProfile,
        orgProfile,
        updateOrgProfile,
        collaboratorProfile,
        updateCollaboratorProfile,
        founderProfile,
        updateFounderProfile,
        registerForHackathon,
        updateHackathonRegistration,
        submitBrief,
        addCheckIn,
        submitFinal,
        addFounderProject,
        addTeamWorkspace,
        bindTeamWorkspaceProject,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// Convenience hook for investor profile
export function useInvestorProfile() {
  const { investorProfile, updateInvestorProfile } = useUser();
  return { investorProfile, updateInvestorProfile };
}

// Convenience hook for organization profile
export function useOrgProfile() {
  const { orgProfile, updateOrgProfile } = useUser();
  return { orgProfile, updateOrgProfile };
}

// Convenience hook for collaborator profile
export function useCollaboratorProfile() {
  const { collaboratorProfile, updateCollaboratorProfile } = useUser();
  return { collaboratorProfile, updateCollaboratorProfile };
}

export function useActiveRoles(): { activeRoles: Set<Role>; currentRole: Role } {
  const { founderProfile, collaboratorProfile, investorProfile, orgProfile } = useUser();
  const { profile } = useAuth();
  const location = useLocation();

  const activeRoles = useMemo(() => {
    const s = new Set<Role>();
    if (profile?.isOnboarded) {
      if (hasRole(profile, "founder")) s.add("founder");
      if (hasRole(profile, "collaborator")) s.add("collaborator");
      if (hasRole(profile, "investor")) s.add("investor");
      if (hasRole(profile, "org")) s.add("org");
    }
    if (founderProfile.onboardingComplete)              s.add("founder");
    if (collaboratorProfile.onboardingComplete)         s.add("collaborator");
    if (investorProfile.industries.length > 0)          s.add("investor");
    if (orgProfile.verificationStatus !== "unverified") s.add("org");
    return s;
  }, [profile, founderProfile.onboardingComplete, collaboratorProfile.onboardingComplete, investorProfile.industries.length, orgProfile.verificationStatus]);

  const path = location.pathname;
  let currentRole: Role = "founder";
  if (path.startsWith("/collaborator")) currentRole = "collaborator";
  else if (path.startsWith("/investor")) currentRole = "investor";
  else if (path.startsWith("/org"))      currentRole = "org";
  // everything else (/dashboard, /incubation-hub, /chat, /matchresults, /founder/*) → founder

  return { activeRoles, currentRole };
}

export function useFounderProfile() {
  const {
    founderProfile,
    updateFounderProfile,
    registerForHackathon,
    updateHackathonRegistration,
    submitBrief,
    addCheckIn,
    submitFinal,
    addFounderProject,
    addTeamWorkspace,
    bindTeamWorkspaceProject,
  } = useUser();
  return {
    founderProfile,
    updateFounderProfile,
    registerForHackathon,
    updateHackathonRegistration,
    submitBrief,
    addCheckIn,
    submitFinal,
    addFounderProject,
    addTeamWorkspace,
    bindTeamWorkspaceProject,
  };
}
