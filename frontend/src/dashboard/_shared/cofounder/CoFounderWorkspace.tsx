import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Flag,
  FolderOpen,
  ListChecks,
  MessageCircle,
  Plus,
  Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import {
  cofounderFrontendEnabled,
  createCofounderObjective,
  createCofounderResponsibility,
  fetchCofounderActivity,
  fetchCofounderObjectives,
  fetchCofounderResponsibilities,
  fetchCofounderWorkspace,
  patchCofounderObjective,
  patchCofounderResponsibility,
} from '@/lib/api/cofounder'
import { domainGet, domainPatch, domainPost } from '@/lib/domainApi'
import { DecisionCenter } from './DecisionCenter'
import { ExecutionEvidencePanel } from './ExecutionEvidencePanel'
import { RelationshipHealthCard } from './RelationshipHealthCard'
import {
  cofounderStatusLabel,
  formatCommitment,
  formatDate,
} from './helpers'
import type {
  CofounderActivity,
  CofounderObjective,
  CofounderRelationship,
  CofounderResponsibility,
} from './types'

type WorkspaceTab = 'overview' | 'objectives' | 'responsibilities' | 'tasks' | 'milestones' | 'decisions' | 'documents' | 'activity' | 'communication' | 'evidence'

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'objectives', label: 'Objectives' },
  { id: 'responsibilities', label: 'Responsibilities' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
  { id: 'communication', label: 'Communication' },
  { id: 'evidence', label: 'Evidence' },
]

interface WorkspaceDescriptor {
  id: string
  projectId: string
  name: string
  kind: string
  status: string
}

interface RelationshipTask {
  id: string
  title?: string
  prompt?: string
  description?: string
  status?: string
  ownerId?: string
  assigneeId?: string
  assignedTo?: string
  visibilityLayer?: string
  createdAt?: string
  updatedAt?: string
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-primary p-4">
      <p className="text-2xl font-bold tabular-nums text-text-primary">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
    </div>
  )
}

