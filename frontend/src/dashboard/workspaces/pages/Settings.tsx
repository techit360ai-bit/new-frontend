// frontend/src/dashboard/workspaces/pages/Settings.tsx
//
// Workspace settings are bound to real APIs: profile → PATCH /users/me (via
// AuthContext.updateProfile), password → POST /auth/change-password, notification
// preferences → /api/domain/notifications/preferences, appearance → ThemeContext.
// Anything the deployment cannot do yet is labelled, not rendered as a dead control.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getActiveSessions, revokeOtherSessions, revokeSession } from '@/lib/api/session';
import { fetchNotificationPreferences, saveNotificationPreferences } from '@/lib/api/settings';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  mentions: boolean;
  buildStatus: boolean;
  pullRequests: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  email: true,
  push: true,
  mentions: true,
  buildStatus: true,
  pullRequests: true,
};

export function Settings() {
  const { profile, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const roleScope: 'founder' | 'collaborator' = profile?.role === 'founder' ? 'founder' : 'collaborator';

  // ── Profile ────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => {
    setFirstName(profile?.firstName ?? '');
    setLastName(profile?.lastName ?? '');
    setBio(profile?.bio ?? '');
  }, [profile?.firstName, profile?.lastName, profile?.bio]);

  const saveProfile = async () => {
    setSavingProfile(true);
    const { error } = await updateProfile({ firstName, lastName, bio });
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success('Profile updated');
  };
  const resetProfile = () => {
    setFirstName(profile?.firstName ?? '');
    setLastName(profile?.lastName ?? '');
    setBio(profile?.bio ?? '');
  };

  // ── Notification preferences (persisted per role) ──────────
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchNotificationPreferences<NotificationSettings>(roleScope)
      .then((prefs) => { if (alive) setNotifications({ ...DEFAULT_NOTIFICATIONS, ...prefs }); })
      .catch(() => { if (alive) setNotificationsError('Notification preferences could not be loaded.'); });
    return () => { alive = false; };
  }, [roleScope]);

  const persistNotifications = async (next: NotificationSettings) => {
    setNotifications(next);
    setSavingNotifications(true);
    try {
      await saveNotificationPreferences(roleScope, next);
      setNotificationsError(null);
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : 'Notification preferences could not be saved.');
    } finally {
      setSavingNotifications(false);
    }
  };
  const toggleNotification = (key: keyof NotificationSettings, value: boolean) => {
    void persistNotifications({ ...notifications, [key]: value });
  };

  // ── Security ───────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof getActiveSessions>>['sessions']>([]);
  useEffect(() => { void getActiveSessions().then(data => setSessions(data.sessions)).catch(() => setSessions([])); }, []);

  const submitPassword = async () => {
    if (!currentPassword || !newPassword) { toast.error('Enter your current and new password.'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match.'); return; }
    setChangingPassword(true);
    const { error } = await changePassword(currentPassword, newPassword);
    setChangingPassword(false);
    if (error) { toast.error(error.message); return; }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password updated');
  };

  return (
    <div className="h-full flex flex-col bg-background-primary">
      {/* Header */}
      <div className="bg-surface-primary border-b border-border-default px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Settings
            </h1>
            <p className="text-sm text-text-muted">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <Tabs defaultValue="profile" className="w-full max-w-4xl">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Zap className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <div className="bg-surface-primary rounded-lg border border-border-default p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile?.email ?? ''} readOnly disabled />
                  <p className="mt-1 text-xs text-text-muted">Email changes are handled through account support.</p>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" value={profile?.role ?? ''} readOnly disabled className="capitalize" />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    className="w-full px-3 py-2 border border-border-strong rounded-md"
                    rows={3}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={resetProfile} disabled={savingProfile}>Cancel</Button>
                <Button className="bg-brand-primary hover:bg-brand-primary-hover" onClick={() => { void saveProfile(); }} disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-surface-primary rounded-lg border border-border-default p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Notification Preferences</h2>
                {savingNotifications && <span className="text-xs text-text-muted">Saving…</span>}
              </div>
              {notificationsError && (
                <p className="mb-4 rounded border border-status-error bg-status-error-soft px-3 py-2 text-sm text-status-error">{notificationsError}</p>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-text-muted">Receive email updates about your activity</p>
                  </div>
                  <Switch checked={notifications.email} onCheckedChange={(value) => toggleNotification('email', value)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-text-muted">Receive push notifications on your devices</p>
                  </div>
                  <Switch checked={notifications.push} onCheckedChange={(value) => toggleNotification('push', value)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Comment Mentions</Label>
                    <p className="text-sm text-text-muted">Notify when someone mentions you</p>
                  </div>
                  <Switch checked={notifications.mentions} onCheckedChange={(value) => toggleNotification('mentions', value)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Build Status</Label>
                    <p className="text-sm text-text-muted">Get notified about build completions</p>
                  </div>
                  <Switch checked={notifications.buildStatus} onCheckedChange={(value) => toggleNotification('buildStatus', value)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pull Request Reviews</Label>
                    <p className="text-sm text-text-muted">Notifications for PR reviews and comments</p>
                  </div>
                  <Switch checked={notifications.pullRequests} onCheckedChange={(value) => toggleNotification('pullRequests', value)} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="bg-surface-primary rounded-lg border border-border-default p-6">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-text-muted">Applies the dark theme across the platform. Saved on this device.</p>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={(value) => setTheme(value ? 'dark' : 'light')} />
              </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="bg-surface-primary rounded-lg border border-border-default p-6">
              <h2 className="text-lg font-semibold mb-4">Security</h2>
              <div className="space-y-4">
                <div>
                  <Label>Change Password</Label>
                  <div className="space-y-2 mt-2">
                    <Input type="password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                    <Input type="password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                    <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                  </div>
                  <Button className="mt-3 bg-brand-primary hover:bg-brand-primary-hover" onClick={() => { void submitPassword(); }} disabled={changingPassword}>
                    {changingPassword ? 'Updating…' : 'Update Password'}
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-text-muted">Not available on this deployment yet — contact support to enable 2FA.</p>
                  </div>
                  <span className="text-xs font-medium text-text-muted">Unavailable</span>
                </div>
                <Separator />
                <div>
                  <Label>Active Sessions</Label>
                  <p className="text-sm text-text-muted mb-3">Manage your active sessions</p>
                  <div className="space-y-2">
                    {sessions.map(session => <div key={session.id} className="flex items-center justify-between p-3 bg-background-primary rounded-lg"><div><p className="font-medium text-sm">{session.browser} on {session.platform}</p><p className="text-xs text-text-muted">{session.current ? 'Current session' : `Last active ${new Date(session.lastActiveAt).toLocaleString()}`}</p></div>{session.current ? <span className="text-xs text-status-success font-medium">Active now</span> : <Button variant="ghost" size="sm" className="text-status-error" onClick={() => void revokeSession(session.sessionIdentifier).then(() => getActiveSessions().then(data => setSessions(data.sessions)))}>Revoke</Button>}</div>)}
                    {sessions.length > 1 && <Button variant="outline" size="sm" onClick={() => void revokeOtherSessions().then(() => getActiveSessions().then(data => setSessions(data.sessions)))}>Sign out other devices</Button>}
                    {!sessions.length && <p className="text-sm text-text-muted">No active sessions available.</p>}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="bg-surface-primary rounded-lg border border-border-default p-6">
              <h2 className="text-lg font-semibold mb-2">Connected Integrations</h2>
              <p className="text-sm text-text-muted mb-4">
                Provider integrations (GitHub, Slack, Jira, …) are managed as workspace connector metadata. This deployment
                does not perform a provider OAuth or credential handshake yet, so there is no per-account connection to show here.
              </p>
              <Button asChild variant="outline">
                <Link to="/workspaces/connectors">Open workspace Connectors</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
