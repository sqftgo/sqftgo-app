import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useApp } from "@/context/AppContext";
import type { DirectoryProfile } from "@/data/types";
import { isApiMode } from "@/lib/api/config";
import { apiListDealers } from "@/lib/api/services/dealers";
import { isServiceDirectoryCategory } from "@/lib/is-dealer-category";

/** The signed-in user's service-partner profile, if they registered one. */
export function useMyServiceProfile(): {
  profile: DirectoryProfile | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { isLoggedIn, directoryProfiles, profile: me, userEmail } = useApp();
  const query = useQuery({
    queryKey: ["dealers", "mine"],
    queryFn: () => apiListDealers(true),
    enabled: isApiMode && isLoggedIn,
  });

  const profile = useMemo(() => {
    const email = userEmail?.toLowerCase();
    const mine = (p: DirectoryProfile) =>
      (me?.id && p.userId === me.id) || (email && p.email?.toLowerCase() === email);
    const source = query.data ?? directoryProfiles.filter(mine);
    return source.find((p) => isServiceDirectoryCategory(p.category));
  }, [query.data, directoryProfiles, me?.id, userEmail]);

  return {
    profile,
    isLoading: isApiMode && isLoggedIn && query.isLoading,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
