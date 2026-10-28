import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createOrganizationSectionRecord,
  fetchOrganizationSection,
  updateOrganizationSectionRecord,
  type OrganizationLiveRecord,
  type OrganizationLiveSection,
} from "@/lib/api/organization";

export type LiveField = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
};

export function LiveCollectionPage({
  section,
  title,
  description,
  itemLabel,
  fields,
}: {
  section: OrganizationLiveSection;
  title: string;
  description: string;
  itemLabel: string;
  fields: LiveField[];
}) {
  const [records, setRecords] = useState<OrganizationLiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    fetchOrganizationSection(section)
      .then(setRecords)
      .catch(() => toast.error(`Unable to load ${title.toLowerCase()}.`))
      .finally(() => setLoading(false));
  }, [section, title]);

  useEffect(() => {
    void load();
  }, [load]);

  const summaryFields = useMemo(() => fields.slice(0, 4), [fields]);

  const create = async () => {
    if (!String(draft[fields[0].key] || "").trim())
      return toast.error(`${fields[0].label} is required.`);
    setCreating(true);
    try {
      const record = await createOrganizationSectionRecord(section, draft);
      setRecords((current) => [record, ...current]);
      setDraft({});
      toast.success(`${itemLabel} created.`);
    } catch {
      toast.error(`Unable to create ${itemLabel.toLowerCase()}.`);
    } finally {
      setCreating(false);
    }
  };

  const changeStatus = async (
    record: OrganizationLiveRecord,
    status: string,
  ) => {
    try {
      const updated = await updateOrganizationSectionRecord(
        section,
        record.id,
        { status },
      );
      setRecords((current) =>
        current.map((item) => (item.id === record.id ? updated : item)),
      );
      toast.success("Status updated.");
    } catch {
      toast.error("Unable to update status.");
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6 lg:p-8 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] text-slate-700 dark:text-slate-200 hover:text-[#20C997] hover:border-[#20C997]/30 transition-all shadow-sm"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 text-[#20C997] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <Card className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] shadow-sm">
        <CardHeader className="border-b border-black/[0.05] dark:border-white/10 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
            Add {itemLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.key}
                className={field.multiline ? "md:col-span-2" : ""}
              >
                <Label
                  htmlFor={`${section}-${field.key}`}
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block"
                >
                  {field.label}
                </Label>
                {field.multiline ? (
                  <Textarea
                    id={`${section}-${field.key}`}
                    value={draft[field.key] || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                    placeholder={field.placeholder}
                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white focus:border-[#20C997] focus:ring-[#20C997]"
                  />
                ) : (
                  <Input
                    id={`${section}-${field.key}`}
                    type={field.type || "text"}
                    value={draft[field.key] || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                    placeholder={field.placeholder}
                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-900 dark:text-white focus:border-[#20C997] focus:ring-[#20C997]"
                  />
                )}
              </div>
            ))}
          </div>
          <button
            disabled={creating}
            onClick={create}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 py-2.5 text-xs font-bold text-slate-950 transition-all disabled:opacity-50 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {creating ? "Saving..." : `Add ${itemLabel}`}
          </button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-16 text-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-[#111111] rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm">
          Loading live records...
        </div>
      ) : records.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <CardContent className="py-12 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            No {title.toLowerCase()} records yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {records.map((record) => (
            <Card
              key={record.id}
              className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] shadow-sm transition-all hover:border-[#20C997]/30"
            >
              <CardHeader className="border-b border-black/[0.05] dark:border-white/10 pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  {String(
                    record.title ||
                      record.name ||
                      record[fields[0].key] ||
                      itemLabel,
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {summaryFields.map((field) =>
                  record[field.key] ? (
                    <div key={field.key}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {field.label}
                      </p>
                      <p className="break-words text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {String(record[field.key])}
                      </p>
                    </div>
                  ) : null,
                )}
                <div className="flex gap-2 pt-2 border-t border-black/[0.05] dark:border-white/10">
                  <button
                    onClick={() => changeStatus(record, "active")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#20C997]/30 bg-[#20C997]/10 text-[#20C997] hover:bg-[#20C997]/20 px-3 py-1.5 text-xs font-bold transition-all"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Active
                  </button>
                  <button
                    onClick={() => changeStatus(record, "archived")}
                    className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 text-xs font-bold transition-all"
                  >
                    Archive
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
