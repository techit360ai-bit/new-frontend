import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, Zap, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getActiveSessions, revokeOtherSessions, revokeSession } from '@/lib/api/session';

export function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [sessions, setSessions] = useState<Awaited<ReturnType<typeof getActiveSessions>>['sessions']>([]);
  useEffect(() => { void getActiveSessions().then(data => setSessions(data.sessions)).catch(() => setSessions([])); }, []);

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
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john.doe@techit.com" />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select defaultValue="developer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer">Software Developer</SelectItem>
                      <SelectItem value="designer">UI/UX Designer</SelectItem>
                      <SelectItem value="manager">Project Manager</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    className="w-full px-3 py-2 border border-border-strong rounded-md"
                    rows={3}
                    defaultValue="Full-stack developer passionate about building scalable applications"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-brand-primary hover:bg-brand-primary-hover">Save Changes</Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-surface-primary rounded-lg border border-border-default p-6">
              <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-text-muted">Receive email updates about your activity</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-text-muted">Receive push notifications on your devices</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Comment Mentions</Label>
                    <p className="text-sm text-text-muted">Notify when someone mentions you</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Build Status</Label>
                    <p className="text-sm text-text-muted">Get notified about build completions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pull Request Reviews</Label>
                    <p className="text-sm text-text-muted">Notifications for PR reviews and comments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="bg-surface-primary rounded-lg border border-border-default p-6">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-text-muted">Enable dark theme across the platform</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <Separator />
                <div>
                  <Label>Theme Color</Label>
                  <p className="text-sm text-text-muted mb-3">Choose your accent color</p>
                  <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-lg bg-brand-primary border-2 border-brand-primary ring-2 ring-brand-primary/30" />
                    <button className="w-10 h-10 rounded-lg bg-status-success border-2 border-border-default hover:border-status-success" />
                    <button className="w-10 h-10 rounded-lg bg-status-warning border-2 border-border-default hover:border-status-warning" />
                    <button className="w-10 h-10 rounded-lg bg-chart-3 border-2 border-border-default hover:border-chart-3" />
                    <button className="w-10 h-10 rounded-lg bg-chart-5 border-2 border-border-default hover:border-chart-5" />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save</Label>
                    <p className="text-sm text-text-muted">Automatically save your work</p>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
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
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button className="mt-3 bg-brand-primary hover:bg-brand-primary-hover">Update Password</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-text-muted">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
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
              <h2 className="text-lg font-semibold mb-4">Connected Integrations</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border-default rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background-inverse rounded-lg">
                      <Github className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">GitHub</p>
                      <p className="text-sm text-text-muted">Connected as @johndoe</p>
                    </div>
                  </div>
                  <Button variant="outline">Disconnect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border-default rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-integration-slack rounded-lg">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Slack</p>
                      <p className="text-sm text-text-muted">Not connected</p>
                    </div>
                  </div>
                  <Button className="bg-brand-primary hover:bg-brand-primary-hover">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border-default rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-integration-jira rounded-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Jira</p>
                      <p className="text-sm text-text-muted">Not connected</p>
                    </div>
                  </div>
                  <Button className="bg-brand-primary hover:bg-brand-primary-hover">Connect</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
