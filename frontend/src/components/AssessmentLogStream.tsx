import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/services/api";

interface AssessmentLogStreamProps {
    smeId: number;
    onDone?: () => void;
}

export function AssessmentLogStream({ smeId, onDone }: AssessmentLogStreamProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [done, setDone] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        setLogs([]);
        setDone(false);
        const token = localStorage.getItem("access_token");
        const es = new EventSource(`${API_URL}/alternative-data/sme/${smeId}/stream?token=${token}`);

        es.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "log") {
                setLogs((prev) => [...prev, data.message]);
            } else if (data.type === "done") {
                setDone(true);
                es.close();
                queryClient.invalidateQueries({ queryKey: ["sme-alternative-data", smeId] });
                queryClient.invalidateQueries({ queryKey: ["admin-alternative-data", smeId] });
                onDone?.();
            }
        };

        es.onerror = () => es.close();
        return () => es.close();
    }, [smeId, queryClient, onDone]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    if (done && logs.length === 0) return null;

    return (
        <div className="rounded-2xl border border-teal-200 bg-teal-950 p-4 font-mono text-xs text-teal-300">
            <div className="mb-2 flex items-center gap-2 text-teal-400">
                <span className={`h-2 w-2 rounded-full ${done ? "bg-teal-400" : "animate-pulse bg-teal-300"}`} />
                <span className="font-bold tracking-wide">
                    {done ? "ASSESSMENT COMPLETE" : "ĐANG PHÂN TÍCH ALTERNATIVE DATA..."}
                </span>
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {logs.map((line, i) => (
                    <div key={i} className="leading-5">{line}</div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
