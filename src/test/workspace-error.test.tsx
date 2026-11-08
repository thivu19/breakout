import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceError } from "../components/breakout/workspace-error";

const helpers = vi.hoisted(() => ({ invalidate: vi.fn().mockResolvedValue(undefined), invalidateQueries: vi.fn().mockResolvedValue(undefined), resetQuery: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useRouter: () => ({ state: { location: { pathname: "/command-center" } }, invalidate: helpers.invalidate }) }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: helpers.invalidateQueries }), useQueryErrorResetBoundary: () => ({ reset: helpers.resetQuery }) }));
vi.mock("../components/breakout/app-shell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

describe("workspace recovery", () => {
  it("retries failed workspace reads and resets both boundaries", async () => {
    const reset = vi.fn();
    render(<WorkspaceError error={new Error("The protected SpacetimeDB module must be published before activation.")} reset={reset} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(reset).toHaveBeenCalledTimes(1));
    expect(helpers.resetQuery).toHaveBeenCalledTimes(1);
    expect(helpers.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["stdb"], refetchType: "none" });
    expect(helpers.invalidate).toHaveBeenCalledTimes(1);
  });
});