# Mounted UI route coverage

Baseline: local origin/main at 20277492b1fe4642709ddd42d2b6e48b15a61a95. This checks route presence; it does not certify visual or API behavior.

170 baseline entries; 178 current entries; 0 missing.

| Route | Mounted destination |
| --- | --- |
| / | `<RedirectAuthenticated><Landing /></RedirectAuthenticated>` |
| /plugins | `<RequirePluginsAccess> <PluginsDashboard /> </RequirePluginsAccess>` |
| /founder/onboarding/step-1 | `<RequireRole allowed={["founder"]}><FounderStep1 /></RequireRole>` |
| /founder/onboarding/step-2 | `<RequireRole allowed={["founder"]}><FounderStep2 /></RequireRole>` |
| /founder/onboarding/step-3 | `<RequireRole allowed={["founder"]}><FounderStep3 /></RequireRole>` |
| /founder/onboarding/step-4 | `<RequireRole allowed={["founder"]}><FounderStep4 /></RequireRole>` |
| /founder/onboarding/step-5 | `<RequireRole allowed={["founder"]}><FounderStep5 /></RequireRole>` |
| /founder/onboarding/step-6 | `<RequireRole allowed={["founder"]}><FounderStep6 /></RequireRole>` |
| /founder/setup | `<Navigate to="/founder/onboarding/step-1" replace />` |
| /founder/summary | `<Navigate to="/founder/dashboard" replace />` |
| /collaborator/onboarding/step-1 | `<RequireRole allowed={["collaborator"]}><CollabStep1 /></RequireRole>` |
| /collaborator/onboarding/step-2 | `<RequireRole allowed={["collaborator"]}><CollabStep2 /></RequireRole>` |
| /collaborator/onboarding/step-3 | `<RequireRole allowed={["collaborator"]}><CollabStep3 /></RequireRole>` |
| /collaborator/onboarding/step-4 | `<RequireRole allowed={["collaborator"]}><CollabStep4 /></RequireRole>` |
| /collaborator/onboarding/step-5 | `<RequireRole allowed={["collaborator"]}><CollabStep5 /></RequireRole>` |
| /collaborator/onboarding/step-6 | `<RequireRole allowed={["collaborator"]}><CollabStep6 /></RequireRole>` |
| /collaborator | `<RequireRole allowed={["collaborator"]}><CollabLayout /></RequireRole>` |
| /collaborator [index] | `<Navigate to="/collaborator/dashboard" replace />` |
| /collaborator/dashboard | `<CollabDashboard />` |
| /collaborator/equity | `<CollabEquity />` |
| /collaborator/tasks | `<CollabTasks />` |
| /collaborator/performance | `<CollabPerformance />` |
| /collaborator/earnings | `<CollabEarnings />` |
| /collaborator/opportunities | `<CollabOpportunities />` |
| /collaborator/reputation | `<CollabReputation />` |
| /collaborator/messages | `<CollabMessages />` |
| /collaborator/academy | `<CollabAcademy />` |
| /collaborator/tools | `<CollabTools />` |
| /collaborator/profile | `<CollabProfile />` |
| /collaborator/settings | `<CollabSettings />` |
| /collaborator/setup | `<Navigate to="/collaborator/onboarding/step-1" replace />` |
| /collaborator/summary | `<Navigate to="/collaborator/dashboard" replace />` |
| /investor/onboarding/step-1 | `<RequireRole allowed={["investor"]}><InvestorStep1 /></RequireRole>` |
| /investor/onboarding/step-2 | `<RequireRole allowed={["investor"]}><InvestorStep2 /></RequireRole>` |
| /investor/onboarding/step-3 | `<RequireRole allowed={["investor"]}><InvestorStep3 /></RequireRole>` |
| /investor/onboarding/step-4 | `<RequireRole allowed={["investor"]}><InvestorStep4 /></RequireRole>` |
| /investor/onboarding/step-5 | `<RequireRole allowed={["investor"]}><InvestorStep5 /></RequireRole>` |
| /investor/setup | `<Navigate to="/investor/onboarding/step-1" replace />` |
| /investor | `<RequireRole allowed={["investor"]}><InvestorLayout /></RequireRole>` |
| /investor [index] | `<InvestorDashboard />` |
| /investor/dashboard | `<InvestorDashboard />` |
| /investor/deal-intelligence | `<CapabilityGate capability="investor.intelligence.view" role="investor"><InvestorDealIntelligence /></CapabilityGate>` |
| /investor/risk-analysis | `<CapabilityGate capability="investor.risk.monitor" role="investor"><InvestorRiskAnalysis /></CapabilityGate>` |
| /investor/startup/:startupId | `<InvestorStartupOverview />` |
| /investor/risk-radar/:startupId | `<CapabilityGate capability="investor.risk.monitor" role="investor"><InvestorRiskRadar /></CapabilityGate>` |
| /investor/allocation | `<CapabilityGate capability="investor.portfolio.analytics" role="investor"><InvestorAllocationEngine /></CapabilityGate>` |
| /investor/watchlist | `<InvestorWatchlist />` |
| /investor/trust | `<CapabilityGate capability="investor.intelligence.view" role="investor"><InvestorTrustDashboard /></CapabilityGate>` |
| /investor/trust/:startupId | `<CapabilityGate capability="investor.intelligence.view" role="investor"><InvestorTrustDashboard /></CapabilityGate>` |
| /investor/capital-pools | `<CapabilityGate capability="investor.portfolio.analytics" role="investor"><InvestorCapitalPools /></CapabilityGate>` |
| /investor/heatmap | `<CapabilityGate capability="investor.intelligence.view" role="investor"><InvestorHeatmap /></CapabilityGate>` |
| /investor/data-rooms | `<CapabilityGate capability="dealroom.access" role="investor"><InvestorDataRooms /></CapabilityGate>` |
| /investor/data-room/:startupId | `<CapabilityGate capability="dealroom.access" role="investor"><InvestorDataRoom /></CapabilityGate>` |
| /investor/deal-rooms | `<CapabilityGate capability="dealroom.access" role="investor"><InvestorDealRooms /></CapabilityGate>` |
| /investor/deal-room/:startupId | `<CapabilityGate capability="dealroom.access" role="investor"><InvestorDealRoom /></CapabilityGate>` |
| /investor/reputation | `<InvestorReputation />` |
| /investor/profile | `<InvestorProfile />` |
| /investor/deals | `<InvestorDealPipeline />` |
| /investor/deals/:dealId | `<InvestorDealRoomPage />` |
| /investor/intelligence/startups/:startupId | `<InvestorIntelligenceDetail />` |
| /investor/mentorship | `<RequireRole allowed={["investor"]}><MentorshipGate /></RequireRole>` |
| /investor/mentorship [index] | `<MentorshipOverview />` |
| /investor/mentorship/room/:roomId | `<MentorshipRoom />` |
| /investor/mentorship/applications | `<MentorshipApplications />` |
| /investor/mentorship/create-room | `<MentorshipCreateRoom />` |
| /investor/mentorship/analytics | `<MentorshipAnalytics />` |
| /investor/mentorship/payments | `<MentorshipPayments />` |
| /investor/mentorship/hub | `<MentorshipAdvancedHub />` |
| /mentorship/invite/:token | `<RequireAuth><MentorshipInviteAccept /></RequireAuth>` |
| /validate/:token | `<PublicValidation />` |
| /validation-evidence/:token | `<PublicEvidenceSummary />` |
| /moments/:slug | `<PublicMomentPage />` |
| /h/:hackathonId/team/:teamId | `<RequireAuth><InviteAcceptPage /></RequireAuth>` |
| /cofounder-invitations/:relationshipId | `<RequireAuth><CoFounderInvitationPage /></RequireAuth>` |
| /workspace-invitations/:invitationId | `<RequireAuth><WorkspaceInvitationPage /></RequireAuth>` |
| / | `<RequireRole allowed={["founder"]}><FounderLayout /></RequireRole>` |
| /founder/dashboard | `<Dashboard />` |
| /dashboard | `<Navigate to="/founder/dashboard" replace />` |
| /team-workspace/:teamId | `<TeamWorkspaceView />` |
| /founder/trust | `<TrustCenter />` |
| /founder/mentorship | `<FounderMentorshipHub />` |
| /founder/mentorship/rooms/:roomId | `<MentorshipRoom />` |
| /founder/profile | `<FounderProfile />` |
| /founder/settings | `<FounderSettings />` |
| /founder/messages | `<FounderMessages />` |
| /incubation-hub | `<IncubationHub />` |
| /opportunity-hub | `<OpportunityHub />` |
| /opportunity-hub/:opportunityId | `<OpportunityDetail />` |
| /chat | `<Chat />` |
| /matches | `<MatchResults />` |
| /contracts/sign | `<ContractSigningPage />` |
| /wallet | `<RequireAuth><Wallet /></RequireAuth>` |
| /explore | `<RequireAuth><ExplorerHome /></RequireAuth>` |
| /explore/discover | `<RequireAuth><ExplorerDiscover /></RequireAuth>` |
| /explore/startups | `<RequireAuth><ExplorerStartups /></RequireAuth>` |
| /explore/projects | `<RequireAuth><ExplorerProjects /></RequireAuth>` |
| /explore/opportunities | `<RequireAuth><ExplorerOpportunities /></RequireAuth>` |
| /explore/events | `<RequireAuth><ExplorerEvents /></RequireAuth>` |
| /explore/ai-guide | `<RequireAuth><ExplorerAIGuide /></RequireAuth>` |
| /explore/profile | `<RequireAuth><ExplorerProfile /></RequireAuth>` |
| /explore/settings | `<RequireAuth><ExplorerSettings /></RequireAuth>` |
| /explorer | `<Navigate to="/explore" replace />` |
| /verification/:role | `<RequireAuth><VerificationCenter /></RequireAuth>` |
| /security/mfa | `<RequireAuth><MfaSetup /></RequireAuth>` |
| /compliance | `<RequireAuth><ComplianceCenter /></RequireAuth>` |
| /signup | `<RedirectAuthenticated><Signup /></RedirectAuthenticated>` |
| /signin | `<RedirectAuthenticated><Login /></RedirectAuthenticated>` |
| /forgot-password | `<RedirectAuthenticated><ForgotPassword /></RedirectAuthenticated>` |
| /reset-password | `<RedirectAuthenticated><ResetPassword /></RedirectAuthenticated>` |
| /workspaces | `<RequireAuth><WorkspacesLayout /></RequireAuth>` |
| /workspaces [index] | `<Navigate to="build" replace />` |
| /workspaces/cofounder/:relationshipId | `<CoFounderWorkspace />` |
| /workspaces/build | `<WsBuild />` |
| /workspaces/code | `<CodeErrorBoundary><WsCode /></CodeErrorBoundary>` |
| /workspaces/connectors | `<WsConnectors />` |
| /workspaces/agents | `<WsAgents />` |
| /workspaces/ai-agents | `<Navigate to="/workspaces/agents" replace />` |
| /workspaces/chat | `<WsChat />` |
| /workspaces/copilot | `<WsCopilot />` |
| /workspaces/files | `<WsFiles />` |
| /workspaces/github | `<WsGitHub />` |
| /workspaces/reports | `<WsReports />` |
| /workspaces/notifications | `<WsNotifications />` |
| /workspaces/settings | `<WsSettings />` |
| /workspaces/components | `<RequireAuth><WsComponentLibrary /></RequireAuth>` |
| /org/onboarding/step-1 | `<RequireRole allowed={["organisation"]}><OrgStep1 /></RequireRole>` |
| /org/onboarding/step-2 | `<RequireRole allowed={["organisation"]}><OrgStep2 /></RequireRole>` |
| /org/onboarding/step-3 | `<RequireRole allowed={["organisation"]}><OrgStep3 /></RequireRole>` |
| /org/onboarding/step-4 | `<RequireRole allowed={["organisation"]}><OrgStep4 /></RequireRole>` |
| /org/onboarding/step-5 | `<RequireRole allowed={["organisation"]}><OrgStep5 /></RequireRole>` |
| /org/setup | `<Navigate to="/org/onboarding/step-1" replace />` |
| /organisation/setup | `<Navigate to="/org/setup" replace />` |
| /org | `<RequireRole allowed={["organisation"]}><OrgLayout /></RequireRole>` |
| /org [index] | `<OrgDashboard />` |
| /org/dashboard | `<OrgDashboard />` |
| /org/intelligence | `<OrgIntelligenceLayout />` |
| /org/intelligence [index] | `<CapabilityGate capability="organization.analytics" role="organization"><OrgCohortHealth /></CapabilityGate>` |
| /org/intelligence/cohort-health | `<CapabilityGate capability="organization.analytics" role="organization"><OrgCohortHealth /></CapabilityGate>` |
| /org/intelligence/impact | `<CapabilityGate capability="organization.analytics" role="organization"><OrgImpactReporting /></CapabilityGate>` |
| /org/intelligence/demo-day | `<CapabilityGate capability="organization.analytics" role="organization"><OrgDemoDayPipeline /></CapabilityGate>` |
| /org/intelligence/allocation | `<CapabilityGate capability="organization.analytics" role="organization"><OrgResourceAllocation /></CapabilityGate>` |
| /org/intelligence/alumni | `<CapabilityGate capability="organization.analytics" role="organization"><OrgAlumniOutcomes /></CapabilityGate>` |
| /org/intelligence/benchmarks | `<CapabilityGate capability="organization.analytics" role="organization"><OrgCohortBenchmarks /></CapabilityGate>` |
| /org/teams | `<OrgTeams />` |
| /org/projects | `<OrgProjects />` |
| /org/incubator | `<OrgIncubator />` |
| /org/hackathons | `<OrgHackathons />` |
| /org/hackathons/new | `<OrgHackathonCreate />` |
| /org/hackathons/:id | `<OrgHackathonDetail />` |
| /org/talent | `<CapabilityGate capability="organization.recruit" role="organization"><OrgTalentPool /></CapabilityGate>` |
| /org/ai-ops | `<OrgAIOps />` |
| /org/analytics | `<CapabilityGate capability="organization.analytics" role="organization"><OrgAnalytics /></CapabilityGate>` |
| /org/marketplace | `<CapabilityGate capability="organization.opportunity.create" role="organization"><OrgMarketplace /></CapabilityGate>` |
| /org/market-ready | `<OrgMarketReady />` |
| /org/hangout | `<OrgHangout />` |
| /org/integrations | `<OrgIntegrations />` |
| /org/billing | `<OrgBilling />` |
| /org/settings | `<OrgSettings />` |
| /org/profile | `<OrgProfile />` |
| /feed | `<RequireAuth><FeedLayout /></RequireAuth>` |
| /feed [index] | `<FeedPage />` |
| /feed/discover | `<DiscoveryPage />` |
| /feed/tribe | `<TribePage />` |
| /feed/build-log | `<BuildLogPage />` |
| /feed/questions | `<QuestionsPage />` |
| /feed/problems | `<ProblemsPage />` |
| /feed/notifications | `<FeedNotificationsPage />` |
| /feed/my-log | `<MyLogPage />` |
| /feed/post/:postId | `<PostDetailPage />` |
| /feed/problem/:problemId | `<PostDetailPage />` |
| /feed/profile/:userId | `<UserProfilePage />` |
| /feed/messages | `<MessagesInboxPage />` |
| /feed/messages/:userId | `<DirectMessagePage />` |
| /support | `<RequireAuth><SupportCenter /></RequireAuth>` |
| /demos | `<RequireAuth><DemoList /></RequireAuth>` |
| /demos/new | `<RequireAuth><DemoCreate /></RequireAuth>` |
| /demos/:id | `<RequireAuth><DemoRoom /></RequireAuth>` |
| * | `<NotFound />` |
