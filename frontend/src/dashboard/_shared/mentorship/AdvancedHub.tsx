import { AlertCircle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HUB_GRADIENT } from "./theme";

export function AdvancedHub() {
  return (
    <div className="space-y-6">
      <div className={`rounded-lg p-6 ${HUB_GRADIENT}`}>
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7" />
          <div>
            <h1 className="text-3xl">Advanced Mentorship Hub</h1>
            <p className="mt-1 text-white/80">Persisted co-mentor coordination</p>
          </div>
        </div>
      </div>
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="font-semibold">No persisted co-mentor data</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Co-mentor invitations, shared calendars, matching, and activity require a canonical mentorship endpoint before they can appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
