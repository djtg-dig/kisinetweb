"use client";

import { useSession } from "@/lib/hooks/use-session";
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
  loggedInHref = "/app/select-pharmacy",
  loggedInLabel = "Ouvrir Kisinet",
  variant = "primary",
}: PublicAuthLinkProps) {
  const { authenticated, loading } = useSession();

  if (loading) {
    return (
      <LinkButton href={carriAccountLoginUrl} variant={variant} className={className}>
        {children}
      </LinkButton>
    );
  }

  return (
    <LinkButton
      href={authenticated ? loggedInHref : carriAccountLoginUrl}
      variant={variant}
      className={className}
    >
      {authenticated ? loggedInLabel : children}
    </LinkButton>
  );
}
