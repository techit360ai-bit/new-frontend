import { useEffect, useMemo, useState } from 'react';
import { Bell, Settings, Video, Phone, ChevronDown, Code2, Palette, ClipboardList, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { VideoCall } from '../calls/VideoCall';
import { AudioCall } from '../calls/AudioCall';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWorkspaces, type WorkspaceRef } from '@/lib/api/workspaces';
import { listNotifications } from '@/lib/api/notifications';
import { listTasks } from '../../lib/api/tasks';
import type { AgentTask } from '../../lib/types';
import { setActiveWorkspaceId } from '../../lib/api/client';

interface ShellMember {
  name: string;
  avatar: string;
  color: string;
}

const MEMBER_COLORS = ['bg-status-info', 'bg-status-success', 'bg-status-inactive', 'bg-feature-code'];

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'WS';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function displayName(profile: ReturnType<typeof useAuth>['profile']): string {
  if (!profile) return 'Workspace User';
  const name = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
  return name || profile.username || profile.email || 'Workspace User';
}

function buildMembers(tasks: AgentTask[]): ShellMember[] {
  const agentIds = [...new Set(tasks.map((task) => task.agentId).filter(Boolean))];
  return agentIds.slice(0, 4).map((agentId, index) => ({
    name: agentId,
    avatar: initials(agentId),
    color: MEMBER_COLORS[index % MEMBER_COLORS.length],
  }));
}

export function HeaderWithCallsAndRole() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showAudioCall, setShowAudioCall] = useState(false);
  const [isVideoPIP, setIsVideoPIP] = useState(false);
  const [currentRole, setCurrentRole] = useState<'developer' | 'designer' | 'manager' | 'admin'>('developer');
  const [workspaces, setWorkspaces] = useState<WorkspaceRef[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const roles = [
    { id: 'developer' as const, name: 'Software Developer', icon: Code2 },
    { id: 'designer' as const, name: 'UI/UX Designer', icon: Palette },
    { id: 'manager' as const, name: 'Project Manager', icon: ClipboardList },
    { id: 'admin' as const, name: 'Administrator', icon: Shield },
  ];

  const handleRoleChange = (role: typeof currentRole) => {
    setCurrentRole(role);
  };

  useEffect(() => {
    let alive = true;
    Promise.allSettled([fetchWorkspaces(), listTasks(), listNotifications()]).then((results) => {
      if (!alive) return;
      const [workspaceResult, taskResult, notificationResult] = results;
      setWorkspaces(workspaceResult.status === 'fulfilled' && Array.isArray(workspaceResult.value) ? workspaceResult.value : []);
      setTasks(taskResult.status === 'fulfilled' && Array.isArray(taskResult.value) ? taskResult.value : []);
      setUnreadNotifications(
        notificationResult.status === 'fulfilled' && Array.isArray(notificationResult.value)
          ? notificationResult.value.filter((notification) => !notification.read).length
          : 0,
      );
    });
    return () => { alive = false; };
  }, []);

  const selectedWorkspaceId = new URLSearchParams(location.search).get('workspace');
  const activeWorkspace = workspaces.find(workspace => workspace.id === selectedWorkspaceId) || workspaces[0];
  const teamMembers = useMemo(() => buildMembers(tasks), [tasks]);
  const userName = displayName(profile);
  const userInitials = initials(userName);

  return (
    <>
      <header className="h-[60px] border-b border-border-default bg-surface-primary flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {activeWorkspace?.name ?? 'Workspace'}
            </h1>
            <Badge className="bg-status-success text-white hover:bg-status-success/90">
              {activeWorkspace?.status ?? 'No live workspace'}
            </Badge>
          </div>
        </div>

        <div className="flex-1 max-w-xs mx-8">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center justify-between px-4 py-2 bg-background-primary rounded-lg hover:bg-surface-secondary transition-colors border border-border-default">
                <span className="text-sm font-medium">Current Workspace</span>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[280px]">
              {workspaces.length > 0 ? (
                workspaces.map((workspace) => (
                  <DropdownMenuItem key={workspace.id} onClick={() => { const query = new URLSearchParams(location.search); query.set('workspace', workspace.id); setActiveWorkspaceId(workspace.id); navigate(`${location.pathname}?${query.toString()}`); }}>
                    {workspace.name}{workspace.id === activeWorkspace?.id ? ' (Current)' : ''}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>No persisted workspaces</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {teamMembers.map((member, idx) => (
              <Avatar
                key={member.name}
                className="w-8 h-8 border-2 border-white hover:z-10 transition-all hover:scale-110 cursor-pointer"
              >
                <AvatarFallback className={`${member.color} text-white text-xs`}>
                  {member.avatar}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {teamMembers.length === 0 && (
            <span className="text-xs text-text-muted">No live contributors</span>
          )}

          <div className="h-6 w-px bg-gray-200" />

          <button
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
            onClick={() => {
              setShowVideoCall(true);
              setIsVideoPIP(false);
            }}
          >
            <Video className="w-5 h-5 text-text-muted" />
          </button>
          <button
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
            onClick={() => setShowAudioCall(true)}
          >
            <Phone className="w-5 h-5 text-text-muted" />
          </button>
          <button
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors relative"
            onClick={() => navigate('/workspaces/notifications')}
          >
            <Bell className="w-5 h-5 text-text-muted" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-status-warning rounded-full" />
            )}
          </button>
          <button
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors"
            onClick={() => navigate('/workspaces/settings')}
          >
            <Settings className="w-5 h-5 text-text-muted" />
          </button>

          <div className="h-6 w-px bg-gray-200" />

          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-background-primary rounded-lg px-2 py-1 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-brand-primary text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-text-muted" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-text-muted font-normal">
                Switch Role
              </DropdownMenuLabel>
              {roles.map(role => {
                const RoleIcon = role.icon;
                return (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  className={currentRole === role.id ? 'bg-brand-primary/10 text-brand-primary' : ''}
                >
                  <RoleIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {role.name}
                  {currentRole === role.id && (
                    <Badge className="ml-auto bg-brand-primary text-white text-xs">Active</Badge>
                  )}
                </DropdownMenuItem>
              );})}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/workspaces/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { void signOut(); }}>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {showVideoCall && (
        <VideoCall
          workspaceId={activeWorkspace?.id}
          onClose={() => setShowVideoCall(false)}
          isPIP={isVideoPIP}
          onTogglePIP={() => setIsVideoPIP(!isVideoPIP)}
        />
      )}

      {showAudioCall && (
        <AudioCall workspaceId={activeWorkspace?.id} onClose={() => setShowAudioCall(false)} />
      )}
    </>
  );
}
