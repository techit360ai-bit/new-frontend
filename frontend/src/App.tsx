import { Routes, Route, Navigate, useLocation } from "react-router";
import { useEffect } from "react";
import Landing from "@/components/Landing";
import { FounderStep1 } from "@/dashboard/founders/onboarding/FounderStep1";
import { FounderLayout } from "@/dashboard/founders/section/components/founder/FounderLayout";
import { Dashboard } from "@/dashboard/founders/section/components/founder/Dashboard";
import { FounderProfile } from "@/dashboard/founders/section/components/founder/FounderProfile";
import { Settings as FounderSettings } from "@/dashboard/founders/section/components/founder/Settings";
import { Messages as FounderMessages } from "@/dashboard/founders/section/components/founder/Messages";
import { TeamWorkspaceView } from "@/dashboard/founders/section/components/founder/TeamWorkspaceView";
import { TrustCenter } from "@/dashboard/founders/section/components/founder/TrustCenter";
import { CollabLayout } from "@/dashboard/collaborators/section/components/collab/CollabLayout";
import { Dashboard as CollabDashboard } from "@/dashboard/collaborators/section/components/collab/Dashboard";
import { Equity as CollabEquity } from "@/dashboard/collaborators/section/components/collab/Equity";
import { Tasks as CollabTasks } from "@/dashboard/collaborators/section/components/collab/Tasks";
import { Performance as CollabPerformance } from "@/dashboard/collaborators/section/components/collab/Performance";
import { Earnings as CollabEarnings } from "@/dashboard/collaborators/section/components/collab/Earnings";
import { Opportunities as CollabOpportunities } from "@/dashboard/collaborators/section/components/collab/Opportunities";
import { Reputation as CollabReputation } from "@/dashboard/collaborators/section/components/collab/Reputation";
import { Messages as CollabMessages } from "@/dashboard/collaborators/section/components/collab/Messages";
import { Tools as CollabTools } from "@/dashboard/collaborators/section/components/collab/Tools";
import { CollabProfile } from "@/dashboard/collaborators/section/components/collab/CollabProfile";
import { AcademyPage as CollabAcademy } from "@/dashboard/collaborators/section/components/collab/AcademyPage";
import { Settings as CollabSettings } from "@/dashboard/collaborators/section/components/collab/Settings";
import IncubationHub from "@/dashboard/incubationHub";
import MatchResults from "@/dashboard/matchResults";
import OpportunityHub from "@/dashboard/founders/section/components/founder/OpportunityHub";
import OpportunityDetail from "@/dashboard/founders/section/components/founder/OpportunityDetail";
import InviteAcceptPage from "@/dashboard/founders/section/components/founder/InviteAcceptPage";
import { WorkspaceInvitationPage } from "@/dashboard/workspaces/pages/WorkspaceInvitationPage";
import ContractSigningPage from "@/dashboard/founders/section/components/founder/ContractSigningPage";
import Wallet from "@/TechitWallet/Wallet";
import NotFound from "@/dashboard/NotFound";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CookieConsent } from "@/components/CookieConsent";
import ExplorerHome from "@/dashboard/explorer/ExplorerHome";
import { ContextSwitcher } from "@/components/context/ContextSwitcher";
import ComplianceCenter from "@/dashboard/ComplianceCenter";
import { InvestorStep1 } from "@/dashboard/investors/onboarding/InvestorStep1";
import { InvestorLayout } from "@/dashboard/investors/section/components/investor/InvestorLayout";
import { Dashboard as InvestorDashboard } from "@/dashboard/investors/section/components/investor/Dashboard";
import { DealIntelligence as InvestorDealIntelligence } from "@/dashboard/investors/section/components/investor/DealIntelligence";
import { RiskAnalysis as InvestorRiskAnalysis } from "@/dashboard/investors/section/components/investor/RiskAnalysis";
import { RiskRadar as InvestorRiskRadar } from "@/dashboard/investors/section/components/investor/RiskRadar";
import { AllocationEngine as InvestorAllocationEngine } from "@/dashboard/investors/section/components/investor/AllocationEngine";
import { Watchlist as InvestorWatchlist } from "@/dashboard/investors/section/components/investor/Watchlist";
import { CapitalPools as InvestorCapitalPools } from "@/dashboard/investors/section/components/investor/CapitalPools";
import { GlobalHeatmap as InvestorHeatmap } from "@/dashboard/investors/section/components/investor/GlobalHeatmap";
import { DataRoom as InvestorDataRoom } from "@/dashboard/investors/section/components/investor/DataRoom";
import { DataRooms as InvestorDataRooms } from "@/dashboard/investors/section/components/investor/DataRooms";
import { DealRoom as InvestorDealRoom } from "@/dashboard/investors/section/components/investor/DealRoom";
import { DealRooms as InvestorDealRooms } from "@/dashboard/investors/section/components/investor/DealRooms";
import { Reputation as InvestorReputation } from "@/dashboard/investors/section/components/investor/Reputation";
import { InvestorProfile } from "@/dashboard/investors/section/components/investor/InvestorProfile";
import { InvestorTrustDashboard } from "@/dashboard/investors/section/components/investor/InvestorTrustDashboard";
import { DealPipeline as InvestorDealPipeline } from "@/dashboard/investors/section/components/investor/DealPipeline";
import { DealRoomPage as InvestorDealRoomPage } from "@/dashboard/investors/section/components/investor/DealRoomPage";
import { StartupOverview as InvestorStartupOverview } from "@/dashboard/investors/section/components/investor/StartupOverview";
import { InvestorIntelligenceDetail } from "@/dashboard/investors/section/components/investor/InvestorIntelligenceDetail";
import { MentorshipGate } from "@/dashboard/_shared/mentorship/MentorshipGate";
import { Overview as MentorshipOverview } from "@/dashboard/_shared/mentorship/Overview";
import { Room as MentorshipRoom } from "@/dashboard/_shared/mentorship/Room";
import { Applications as MentorshipApplications } from "@/dashboard/_shared/mentorship/Applications";
import { CreateRoom as MentorshipCreateRoom } from "@/dashboard/_shared/mentorship/CreateRoom";
import { Analytics as MentorshipAnalytics } from "@/dashboard/_shared/mentorship/Analytics";
import { Payments as MentorshipPayments } from "@/dashboard/_shared/mentorship/Payments";
import { AdvancedHub as MentorshipAdvancedHub } from "@/dashboard/_shared/mentorship/AdvancedHub";
import { OrgLayout } from "@/dashboard/organization/section/components/org/OrgLayout";
import { Dashboard as OrgDashboard } from "@/dashboard/organization/section/components/org/Dashboard";
import { Teams as OrgTeams } from "@/dashboard/organization/section/components/org/Teams";
import { Projects as OrgProjects } from "@/dashboard/organization/section/components/org/Projects";
import { Incubator as OrgIncubator } from "@/dashboard/organization/section/components/org/Incubator";
import { TalentPool as OrgTalentPool } from "@/dashboard/organization/section/components/org/TalentPool";
import { AIOps as OrgAIOps } from "@/dashboard/organization/section/components/org/AIOps";
import { Analytics as OrgAnalytics } from "@/dashboard/organization/section/components/org/Analytics";
import { Marketplace as OrgMarketplace } from "@/dashboard/organization/section/components/org/Marketplace";
import { MarketReady as OrgMarketReady } from "@/dashboard/organization/section/components/org/MarketReady";
import { Hangout as OrgHangout } from "@/dashboard/organization/section/components/org/Hangout";
import { Integrations as OrgIntegrations } from "@/dashboard/organization/section/components/org/Integrations";
import { Billing as OrgBilling } from "@/dashboard/organization/section/components/org/Billing";
import { Settings as OrgSettings } from "@/dashboard/organization/section/components/org/Settings";
import { Hackathons as OrgHackathons } from "@/dashboard/organization/section/components/org/Hackathons";
import { HackathonCreate as OrgHackathonCreate } from "@/dashboard/organization/section/components/org/HackathonCreate";
import { HackathonDetail as OrgHackathonDetail } from "@/dashboard/organization/section/components/org/HackathonDetail";
import { OrgProfile } from "@/dashboard/organization/section/components/org/OrgProfile";
import { OrgIntelligenceLayout } from "@/dashboard/organization/section/components/org/intelligence/OrgIntelligenceLayout";
import { CohortHealth as OrgCohortHealth } from "@/dashboard/organization/section/components/org/intelligence/CohortHealth";
import { ImpactReporting as OrgImpactReporting } from "@/dashboard/organization/section/components/org/intelligence/ImpactReporting";
import { DemoDayPipeline as OrgDemoDayPipeline } from "@/dashboard/organization/section/components/org/intelligence/DemoDayPipeline";
import { AlumniOutcomes as OrgAlumniOutcomes, CohortBenchmarks as OrgCohortBenchmarks, ResourceAllocation as OrgResourceAllocation } from "@/dashboard/organization/section/components/org/intelligence/AdvancedIntelligence";
import { OrgStep1 } from "@/dashboard/organization/onboarding/OrgStep1";
import { VerificationCenter } from "@/components/authorization/VerificationCenter";
import { MfaSetup } from "@/components/authorization/MfaSetup";
import { CapabilityGate } from "@/components/authorization/CapabilityGate";
import { CollabStep1 } from "@/dashboard/collaborators/onboarding/CollabStep1";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Chat from "@/dashboard/chat/Chat";
import Signup from "@/components/SignUp";
import Login from "@/components/Login";
import ForgotPassword from "@/components/ForgotPassword";
import ResetPassword from "@/components/ResetPassword";
import { RedirectAuthenticated, RequireAuth, RequireRole } from "@/components/auth/RouteGuards";
import { MainLayout as WorkspacesLayout } from "@/dashboard/workspaces/components/layout/MainLayout";
import { Build as WsBuild } from "@/dashboard/workspaces/pages/Build";
import { Reports as WsReports } from "@/dashboard/workspaces/pages/Reports";
import { Connectors as WsConnectors } from "@/dashboard/workspaces/pages/Connectors";
import { Agents as WsAgents } from "@/dashboard/workspaces/pages/Agents";
import { Chat as WsChat } from "@/dashboard/workspaces/pages/Chat";
import { Copilot as WsCopilot } from "@/dashboard/workspaces/pages/Copilot";
import { Files as WsFiles } from "@/dashboard/workspaces/pages/Files";
import { Notifications as WsNotifications } from "@/dashboard/workspaces/pages/Notifications";
import { Settings as WsSettings } from "@/dashboard/workspaces/pages/Settings";
import { GitHub as WsGitHub } from "@/dashboard/workspaces/pages/GitHub";
import { ComponentLibrary as WsComponentLibrary } from "@/dashboard/workspaces/components/ComponentLibrary";
import { FeedLayout } from "@/dashboard/feed/components/FeedLayout";
import { FeedPage } from "@/dashboard/feed/pages/FeedPage";
import { DiscoveryPage } from "@/dashboard/feed/pages/DiscoveryPage";
import { TribePage } from "@/dashboard/feed/pages/TribePage";
import { BuildLogPage } from "@/dashboard/feed/pages/BuildLogPage";
import { QuestionsPage } from "@/dashboard/feed/pages/QuestionsPage";
import { ProblemsPage } from "@/dashboard/feed/pages/ProblemsPage";
import { NotificationsPage as FeedNotificationsPage } from "@/dashboard/feed/pages/NotificationsPage";
import { PostDetailPage } from "@/dashboard/feed/pages/PostDetailPage";
import { MyLogPage } from "@/dashboard/feed/pages/MyLogPage";
import { UserProfilePage } from "@/dashboard/feed/pages/UserProfilePage";
import { DirectMessagePage } from "@/dashboard/feed/pages/DirectMessagePage";
import { MessagingProvider } from "@/contexts/MessagingProvider";
import { setMessagingToken } from "@/lib/messaging/config";
import { DemoList } from "@/dashboard/demos/DemoList";
import { DemoCreate } from "@/dashboard/demos/DemoCreate";
import { DemoRoom } from "@/dashboard/demos/DemoRoom";
import PluginsDashboard from "@/dashboard/plugins/PluginsDashboard";
import { RequirePluginsAccess } from "@/components/RequirePluginsAccess";
import { getAuthToken } from "@/lib/api/client";

