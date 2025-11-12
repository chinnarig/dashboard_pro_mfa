'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { formatDate, calculateReadingTime, getInitials } from '@/lib/utils';

interface BlogCardProps {
    post: {
        id: string;
        title: string;
        slug: string;
        excerpt?: string | null;
        content: string;
        coverImage?: string | null;
        publishedAt: Date | null;
        viewCount: number;
        author: {
            id: string;
            name: string | null;
            username: string;
            image: string | null;
        };
        tags?: Array<{
            tag: {
                id: string;
                name: string;
                slug: string;
            };
        }>;
        _count: {
            comments: number;
            likes: number;
        };
    };
}

export function BlogCard({ post }: BlogCardProps) {
    const readingTime = calculateReadingTime(post.content);

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Link href={`/blog/${post.slug}`}>
                {post.coverImage && (
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                        <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 hover:scale-105"
                        />
                    </div>
                )}
            </Link>

            <CardHeader className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {post.tags?.slice(0, 3).map(({ tag }) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                        </Badge>
                    ))}
                </div>

                <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-2xl font-bold leading-tight hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                    </h3>
                </Link>

                {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
                )}
            </CardHeader>

            <CardContent>
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.author.username}`}>
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={post.author.image || ''} alt={post.author.name || ''} />
                            <AvatarFallback>
                                {getInitials(post.author.name || post.author.username)}
                            </AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                        <Link
                            href={`/profile/${post.author.username}`}
                            className="font-medium hover:underline truncate block"
                        >
                            {post.author.name || `@${post.author.username}`}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(post.publishedAt || "")}</span>
                            <span>•</span>
                            <span>{readingTime} min read</span>
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="border-t pt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground w-full">
                    <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{post._count.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post._count.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{post.viewCount}</span>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}