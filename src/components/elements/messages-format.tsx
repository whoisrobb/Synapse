"use client";

import { useCurrentMember } from "@/hooks/use-current-member";
import { useParams } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { MessagesReturnProps } from "@/hooks/use-get-messages";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import Message from "./message";
import { Loader } from "lucide-react";

const TIMETHRESHOLD = 5;

const formartDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
};

type MessagesFormatProps = {
    data: MessagesReturnProps;
    variant?: 'channel' | 'thread' | 'conversation';
    loadMore: () => void;
    isLoadingMore: boolean;
    canLoadMore: boolean;
}

const MessagesFormat = ({
    data,
    variant,
    loadMore,
    isLoadingMore,
    canLoadMore
}: MessagesFormatProps) => {
    const { workspaceId } = useParams<{ workspaceId: string }>();	

    const { data: currentMember } = useCurrentMember(workspaceId as Id<"workspaces">);
    const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

    const groupedMessages = data.reduce((acc, message) => {
        const date = new Date(message._creationTime);
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].unshift(message);
        return acc;
    }, {} as Record<string, MessagesReturnProps>);

  return (
    Object.entries(groupedMessages || {}).map(([date, messages]) => (
        <div key={date} className="">
            <div className="text-center my-2 relative">
                <hr className='absolute top-1/2 left-0 right-0 border-t border-muted-foreground' />
                <span className='relative inline-block px-4 py-1 rounded-full text-xs bg-background border border-muted-foreground shadow-sm'>
                    {formartDateLabel(date)}
                </span>
            </div>
            {messages.map((message, index) => {
                const prevMessage = messages[index - 1];
                const isCompact =
                    prevMessage &&
                    prevMessage.user._id === message.user._id &&
                    differenceInMinutes(
                        new Date(message._creationTime),
                        new Date(prevMessage._creationTime)
                    ) < TIMETHRESHOLD;
                return (
                    <Message
                        key={message._id}
                        id={message._id}
                        memberId={message.memberId}
                        authorImage={message.user.image}
                        authorName={message.user.name}
                        isAuthor={message.memberId === currentMember?._id}
                        reactions={message.reactions}
                        body={message.content}
                        updatedAt={message.updatedAt}
                        createdAt={message._creationTime}
                        isEditing={editingId === message._id}
                        setEditingId={setEditingId}
                        isCompact={isCompact}
                        hideThreadButton={variant === 'thread'}
                        threadCount={message.threadCount}
                        threadTimestamp={message.threadTimestamp}
                    />)
            })}
            <div
                className="h-1"
                ref={(el) => {
                    if (el) {
                        const observer = new IntersectionObserver(
                            ([entry]) => {
                                if (entry.isIntersecting && canLoadMore) {
                                    loadMore();
                                }
                            },
                            { threshold: 1.0 }
                        );

                        observer.observe(el);
                        return () => {
                            observer.disconnect();
                        };
                    }
                }}
            />
            {isLoadingMore && (
                <div className="text-center my-2 relative">
                    <hr className='absolute top-1/2 left-0 right-0 border-t border-muted-foreground' />
                    <span className='relative inline-block px-4 py-1 rounded-full text-xs bg-background border border-muted-foreground shadow-sm'>
                        <Loader className="size-4 animate-spin" />
                    </span>
                </div>
            )}
        </div>
    ))
  );
}

export default MessagesFormat;
