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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(getAccessToken()));
  }, []);

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
