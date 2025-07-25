"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadIcon, Loader2, LogIn } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { uploadFile, uploadFileToWorkspace } from "@/lib/actions";
import { WorkspaceSelector } from "@/components/workspace-selector";

export function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { isSignedIn, isLoaded, user } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload files",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an XLSX file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!file.name.endsWith(".xlsx")) {
      toast({
        title: "Invalid file format",
        description: "Please upload an XLSX file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      let result;
      if (selectedWorkspaceId) {
        result = await uploadFileToWorkspace(formData, selectedWorkspaceId);
      } else {
        result = await uploadFile(formData);
      }

      if (result.success) {
        toast({
          title: "File uploaded successfully",
          description: "Your attendance data is being processed",
        });
        router.push(`/reports/${result.reportId}`);
      } else {
        throw new Error(result.error || "Failed to upload file");
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <section id="upload" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Upload Attendance Data
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Loading...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="upload" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Upload Attendance Data
            </h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Upload your XLSX file from the access control system to generate
              attendance reports
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-lg py-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload XLSX File</CardTitle>
              <CardDescription>
                {isSignedIn 
                  ? "Select an XLSX file containing employee attendance data"
                  : "Please sign in to upload attendance data"
                }
              </CardDescription>

            </CardHeader>
            {isSignedIn ? (
              <form onSubmit={handleSubmit}>
                <CardContent>
                  <div className="grid w-full items-center gap-4">
                    <WorkspaceSelector
                      selectedWorkspaceId={selectedWorkspaceId}
                      onWorkspaceChange={setSelectedWorkspaceId}
                    />
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="file">File</Label>
                      <Input
                        id="file"
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" disabled={isUploading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!file || isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <CardContent className="flex flex-col items-center space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  You need to be signed in to upload and process attendance files.
                </p>
                <SignInButton mode="modal">
                  <Button className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In to Upload
                  </Button>
                </SignInButton>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
