import { act, render, screen } from "@testing-library/react";
import BackendDown, { MAX_RETRIES, RETRY_AFTER_MS } from "./BackendDown";

const router = { refresh: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function wait(ms: number) {
  return act(() => vi.advanceTimersByTimeAsync(ms));
}

describe("BackendDown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    router.refresh.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks a visitor of the deployed site to wait while the server wakes up", () => {
    render(<BackendDown local={false} />);

    expect(screen.getByRole("alert")).toHaveTextContent("takes a few minutes to wake up");
  });

  it("tells a developer how to start the local backend", () => {
    render(<BackendDown local />);

    expect(screen.getByRole("alert")).toHaveTextContent("./mvnw spring-boot:run");
  });

  it("tries again by itself", async () => {
    render(<BackendDown local={false} />);

    expect(router.refresh).not.toHaveBeenCalled();
    await wait(RETRY_AFTER_MS);
    expect(router.refresh).toHaveBeenCalledTimes(1);
    await wait(RETRY_AFTER_MS);
    expect(router.refresh).toHaveBeenCalledTimes(2);
  });

  it("waits for a try to end before it starts the next one", async () => {
    let endTry = () => {};
    router.refresh.mockReturnValue(new Promise<void>((resolve) => (endTry = resolve)));
    render(<BackendDown local={false} />);

    await wait(RETRY_AFTER_MS * 4);
    expect(router.refresh).toHaveBeenCalledTimes(1);

    router.refresh.mockReturnValue(undefined);
    await act(async () => endTry());
    await wait(RETRY_AFTER_MS);
    expect(router.refresh).toHaveBeenCalledTimes(2);
  });

  it("gives up after a few minutes and says how to try again", async () => {
    render(<BackendDown local={false} />);

    for (let tries = 0; tries < MAX_RETRIES + 2; tries++) {
      await wait(RETRY_AFTER_MS);
    }

    expect(router.refresh).toHaveBeenCalledTimes(MAX_RETRIES);
    expect(screen.getByRole("alert")).toHaveTextContent("Reload the page");
  });

  it("does not try again when retry is off", async () => {
    render(<BackendDown local={false} retry={false} />);

    await wait(RETRY_AFTER_MS * 2);

    expect(router.refresh).not.toHaveBeenCalled();
  });
});