setMessagingToken(() => {
  try { return getAuthToken(); } catch { return null; }
});

function RouteMemory() { const location = useLocation(); useEffect(() => { if (!location.pathname.startsWith('/signin') && !location.pathname.startsWith('/signup')) sessionStorage.setItem('techit_last_route', `${location.pathname}${location.search}`) }, [location.pathname, location.search]); return null }

const App = () => {
  return (
    <AuthProvider>
    <UserProvider>
      <MessagingProvider>
      <RouteMemory />
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
        {[2,3,4,5,6].map(step => <Route key={step} path={`/founder/onboarding/step-${step}`} element={<Navigate to="/founder/dashboard" replace />} />)}
        <Route path="/founder/setup"   element={<Navigate to="/founder/onboarding/step-1" replace />} />
        <Route path="/founder/summary" element={<Navigate to="/founder/dashboard" replace />} />

        <Route path="/collaborator/onboarding/step-1" element={<RequireRole allowed={["collaborator"]}><CollabStep1 /></RequireRole>} />
        {[2,3,4,5,6].map(step => <Route key={step} path={`/collaborator/onboarding/step-${step}`} element={<Navigate to="/collaborator/dashboard" replace />} />)}

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
        {[2,3,4,5].map(step => <Route key={step} path={`/investor/onboarding/step-${step}`} element={<Navigate to="/investor/dashboard" replace />} />)}
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

        <Route path="/h/:hackathonId/team/:teamId" element={<RequireAuth><InviteAcceptPage /></RequireAuth>} />
        <Route path="/workspace-invitations/:invitationId" element={<RequireAuth><WorkspaceInvitationPage /></RequireAuth>} />

        <Route element={<RequireRole allowed={["founder"]}><FounderLayout /></RequireRole>}>
          <Route path="/founder/dashboard" element={<Dashboard />} />
          <Route path="/dashboard"        element={<Navigate to="/founder/dashboard" replace />} />
          <Route path="/team-workspace/:teamId" element={<TeamWorkspaceView />} />
          <Route path="/founder/trust"    element={<TrustCenter />} />
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
        {[2,3,4,5].map(step => <Route key={step} path={`/org/onboarding/step-${step}`} element={<Navigate to="/org/dashboard" replace />} />)}
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

        <Route path="/demos"     element={<RequireAuth><DemoList /></RequireAuth>} />
        <Route path="/demos/new" element={<RequireAuth><DemoCreate /></RequireAuth>} />
        <Route path="/demos/:id" element={<RequireAuth><DemoRoom /></RequireAuth>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ThemeToggle />
      <div className="fixed bottom-5 left-5 z-30"><ContextSwitcher /></div>
      <CookieConsent />
      </MessagingProvider>
    </UserProvider>
    </AuthProvider>
  );
};

export default App;
