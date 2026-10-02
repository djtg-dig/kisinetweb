import { afterEach, describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  acceptPharmacyMemberInvitation,
  createPharmacyMemberInvitation,
  declinePharmacyMemberInvitation,
  getPharmacyMemberInvitations,
  resendPharmacyMemberInvitation,
  revokePharmacyMemberInvitation,
  searchPharmacyMemberCandidate,
} from "@/lib/api";
import { setApiFetchImpl } from "@/lib/api/request";

const invitationPayload = {
  id: 42,
  pharmacy: "PH12345678",
  invited_user_reference: "US12345678",
  invited_user_display_name: "Marie Kabasele",
  invited_email: "marie@example.com",
  invited_by: "4",
  invited_by_email: "owner@example.com",
  role: "PHARMACIST",
  status: "PENDING",
  expires_at: "2026-10-10T12:00:00Z",
  accepted_by: null,
  accepted_by_email: null,
  accepted_at: null,
  created_at: "2026-10-03T12:00:00Z",
  updated_at: "2026-10-03T12:00:00Z",
};

afterEach(() => {
  setApiFetchImpl((input, init) => fetch(input, init));
});

function mockApiResponse(payload: unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  setApiFetchImpl(async (input, init) => {
    calls.push({ url: String(input), init });
    return Response.json(payload);
  });
  return calls;
}

describe("client API invitations membres", () => {
  test("recherche un candidat avec un e-mail normalisé", async () => {
    const calls = mockApiResponse({
      reference: "US12345678",
      email: "marie@example.com",
      display_name: "Marie Kabasele",
    });

    const candidate = await searchPharmacyMemberCandidate("PH12345678", " Marie@Example.COM ");

    assert.deepEqual(candidate, {
      reference: "US12345678",
      email: "marie@example.com",
      displayName: "Marie Kabasele",
    });
    assert.equal(
      calls[0]?.url,
      "/api/backend/api/pharmacies/PH12345678/member-candidates/?email=marie%40example.com",
    );
    assert.equal(calls[0]?.init?.method, undefined);
  });

  test("crée une invitation avec user_reference et rôle", async () => {
    const calls = mockApiResponse(invitationPayload);

    const invitation = await createPharmacyMemberInvitation("PH12345678", {
      userReference: "US12345678",
      role: "PHARMACIST",
    });

    assert.equal(invitation.invitedUserReference, "US12345678");
    assert.equal(invitation.invitedEmail, "marie@example.com");
    assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
      user_reference: "US12345678",
      role: "PHARMACIST",
    });
  });

  test("liste et agit sur les invitations avec les routes prévues", async () => {
    mockApiResponse([invitationPayload]);
    const invitations = await getPharmacyMemberInvitations("PH12345678");
    assert.equal(invitations[0]?.id, 42);

    const actionCalls = mockApiResponse(invitationPayload);
    await resendPharmacyMemberInvitation("PH12345678", 42);
    await revokePharmacyMemberInvitation("PH12345678", 42);
    await acceptPharmacyMemberInvitation("token-secure-1234567890");
    await declinePharmacyMemberInvitation("token-secure-1234567890");

    assert.deepEqual(
      actionCalls.map((call) => call.url),
      [
        "/api/backend/api/pharmacies/PH12345678/member-invitations/42/resend/",
        "/api/backend/api/pharmacies/PH12345678/member-invitations/42/revoke/",
        "/api/backend/api/pharmacies/member-invitations/accept/",
        "/api/backend/api/pharmacies/member-invitations/decline/",
      ],
    );
    assert.equal(actionCalls[0]?.init?.method, "POST");
    assert.deepEqual(JSON.parse(String(actionCalls[2]?.init?.body)), {
      token: "token-secure-1234567890",
    });
  });
});
