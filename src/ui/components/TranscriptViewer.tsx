import { useEffect, useRef } from "react";
import type { TranscriptItem } from "../../types";

interface Props {
  messages: TranscriptItem[];
}

export default function TranscriptViewer({
  messages,
}: Props) {

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">

      {messages.map(msg => (
        <div
          key={msg.id}
          className={`flex ${
            msg.role === "user"
              ? "justify-end"
              : "justify-start"
          }`}
        >
          <div
            className={`
              max-w-[70%]
              px-3 py-2
              rounded-lg
              text-sm
              ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-black"
              }
            `}
          >
            {msg.text}
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}