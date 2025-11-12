import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Image uploader for blog post covers
    imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
        .middleware(async () => {
            // Check if user is authenticated
            const session = await getServerSession(authOptions);

            if (!session?.user) {
                throw new Error("Unauthorized");
            }

            // Pass user ID to the upload handler
            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This runs on the server after upload
            console.log("Upload complete for userId:", metadata.userId);
            console.log("File URL:", file.url);

            // Return data to the client
            return { uploadedBy: metadata.userId, url: file.url };
        }),

    // Avatar uploader for user profiles
    avatarUploader: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
        .middleware(async () => {
            const session = await getServerSession(authOptions);

            if (!session?.user) {
                throw new Error("Unauthorized");
            }

            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Avatar upload complete for userId:", metadata.userId);
            console.log("File URL:", file.url);

            return { uploadedBy: metadata.userId, url: file.url };
        }),

    // Post content image uploader (multiple images)
    contentImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
        .middleware(async () => {
            const session = await getServerSession(authOptions);

            if (!session?.user) {
                throw new Error("Unauthorized");
            }

            return { userId: session.user.id };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Content image upload complete for userId:", metadata.userId);
            console.log("File URL:", file.url);

            return { uploadedBy: metadata.userId, url: file.url };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;