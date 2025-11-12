"use client";

import { cn } from "@/lib/utils";

interface HtmlContentProps {
    content: string;
    className?: string;
}

/**
 * Component to safely render HTML content from Tiptap editor
 * with proper styling using Tailwind Typography
 */
export function HtmlContent({ content, className }: HtmlContentProps) {
    return (
        <div
            className={cn(
                // Tailwind Typography classes for beautiful styling
                "prose prose-slate dark:prose-invert",
                "prose-headings:font-bold prose-headings:text-foreground",
                "prose-p:text-muted-foreground prose-p:leading-7",
                "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                "prose-strong:text-foreground prose-strong:font-semibold",
                "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
                "prose-pre:bg-muted prose-pre:text-foreground",
                "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
                "prose-img:rounded-lg prose-img:shadow-md",
                "max-w-none", // Remove max-width constraint
                className
            )}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}

// Usage in blog post page:
// <HtmlContent content={post.content} />