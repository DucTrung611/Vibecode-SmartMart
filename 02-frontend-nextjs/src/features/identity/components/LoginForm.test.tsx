import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@/shared/context/session-context";
import { LoginForm } from "./LoginForm";
import * as identityService from "../services/identity.service";

jest.mock("../services/identity.service");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{ui}</SessionProvider>
    </QueryClientProvider>,
  );
}

describe("LoginForm", () => {
  it("shows a validation error when email is invalid", async () => {
    renderWithProviders(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(identityService.login).not.toHaveBeenCalled();
  });

  it("calls identityService.login and getProfile on valid submit", async () => {
    (identityService.login as jest.Mock).mockResolvedValueOnce({
      accessToken: "token",
    });
    (identityService.getProfile as jest.Mock).mockResolvedValueOnce({
      id: "u1",
      email: "a@test.com",
      status: "active",
      preferences: {},
      createdAt: new Date().toISOString(),
    });
    renderWithProviders(<LoginForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "a@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(identityService.login).toHaveBeenCalledWith({
        email: "a@test.com",
        password: "password123",
      }),
    );
    await waitFor(() => expect(identityService.getProfile).toHaveBeenCalled());
  });
});
