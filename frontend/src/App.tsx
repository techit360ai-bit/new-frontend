import { Routes, Route, Navigate, useLocation } from "react-router";
import { lazy, Suspense, useEffect } from "react";
const Landing = lazy(() => import("@/components/Landing"));
const FounderStep1 = lazy(() => import("@/dashboard/founders/onboarding/FounderStep1").then((m) => ({ default: m.FounderStep1 })));
const FounderStep2 = lazy(() => import("@/dashboard/founders/onboarding/FounderStep2").then((m) => ({ default: m.FounderStep2 })));
const FounderStep3 = lazy(() => import("@/dashboard/founders/onboarding/FounderStep3").then((m) => ({ default: m.FounderStep3 })));
const FounderStep4 = lazy(() => import("@/dashboard/founders/onboarding/FounderStep4").then((m) => ({ default: m.FounderStep4 })));
const FounderStep5 = lazy(() => import("@/dashboard/founders/onboarding/FounderStep5").then((m) => ({ default: m.FounderStep5 })));
const FounderStep6 = lazy(() => import("@/dashboard/founders/onboarding/FounderStep6").then((m) => ({ default: m.FounderStep6 })));
const FounderLayout = lazy(() => import("@/dashboard/founders/section/components/founder/FounderLayout").then((m) => ({ default: m.FounderLayout })));
const Dashboard = lazy(() => import("@/dashboard/founders/section/components/founder/Dashboard").then((m) => ({ default: m.Dashboard })));
const FounderProfile = lazy(() => import("@/dashboard/founders/section/components/founder/FounderProfile").then((m) => ({ default: m.FounderProfile })));
const FounderSettings = lazy(() => import("@/dashboard/founders/section/components/founder/Settings").then((m) => ({ default: m.Settings })));
const FounderMessages = lazy(() => import("@/dashboard/founders/section/components/founder/Messages").then((m) => ({ default: m.Messages })));
const TeamWorkspaceView = lazy(() => import("@/dashboard/founders/section/components/founder/TeamWorkspaceView").then((m) => ({ default: m.TeamWorkspaceView })));
const TrustCenter = lazy(() => import("@/dashboard/founders/section/components/founder/TrustCenter").then((m) => ({ default: m.TrustCenter })));
const CollabLayout = lazy(() => import("@/dashboard/collaborators/section/components/collab/CollabLayout").then((m) => ({ default: m.CollabLayout })));
const CollabDashboard = lazy(() => import("@/dashboard/collaborators/section/components/collab/Dashboard").then((m) => ({ default: m.Dashboard })));
const CollabEquity = lazy(() => import("@/dashboard/collaborators/section/components/collab/Equity").then((m) => ({ default: m.Equity })));
const CollabTasks = lazy(() => import("@/dashboard/collaborators/section/components/collab/Tasks").then((m) => ({ default: m.Tasks })));
const CollabPerformance = lazy(() => import("@/dashboard/collaborators/section/components/collab/Performance").then((m) => ({ default: m.Performance })));
const CollabEarnings = lazy(() => import("@/dashboard/collaborators/section/components/collab/Earnings").then((m) => ({ default: m.Earnings })));
const CollabOpportunities = lazy(() => import("@/dashboard/collaborators/section/components/collab/Opportunities").then((m) => ({ default: m.Opportunities })));
const CollabReputation = lazy(() => import("@/dashboard/collaborators/section/components/collab/Reputation").then((m) => ({ default: m.Reputation })));
const CollabMessages = lazy(() => import("@/dashboard/collaborators/section/components/collab/Messages").then((m) => ({ default: m.Messages })));
const CollabTools = lazy(() => import("@/dashboard/collaborators/section/components/collab/Tools").then((m) => ({ default: m.Tools })));
const CollabProfile = lazy(() => import("@/dashboard/collaborators/section/components/collab/CollabProfile").then((m) => ({ default: m.CollabProfile })));
const CollabAcademy = lazy(() => import("@/dashboard/collaborators/section/components/collab/AcademyPage").then((m) => ({ default: m.AcademyPage })));
const CollabSettings = lazy(() => import("@/dashboard/collaborators/section/components/collab/Settings").then((m) => ({ default: m.Settings })));
const IncubationHub = lazy(() => import("@/dashboard/incubationHub"));
const PublicValidation = lazy(() => import("@/dashboard/PublicValidation"));
const PublicEvidenceSummary = lazy(() => import("@/dashboard/PublicEvidenceSummary"));
const MatchResults = lazy(() => import("@/dashboard/matchResults"));
const OpportunityHub = lazy(() => import("@/dashboard/founders/section/components/founder/OpportunityHub"));
const OpportunityDetail = lazy(() => import("@/dashboard/founders/section/components/founder/OpportunityDetail"));
const InviteAcceptPage = lazy(() => import("@/dashboard/founders/section/components/founder/InviteAcceptPage"));
const WorkspaceInvitationPage = lazy(() => import("@/dashboard/workspaces/pages/WorkspaceInvitationPage").then((m) => ({ default: m.WorkspaceInvitationPage })));
const ContractSigningPage = lazy(() => import("@/dashboard/founders/section/components/founder/ContractSigningPage"));
const Wallet = lazy(() => import("@/TechitWallet/Wallet"));
const NotFound = lazy(() => import("@/dashboard/NotFound"));
import { CookieConsent } from "@/components/CookieConsent";
const ExplorerHome = lazy(() => import("@/dashboard/explorer/ExplorerHome"));
import { ContextSwitcher } from "@/components/context/ContextSwitcher";
const ComplianceCenter = lazy(() => import("@/dashboard/ComplianceCenter"));
const InvestorStep1 = lazy(() => import("@/dashboard/investors/onboarding/InvestorStep1").then((m) => ({ default: m.InvestorStep1 })));
const InvestorStep2 = lazy(() => import("@/dashboard/investors/onboarding/InvestorStep2").then((m) => ({ default: m.InvestorStep2 })));
const InvestorStep3 = lazy(() => import("@/dashboard/investors/onboarding/InvestorStep3").then((m) => ({ default: m.InvestorStep3 })));
const InvestorStep4 = lazy(() => import("@/dashboard/investors/onboarding/InvestorStep4").then((m) => ({ default: m.InvestorStep4 })));
const InvestorStep5 = lazy(() => import("@/dashboard/investors/onboarding/InvestorStep5").then((m) => ({ default: m.InvestorStep5 })));
const InvestorLayout = lazy(() => import("@/dashboard/investors/section/components/investor/InvestorLayout").then((m) => ({ default: m.InvestorLayout })));
const InvestorDashboard = lazy(() => import("@/dashboard/investors/section/components/investor/Dashboard").then((m) => ({ default: m.Dashboard })));
const InvestorDealIntelligence = lazy(() => import("@/dashboard/investors/section/components/investor/DealIntelligence").then((m) => ({ default: m.DealIntelligence })));
const InvestorRiskAnalysis = lazy(() => import("@/dashboard/investors/section/components/investor/RiskAnalysis").then((m) => ({ default: m.RiskAnalysis })));
const InvestorRiskRadar = lazy(() => import("@/dashboard/investors/section/components/investor/RiskRadar").then((m) => ({ default: m.RiskRadar })));
const InvestorAllocationEngine = lazy(() => import("@/dashboard/investors/section/components/investor/AllocationEngine").then((m) => ({ default: m.AllocationEngine })));
const InvestorWatchlist = lazy(() => import("@/dashboard/investors/section/components/investor/Watchlist").then((m) => ({ default: m.Watchlist })));
const InvestorCapitalPools = lazy(() => import("@/dashboard/investors/section/components/investor/CapitalPools").then((m) => ({ default: m.CapitalPools })));
const InvestorHeatmap = lazy(() => import("@/dashboard/investors/section/components/investor/GlobalHeatmap").then((m) => ({ default: m.GlobalHeatmap })));
const InvestorDataRoom = lazy(() => import("@/dashboard/investors/section/components/investor/DataRoom").then((m) => ({ default: m.DataRoom })));
const InvestorDataRooms = lazy(() => import("@/dashboard/investors/section/components/investor/DataRooms").then((m) => ({ default: m.DataRooms })));
const InvestorDealRoom = lazy(() => import("@/dashboard/investors/section/components/investor/DealRoom").then((m) => ({ default: m.DealRoom })));
const InvestorDealRooms = lazy(() => import("@/dashboard/investors/section/components/investor/DealRooms").then((m) => ({ default: m.DealRooms })));
const InvestorReputation = lazy(() => import("@/dashboard/investors/section/components/investor/Reputation").then((m) => ({ default: m.Reputation })));
const InvestorProfile = lazy(() => import("@/dashboard/investors/section/components/investor/InvestorProfile").then((m) => ({ default: m.InvestorProfile })));
const InvestorTrustDashboard = lazy(() => import("@/dashboard/investors/section/components/investor/InvestorTrustDashboard").then((m) => ({ default: m.InvestorTrustDashboard })));
const InvestorDealPipeline = lazy(() => import("@/dashboard/investors/section/components/investor/DealPipeline").then((m) => ({ default: m.DealPipeline })));
const InvestorDealRoomPage = lazy(() => import("@/dashboard/investors/section/components/investor/DealRoomPage").then((m) => ({ default: m.DealRoomPage })));
const InvestorStartupOverview = lazy(() => import("@/dashboard/investors/section/components/investor/StartupOverview").then((m) => ({ default: m.StartupOverview })));
const InvestorIntelligenceDetail = lazy(() => import("@/dashboard/investors/section/components/investor/InvestorIntelligenceDetail").then((m) => ({ default: m.InvestorIntelligenceDetail })));
const MentorshipGate = lazy(() => import("@/dashboard/_shared/mentorship/MentorshipGate").then((m) => ({ default: m.MentorshipGate })));
const MentorshipOverview = lazy(() => import("@/dashboard/_shared/mentorship/Overview").then((m) => ({ default: m.Overview })));
const MentorshipRoom = lazy(() => import("@/dashboard/_shared/mentorship/Room").then((m) => ({ default: m.Room })));
const MentorshipApplications = lazy(() => import("@/dashboard/_shared/mentorship/Applications").then((m) => ({ default: m.Applications })));
const MentorshipCreateRoom = lazy(() => import("@/dashboard/_shared/mentorship/CreateRoom").then((m) => ({ default: m.CreateRoom })));
const MentorshipAnalytics = lazy(() => import("@/dashboard/_shared/mentorship/Analytics").then((m) => ({ default: m.Analytics })));
const MentorshipPayments = lazy(() => import("@/dashboard/_shared/mentorship/Payments").then((m) => ({ default: m.Payments })));
const MentorshipAdvancedHub = lazy(() => import("@/dashboard/_shared/mentorship/AdvancedHub").then((m) => ({ default: m.AdvancedHub })));
const MentorshipInviteAccept = lazy(() => import("@/dashboard/_shared/mentorship/InviteAccept").then((m) => ({ default: m.MentorshipInviteAccept })));
const FounderMentorshipHub = lazy(() => import("@/dashboard/founders/mentorship/FounderMentorshipHub").then((m) => ({ default: m.FounderMentorshipHub })));
const OrgLayout = lazy(() => import("@/dashboard/organization/section/components/org/OrgLayout").then((m) => ({ default: m.OrgLayout })));
const OrgDashboard = lazy(() => import("@/dashboard/organization/section/components/org/Dashboard").then((m) => ({ default: m.Dashboard })));
const OrgTeams = lazy(() => import("@/dashboard/organization/section/components/org/Teams").then((m) => ({ default: m.Teams })));
const OrgProjects = lazy(() => import("@/dashboard/organization/section/components/org/Projects").then((m) => ({ default: m.Projects })));
const OrgIncubator = lazy(() => import("@/dashboard/organization/section/components/org/Incubator").then((m) => ({ default: m.Incubator })));
const OrgTalentPool = lazy(() => import("@/dashboard/organization/section/components/org/TalentPool").then((m) => ({ default: m.TalentPool })));
const OrgAIOps = lazy(() => import("@/dashboard/organization/section/components/org/AIOps").then((m) => ({ default: m.AIOps })));
const OrgAnalytics = lazy(() => import("@/dashboard/organization/section/components/org/Analytics").then((m) => ({ default: m.Analytics })));
const OrgMarketplace = lazy(() => import("@/dashboard/organization/section/components/org/Marketplace").then((m) => ({ default: m.Marketplace })));
const OrgMarketReady = lazy(() => import("@/dashboard/organization/section/components/org/MarketReady").then((m) => ({ default: m.MarketReady })));
const OrgHangout = lazy(() => import("@/dashboard/organization/section/components/org/Hangout").then((m) => ({ default: m.Hangout })));
const OrgIntegrations = lazy(() => import("@/dashboard/organization/section/components/org/Integrations").then((m) => ({ default: m.Integrations })));
const OrgBilling = lazy(() => import("@/dashboard/organization/section/components/org/Billing").then((m) => ({ default: m.Billing })));
const OrgSettings = lazy(() => import("@/dashboard/organization/section/components/org/Settings").then((m) => ({ default: m.Settings })));
const OrgHackathons = lazy(() => import("@/dashboard/organization/section/components/org/Hackathons").then((m) => ({ default: m.Hackathons })));
const OrgHackathonCreate = lazy(() => import("@/dashboard/organization/section/components/org/HackathonCreate").then((m) => ({ default: m.HackathonCreate })));
const OrgHackathonDetail = lazy(() => import("@/dashboard/organization/section/components/org/HackathonDetail").then((m) => ({ default: m.HackathonDetail })));
const OrgProfile = lazy(() => import("@/dashboard/organization/section/components/org/OrgProfile").then((m) => ({ default: m.OrgProfile })));
const OrgIntelligenceLayout = lazy(() => import("@/dashboard/organization/section/components/org/intelligence/OrgIntelligenceLayout").then((m) => ({ default: m.OrgIntelligenceLayout })));
const OrgCohortHealth = lazy(() => import("@/dashboard/organization/section/components/org/intelligence/CohortHealth").then((m) => ({ default: m.CohortHealth })));
const OrgImpactReporting = lazy(() => import("@/dashboard/organization/section/components/org/intelligence/ImpactReporting").then((m) => ({ default: m.ImpactReporting })));
const OrgDemoDayPipeline = lazy(() => import("@/dashboard/organization/section/components/org/intelligence/DemoDayPipeline").then((m) => ({ default: m.DemoDayPipeline })));
const OrgAlumniOutcomes = lazy(() => import("@/dashboard/organization/section/components/org/intelligence/AdvancedIntelligence").then((m) => ({ default: m.AlumniOutcomes })));
const OrgCohortBenchmarks = lazy(() => import("@/dashboard/organization/section/components/org/intelligence/AdvancedIntelligence").then((m) => ({ default: m.CohortBenchmarks })));
const OrgResourceAllocation = lazy(() => import("@/dashboard/organization/section/components/org/intelligence/AdvancedIntelligence").then((m) => ({ default: m.ResourceAllocation })));
const OrgStep1 = lazy(() => import("@/dashboard/organization/onboarding/OrgStep1").then((m) => ({ default: m.OrgStep1 })));
const OrgStep2 = lazy(() => import("@/dashboard/organization/onboarding/OrgStep2").then((m) => ({ default: m.OrgStep2 })));
const OrgStep3 = lazy(() => import("@/dashboard/organization/onboarding/OrgStep3").then((m) => ({ default: m.OrgStep3 })));
const OrgStep4 = lazy(() => import("@/dashboard/organization/onboarding/OrgStep4").then((m) => ({ default: m.OrgStep4 })));
const OrgStep5 = lazy(() => import("@/dashboard/organization/onboarding/OrgStep5").then((m) => ({ default: m.OrgStep5 })));
const VerificationCenter = lazy(() => import("@/components/authorization/VerificationCenter").then((m) => ({ default: m.VerificationCenter })));
const MfaSetup = lazy(() => import("@/components/authorization/MfaSetup").then((m) => ({ default: m.MfaSetup })));
import { CapabilityGate } from "@/components/authorization/CapabilityGate";
const CollabStep1 = lazy(() => import("@/dashboard/collaborators/onboarding/CollabStep1").then((m) => ({ default: m.CollabStep1 })));
const CollabStep2 = lazy(() => import("@/dashboard/collaborators/onboarding/CollabStep2").then((m) => ({ default: m.CollabStep2 })));
const CollabStep3 = lazy(() => import("@/dashboard/collaborators/onboarding/CollabStep3").then((m) => ({ default: m.CollabStep3 })));
const CollabStep4 = lazy(() => import("@/dashboard/collaborators/onboarding/CollabStep4").then((m) => ({ default: m.CollabStep4 })));
const CollabStep5 = lazy(() => import("@/dashboard/collaborators/onboarding/CollabStep5").then((m) => ({ default: m.CollabStep5 })));
const CollabStep6 = lazy(() => import("@/dashboard/collaborators/onboarding/CollabStep6").then((m) => ({ default: m.CollabStep6 })));
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider } from "@/contexts/AuthContext";
const Chat = lazy(() => import("@/dashboard/chat/Chat"));
const Signup = lazy(() => import("@/components/SignUp"));
const Login = lazy(() => import("@/components/Login"));
const ForgotPassword = lazy(() => import("@/components/ForgotPassword"));
const ResetPassword = lazy(() => import("@/components/ResetPassword"));
import { RedirectAuthenticated, RequireAuth, RequireRole as RealRequireRole } from "@/components/auth/RouteGuards";

