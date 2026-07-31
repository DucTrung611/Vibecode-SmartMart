import { apiFetch } from "@/shared/lib/api-client";
import * as identityService from "./identity.service";

jest.mock("@/shared/lib/api-client", () => ({
  apiFetch: jest.fn(),
}));

const mockedApiFetch = apiFetch as jest.Mock;

describe("identity.service", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("register() posts to /auth/register", async () => {
    mockedApiFetch.mockResolvedValueOnce({ id: "u1" });

    await identityService.register({ email: "a@test.com", password: "password123" });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({
        method: "POST",
        body: { email: "a@test.com", password: "password123" },
      }),
    );
  });

  it("login() posts to /auth/login", async () => {
    mockedApiFetch.mockResolvedValueOnce({ accessToken: "token" });

    await identityService.login({ email: "a@test.com", password: "password123" });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("getProfile() calls GET /users/me", async () => {
    mockedApiFetch.mockResolvedValueOnce({ id: "u1" });

    await identityService.getProfile();

    expect(mockedApiFetch).toHaveBeenCalledWith("/users/me", expect.any(Object));
  });

  it("logout() posts to /auth/logout", async () => {
    mockedApiFetch.mockResolvedValueOnce(undefined);

    await identityService.logout();

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
