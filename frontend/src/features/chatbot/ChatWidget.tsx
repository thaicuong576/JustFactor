import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiService } from "@/services/api";

type Message = {
    id: string;
    sender: 'user' | 'bot';
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

    return "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau.";
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

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'bot', text: 'Xin chào! Tôi có thể giúp gì cho bạn? (VD: Lãi suất, Phí, hoặc tra cứu đơn INV-123)' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setLoading(true);

        try {
            const res = await apiService.chat(userMsg.text);
            const botMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: res.data.response };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("ChatWidget Error:", error);
            if (typeof error === "object" && error !== null && "response" in error) {
                const response = (error as { response?: { data?: unknown; status?: number } }).response;
                console.error("Response data:", response?.data);
                console.error("Response status:", response?.status);
            }
            const errorMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: getChatErrorText(error) };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <Card className="w-[350px] h-[500px] shadow-2xl flex flex-col border-blue-100 animate-in fade-in slide-in-from-bottom-10">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-xl flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="w-6 h-6" />
                            <CardTitle className="text-base">Trợ lý ảo AI</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 text-white relative right-[-8px]" onClick={() => setIsOpen(false)}>
                            <X className="w-5 h-5 line-through decoration-transparent" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 p-4 overflow-hidden flex flex-col bg-slate-50">
                        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                                        }`}>
                                        {formatMessageText(msg.text)}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 text-slate-400 text-sm italic flex items-center gap-1">
                                        <Bot className="w-3 h-3 animate-bounce" /> Đang trả lời...
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập câu hỏi..."
                                className="bg-white border-slate-200 focus-visible:ring-blue-500"
                            />
                            <Button size="icon" onClick={handleSend} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                                <Send className="w-4 h-4 ml-0.5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-300 transition-all hover:scale-110 flex items-center justify-center p-0"
                >
                    <MessageCircle className="w-8 h-8" />
                </Button>
            )}
        </div>
    );
}
