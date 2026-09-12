import { useEffect, useMemo, useState } from 'react';
import { Bell, Settings, Video, Phone, ChevronDown, Code2, Palette, ClipboardList, Shield, Layers, FolderGit2, Check, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
import { BackButton } from '@/dashboard/feed/components/BackButton';
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

const MEMBER_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-slate-500', 'bg-cyan-500'];

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
      <header className="h-[60px] border-b border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl flex items-center justify-between px-6 transition-colors">
        <div className="flex items-center gap-3">
          <BackButton fallback="/dashboard" />
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {activeWorkspace?.name ?? 'Workspace'}
            </h1>
            <Badge className="bg-[#20c937] text-white font-medium hover:bg-[#20c937]/90">
              {activeWorkspace?.status ?? 'No live workspace'}
            </Badge>
          </div>
        </div>

        <div className="flex-1 max-w-xs mx-8">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full focus:outline-none">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-black/[0.08] dark:border-white/10 text-slate-900 dark:text-white shadow-sm group">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1 rounded-lg bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff] shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start min-w-0 text-left">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Workspace</span>
                    <span className="text-xs font-semibold truncate max-w-[140px]">
                      {activeWorkspace?.name ?? 'Main Workspace'}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-transform duration-200 shrink-0 ml-2" />
              </div>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-[300px] p-2 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border border-black/[0.08] dark:border-white/10 text-slate-900 dark:text-white shadow-2xl rounded-2xl z-50">
              <DropdownMenuLabel className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Workspaces ({workspaces.length > 0 ? workspaces.length : 1})
                </span>
                <Badge className="bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff] border border-[#0066ff]/20 text-[10px] px-2">
                  Active Sync
                </Badge>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator className="bg-black/[0.06] dark:bg-white/10 my-1" />
              
              <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                {workspaces.length > 0 ? (
                  workspaces.map((workspace) => {
                    const isSelected = workspace.id === activeWorkspace?.id;
                    return (
                      <DropdownMenuItem
                        key={workspace.id}
                        onClick={() => {
                          const query = new URLSearchParams(location.search);
                          query.set('workspace', workspace.id);
                          setActiveWorkspaceId(workspace.id);
                          navigate(`${location.pathname}?${query.toString()}`);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#0066ff]/15 text-[#0066ff] dark:text-[#58a6ff] font-semibold border border-[#0066ff]/20'
                            : 'hover:bg-black/[0.04] dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff]' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                            <FolderGit2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{workspace.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{workspace.status ?? 'Active'}</div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#0066ff] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <DropdownMenuItem
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0066ff]/15 text-[#0066ff] dark:text-[#58a6ff] font-semibold border border-[#0066ff]/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff]">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-semibold">Default Workspace</div>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-[#0066ff] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  </DropdownMenuItem>
                )}
              </div>

              <DropdownMenuSeparator className="bg-black/[0.06] dark:bg-white/10 my-1" />

              <DropdownMenuItem
                onClick={() => navigate('/workspaces/settings')}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#0066ff]" />
                <span>Manage Workspace Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {teamMembers.map((member) => (
              <Avatar
                key={member.name}
                className="w-8 h-8 border-2 border-white dark:border-[#121212] hover:z-10 transition-all hover:scale-110 cursor-pointer"
              >
                <AvatarFallback className={`${member.color} text-white text-xs font-semibold`}>
                  {member.avatar}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {teamMembers.length === 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">No live contributors</span>
          )}

          <div className="h-6 w-px bg-black/[0.08] dark:bg-white/10" />

          <button
            className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
            onClick={() => {
              setShowVideoCall(true);
              setIsVideoPIP(false);
            }}
          >
            <Video className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
            onClick={() => setShowAudioCall(true)}
          >
            <Phone className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl transition-colors relative text-slate-600 dark:text-slate-300"
            onClick={() => navigate('/workspaces/notifications')}
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#0066ff] rounded-full" />
            )}
          </button>
          <button
            className="p-2 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
            onClick={() => navigate('/workspaces/settings')}
          >
            <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>

          <div className="h-6 w-px bg-black/[0.08] dark:bg-white/10" />

          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-xl px-2 py-1 transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#1a1a1a] border-black/[0.08] dark:border-white/10 text-slate-900 dark:text-white">
              <DropdownMenuLabel className="font-semibold">{userName}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-black/[0.06] dark:bg-white/10" />
              <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Switch Role
              </DropdownMenuLabel>
              {roles.map(role => {
                const RoleIcon = role.icon;
                return (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  className={currentRole === role.id ? 'bg-[#0066ff]/10 dark:bg-[#0066ff]/20 text-[#0066ff] dark:text-[#58a6ff] font-semibold cursor-pointer' : 'cursor-pointer'}
                >
                  <RoleIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {role.name}
                  {currentRole === role.id && (
                    <Badge className="ml-auto bg-[#0066ff] text-white text-xs">Active</Badge>
                  )}
                </DropdownMenuItem>
              );})}
              <DropdownMenuSeparator className="bg-black/[0.06] dark:bg-white/10" />
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/workspaces/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400" onClick={() => { void signOut(); }}>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {showVideoCall && (
        <VideoCall
          participants={teamMembers.map((member) => ({ name: member.name, avatar: member.avatar }))}
          self={{ name: userName, avatar: userInitials }}
          onClose={() => setShowVideoCall(false)}
          isPIP={isVideoPIP}
          onTogglePIP={() => setIsVideoPIP(!isVideoPIP)}
        />
      )}

      {showAudioCall && (
        <AudioCall
          participant={teamMembers[0] ? { name: teamMembers[0].name, avatar: teamMembers[0].avatar } : undefined}
          self={{ name: userName, avatar: userInitials }}
          onClose={() => setShowAudioCall(false)}
        />
      )}
    </>
  );
}
