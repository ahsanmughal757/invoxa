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
import { Button } from "@/components/ui/button";
import { UserX, Loader2, AlertTriangle } from "lucide-react";

interface RemoveMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => Promise<void>;
  memberName?: string;
  memberRole?: string;
  isSelf?: boolean;
  isLastOwner?: boolean;
}

export function RemoveMemberModal({
  open,
  onOpenChange,
  onRemove,
  memberName,
  memberRole,
  isSelf = false,
  isLastOwner = false,
}: RemoveMemberModalProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to remove member:", error);
      // Error is handled by the parent component via toast
    } finally {
      setIsRemoving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isRemoving) {
      onOpenChange(newOpen);
    }
  };

  // Cannot remove last owner
  if (isLastOwner) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cannot Remove Owner
            </DialogTitle>
            <DialogDescription>
              This is the last owner of the organization. Ownership must be transferred to another member before removing this user.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            {isSelf ? "Leave Organization" : "Remove Member"}
          </DialogTitle>
          <DialogDescription>
            {isSelf ? (
              <>
                Are you sure you want to leave this organization? You will lose access to all invoices, clients, and organization data.
              </>
            ) : (
              <>
                Are you sure you want to remove{" "}
                <span className="font-semibold">{memberName}</span> from the organization?
                {memberRole === "admin" && (
                  <span className="block mt-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    This user has admin privileges.
                  </span>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isRemoving}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isSelf ? "Leaving..." : "Removing..."}
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                {isSelf ? "Leave Organization" : "Remove Member"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
