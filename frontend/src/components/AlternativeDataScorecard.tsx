import { ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AlternativeDataScorecard as AlternativeDataScorecardType } from "@/types";
import { useRoleTheme } from "@/lib/role-theme";
import { cn } from "@/lib/utils";

export function AlternativeDataScorecard({ data }: { data?: AlternativeDataScorecardType | null }) {
    const theme = useRoleTheme();
    const roleId = theme?.id || "sme";

    const colors = {
        sme: {
            container: "border-teal-100 bg-teal-50/60",
            heading: "text-teal-950",
            subtext: "text-teal-900",
            metric: "text-teal-900",
            score: "text-teal-800",
            sourceTag: "border-teal-200 text-teal-800",
            icon: "text-teal-700",
            progress: "bg-teal-600",
        },
        fi: {
            container: "border-amber-200/80 bg-amber-50/60",
            heading: "text-amber-950",
            subtext: "text-amber-900",
            metric: "text-amber-900",
            score: "text-amber-800",
            sourceTag: "border-amber-200 text-amber-800",
            icon: "text-amber-600",
            progress: "bg-amber-600",
        },
        admin: {
            container: "border-slate-200 bg-slate-50/80",
            heading: "text-slate-950",
            subtext: "text-slate-900",
            metric: "text-slate-900",
            score: "text-slate-800",
            sourceTag: "border-slate-300 text-slate-800",
            icon: "text-slate-700",
            progress: "bg-slate-800",
        },
    }[roleId];

    if (!data) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-black text-slate-950">Alternative data</div>
                <p className="mt-1 text-sm font-medium text-slate-500">Assessment has not been generated yet.</p>
            </div>
        );
    }

    const score = data.scorecard?.alternative_data_score ?? data.alternative_data_score ?? 0;
    const fitScore = data.scorecard?.fit_score ?? data.fit_score ?? 0;
    const confidence = data.scorecard?.confidence_avg ?? data.confidence_avg ?? 0;
    const components = Object.values(data.scorecard?.components || {});
    const sources = data.scorecard?.sources || data.sources || [];

    return (
        <div className={cn("rounded-2xl border p-5", colors.container)}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className={cn("flex items-center gap-2 font-black", colors.heading)}>
                        <ShieldCheck className={cn("h-5 w-5", colors.icon)} />
                        Alternative data
                    </h3>
                    <p className={cn("mt-1 text-sm font-medium leading-6", colors.subtext)}>
                        {data.public_summary || data.scorecard?.public_summary || data.scorecard?.reasoning || "Mira-style public footprint assessment."}
                    </p>
                </div>
                <Badge variant={data.status === "COMPLETED" ? "success" : data.status === "FAILED" ? "destructive" : "warning"}>
                    {data.status}
                </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
                <Metric label="Score" value={`${score}/200`} textColor={colors.metric} />
                <Metric label="Fit" value={`${fitScore}/10`} textColor={colors.metric} />
                <Metric label="Confidence" value={`${confidence}/5`} textColor={colors.metric} />
            </div>

            {components.length > 0 && (
                <div className="mt-5 space-y-3">
                    {components.map((component) => (
                        <div key={component.label} className="rounded-xl border border-white/70 bg-white/70 p-3">
                            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                                <span className="font-black text-slate-950">{component.label}</span>
                                <span className={cn("font-mono font-black", colors.score)}>
                                    {component.score}/{component.max_score}
                                </span>
                            </div>
                            <Progress value={(component.score / Math.max(component.max_score, 1)) * 100} className="h-2" indicatorClassName={colors.progress} />
                            <div className="mt-2 flex items-start justify-between gap-3 text-xs font-medium text-slate-500">
                                <span className="line-clamp-2">{component.evidence || "No evidence found."}</span>
                                <span className="shrink-0">C{component.confidence}/5</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {sources.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                    {sources.slice(0, 5).map((source) => (
                        <a
                            key={source}
                            href={source.startsWith("http") ? source : undefined}
                            target="_blank"
                            rel="noreferrer"
                            className={cn("inline-flex max-w-full items-center gap-1 rounded-full border bg-white px-3 py-1 text-xs font-bold", colors.sourceTag)}
                        >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{source}</span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

function Metric({ label, value, textColor }: { label: string; value: string; textColor: string }) {
    return (
        <div className="rounded-xl bg-white/80 p-3">
            <div className={cn("text-lg font-black", textColor)}>{value}</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
        </div>
    );
}
