import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// ADR-0011: a page is a screen of the catalog, added there before it is coded. Only the
// screen-review skill checked this, and pages slipped past it (SCRUM-254).

const appDir = dirname(fileURLToPath(import.meta.url));
const catalog = readFileSync(join(appDir, "../../../../spec/screens/README.md"), "utf8");

// The pages the catalog names as not screens, under its Administrator table
const NOT_SCREENS = ["/styleguide", "/about"];

function pages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name === "page.tsx" ? [path] : [];
  });
}

// app/jobs/[id]/apply/page.tsx is /jobs/{id}/apply, as the catalog writes it
function addressOf(page: string): string {
  const segments = relative(appDir, dirname(page))
    .split(sep)
    .filter((segment) => segment !== "" && !segment.startsWith("("))
    .map((segment) => segment.replace(/^\[(.+)\]$/, "{$1}"));
  return "/" + segments.join("/");
}

// The Address column of the "Screens by role" tables: `/a`, `/b?token=…`
function catalogAddresses(): Set<string> {
  const addresses = new Set<string>();
  for (const line of catalog.split("\n")) {
    if (!line.startsWith("| [`")) continue;
    const addressColumn = line.split("|")[2];
    for (const [, address] of addressColumn.matchAll(/`([^`]+)`/g)) {
      addresses.add(address.split("?")[0]);
    }
  }
  return addresses;
}

describe("the screen catalog", () => {
  it("lists the address of every page", () => {
    const listed = catalogAddresses();
    const missing = pages(appDir)
      .map(addressOf)
      .filter((address) => !listed.has(address) && !NOT_SCREENS.includes(address));

    expect(missing).toEqual([]);
  });

  it("is read from the right place", () => {
    expect(catalogAddresses()).toContain("/jobs/{id}/apply");
  });
});
