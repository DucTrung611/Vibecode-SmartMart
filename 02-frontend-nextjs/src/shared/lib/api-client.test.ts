import { apiFetch } from "./api-client";
import { ApiError } from "@/shared/types/api-envelope";
import { getAccessToken, setAccessToken } from "./auth-token";

function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe("apiFetch", () => {
  beforeEach(() => {
    setAccessToken(null);
    global.fetch = jest.fn();
  });

  it("returns unwrapped data on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ success: true, data: { id: "u1" }, meta: {} }),
    );

    const result = await apiFetch<{ id: string }>("/users/me");

    expect(result).toEqual({ id: "u1" });
  });

  it("throws ApiError with the backend error code on failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        {
          success: false,
          error: { code: "IDENTITY_INVALID_CREDENTIALS", message: "Invalid", details: null },
        },
        401,
      ),
    );

    await expect(apiFetch("/auth/login")).rejects.toMatchObject({
      code: "IDENTITY_INVALID_CREDENTIALS",
    });
  });

  it("refreshes the access token once and retries on AUTH_TOKEN_EXPIRED", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            error: { code: "AUTH_TOKEN_EXPIRED", message: "Expired", details: null },
          },
          401,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { accessToken: "new-token" },
          meta: {},
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: "u1" }, meta: {} }),
      );

    const result = await apiFetch<{ id: string }>("/users/me");

    expect(result).toEqual({ id: "u1" });
    expect(getAccessToken()).toBe("new-token");
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("resolves 204 No Content without parsing a body (e.g. logout)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 204,
      json: () => Promise.reject(new Error("no body to parse")),
    } as unknown as Response);

    await expect(
      apiFetch<void>("/auth/logout", { method: "POST" }),
    ).resolves.toBeUndefined();
  });

  it("clears the access token on AUTH_SESSION_INVALID", async () => {
    setAccessToken("stale-token");
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(
        {
          success: false,
          error: { code: "AUTH_SESSION_INVALID", message: "Invalid session", details: null },
        },
        401,
      ),
    );

    await expect(apiFetch("/auth/refresh", { method: "POST" })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(getAccessToken()).toBeNull();
  });
});
