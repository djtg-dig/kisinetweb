"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { carriAccountLoginUrl } from "@/lib/carri-account";
import { getAccessToken } from "@/lib/auth";

type PublicAuthLinkProps = {
  children: React.ReactNode;
  className?: string;
  loggedInHref?: string;
  loggedInLabel?: string;
  variant?: "primary" | "secondary";
};

export function PublicAuthLink({
  children,
  className = "",
  loggedInHref = "/app/select-pharmacy",
  loggedInLabel = "Ouvrir Kisinet",
  variant = "primary",
}: PublicAuthLinkProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLoggedIn(Boolean(getAccessToken()));
  }, []);

  if (isLoggedIn === null) {
    return <span aria-hidden="true" className={`inline-flex min-h-11 ${className}`} />;
  }

  return (
    <LinkButton
      href={isLoggedIn ? loggedInHref : carriAccountLoginUrl}
      variant={variant}
      className={className}
    >
      {isLoggedIn ? loggedInLabel : children}
    </LinkButton>
  );
}
