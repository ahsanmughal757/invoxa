"use client";

import { Organization } from "@/types/invoice";
import { useState, createContext, useContext } from "react";
import { useInvoices } from "./use-invoices";

const SelectedOrganizationContext = createContext<{
    selectedOrganization: Organization | null;
    setSelectedOrganization: (org: Organization | null) => any;
}>({
    selectedOrganization: null,
    setSelectedOrganization: () => {},
});

export const SelectedOrganizationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);


  return (
    <SelectedOrganizationContext.Provider
      value={{ selectedOrganization, setSelectedOrganization }}
    >
      {children}
    </SelectedOrganizationContext.Provider>
  );
};

export const useSelectedOrganization = () => {
  const context = useContext(SelectedOrganizationContext);
  if (!context) {
    throw new Error(
      "useSelectedOrganization must be used within a SelectedOrganizationProvider"
    );
  }

  return context;
};
