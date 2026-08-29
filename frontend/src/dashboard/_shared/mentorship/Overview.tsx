import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, TrendingUp, DollarSign, Award, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { fetchMentorshipAnalytics, getMentorshipRoom, listMentorshipApplications, listMentorshipRooms, type MentorshipAnalytics, type MentorshipRoom } from "@/lib/api/mentorship";
import { ACCENT_SOLID, ACCENT_TEXT, ACCENT_SOFT, HERO_GRADIENT } from "./theme";

const BASE = "/investor/mentorship";

export function Overview() {
  const [rooms, setRooms] = useState<MentorshipRoom[]>([]);
  const [analytics, setAnalytics] = useState<MentorshipAnalytics | null>(null);
  const [mentees, setMentees] = useState<Array<Record<string, unknown>>>([]);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([listMentorshipRooms(true), fetchMentorshipAnalytics(), listMentorshipApplications()])
      .then(async ([roomData, metrics, applicationData]) => {
        if (!alive) return;
        setRooms(roomData.rooms ?? []);
        setAnalytics(metrics);
        setPendingApplications((applicationData.applications ?? []).filter((item) => item.status === "pending").length);
        const details = await Promise.all((roomData.rooms ?? []).map((room) => getMentorshipRoom(room.id).catch(() => null)));
        if (alive) setMentees(details.flatMap((detail) => detail?.mentees ?? []));
      })
      .catch(() => {
        if (!alive) return;
        setRooms([]);
        setAnalytics(null);
        setMentees([]);
        setPendingApplications(0);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const activeMentees = analytics?.activeMentees ?? 0;
  const totalMentees = activeMentees + (analytics?.completedMentees ?? 0);
  const totalTasks = analytics?.totalTasks ?? 0;
  const completedTasks = analytics?.completedTasks ?? 0;
  const averageProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className={`rounded-lg p-6 ${HERO_GRADIENT}`}>
        <h2 className="mb-2 text-2xl font-semibold">Welcome to TECHIT Mentorship</h2>
        <p className="mb-4 text-white/80">
          Run mentorship rooms for the founders you back — manage tasks, applications, analytics,
          payments, and multi-mentor coordination, all in one place.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to={`${BASE}/create-room`}>
            <button className="rounded-lg bg-white px-4 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-50 dark:text-emerald-700">
              Create Your First Room
            </button>
          </Link>
          <Link to={`${BASE}/applications`}>
            <button className="rounded-lg bg-white/20 px-4 py-2 text-sm text-white transition-colors hover:bg-white/30">
              View Applications ({pendingApplications} Pending)
            </button>
          </Link>
          <Link to={`${BASE}/hub`}>
            <button className="rounded-lg bg-white/20 px-4 py-2 text-sm text-white transition-colors hover:bg-white/30">
              Explore Advanced Hub
            </button>
          </Link>
        </div>
      </div>

      <div>
        <h1 className="mb-1 text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Manage your mentorship rooms and track progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Mentees</CardTitle>
            <Users className={`h-4 w-4 ${ACCENT_TEXT}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{activeMentees}</div>
              <p className="mt-1 text-xs text-muted-foreground">Live persisted room membership</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">Not tracked</div>
            <p className="mt-1 text-xs text-muted-foreground">Payment metrics remain available when persisted by the backend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equity Distributed</CardTitle>
            <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">Not tracked</div>
            <p className="mt-1 text-xs text-muted-foreground">Equity metrics remain available when persisted by the backend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{averageProgress}%</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mentorship Rooms */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl">Your Mentorship Rooms</h2>
          <Link to={`${BASE}/create-room`} className={`flex items-center gap-1 text-sm ${ACCENT_TEXT}`}>
            Create New Room
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {loading && <p className="text-sm text-muted-foreground">Loading live mentorship rooms...</p>}
          {!loading && rooms.length === 0 && <p className="text-sm text-muted-foreground">No persisted mentorship rooms yet.</p>}
          {rooms.map((room) => (
            <Card key={room.id} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2 text-lg">{room.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  </div>
                  <Badge variant={room.paymentModel === "equity" ? "default" : "secondary"}>
                    {room.paymentModel === "equity" ? `${room.equityPercentage}% Equity` : room.rate}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mentees</span>
                  <span className="font-medium">
                    {room.menteeCount ?? 0} / {room.capacity}
                  </span>
                </div>
              <Progress value={((room.menteeCount ?? 0) / Math.max(room.capacity, 1)) * 100} />
                <div className="flex gap-2 pt-2">
                  <Link to={`${BASE}/room/${room.id}`} className="flex-1">
                    <button className={`w-full rounded-lg px-4 py-2 transition-colors ${ACCENT_SOLID}`}>
                      Open Room
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Mentees */}
      <div>
        <h2 className="mb-4 text-xl">Recent Mentees</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {mentees.length === 0 && <p className="p-4 text-sm text-muted-foreground">No persisted mentees yet.</p>}
              {mentees.map((mentee, index) => (
                <div key={String(mentee.id ?? index)} className="p-4 transition-colors hover:bg-accent">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">{String(mentee.name ?? mentee.userId ?? "M").slice(0, 1).toUpperCase()}</div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-medium">{String(mentee.name ?? mentee.userId ?? "Mentee")}</h3>
                        <Badge variant={mentee.status === "active" ? "default" : "secondary"}>
                          {String(mentee.status ?? "active")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{String(mentee.goals ?? "Active mentorship participant")}</p>
                      <div className="mt-2 flex gap-2">
                        {(Array.isArray(mentee.skills) ? mentee.skills : []).slice(0, 3).map((skill) => (
                          <span key={String(skill)} className={`rounded px-2 py-1 text-xs ${ACCENT_SOFT}`}>
                            {String(skill)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-1 text-sm text-muted-foreground">Progress</div>
                      <div className={`text-lg font-semibold ${ACCENT_TEXT}`}>{Number(mentee.progress ?? 0)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