export function CoFounderWorkspace() {
  const { relationshipId = '' } = useParams()
  const { profile } = useAuth()
  const enabled = cofounderFrontendEnabled()
  const userId = profile?.id || ''
  const [relationship, setRelationship] = useState<CofounderRelationship | null>(null)
  const [workspace, setWorkspace] = useState<WorkspaceDescriptor | null>(null)
  const [objectives, setObjectives] = useState<CofounderObjective[]>([])
  const [responsibilities, setResponsibilities] = useState<CofounderResponsibility[]>([])
  const [activity, setActivity] = useState<CofounderActivity[]>([])
  const [tasks, setTasks] = useState<RelationshipTask[]>([])
  const [tab, setTab] = useState<WorkspaceTab>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fallbackDashboard = profile?.role === 'founder' ? '/founder/dashboard' : '/collaborator/dashboard'

  const [objectiveOpen, setObjectiveOpen] = useState(false)
  const [objectiveTitle, setObjectiveTitle] = useState('')
  const [objectiveDescription, setObjectiveDescription] = useState('')
  const [objectiveDue, setObjectiveDue] = useState('')
  const [objectiveOwner, setObjectiveOwner] = useState('')
  const [objectiveVisibility, setObjectiveVisibility] = useState('SHARED')

  const [responsibilityOpen, setResponsibilityOpen] = useState(false)
  const [responsibilityTitle, setResponsibilityTitle] = useState('')
  const [responsibilityDescription, setResponsibilityDescription] = useState('')
  const [responsibilityOwner, setResponsibilityOwner] = useState('')
  const [responsibilityVisibility, setResponsibilityVisibility] = useState('SHARED')

  const [taskTitle, setTaskTitle] = useState('')
  const [taskVisibility, setTaskVisibility] = useState('SHARED')

  useEffect(() => {
    if (!enabled || !relationshipId) {
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    const load = async () => {
      const workspaceResult = await fetchCofounderWorkspace(relationshipId)
      if (!alive) return
      const workspaceRow = workspaceResult.workspace as unknown as WorkspaceDescriptor
      setRelationship(workspaceResult.relationship)
      setWorkspace(workspaceRow)
      const [objectiveResult, responsibilityResult, activityResult, taskResult] = await Promise.all([
        fetchCofounderObjectives(relationshipId),
        fetchCofounderResponsibilities(relationshipId),
        fetchCofounderActivity(relationshipId, { limit: 100 }),
        domainGet<{ tasks?: RelationshipTask[] }>(`/workspaces/${encodeURIComponent(workspaceRow.id)}/tasks`),
      ])
      if (!alive) return
      setObjectives(objectiveResult.objectives || [])
      setResponsibilities(responsibilityResult.responsibilities || [])
      setActivity(activityResult.activity || [])
      setTasks(taskResult.tasks || [])
      setError(null)
    }
    load()
      .catch((loadError) => {
        if (alive) setError(loadError instanceof Error ? loadError.message : 'The active co-founder workspace is unavailable.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [enabled, relationshipId])

  const otherPartyId = relationship?.otherParty.id || ''
  const partyOptions = useMemo(() => [
    { id: userId, label: 'You' },
    { id: otherPartyId, label: relationship?.otherParty.name || 'Relationship partner' },
  ].filter((option) => option.id), [otherPartyId, relationship?.otherParty.name, userId])

  useEffect(() => {
    if (!objectiveOwner && userId) setObjectiveOwner(userId)
    if (!responsibilityOwner && userId) setResponsibilityOwner(userId)
  }, [objectiveOwner, responsibilityOwner, userId])

  const createObjective = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!objectiveTitle.trim()) return
    try {
      const result = await createCofounderObjective(relationshipId, {
        title: objectiveTitle.trim(),
        description: objectiveDescription.trim(),
        ownerId: objectiveOwner || userId,
        dueDate: objectiveDue || null,
        visibilityLayer: objectiveVisibility,
      })
      setObjectives((current) => [result.objective, ...current])
      setObjectiveTitle('')
      setObjectiveDescription('')
      setObjectiveDue('')
      setObjectiveOpen(false)
      toast.success('Shared objective created.')
    } catch (createError) {
      toast.error(createError instanceof Error ? createError.message : 'The objective could not be created.')
    }
  }

  const completeObjective = async (objective: CofounderObjective) => {
    try {
      const result = await patchCofounderObjective(objective.id, { version: objective.version, status: 'completed', progress: 100 })
      setObjectives((current) => current.map((row) => row.id === objective.id ? result.objective : row))
    } catch (patchError) {
      toast.error(patchError instanceof Error ? patchError.message : 'The objective could not be updated.')
    }
  }

  const createResponsibility = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!responsibilityTitle.trim()) return
    try {
      const result = await createCofounderResponsibility(relationshipId, {
        title: responsibilityTitle.trim(),
        description: responsibilityDescription.trim(),
        ownerId: responsibilityOwner || userId,
        visibilityLayer: responsibilityVisibility,
      })
      setResponsibilities((current) => [result.responsibility, ...current])
      setResponsibilityTitle('')
      setResponsibilityDescription('')
      setResponsibilityOpen(false)
      toast.success('Responsibility created.')
    } catch (createError) {
      toast.error(createError instanceof Error ? createError.message : 'The responsibility could not be created.')
    }
  }

  const toggleResponsibility = async (responsibility: CofounderResponsibility) => {
    try {
      const nextStatus = responsibility.status === 'completed' ? 'active' : 'completed'
      const result = await patchCofounderResponsibility(responsibility.id, { version: responsibility.version, status: nextStatus })
      setResponsibilities((current) => current.map((row) => row.id === responsibility.id ? result.responsibility : row))
    } catch (patchError) {
      toast.error(patchError instanceof Error ? patchError.message : 'The responsibility could not be updated.')
    }
  }

  const createTask = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!workspace || !taskTitle.trim()) return
    try {
      const result = await domainPost<{ task?: RelationshipTask }>(`/workspaces/${encodeURIComponent(workspace.id)}/tasks`, {
        title: taskTitle.trim(),
        prompt: taskTitle.trim(),
        status: 'queued',
        ownerId: userId,
        visibilityLayer: taskVisibility,
      })
      if (result.task) setTasks((current) => [result.task as RelationshipTask, ...current])
      setTaskTitle('')
      toast.success('Relationship task created.')
    } catch (createError) {
      toast.error(createError instanceof Error ? createError.message : 'The task could not be created.')
    }
  }

  const toggleTask = async (task: RelationshipTask) => {
    if (!workspace) return
    try {
      const nextStatus = ['completed', 'done'].includes(String(task.status || '').toLowerCase()) ? 'queued' : 'done'
      const result = await domainPatch<{ task?: RelationshipTask }>(`/workspaces/${encodeURIComponent(workspace.id)}/tasks/${encodeURIComponent(task.id)}`, { status: nextStatus })
      setTasks((current) => current.map((row) => row.id === task.id ? (result.task as RelationshipTask || { ...row, status: nextStatus }) : row))
    } catch (patchError) {
      toast.error(patchError instanceof Error ? patchError.message : 'The task could not be updated.')
    }
  }

  if (!enabled) {
    return <div className="p-8 text-sm text-text-muted">Co-founder Mode is not enabled.</div>
  }

  if (loading) {
    return <div className="p-8 text-sm text-text-muted">Loading the relationship workspace…</div>
  }

  if (error || !relationship || !workspace) {
    return (
      <div className="mx-auto max-w-3xl p-8 text-center">
        <h1 className="text-xl font-semibold text-text-primary">Workspace unavailable</h1>
        <p className="mt-2 text-sm text-text-muted">{error || 'Only active co-founder relationship parties can open this workspace.'}</p>
        <Link to={fallbackDashboard} className="mt-4 inline-flex items-center gap-2 text-sm text-brand-accent"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      </div>
    )
  }

  const completedObjectives = objectives.filter((objective) => objective.status === 'completed').length
  const completedResponsibilities = responsibilities.filter((responsibility) => responsibility.status === 'completed').length
  const openTasks = tasks.filter((task) => !['completed', 'done'].includes(String(task.status || '').toLowerCase())).length
  const milestoneObjectives = objectives.filter((objective) => objective.milestoneIds.length || objective.publishedMilestoneId)
  const backLink = relationship.role === 'founder' ? '/founder/dashboard' : '/collaborator/dashboard'
  const messageLink = relationship.role === 'founder'
    ? `/founder/messages?recipient=${encodeURIComponent(relationship.otherParty.id)}`
    : `/collaborator/messages?recipient=${encodeURIComponent(relationship.otherParty.id)}`

  return (
    <div className="mx-auto max-w-7xl p-4 lg:p-8">
      <Link to={backLink} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <header className="mt-4 rounded-2xl border border-border-default bg-surface-primary p-5 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">Active co-founder workspace</p>
            <h1 className="mt-1 text-2xl font-bold text-text-primary">{workspace.name}</h1>
            <p className="mt-1 text-sm text-text-secondary">{relationship.otherParty.name} · {relationship.roleTitle || 'Co-founder'} · {formatCommitment(relationship.commitment)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/workspaces/build?workspace=${encodeURIComponent(workspace.id)}`} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white">Open task board</Link>
            <Link to={`/cofounder-invitations/${relationship.id}`} className="rounded-lg border border-border-default px-3 py-2 text-xs font-medium text-text-secondary">Manage relationship</Link>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <StatCard label="Shared objectives" value={`${completedObjectives}/${objectives.length}`} />
          <StatCard label="Responsibilities" value={`${completedResponsibilities}/${responsibilities.length}`} />
          <StatCard label="Open tasks" value={openTasks} />
          <StatCard label="Relationship status" value={cofounderStatusLabel(relationship.status)} />
        </div>
      </header>

      <nav className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-border-default bg-surface-primary p-1" aria-label="Co-founder workspace sections">
        {TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${tab === item.id ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-background-primary'}`}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-5 space-y-5">
        {tab === 'overview' && (
          <>
            <RelationshipHealthCard relationshipId={relationship.id} />
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-border-default bg-surface-primary p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Activity className="h-4 w-4" /> Recent relationship activity</div>
                <div className="mt-3 space-y-2">
                  {activity.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-lg bg-background-primary px-3 py-2 text-xs text-text-secondary">
                      <p>{item.summary}</p>
                      <p className="mt-1 text-[10px] text-text-muted">{formatDate(item.createdAt)} · {item.visibilityLayer.toLowerCase()}</p>
                    </div>
                  ))}
                  {activity.length === 0 && <p className="text-sm text-text-muted">No relationship activity recorded yet.</p>}
                </div>
              </section>
              <section className="rounded-xl border border-border-default bg-surface-primary p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Target className="h-4 w-4" /> Active focus</div>
                <div className="mt-3 space-y-2">
                  {objectives.filter((objective) => objective.status === 'active').slice(0, 5).map((objective) => (
                    <div key={objective.id} className="rounded-lg border border-border-default px-3 py-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-text-primary">{objective.title}</span>
                        <span className="tabular-nums text-text-muted">{objective.progress}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full bg-violet-500" style={{ width: `${objective.progress}%` }} /></div>
                    </div>
                  ))}
                  {objectives.length === 0 && <p className="text-sm text-text-muted">Create the first shared objective to begin tracking alignment.</p>}
                </div>
              </section>
            </div>
          </>
        )}

        {tab === 'objectives' && (
          <section className="rounded-xl border border-border-default bg-surface-primary p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Shared objectives</h2>
                <p className="mt-1 text-xs text-text-muted">Progress is derived from linked tasks or the explicitly reported status.</p>
              </div>
              <button type="button" onClick={() => setObjectiveOpen((current) => !current)} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> New objective</button>
            </div>
            {objectiveOpen && (
              <form onSubmit={createObjective} className="mt-4 rounded-xl border border-border-default bg-background-primary p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-text-secondary">Title<input value={objectiveTitle} onChange={(event) => setObjectiveTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" /></label>
                  <label className="text-xs font-semibold text-text-secondary">Owner<select value={objectiveOwner} onChange={(event) => setObjectiveOwner(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm">{partyOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
                  <label className="text-xs font-semibold text-text-secondary">Due date<input type="date" value={objectiveDue} onChange={(event) => setObjectiveDue(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" /></label>
                  <label className="text-xs font-semibold text-text-secondary">Visibility<select value={objectiveVisibility} onChange={(event) => setObjectiveVisibility(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm"><option value="SHARED">Shared</option><option value="PERSONAL">Personal</option></select></label>
                </div>
                <label className="mt-3 block text-xs font-semibold text-text-secondary">Description<textarea value={objectiveDescription} onChange={(event) => setObjectiveDescription(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-border-default px-3 py-2 text-sm" /></label>
                <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setObjectiveOpen(false)} className="rounded-lg border border-border-default px-3 py-2 text-xs">Cancel</button><button type="submit" disabled={!objectiveTitle.trim()} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60">Create objective</button></div>
              </form>
            )}
            <div className="mt-4 space-y-3">
              {objectives.map((objective) => (
                <article key={objective.id} className="rounded-xl border border-border-default p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><h3 className="text-sm font-semibold text-text-primary">{objective.title}</h3><p className="mt-1 text-xs text-text-secondary">{objective.description || 'No description recorded.'}</p></div>
                    <span className="rounded-full border border-border-default px-2 py-0.5 text-[10px] font-medium text-text-muted">{objective.status}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary"><div className="h-full bg-violet-500" style={{ width: `${objective.progress}%` }} /></div><span className="text-xs font-semibold tabular-nums text-text-primary">{objective.progress}%</span></div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-muted"><span>Due {formatDate(objective.dueDate)} · {objective.visibilityLayer.toLowerCase()} · {objective.progressSource}</span>{objective.status !== 'completed' && <button type="button" onClick={() => void completeObjective(objective)} className="inline-flex items-center gap-1 rounded-lg border border-status-success bg-status-success-soft px-2.5 py-1.5 font-medium text-status-success"><CheckCircle2 className="h-3.5 w-3.5" /> Mark complete</button>}</div>
                </article>
              ))}
              {objectives.length === 0 && <p className="rounded-lg border border-dashed border-border-default p-4 text-sm text-text-muted">No shared objectives recorded.</p>}
            </div>
          </section>
        )}

        {tab === 'responsibilities' && (
          <section className="rounded-xl border border-border-default bg-surface-primary p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-sm font-semibold text-text-primary">Responsibilities</h2><p className="mt-1 text-xs text-text-muted">Agreed ownership produces observable execution evidence.</p></div>
              <button type="button" onClick={() => setResponsibilityOpen((current) => !current)} className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white"><Plus className="h-3.5 w-3.5" /> Add responsibility</button>
            </div>
            {responsibilityOpen && (
              <form onSubmit={createResponsibility} className="mt-4 rounded-xl border border-border-default bg-background-primary p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-text-secondary">Title<input value={responsibilityTitle} onChange={(event) => setResponsibilityTitle(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm" /></label>
                  <label className="text-xs font-semibold text-text-secondary">Owner<select value={responsibilityOwner} onChange={(event) => setResponsibilityOwner(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm">{partyOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
                  <label className="text-xs font-semibold text-text-secondary">Visibility<select value={responsibilityVisibility} onChange={(event) => setResponsibilityVisibility(event.target.value)} className="mt-1 w-full rounded-lg border border-border-default px-3 py-2 text-sm"><option value="SHARED">Shared</option><option value="PERSONAL">Personal</option></select></label>
                </div>
                <label className="mt-3 block text-xs font-semibold text-text-secondary">Description<textarea value={responsibilityDescription} onChange={(event) => setResponsibilityDescription(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-border-default px-3 py-2 text-sm" /></label>
                <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setResponsibilityOpen(false)} className="rounded-lg border border-border-default px-3 py-2 text-xs">Cancel</button><button type="submit" disabled={!responsibilityTitle.trim()} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60">Create responsibility</button></div>
              </form>
            )}
            <div className="mt-4 space-y-3">
              {responsibilities.map((responsibility) => (
                <article key={responsibility.id} className="rounded-xl border border-border-default p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><h3 className="text-sm font-semibold text-text-primary">{responsibility.title}</h3><p className="mt-1 text-xs text-text-secondary">{responsibility.description || 'No description recorded.'}</p></div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${responsibility.status === 'completed' ? 'border-status-success bg-status-success-soft text-status-success' : 'border-border-default text-text-muted'}`}>{responsibility.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-muted"><span>{responsibility.visibilityLayer.toLowerCase()} visibility · areas: {responsibility.areas.length ? responsibility.areas.join(', ') : 'none recorded'}</span><button type="button" onClick={() => void toggleResponsibility(responsibility)} className="rounded-lg border border-border-default px-2.5 py-1.5 font-medium text-text-secondary">{responsibility.status === 'completed' ? 'Reopen' : 'Mark complete'}</button></div>
                </article>
              ))}
              {responsibilities.length === 0 && <p className="rounded-lg border border-dashed border-border-default p-4 text-sm text-text-muted">No responsibilities recorded.</p>}
            </div>
          </section>
        )}

        {tab === 'tasks' && (
          <section className="rounded-xl border border-border-default bg-surface-primary p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><ListChecks className="h-4 w-4" /> Relationship tasks</div>
            <p className="mt-1 text-xs text-text-muted">Tasks use the existing workspace API. Personal tasks are filtered server-side from the other party.</p>
            <form onSubmit={createTask} className="mt-4 flex flex-col gap-2 rounded-xl border border-border-default bg-background-primary p-3 sm:flex-row">
              <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a task" className="min-w-0 flex-1 rounded-lg border border-border-default px-3 py-2 text-sm" />
              <select value={taskVisibility} onChange={(event) => setTaskVisibility(event.target.value)} className="rounded-lg border border-border-default px-3 py-2 text-sm"><option value="SHARED">Shared</option><option value="PERSONAL">Personal</option></select>
              <button type="submit" disabled={!taskTitle.trim()} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60">Add task</button>
            </form>
            <div className="mt-4 space-y-2">
              {tasks.map((task) => {
                const completed = ['completed', 'done'].includes(String(task.status || '').toLowerCase())
                return (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg border border-border-default px-3 py-2">
                    <button type="button" onClick={() => void toggleTask(task)} className={`flex h-5 w-5 items-center justify-center rounded border ${completed ? 'border-status-success bg-status-success text-white' : 'border-border-strong'}`} aria-label={completed ? 'Reopen task' : 'Complete task'}>{completed && <CheckCircle2 className="h-3.5 w-3.5" />}</button>
                    <span className={`flex-1 text-sm ${completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>{task.title || task.prompt || 'Workspace task'}</span>
                    <span className="text-[10px] text-text-muted">{task.visibilityLayer || 'SHARED'}</span>
                  </div>
                )
              })}
              {tasks.length === 0 && <p className="rounded-lg border border-dashed border-border-default p-4 text-sm text-text-muted">No relationship tasks recorded.</p>}
            </div>
            <Link to={`/workspaces/build?workspace=${encodeURIComponent(workspace.id)}`} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-violet-700">Open full task board <ArrowRight className="h-3.5 w-3.5" /></Link>
          </section>
        )}

        {tab === 'milestones' && (
          <section className="rounded-xl border border-border-default bg-surface-primary p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Flag className="h-4 w-4" /> Objective-linked milestones</div>
            <p className="mt-1 text-xs text-text-muted">Private co-founder milestones stay inside these objectives. Nothing is published to the venture or investors automatically.</p>
            <div className="mt-4 space-y-2">
              {milestoneObjectives.map((objective) => <div key={objective.id} className="rounded-lg border border-border-default px-3 py-2 text-sm text-text-secondary"><span className="font-medium text-text-primary">{objective.title}</span> · {objective.milestoneIds.length} linked · {objective.publishedMilestoneId ? 'explicitly published' : 'private to relationship'}</div>)}
              {milestoneObjectives.length === 0 && <p className="rounded-lg border border-dashed border-border-default p-4 text-sm text-text-muted">No objective-linked milestones recorded.</p>}
            </div>
          </section>
        )}

        {tab === 'decisions' && <DecisionCenter relationshipId={relationship.id} />}

        {tab === 'documents' && (
          <section className="rounded-xl border border-border-default bg-surface-primary p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><FolderOpen className="h-4 w-4" /> Relationship documents</div>
            <p className="mt-1 text-xs text-text-muted">Files remain in the existing workspace file system and inherit relationship access.</p>
            <Link to={`/workspaces/files?workspace=${encodeURIComponent(workspace.id)}`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white"><FileText className="h-3.5 w-3.5" /> Open workspace files</Link>
          </section>
        )}

        {tab === 'activity' && (
          <section className="rounded-xl border border-border-default bg-surface-primary p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Activity className="h-4 w-4" /> Relationship activity</div>
            <p className="mt-1 text-xs text-text-muted">Private co-founder activity never enters the public feed automatically.</p>
            <div className="mt-4 space-y-2">{activity.map((item) => <div key={item.id} className="rounded-lg border border-border-default px-3 py-2"><p className="text-sm text-text-primary">{item.summary}</p><p className="mt-1 text-[10px] text-text-muted">{formatDate(item.createdAt)} · {item.actorRole || 'system'} · {item.visibilityLayer.toLowerCase()}</p></div>)}</div>
          </section>
        )}

        {tab === 'communication' && (
          <section className="rounded-xl border border-border-default bg-surface-primary p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><MessageCircle className="h-4 w-4" /> Communication</div>
            <p className="mt-1 text-xs text-text-muted">Use the existing workspace chat or direct messaging. Co-founder Mode does not create a second communication system.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/workspaces/chat?workspace=${encodeURIComponent(workspace.id)}`} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white">Open workspace chat</Link>
              <Link to={messageLink} className="rounded-lg border border-border-default px-3 py-2 text-xs font-medium text-text-secondary">Direct message</Link>
            </div>
          </section>
        )}

        {tab === 'evidence' && <ExecutionEvidencePanel relationshipId={relationship.id} />}
      </div>
    </div>
  )
}
