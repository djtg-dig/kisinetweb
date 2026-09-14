"use client";

import { carriAccountLoginUrl } from "@/lib/carri-account";
import { LinkButton } from "@/components/ui/link-button";

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
  loggedInHref,
  loggedInLabel,
  variant = "primary",
}: PublicAuthLinkProps) {
  return (
    <LinkButton href={carriAccountLoginUrl} variant={variant} className={className}>
      {children}
    </LinkButton>
  );
}
