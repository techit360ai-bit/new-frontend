import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Bell, Settings, Video, Flag, Calendar, Clock, Bot, Sparkles } from 'lucide-react';

/**
 * Component Library - TechIT Platform Design System
 * 
 * This page showcases all reusable UI components with their variants
 * Use this as a reference for maintaining design consistency
 */

export function ComponentLibrary() {
  return (
    <div className="min-h-screen bg-background-primary px-4 py-8 text-text-primary sm:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Component Library
          </h1>
          <p className="text-text-muted">TechIT Platform Design System</p>
        </div>

        {/* Color Palette */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Color Palette
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="space-y-2">
              <div className="h-20 bg-brand-secondary rounded-lg" />
              <div className="text-sm font-mono">brand-secondary</div>
              <div className="text-xs text-text-muted">Brand secondary</div>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-brand-primary rounded-lg" />
              <div className="text-sm font-mono">brand-primary</div>
              <div className="text-xs text-text-muted">Brand primary</div>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-status-success rounded-lg" />
              <div className="text-sm font-mono">status-success</div>
              <div className="text-xs text-text-muted">Success</div>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-status-warning rounded-lg" />
              <div className="text-sm font-mono">status-warning</div>
              <div className="text-xs text-text-muted">Warning</div>
            </div>
            <div className="space-y-2">
              <div className="h-20 bg-brand-premium rounded-lg" />
              <div className="text-sm font-mono">brand-premium</div>
              <div className="text-xs text-text-muted">Premium</div>
            </div>
          </div>
        </section>

        {/* Semantic and role tokens */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Semantic and role tokens
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default space-y-3">
              <p className="text-sm font-medium">Status</p>
              <div className="flex flex-wrap gap-2"><Badge className="bg-status-success text-text-inverse">Success</Badge><Badge className="bg-status-warning text-text-inverse">Warning</Badge><Badge className="bg-status-error text-text-inverse">Error</Badge><Badge className="bg-status-info text-text-inverse">Info</Badge></div>
            </div>
            <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default space-y-3">
              <p className="text-sm font-medium">Roles</p>
              <div className="flex flex-wrap gap-2"><Badge className="bg-role-explorer text-text-inverse">Explorer</Badge><Badge className="bg-role-founder text-text-inverse">Founder</Badge><Badge className="bg-role-collaborator text-text-inverse">Collaborator</Badge><Badge className="bg-role-investor text-text-inverse">Investor</Badge><Badge className="bg-role-organization text-text-inverse">Organization</Badge></div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Typography
          </h2>
          <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default space-y-4">
            <div>
              <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Heading 1 - Space Grotesk</h1>
              <p className="text-sm text-text-muted mt-1">32px / 48px line height</p>
            </div>
            <div>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Heading 2 - Space Grotesk</h2>
              <p className="text-sm text-text-muted mt-1">24px / 36px line height</p>
            </div>
            <div>
              <p>Body text - Inter Regular</p>
              <p className="text-sm text-text-muted mt-1">16px / 24px line height</p>
            </div>
            <div>
              <p className="text-sm">Small text - Inter Regular</p>
              <p className="text-xs text-text-muted mt-1">14px / 20px line height</p>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Buttons
          </h2>
          <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default">
            <div className="flex flex-wrap gap-4">
              <Button className="bg-action-primary hover:bg-action-primary-hover">
                Primary Button
              </Button>
              <Button variant="outline">
                Secondary Button
              </Button>
              <Button variant="destructive">
                Destructive Button
              </Button>
              <Button variant="ghost">
                Ghost Button
              </Button>
              <Button size="sm">Small Button</Button>
              <Button size="lg">Large Button</Button>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Badges
          </h2>
          <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default">
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-status-success text-text-inverse">Active</Badge>
              <Badge className="bg-brand-primary text-text-inverse">In Progress</Badge>
              <Badge className="bg-status-warning text-text-inverse">Warning</Badge>
              <Badge className="bg-brand-premium text-text-inverse">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium
              </Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </section>

        {/* Avatars */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Avatars
          </h2>
          <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default">
            <div className="flex items-center gap-4">
              <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-role-founder text-text-inverse text-xs">SC</AvatarFallback>
              </Avatar>
              <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-role-collaborator text-text-inverse">MJ</AvatarFallback>
              </Avatar>
              <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-role-investor text-text-inverse">AK</AvatarFallback>
              </Avatar>
              <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-role-explorer text-text-inverse text-lg">EW</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </section>

        {/* Icons */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Icons
          </h2>
          <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default">
            <div className="grid grid-cols-4 gap-6 sm:grid-cols-8">
              <div className="flex flex-col items-center gap-2">
                <Bell className="w-6 h-6 text-text-secondary" />
                <span className="text-xs">Bell</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Settings className="w-6 h-6 text-text-secondary" />
                <span className="text-xs">Settings</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Video className="w-6 h-6 text-text-secondary" />
                <span className="text-xs">Video</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Flag className="w-6 h-6 text-text-secondary" />
                <span className="text-xs">Flag</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Calendar className="w-6 h-6 text-text-secondary" />
                <span className="text-xs">Calendar</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Clock className="w-6 h-6 text-text-secondary" />
                <span className="text-xs">Clock</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Bot className="w-6 h-6 text-text-secondary" />
                <span className="text-xs">Bot</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="w-6 h-6 text-text-secondary" />
                <span className="text-xs">Sparkles</span>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Cards
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Standard Card */}
            <div className="bg-surface-primary rounded-lg shadow-sm border border-border-default p-6">
              <h3 className="font-semibold mb-2">Standard Card</h3>
              <p className="text-sm text-text-muted">
                Basic card with subtle shadow and border. Border radius: 8px
              </p>
            </div>

            {/* Task Card */}
            <div className="bg-surface-primary rounded-lg shadow-sm border-l-4 border-brand-primary p-4">
              <h4 className="font-medium mb-2">Task Card</h4>
              <p className="text-sm text-text-muted mb-3">With semantic left border for priority</p>
              <div className="flex items-center justify-between">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-role-founder text-text-inverse text-xs">SC</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Calendar className="w-3 h-3" />
                  <span>Feb 20</span>
                </div>
              </div>
            </div>

            {/* Premium Card */}
            <div className="bg-surface-primary rounded-xl p-5 border-2 border-brand-premium/30 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-premium/10 animate-shimmer" />
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                Premium Card
                <Sparkles className="w-4 h-4 text-brand-premium" />
              </h3>
              <p className="text-sm text-text-muted">
                With gold shimmer effect and gradient background
              </p>
            </div>

            {/* Metric Card */}
            <div className="bg-surface-primary rounded-xl p-6 shadow-sm border border-border-default">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-brand-primary" />
                </div>
                <Badge className="bg-status-success text-text-inverse">+12%</Badge>
              </div>
              <div className="text-3xl font-bold mb-1">347</div>
              <div className="text-sm text-text-muted">Metric Card</div>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Form Elements
          </h2>
          <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Text Input</label>
              <input
                type="text"
                placeholder="Enter text..."
                className="w-full px-4 py-2 bg-surface-secondary border border-border-default rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <Switch />
                <label className="text-sm">Toggle Switch</label>
              </div>
              <div className="flex items-center gap-3">
                <Switch defaultChecked />
                <label className="text-sm">Enabled Switch</label>
              </div>
            </div>
          </div>
        </section>

        {/* Border Radius Guide */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Border Radius
          </h2>
          <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="text-center">
                <div className="h-20 bg-brand-primary rounded" />
                <p className="text-sm mt-2">4px (Buttons)</p>
              </div>
              <div className="text-center">
                <div className="h-20 bg-brand-primary rounded-lg" />
                <p className="text-sm mt-2">8px (Cards)</p>
              </div>
              <div className="text-center">
                <div className="h-20 bg-brand-primary rounded-xl" />
                <p className="text-sm mt-2">12px (Modals)</p>
              </div>
              <div className="text-center">
                <div className="h-20 bg-brand-primary rounded-full" />
                <p className="text-sm mt-2">Full (Avatars)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing Guide */}
        <section>
          <h2 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Spacing System (8px Grid)
          </h2>
          <div className="bg-surface-primary p-6 rounded-xl shadow-sm border border-border-default">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-mono">8px</div>
                <div className="h-2 w-[8px] bg-brand-primary" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-mono">16px</div>
                <div className="h-2 w-[16px] bg-brand-primary" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-mono">24px</div>
                <div className="h-2 w-[24px] bg-brand-primary" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-mono">32px</div>
                <div className="h-2 w-[32px] bg-brand-primary" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-mono">48px</div>
                <div className="h-2 w-[48px] bg-brand-primary" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
