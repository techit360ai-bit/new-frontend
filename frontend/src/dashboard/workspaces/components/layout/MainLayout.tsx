import { Outlet } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { HeaderWithCallsAndRole } from './HeaderWithCallsAndRole';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { VideoCallPIP } from '@/components/ui/video-pip';
import { Toaster } from '@/components/ui/sonner';

export function MainLayout() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="workspaces-scope min-h-screen flex flex-col bg-background-primary overflow-x-clip">
        <HeaderWithCallsAndRole />
        <div className="flex flex-1 min-h-0 overflow-hidden max-md:overflow-visible max-md:flex-col">
          <Sidebar />
          <main className="min-w-0 flex-1 overflow-auto max-md:overflow-visible">
            <Outlet />
          </main>
          <RightPanel />
        </div>
        <VideoCallPIP />
        <Toaster />
      </div>
    </DndProvider>
  );
}
