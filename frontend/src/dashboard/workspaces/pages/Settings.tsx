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
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/10 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#20C997]/10 rounded-xl border border-[#20C997]/20">
            <SettingsIcon className="w-6 h-6 text-[#20C997]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <Tabs defaultValue="profile" className="w-full max-w-4xl">
          <TabsList className="mb-6 bg-slate-100 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 rounded-xl p-1">
            <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-[#111111] data-[state=active]:text-[#20C997] font-medium text-xs">
              <Zap className="w-4 h-4 mr-2" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <div className="bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 text-slate-900 dark:text-white shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Profile Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-300">First Name</Label>
                    <Input id="firstName" defaultValue="John" className="mt-1.5 rounded-xl border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-300">Last Name</Label>
                    <Input id="lastName" defaultValue="Doe" className="mt-1.5 rounded-xl border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                  <Input id="email" type="email" defaultValue="john.doe@techit.com" className="mt-1.5 rounded-xl border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white" />
                </div>
                <div>
                  <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">Role</Label>
                  <Select defaultValue="developer">
                    <SelectTrigger className="mt-1.5 rounded-xl border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#111111] border-black/[0.08] dark:border-white/10 text-slate-900 dark:text-white">
                      <SelectItem value="developer">Software Developer</SelectItem>
                      <SelectItem value="designer">UI/UX Designer</SelectItem>
                      <SelectItem value="manager">Project Manager</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bio" className="text-slate-700 dark:text-slate-300">Bio</Label>
                  <textarea
                    id="bio"
                    className="w-full mt-1.5 px-3.5 py-2.5 bg-white dark:bg-white/5 border border-black/[0.08] dark:border-white/10 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#20C997] text-sm"
                    rows={3}
                    defaultValue="Full-stack developer passionate about building scalable applications"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" className="rounded-xl border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200">Cancel</Button>
                <Button className="bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold rounded-xl shadow-md transition-all">Save Changes</Button>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 text-slate-900 dark:text-white shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Email Notifications</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive email updates about your activity</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <Separator className="bg-black/[0.06] dark:bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Push Notifications</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Receive push notifications on your devices</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
                <Separator className="bg-black/[0.06] dark:bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Comment Mentions</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Notify when someone mentions you</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-black/[0.06] dark:bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Build Status</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Get notified about build completions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-black/[0.06] dark:bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Pull Request Reviews</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Notifications for PR reviews and comments</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 text-slate-900 dark:text-white shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Appearance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Dark Mode</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Enable dark theme across the platform</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <Separator className="bg-black/[0.06] dark:bg-white/10" />
                <div>
                  <Label className="text-slate-900 dark:text-white font-medium">Theme Color</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Choose your accent color</p>
                  <div className="flex gap-3">
                    <button className="w-10 h-10 rounded-xl bg-[#20C997] border-2 border-[#20C997] ring-2 ring-[#20C997]/30" />
                    <button className="w-10 h-10 rounded-xl bg-[#20c937] border-2 border-black/[0.08] dark:border-white/10 hover:border-[#20c937]" />
                    <button className="w-10 h-10 rounded-xl bg-amber-500 border-2 border-black/[0.08] dark:border-white/10 hover:border-amber-500" />
                    <button className="w-10 h-10 rounded-xl bg-purple-600 border-2 border-black/[0.08] dark:border-white/10 hover:border-purple-600" />
                    <button className="w-10 h-10 rounded-xl bg-pink-500 border-2 border-black/[0.08] dark:border-white/10 hover:border-pink-500" />
                  </div>
                </div>
                <Separator className="bg-black/[0.06] dark:bg-white/10" />
                <div>
                  <Label className="text-slate-900 dark:text-white font-medium">Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger className="mt-2 rounded-xl border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#111111] border-black/[0.08] dark:border-white/10 text-slate-900 dark:text-white">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-black/[0.06] dark:bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Auto-save</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Automatically save your work</p>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 text-slate-900 dark:text-white shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Security</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-900 dark:text-white font-medium">Change Password</Label>
                  <div className="space-y-2 mt-2">
                    <Input type="password" placeholder="Current password" className="rounded-xl border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white" />
                    <Input type="password" placeholder="New password" className="rounded-xl border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white" />
                    <Input type="password" placeholder="Confirm new password" className="rounded-xl border-black/[0.08] dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white" />
                  </div>
                  <Button className="mt-3 bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold rounded-xl shadow-md transition-all">Update Password</Button>
                </div>
                <Separator className="bg-black/[0.06] dark:bg-white/10" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-slate-900 dark:text-white font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200">Enable 2FA</Button>
                </div>
                <Separator className="bg-black/[0.06] dark:bg-white/10" />
                <div>
                  <Label className="text-slate-900 dark:text-white font-medium">Active Sessions</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Manage your active sessions</p>
                  <div className="space-y-2">
                    {sessions.map(session => <div key={session.id} className="flex items-center justify-between p-3.5 bg-black/[0.03] dark:bg-white/5 border border-black/[0.06] dark:border-white/10 rounded-xl"><div><p className="font-medium text-sm text-slate-900 dark:text-white">{session.browser} on {session.platform}</p><p className="text-xs text-slate-400 dark:text-slate-500">{session.current ? 'Current session' : `Last active ${new Date(session.lastActiveAt).toLocaleString()}`}</p></div>{session.current ? <span className="text-xs text-[#20C997] font-bold">Active now</span> : <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 rounded-lg" onClick={() => void revokeSession(session.sessionIdentifier).then(() => getActiveSessions().then(data => setSessions(data.sessions)))}>Revoke</Button>}</div>)}
                    {sessions.length > 1 && <Button variant="outline" size="sm" className="rounded-xl border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200" onClick={() => void revokeOtherSessions().then(() => getActiveSessions().then(data => setSessions(data.sessions)))}>Sign out other devices</Button>}
                    {!sessions.length && <p className="text-sm text-slate-500 dark:text-slate-400">No active sessions available.</p>}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl rounded-2xl border border-black/[0.06] dark:border-white/10 p-6 text-slate-900 dark:text-white shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Connected Integrations</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-black/[0.08] dark:border-white/10 rounded-xl bg-black/[0.02] dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-900 dark:bg-white/10 rounded-xl">
                      <Github className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">GitHub</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Connected as @johndoe</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200">Disconnect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-black/[0.08] dark:border-white/10 rounded-xl bg-black/[0.02] dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#20C997] rounded-xl text-slate-950">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Slack</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Not connected</p>
                    </div>
                  </div>
                  <Button className="bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold rounded-xl shadow-md transition-all">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-black/[0.08] dark:border-white/10 rounded-xl bg-black/[0.02] dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 rounded-xl">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Jira</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Not connected</p>
                    </div>
                  </div>
                  <Button className="bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold rounded-xl shadow-md transition-all">Connect</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
