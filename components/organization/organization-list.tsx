"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Organization } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Building, AlertTriangle } from "lucide-react";
import {
  LoadingState,
  EmptyState,
  ErrorState,
  ReadyState,
} from "@/components/ui/state-components";

interface OrganizationListProps {
  organizations: Organization[];
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  errorMessage: string | null;
  isReady: boolean;
  onDelete: (id: string) => void;
  onRetry?: () => void;
}

export function OrganizationList({
  organizations,
  isLoading,
  isEmpty,
  isError,
  errorMessage,
  isReady,
  onDelete,
  onRetry,
}: OrganizationListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setOrgToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (orgToDelete) {
      onDelete(orgToDelete);
    }
    setDeleteDialogOpen(false);
    setOrgToDelete(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border">Name</TableHead>
                  <TableHead className="border">Email</TableHead>
                  <TableHead className="border">Phone</TableHead>
                  <TableHead className="border">Bank Name</TableHead>
                  <TableHead className="border">Website</TableHead>
                  <TableHead className="border text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="border text-center py-12">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Organizations"
        description={
          errorMessage ||
          "There was an issue retrieving your organizations. Please try again later."
        }
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title="No Organizations Found"
        description="Your account doesn't have any organizations yet."
      />
    );
  }

  if (isReady) {
    return (
      <ReadyState>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="border">Name</TableHead>
                    <TableHead className="border">Email</TableHead>
                    <TableHead className="border">Phone</TableHead>
                    <TableHead className="border">Bank Name</TableHead>
                    <TableHead className="border">Website</TableHead>
                    <TableHead className="border text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="border text-center py-8"
                      >
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <Building className="h-12 w-12 text-gray-400" />
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              No organizations
                            </h3>
                            <p className="text-gray-500 mt-1">
                              No organizations match the current criteria.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="border font-medium">
                          {org.name}
                        </TableCell>
                        <TableCell className="border">
                          {org.branding?.email}
                        </TableCell>
                        <TableCell className="border">
                          {org.branding?.phone}
                        </TableCell>
                        <TableCell className="border">
                          {org.branding?.bankDetails?.bankName}
                        </TableCell>
                        <TableCell className="border">
                          {org.branding?.website}
                        </TableCell>
                        <TableCell className="border text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(org.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Organization
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this organization? This will
                delete organization and its related data? Are you sure again?
                This action cannot be reversed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setOrgToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ReadyState>
    );
  }

  return (
    <EmptyState
      title="Organizations Unavailable"
      description="No organizations could be loaded."
    />
  );
}
