"use client";

import { carriAccountLoginUrl } from "@/lib/carri-account";
import { LinkButton } from "@/components/ui/link-button";
import { useSession } from "@/lib/hooks/use-session";

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
  const { authenticated } = useSession();
  const href = authenticated ? (loggedInHref || "/app/select-pharmacy") : carriAccountLoginUrl;
  const label = authenticated ? (loggedInLabel || "Ouvrir Kisinet") : children;

  return (
    <LinkButton href={href} variant={variant} className={className}>
      {label}
    </LinkButton>
  );
}
