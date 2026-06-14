import { useState } from "react";
import { ApiError } from "../api/types";

export function useRateLimitCooldown() {
  const [hasRateLimit, setHasRateLimit] = useState(false);

  function startCooldown(error: unknown) {
    if (!(error instanceof ApiError) || error.code !== "rate_limit") {
      return false;
    }

    setHasRateLimit(true);
    return true;
  }

  function resetCooldown() {
    setHasRateLimit(false);
  }

  return {
    hasRateLimit,
    startCooldown,
    resetCooldown,
  };
}