// Bypass auth for founder UI testing
const RequireRole = ({ allowed, children }: { allowed: any[]; children: React.ReactNode }) => {
  if (allowed.includes("founder")) {
    return <>{children}</>;
  }
  return <RealRequireRole allowed={allowed}>{children}</RealRequireRole>;
};

const WorkspacesLayout = lazy(() => import("@/dashboard/workspaces/components/layout/MainLayout").then((m) => ({ default: m.MainLayout })));
const WsCode = lazy(() => import("@/dashboard/workspaces/pages/Code").then((m) => ({ default: m.Code })));
import { CodeErrorBoundary } from "@/dashboard/workspaces/components/code/CodeErrorBoundary";
const WsBuild = lazy(() => import("@/dashboard/workspaces/pages/Build").then((m) => ({ default: m.Build })));
const WsReports = lazy(() => import("@/dashboard/workspaces/pages/Reports").then((m) => ({ default: m.Reports })));
const WsConnectors = lazy(() => import("@/dashboard/workspaces/pages/Connectors").then((m) => ({ default: m.Connectors })));
const WsAgents = lazy(() => import("@/dashboard/workspaces/pages/Agents").then((m) => ({ default: m.Agents })));
const WsChat = lazy(() => import("@/dashboard/workspaces/pages/Chat").then((m) => ({ default: m.Chat })));
const WsCopilot = lazy(() => import("@/dashboard/workspaces/pages/Copilot").then((m) => ({ default: m.Copilot })));
const WsFiles = lazy(() => import("@/dashboard/workspaces/pages/Files").then((m) => ({ default: m.Files })));
const WsNotifications = lazy(() => import("@/dashboard/workspaces/pages/Notifications").then((m) => ({ default: m.Notifications })));
const WsSettings = lazy(() => import("@/dashboard/workspaces/pages/Settings").then((m) => ({ default: m.Settings })));
const WsGitHub = lazy(() => import("@/dashboard/workspaces/pages/GitHub").then((m) => ({ default: m.GitHub })));
const WsComponentLibrary = lazy(() => import("@/dashboard/workspaces/components/ComponentLibrary").then((m) => ({ default: m.ComponentLibrary })));
const FeedLayout = lazy(() => import("@/dashboard/feed/components/FeedLayout").then((m) => ({ default: m.FeedLayout })));
const FeedPage = lazy(() => import("@/dashboard/feed/pages/FeedPage").then((m) => ({ default: m.FeedPage })));
const DiscoveryPage = lazy(() => import("@/dashboard/feed/pages/DiscoveryPage").then((m) => ({ default: m.DiscoveryPage })));
const TribePage = lazy(() => import("@/dashboard/feed/pages/TribePage").then((m) => ({ default: m.TribePage })));
const BuildLogPage = lazy(() => import("@/dashboard/feed/pages/BuildLogPage").then((m) => ({ default: m.BuildLogPage })));
const QuestionsPage = lazy(() => import("@/dashboard/feed/pages/QuestionsPage").then((m) => ({ default: m.QuestionsPage })));
const ProblemsPage = lazy(() => import("@/dashboard/feed/pages/ProblemsPage").then((m) => ({ default: m.ProblemsPage })));
const FeedNotificationsPage = lazy(() => import("@/dashboard/feed/pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const PostDetailPage = lazy(() => import("@/dashboard/feed/pages/PostDetailPage").then((m) => ({ default: m.PostDetailPage })));
const MyLogPage = lazy(() => import("@/dashboard/feed/pages/MyLogPage").then((m) => ({ default: m.MyLogPage })));
const UserProfilePage = lazy(() => import("@/dashboard/feed/pages/UserProfilePage").then((m) => ({ default: m.UserProfilePage })));
const DirectMessagePage = lazy(() => import("@/dashboard/feed/pages/DirectMessagePage").then((m) => ({ default: m.DirectMessagePage })));
const SupportCenter = lazy(() => import("@/dashboard/support/SupportCenter"));
const PublicMomentPage = lazy(() => import("@/dashboard/moments/PublicMomentPage"));
import { MessagingProvider } from "@/contexts/MessagingProvider";
import { TechitMomentPrompt } from "@/components/moments/TechitMomentPrompt";
import { setMessagingToken } from "@/lib/messaging/config";
const DemoList = lazy(() => import("@/dashboard/demos/DemoList").then((m) => ({ default: m.DemoList })));
const DemoCreate = lazy(() => import("@/dashboard/demos/DemoCreate").then((m) => ({ default: m.DemoCreate })));
const DemoRoom = lazy(() => import("@/dashboard/demos/DemoRoom").then((m) => ({ default: m.DemoRoom })));
const PluginsDashboard = lazy(() => import("@/dashboard/plugins/PluginsDashboard"));
import { RequirePluginsAccess } from "@/components/RequirePluginsAccess";
import { getAuthToken } from "@/lib/api/client";

setMessagingToken(() => {
  try { return getAuthToken(); } catch { return null; }
});

import Preloader from "@/components/landing-page/Preloader";

function RouteMemory() { const location = useLocation(); useEffect(() => { if (!location.pathname.startsWith('/signin') && !location.pathname.startsWith('/signup')) sessionStorage.setItem('techit_last_route', `${location.pathname}${location.search}`) }, [location.pathname, location.search]); return null }

function RouteLoadingState() {
  return <Preloader />;
}

const App = () => {
  return (
    <AuthProvider>
    <UserProvider>
      <MessagingProvider>
      <RouteMemory />
      <Suspense fallback={<RouteLoadingState />}>
      <Routes>
        <Route path="/" element={<RedirectAuthenticated><Landing /></RedirectAuthenticated>} />
        <Route
          path="/plugins"
          element={
            <RequirePluginsAccess>
              <PluginsDashboard />
            </RequirePluginsAccess>
          }
        />

        <Route path="/founder/onboarding/step-1" element={<RequireRole allowed={["founder"]}><FounderStep1 /></RequireRole>} />
        <Route path="/founder/onboarding/step-2" element={<RequireRole allowed={["founder"]}><FounderStep2 /></RequireRole>} />
        <Route path="/founder/onboarding/step-3" element={<RequireRole allowed={["founder"]}><FounderStep3 /></RequireRole>} />
        <Route path="/founder/onboarding/step-4" element={<RequireRole allowed={["founder"]}><FounderStep4 /></RequireRole>} />
        <Route path="/founder/onboarding/step-5" element={<RequireRole allowed={["founder"]}><FounderStep5 /></RequireRole>} />
        <Route path="/founder/onboarding/step-6" element={<RequireRole allowed={["founder"]}><FounderStep6 /></RequireRole>} />
        <Route path="/founder/setup"   element={<Navigate to="/founder/onboarding/step-1" replace />} />
        <Route path="/founder/summary" element={<Navigate to="/founder/dashboard" replace />} />

        <Route path="/collaborator/onboarding/step-1" element={<RequireRole allowed={["collaborator"]}><CollabStep1 /></RequireRole>} />
        <Route path="/collaborator/onboarding/step-2" element={<RequireRole allowed={["collaborator"]}><CollabStep2 /></RequireRole>} />
        <Route path="/collaborator/onboarding/step-3" element={<RequireRole allowed={["collaborator"]}><CollabStep3 /></RequireRole>} />
        <Route path="/collaborator/onboarding/step-4" element={<RequireRole allowed={["collaborator"]}><CollabStep4 /></RequireRole>} />
        <Route path="/collaborator/onboarding/step-5" element={<RequireRole allowed={["collaborator"]}><CollabStep5 /></RequireRole>} />
        <Route path="/collaborator/onboarding/step-6" element={<RequireRole allowed={["collaborator"]}><CollabStep6 /></RequireRole>} />

        <Route path="/collaborator" element={<RequireRole allowed={["collaborator"]}><CollabLayout /></RequireRole>}>
          <Route index element={<Navigate to="/collaborator/dashboard" replace />} />
          <Route path="dashboard" element={<CollabDashboard />} />
          <Route path="equity" element={<CollabEquity />} />
          <Route path="tasks" element={<CollabTasks />} />
          <Route path="performance" element={<CollabPerformance />} />
          <Route path="earnings" element={<CollabEarnings />} />
          <Route path="opportunities" element={<CollabOpportunities />} />
          <Route path="reputation" element={<CollabReputation />} />
          <Route path="messages" element={<CollabMessages />} />
          <Route path="academy" element={<CollabAcademy />} />
          <Route path="tools" element={<CollabTools />} />
          <Route path="profile" element={<CollabProfile />} />
          <Route path="settings" element={<CollabSettings />} />
        </Route>

        {/* Legacy redirects — Landing.tsx still navigates to /collaborator/setup */}
        <Route path="/collaborator/setup"   element={<Navigate to="/collaborator/onboarding/step-1" replace />} />
        <Route path="/collaborator/summary" element={<Navigate to="/collaborator/dashboard" replace />} />

        <Route path="/investor/onboarding/step-1" element={<RequireRole allowed={["investor"]}><InvestorStep1 /></RequireRole>} />
        <Route path="/investor/onboarding/step-2" element={<RequireRole allowed={["investor"]}><InvestorStep2 /></RequireRole>} />
        <Route path="/investor/onboarding/step-3" element={<RequireRole allowed={["investor"]}><InvestorStep3 /></RequireRole>} />
        <Route path="/investor/onboarding/step-4" element={<RequireRole allowed={["investor"]}><InvestorStep4 /></RequireRole>} />
        <Route path="/investor/onboarding/step-5" element={<RequireRole allowed={["investor"]}><InvestorStep5 /></RequireRole>} />
        <Route path="/investor/setup" element={<Navigate to="/investor/onboarding/step-1" replace />} />

        {/* Investor section */}
        <Route path="/investor" element={<RequireRole allowed={["investor"]}><InvestorLayout /></RequireRole>}>
          <Route index element={<InvestorDashboard />} />
          <Route path="dashboard" element={<InvestorDashboard />} />
          <Route path="deal-intelligence" element={<InvestorDealIntelligence />} />
          <Route path="risk-analysis" element={<InvestorRiskAnalysis />} />
          <Route path="startup/:startupId" element={<InvestorStartupOverview />} />
          <Route path="risk-radar/:startupId" element={<InvestorRiskRadar />} />
          <Route path="allocation" element={<InvestorAllocationEngine />} />
          <Route path="watchlist" element={<InvestorWatchlist />} />
          <Route path="trust" element={<InvestorTrustDashboard />} />
          <Route path="trust/:startupId" element={<InvestorTrustDashboard />} />
          <Route path="capital-pools" element={<InvestorCapitalPools />} />
          <Route path="heatmap" element={<CapabilityGate capability="investor.intelligence.view" role="investor"><InvestorHeatmap /></CapabilityGate>} />
          <Route path="data-rooms" element={<CapabilityGate capability="dealroom.access" role="investor"><InvestorDataRooms /></CapabilityGate>} />
          <Route path="data-room/:startupId" element={<InvestorDataRoom />} />
          <Route path="deal-rooms" element={<CapabilityGate capability="dealroom.access" role="investor"><InvestorDealRooms /></CapabilityGate>} />
          <Route path="deal-room/:startupId" element={<InvestorDealRoom />} />
          <Route path="reputation" element={<InvestorReputation />} />
          <Route path="profile" element={<InvestorProfile />} />
          <Route path="deals" element={<InvestorDealPipeline />} />
          <Route path="deals/:dealId" element={<InvestorDealRoomPage />} />
          <Route path="intelligence/startups/:startupId" element={<InvestorIntelligenceDetail />} />
        </Route>

        {/* Mentorship Hub (own focused layout, gated by role) */}
        <Route path="/investor/mentorship" element={<RequireRole allowed={["investor"]}><MentorshipGate /></RequireRole>}>
          <Route index element={<MentorshipOverview />} />
          <Route path="room/:roomId" element={<MentorshipRoom />} />
          <Route path="applications" element={<MentorshipApplications />} />
          <Route path="create-room" element={<MentorshipCreateRoom />} />
          <Route path="analytics" element={<MentorshipAnalytics />} />
          <Route path="payments" element={<MentorshipPayments />} />
          <Route path="hub" element={<MentorshipAdvancedHub />} />
        </Route>
        <Route path="/mentorship/invite/:token" element={<RequireAuth><MentorshipInviteAccept /></RequireAuth>} />
        <Route path="/validate/:token" element={<PublicValidation />} />
        <Route path="/validation-evidence/:token" element={<PublicEvidenceSummary />} />
        <Route path="/moments/:slug" element={<PublicMomentPage />} />

        <Route path="/h/:hackathonId/team/:teamId" element={<RequireAuth><InviteAcceptPage /></RequireAuth>} />
        <Route path="/workspace-invitations/:invitationId" element={<RequireAuth><WorkspaceInvitationPage /></RequireAuth>} />

        <Route element={<RequireRole allowed={["founder"]}><FounderLayout /></RequireRole>}>
          <Route path="/founder/dashboard" element={<Dashboard />} />
          <Route path="/dashboard"        element={<Navigate to="/founder/dashboard" replace />} />
          <Route path="/team-workspace/:teamId" element={<TeamWorkspaceView />} />
          <Route path="/founder/trust"    element={<TrustCenter />} />
          <Route path="/founder/mentorship" element={<FounderMentorshipHub />} />
          <Route path="/founder/mentorship/rooms/:roomId" element={<MentorshipRoom />} />
          <Route path="/founder/profile"  element={<FounderProfile />} />
          <Route path="/founder/settings" element={<FounderSettings />} />
          <Route path="/founder/messages" element={<FounderMessages />} />
          <Route path="/incubation-hub"   element={<IncubationHub />} />
          <Route path="/opportunity-hub"  element={<OpportunityHub />} />
          <Route path="/opportunity-hub/:opportunityId" element={<OpportunityDetail />} />
          <Route path="/chat"             element={<Chat />} />
          <Route path="/matches"          element={<MatchResults />} />
          <Route path="/contracts/sign"  element={<ContractSigningPage />} />
        </Route>
        <Route path="/wallet" element={<RequireAuth><Wallet /></RequireAuth>} />
        <Route path="/explore" element={<RequireAuth><ExplorerHome /></RequireAuth>} />
        <Route path="/explorer" element={<Navigate to="/explore" replace />} />
        <Route path="/verification/:role" element={<RequireAuth><VerificationCenter /></RequireAuth>} />
        <Route path="/security/mfa" element={<RequireAuth><MfaSetup /></RequireAuth>} />
        <Route path="/compliance" element={<RequireAuth><ComplianceCenter /></RequireAuth>} />
        <Route path="/signup" element={<RedirectAuthenticated><Signup /></RedirectAuthenticated>} />
        <Route path="/signin" element={<RedirectAuthenticated><Login /></RedirectAuthenticated>} />
        <Route path="/forgot-password" element={<RedirectAuthenticated><ForgotPassword /></RedirectAuthenticated>} />
        <Route path="/reset-password" element={<RedirectAuthenticated><ResetPassword /></RedirectAuthenticated>} />

        {/* Collaborative Project Workspace */}
        <Route path="/workspaces" element={<RequireAuth><WorkspacesLayout /></RequireAuth>}>
          <Route index element={<Navigate to="build" replace />} />
          <Route path="build" element={<WsBuild />} />
          <Route path="code" element={<CodeErrorBoundary><WsCode /></CodeErrorBoundary>} />
          <Route path="connectors" element={<WsConnectors />} />
          <Route path="agents" element={<WsAgents />} />
          <Route path="ai-agents" element={<Navigate to="/workspaces/agents" replace />} />
          <Route path="chat" element={<WsChat />} />
          <Route path="copilot" element={<WsCopilot />} />
          <Route path="files" element={<WsFiles />} />
          <Route path="github" element={<WsGitHub />} />
          <Route path="reports" element={<WsReports />} />
          <Route path="notifications" element={<WsNotifications />} />
          <Route path="settings" element={<WsSettings />} />
        </Route>
        <Route path="/workspaces/components" element={<RequireAuth><WsComponentLibrary /></RequireAuth>} />

        {/* Organization onboarding (flat, outside layout) */}
        <Route path="/org/onboarding/step-1" element={<RequireRole allowed={["organisation"]}><OrgStep1 /></RequireRole>} />
        <Route path="/org/onboarding/step-2" element={<RequireRole allowed={["organisation"]}><OrgStep2 /></RequireRole>} />
        <Route path="/org/onboarding/step-3" element={<RequireRole allowed={["organisation"]}><OrgStep3 /></RequireRole>} />
        <Route path="/org/onboarding/step-4" element={<RequireRole allowed={["organisation"]}><OrgStep4 /></RequireRole>} />
        <Route path="/org/onboarding/step-5" element={<RequireRole allowed={["organisation"]}><OrgStep5 /></RequireRole>} />
        <Route path="/org/setup" element={<Navigate to="/org/onboarding/step-1" replace />} />
        <Route path="/organisation/setup" element={<Navigate to="/org/setup" replace />} />

        {/* Organization section */}
        <Route path="/org" element={<RequireRole allowed={["organisation"]}><OrgLayout /></RequireRole>}>
          <Route index element={<OrgDashboard />} />
          <Route path="dashboard" element={<OrgDashboard />} />
          <Route path="intelligence" element={<OrgIntelligenceLayout />}>
            <Route index element={<OrgCohortHealth />} />
            <Route path="cohort-health" element={<OrgCohortHealth />} />
            <Route path="impact" element={<OrgImpactReporting />} />
            <Route path="demo-day" element={<OrgDemoDayPipeline />} />
            <Route path="allocation" element={<OrgResourceAllocation />} />
            <Route path="alumni" element={<OrgAlumniOutcomes />} />
            <Route path="benchmarks" element={<OrgCohortBenchmarks />} />
          </Route>
          <Route path="teams" element={<OrgTeams />} />
          <Route path="projects" element={<OrgProjects />} />
          <Route path="incubator" element={<OrgIncubator />} />
          <Route path="hackathons" element={<OrgHackathons />} />
          <Route path="hackathons/new" element={<OrgHackathonCreate />} />
          <Route path="hackathons/:id" element={<OrgHackathonDetail />} />
          <Route path="talent" element={<CapabilityGate capability="organization.recruit" role="organization"><OrgTalentPool /></CapabilityGate>} />
          <Route path="ai-ops" element={<OrgAIOps />} />
          <Route path="analytics" element={<CapabilityGate capability="organization.analytics" role="organization"><OrgAnalytics /></CapabilityGate>} />
          <Route path="marketplace" element={<CapabilityGate capability="organization.opportunity.create" role="organization"><OrgMarketplace /></CapabilityGate>} />
          <Route path="market-ready" element={<OrgMarketReady />} />
          <Route path="hangout" element={<OrgHangout />} />
          <Route path="integrations" element={<OrgIntegrations />} />
          <Route path="billing" element={<OrgBilling />} />
          <Route path="settings" element={<OrgSettings />} />
          <Route path="profile" element={<OrgProfile />} />
        </Route>

        {/* Feed / Hangout */}
        <Route path="/feed" element={<RequireAuth><FeedLayout /></RequireAuth>}>
          <Route index element={<FeedPage />} />
          <Route path="discover" element={<DiscoveryPage />} />
          <Route path="tribe" element={<TribePage />} />
          <Route path="build-log" element={<BuildLogPage />} />
          <Route path="questions" element={<QuestionsPage />} />
          <Route path="problems" element={<ProblemsPage />} />
          <Route path="notifications" element={<FeedNotificationsPage />} />
          <Route path="my-log" element={<MyLogPage />} />
          <Route path="post/:postId" element={<PostDetailPage />} />
          <Route path="problem/:problemId" element={<PostDetailPage />} />
          <Route path="profile/:userId" element={<UserProfilePage />} />
          <Route path="messages/:userId" element={<DirectMessagePage />} />
        </Route>

        <Route path="/support" element={<RequireAuth><SupportCenter /></RequireAuth>} />
        <Route path="/demos"     element={<RequireAuth><DemoList /></RequireAuth>} />
        <Route path="/demos/new" element={<RequireAuth><DemoCreate /></RequireAuth>} />
        <Route path="/demos/:id" element={<RequireAuth><DemoRoom /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <TechitMomentPrompt />
      <div className="fixed bottom-20 left-5 z-30 lg:bottom-5"><ContextSwitcher /></div>
      <CookieConsent />
      </MessagingProvider>
    </UserProvider>
    </AuthProvider>
  );
};

export default App;
