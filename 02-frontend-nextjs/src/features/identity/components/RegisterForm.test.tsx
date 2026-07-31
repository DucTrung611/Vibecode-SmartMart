import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@/shared/context/session-context";
import { RegisterForm } from "./RegisterForm";
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

describe("RegisterForm", () => {
  it("shows validation errors when submitted empty", async () => {
    renderWithProviders(<RegisterForm />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    expect(identityService.register).not.toHaveBeenCalled();
  });

  it("calls identityService.register with form values on valid submit", async () => {
    (identityService.register as jest.Mock).mockResolvedValueOnce({ id: "u1" });
    renderWithProviders(<RegisterForm />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "a@test.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(identityService.register).toHaveBeenCalledWith({
        email: "a@test.com",
        password: "password123",
      }),
    );
  });
});
