import Link from "next/link";
import { MessageSquare, ArrowRight } from "lucide-react";

const chats = [
  { id: "1", client: "Компания X", order: "Telegram бот на Python", unread: 2 },
  { id: "2", client: "John Doe", order: "React Landing", unread: 0 },
  { id: "3", client: "Startup Inc", order: "Node.js API", unread: 1 },
];

export default function ChatPage() {
  return (
    <div className="p-8 h-full flex">
      <div className="w-96 bg-card rounded-xl border border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-semibold">Чаты с заказчиками</h2>
          <p className="text-sm text-foreground/60">
            Одобренные заказы и принятые предложения
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="flex items-center gap-4 p-4 hover:bg-card-hover border-b border-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{chat.client}</p>
                <p className="text-sm text-foreground/60 truncate">{chat.order}</p>
              </div>
              {chat.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-accent-green flex items-center justify-center text-xs font-medium text-background shrink-0">
                  {chat.unread}
                </span>
              )}
              <ArrowRight className="w-4 h-4 text-foreground/40 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
      <div className="flex-1 ml-6 flex flex-col items-center justify-center text-center text-foreground/50">
        <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
        <p>Выберите чат слева или</p>
        <p className="text-sm mt-1">откройте диалог из карточки заказа</p>
      </div>
    </div>
  );
}
