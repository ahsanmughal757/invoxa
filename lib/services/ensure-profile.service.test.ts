import {
  ensureProfile,
  type EnsureProfileIdentity,
} from "@/lib/services/ensure-profile.service";

const mockUpsert = jest.fn();
const mockChain = {
  upsert: mockUpsert,
  select: jest.fn(),
};
mockChain.select.mockReturnValue({ single: jest.fn() });

const mockGetSupabaseClient = jest.fn(async () => ({
  from: jest.fn(() => mockChain),
}));

const mockCurrentUser = jest.fn();

jest.mock("@clerk/nextjs/server", () => ({
  get currentUser() {
    return mockCurrentUser;
  },
}));

jest.mock("@/lib/repositories/base.repository", () => ({
  getSupabaseClient: () => mockGetSupabaseClient(),
}));

jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

function okRow(identity: EnsureProfileIdentity) {
  return {
    id: "a1b2c3d4-0000-0000-0000-000000000001",
    clerk_user_id: identity.clerkUserId,
    name: identity.name ?? null,
    email: identity.email!,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("ensureProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpsert.mockReset();
    mockUpsert.mockReturnValue(mockChain);
    mockChain.select.mockReset();
    mockChain.select.mockReturnValue({ single: jest.fn() });
  });

  const identity: EnsureProfileIdentity = {
    clerkUserId: "clerk_test_123",
    name: "Ada Lovelace",
    email: "ada@example.com",
  };

  it("performs one atomic upsert keyed on clerk_user_id", async () => {
    const row = okRow(identity);
    mockChain.select.mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: row, error: null }),
    });

    const result = await ensureProfile(identity);

    expect(mockGetSupabaseClient).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        clerk_user_id: identity.clerkUserId,
        name: identity.name,
        email: identity.email,
      },
      expect.objectContaining({ onConflict: "clerk_user_id" }),
    );
    expect(result.kind).toBe("ok");
    expect(result.profile).toEqual(row);
  });

  it("is idempotent: repeats converge to the same single row", async () => {
    const row = okRow(identity);
    mockChain.select.mockReturnValue({
      single: jest
        .fn()
        .mockResolvedValue({ data: row, error: null }),
    });

    const first = await ensureProfile(identity);
    const second = await ensureProfile(identity);
    const third = await ensureProfile(identity);

    expect(first.profile).toBeDefined();
    expect(second.profile).toBeDefined();
    expect(third.profile).toBeDefined();
    expect(first.profile!.id).toBe(second.profile!.id);
    expect(second.profile!.id).toBe(third.profile!.id);
    // Concurrent/repeated calls exercise the same single statement.
    expect(mockUpsert).toHaveBeenCalledTimes(3);
  });

  it("never provisions a profile from an incomplete clerk identity", async () => {
    const incomplete: EnsureProfileIdentity = {
      clerkUserId: "clerk_test_456",
      name: "No Email",
      email: null,
    };

    const result = await ensureProfile(incomplete);

    expect(result.kind).toBe("clerk-user-incomplete");
    expect(result.profile).toBeNull();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("classifies an email clash (PG unique violation 23505)", async () => {
    const supabaseError = Object.assign(new Error("duplicate key value violates unique constraint"), {
      code: "23505",
    });
    mockChain.select.mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: supabaseError }),
    });

    const result = await ensureProfile(identity);

    expect(result.kind).toBe("email-clash");
    expect(result.profile).toBeNull();
    expect((result as any).error?.code).toBe("23505");
  });

  it("classifies a generic supabase failure as supabase-error", async () => {
    const supabaseError = Object.assign(new Error("connection refused"), {
      code: "42P01",
    });
    mockChain.select.mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: supabaseError }),
    });

    const result = await ensureProfile(identity);

    expect(result.kind).toBe("supabase-error");
    expect(result.profile).toBeNull();
    expect((result as any).error).toBe(supabaseError);
  });

  it("returns clerk-user-unavailable when no identity and Clerk auth yields no user", async () => {
    mockCurrentUser.mockResolvedValue(null);

    const result = await ensureProfile();

    expect(result.kind).toBe("clerk-user-unavailable");
    expect(result.profile).toBeNull();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("resolves Clerk identity via currentUser for authenticated boundaries", async () => {
    mockCurrentUser.mockResolvedValue({
      id: "clerk_test_current",
      firstName: "Grace",
      lastName: "Hopper",
      emailAddresses: [
        { id: "e1", emailAddress: "grace@example.com", primary: true },
      ],
    });
    const row = okRow({
      clerkUserId: "clerk_test_current",
      name: "Grace Hopper",
      email: "grace@example.com",
    });
    mockChain.select.mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: row, error: null }),
    });

    const result = await ensureProfile();

    expect(result.kind).toBe("ok");
    expect(result.profile!.clerk_user_id).toBe("clerk_test_current");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "grace@example.com" }),
      expect.anything(),
    );
  });
});
