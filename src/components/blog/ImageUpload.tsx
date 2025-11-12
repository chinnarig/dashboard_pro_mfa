"use client";

import { useState, useRef } from "react";
import { X, Upload, Link as LinkIcon, CheckCircle2, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
}

export function ImageUpload({
    value,
    onChange,
    disabled = false,
}: ImageUploadProps) {
    const [imageUrl, setImageUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUrlSubmit = (e?: React.FormEvent | React.MouseEvent) => {
        if (e) {
            e.preventDefault();
        }
        if (imageUrl.trim()) {
            onChange(imageUrl.trim());
            setImageUrl("");
        }
    };

    const handleRemove = () => {
        onChange("");
    };

    const uploadFile = async (file: File) => {
        try {
            setIsUploading(true);
            setUploadProgress(10);

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            // Validate file size (4MB)
            if (file.size > 4 * 1024 * 1024) {
                alert('File size must be less than 4MB');
                return;
            }

            setUploadProgress(30);

            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            setUploadProgress(50);

            // Upload to Azure
            const response = await fetch('/api/upload/google', {
                method: 'POST',
                body: formData,
            });

            setUploadProgress(80);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const data = await response.json();

            setUploadProgress(100);
            onChange(data.url);

        } catch (error: any) {
            console.error('Upload error:', error);
            alert(error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadFile(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadFile(e.dataTransfer.files[0]);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    if (value) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Image uploaded successfully!</span>
                </div>

                <div className="relative w-full rounded-lg overflow-hidden border-2 border-green-500 dark:border-green-400 bg-muted">
                    <div className="relative w-full h-80">
                        <Image
                            src={value}
                            alt="Cover image preview"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </div>

                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button
                            type="button"
                            onClick={handleRemove}
                            disabled={disabled}
                            variant="destructive"
                            size="lg"
                        >
                            <X className="h-5 w-5 mr-2" />
                            Remove Image
                        </Button>
                    </div>
                </div>

                <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground mb-1">Image URL:</p>
                    <p className="text-sm font-mono break-all">{value}</p>
                </div>
            </div>
        );
    }

    return (
        <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" disabled={isUploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                </TabsTrigger>
                <TabsTrigger value="url" disabled={isUploading}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Image URL
                </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center bg-muted/50 transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={disabled || isUploading}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-primary/10 rounded-full">
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-primary" />
                            )}
                        </div>

                        {isUploading ? (
                            <div className="space-y-2 w-full max-w-xs">
                                <p className="text-sm font-medium">Uploading to Azure...</p>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center space-y-1">
                                    <p className="text-sm font-medium">
                                        Drag and drop your image here
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        or click the button below to browse
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleButtonClick}
                                    disabled={disabled || isUploading}
                                    size="lg"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Select Image
                                </Button>

                                <p className="text-xs text-muted-foreground">
                                    Maximum file size: 4MB • Supported: JPG, PNG, GIF, WebP
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input
                            id="imageUrl"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleUrlSubmit(e as any);
                                }
                            }}
                            disabled={disabled || isUploading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enter a direct link to an image file
                        </p>
                    </div>
                    <Button
                        type="button"
                        onClick={handleUrlSubmit}
                        disabled={!imageUrl.trim() || disabled || isUploading}
                        className="w-full"
                    >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Add Image from URL
                    </Button>
                </div>
            </TabsContent>
        </Tabs>
    );
}