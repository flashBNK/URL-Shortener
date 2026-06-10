import type { LinkShortSchema } from "../api/types";

export type DashboardStatusFilter = "all" | "active" | "disabled" | "expired";
export type DashboardExpiryFilter = "any" | "none" | "has" | "soon";
export type DashboardSort = "default" | "oldest" | "clicksDesc" | "clicksAsc" | "aliasAsc" | "aliasDesc" | "expiring";

export type DashboardFiltersState = {
  search: string;
  status: DashboardStatusFilter;
  expiry: DashboardExpiryFilter;
  sort: DashboardSort;
};

export const defaultDashboardFilters: DashboardFiltersState = {
  search: "",
  status: "all",
  expiry: "any",
  sort: "default",
};

const soonMs = 7 * 24 * 60 * 60 * 1000;

export function isDashboardFiltersDefault(filters: DashboardFiltersState) {
  return (
    filters.search === defaultDashboardFilters.search &&
    filters.status === defaultDashboardFilters.status &&
    filters.expiry === defaultDashboardFilters.expiry &&
    filters.sort === defaultDashboardFilters.sort
  );
}

export function getFilteredDashboardLinks(links: LinkShortSchema[], filters: DashboardFiltersState) {
  const now = Date.now();
  const normalizedSearch = filters.search.trim().toLowerCase();

  return links
    .map((link, index) => ({ link, index }))
    .filter(({ link }) => {
      if (
        normalizedSearch &&
        !link.short_url.toLowerCase().includes(normalizedSearch) &&
        !link.url.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (!matchesStatus(link, filters.status, now)) {
        return false;
      }

      return matchesExpiry(link, filters.expiry, now);
    })
    .sort((left, right) => compareLinks(left, right, filters.sort))
    .map(({ link }) => link);
}

function matchesStatus(link: LinkShortSchema, status: DashboardStatusFilter, now: number) {
  if (status === "all") {
    return true;
  }

  if (status === "disabled") {
    return !link.is_active;
  }

  const isExpired = Boolean(link.expires_at && new Date(link.expires_at).getTime() < now);

  if (status === "expired") {
    return link.is_active && isExpired;
  }

  return link.is_active && !isExpired;
}

function matchesExpiry(link: LinkShortSchema, expiry: DashboardExpiryFilter, now: number) {
  if (expiry === "any") {
    return true;
  }

  if (expiry === "none") {
    return link.expires_at === null;
  }

  if (!link.expires_at) {
    return false;
  }

  if (expiry === "has") {
    return true;
  }

  const expiresAt = new Date(link.expires_at).getTime();
  return expiresAt >= now && expiresAt - now <= soonMs;
}

function compareLinks(
  left: { link: LinkShortSchema; index: number },
  right: { link: LinkShortSchema; index: number },
  sort: DashboardSort,
) {
  if (sort === "clicksDesc") {
    return right.link.total - left.link.total || left.index - right.index;
  }

  if (sort === "clicksAsc") {
    return left.link.total - right.link.total || left.index - right.index;
  }

  if (sort === "aliasAsc") {
    return left.link.short_url.localeCompare(right.link.short_url) || left.index - right.index;
  }

  if (sort === "aliasDesc") {
    return right.link.short_url.localeCompare(left.link.short_url) || left.index - right.index;
  }

  if (sort === "expiring") {
    const leftExpiresAt = left.link.expires_at ? new Date(left.link.expires_at).getTime() : Number.POSITIVE_INFINITY;
    const rightExpiresAt = right.link.expires_at ? new Date(right.link.expires_at).getTime() : Number.POSITIVE_INFINITY;
    return leftExpiresAt - rightExpiresAt || left.index - right.index;
  }

  if (sort === "oldest") {
    return right.index - left.index;
  }

  return left.index - right.index;
}
