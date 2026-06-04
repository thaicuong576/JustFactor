import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiService } from "@/services/api";

type Message = {
    id: string;
    sender: "user" | "bot";
    text: string;
};

function getChatErrorText(error: unknown) {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { data?: { detail?: string; response?: string }; status?: number } }).response;
        return response?.data?.detail || response?.data?.response || `API lỗi ${response?.status ?? ""}`.trim();
    }

    if (typeof error === "object" && error !== null && "message" in error) {
        return `Không kết nối được API: ${(error as { message?: string }).message}`;
    }

    return "Trợ lý đang bận. Vui lòng thử lại sau ít phút.";
}

function formatMessageText(text: string) {
    if (!text) return null;
    const lines = text.split("\n");

    return (
        <div className="space-y-1.5">
            {lines.map((line, index) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={index} className="h-2" />;

                const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
                const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);

                let isList = false;
                let content = trimmed;
                let listPrefix = null;

                if (bulletMatch) {
                    isList = true;
                    content = bulletMatch[1];
                } else if (numberedMatch) {
                    isList = true;
                    content = numberedMatch[2];
                    listPrefix = `${numberedMatch[1]}. `;
                }

                const formatInline = (str: string) => {
                    const parts = [];
                    let lastIdx = 0;
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    let match;

                    while ((match = boldRegex.exec(str)) !== null) {
                        if (match.index > lastIdx) {
                            parts.push(str.substring(lastIdx, match.index));
                        }
                        parts.push(
                            <strong key={match.index} className="font-semibold text-inherit">
                                {match[1]}
                            </strong>
                        );
                        lastIdx = boldRegex.lastIndex;
                    }
                    if (lastIdx < str.length) {
                        parts.push(str.substring(lastIdx));
                    }
                    return parts.length > 0 ? parts : str;
                };

                const formattedContent = formatInline(content);

                if (isList) {
                    if (listPrefix) {
                        return (
                            <div key={index} className="flex items-start gap-1.5 ml-3">
                                <span className="font-semibold shrink-0 opacity-75">{listPrefix}</span>
                                <span className="text-inherit">{formattedContent}</span>
                            </div>
                        );
                    } else {
                        return (
                            <div key={index} className="flex items-start gap-1.5 ml-3">
                                <span className="shrink-0 opacity-50 select-none">•</span>
                                <span className="text-inherit">{formattedContent}</span>
                            </div>
                        );
                    }
                }

                return (
                    <p key={index} className="text-inherit">
                        {formattedContent}
                    </p>
                );
            })}
        </div>
    );
}

export function ChatWidgetRedesign() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            sender: "bot",
            text: "Xin chào, tôi có thể hỗ trợ về phí, lãi suất, trạng thái thanh toán hoặc tra cứu hóa đơn như INV-123.",
        },
    ]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = { id: Date.now().toString(), sender: "user", text: inputValue };
        setMessages((current) => [...current, userMessage]);
        setInputValue("");
        setLoading(true);

        try {
            const response = await apiService.chat(userMessage.text);
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "bot",
                text: response.data.response,
            };
            setMessages((current) => [...current, botMessage]);
        } catch (error) {
            console.error("ChatWidget Error:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "bot",
                text: getChatErrorText(error),
            };
            setMessages((current) => [...current, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <Card className="flex h-[520px] w-[calc(100vw-2.5rem)] max-w-[380px] flex-col border-slate-200 shadow-2xl shadow-slate-400/40 animate-in fade-in slide-in-from-bottom-10">
                    <CardHeader className="flex flex-row items-center justify-between rounded-t-2xl bg-slate-950 p-4 text-white">
                        <div className="flex items-center gap-2">
                            <Bot className="h-6 w-6" />
                            <CardTitle className="text-base">Trợ lý JustFactor</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative right-[-8px] h-8 w-8 text-white hover:bg-white/20 hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col overflow-hidden bg-slate-50 p-4">
                        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
                            {messages.map((message) => (
                                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${message.sender === "user"
                                            ? "rounded-tr-none bg-teal-700 text-white"
                                            : "rounded-tl-none border border-slate-100 bg-white text-slate-800"
                                            }`}
                                    >
                                        {formatMessageText(message.text)}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-1 rounded-2xl rounded-tl-none border border-slate-100 bg-white p-3 text-sm italic text-slate-400">
                                        <Bot className="h-3 w-3 animate-bounce" />
                                        Đang trả lời...
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <Input
                                value={inputValue}
                                onChange={(event) => setInputValue(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") handleSend();
                                }}
                                placeholder="Nhập câu hỏi..."
                                className="border-slate-200 bg-white"
                            />
                            <Button size="icon" onClick={handleSend} disabled={loading} className="shrink-0">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 p-0 text-white shadow-lg shadow-slate-400 transition-all hover:scale-105 hover:bg-slate-800"
                >
                    <MessageCircle className="h-8 w-8" />
                </Button>
            )}
        </div>
    );
}
