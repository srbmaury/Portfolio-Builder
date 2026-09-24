import test from "node:test";
import assert from "node:assert/strict";

import {
  cloudinaryPortfolioTag,
  cloudinaryUserTag,
  collectCloudinaryUrls,
  parseCloudinaryAssetUrl,
  selectUnreferencedAssetUrls,
} from "../lib/cloudinary-assets.ts";

test("parses owned Cloudinary delivery URLs into destroyable image public IDs", () => {
  assert.deepEqual(
    parseCloudinaryAssetUrl(
      "https://res.cloudinary.com/demo/image/upload/v1720000000/folioblocks/uploads/resume.pdf",
      "demo"
    ),
    {
      publicId: "folioblocks/uploads/resume",
      resourceType: "image",
    }
  );

  assert.equal(
    parseCloudinaryAssetUrl(
      "https://res.cloudinary.com/other/image/upload/v1/folioblocks/uploads/resume.pdf",
      "demo"
    ),
    null
  );
});


test("parses raw resume URLs without stripping the PDF extension", () => {
  assert.deepEqual(
    parseCloudinaryAssetUrl(
      "https://res.cloudinary.com/demo/raw/upload/v1789749724/folioblocks/uploads/resume.pdf",
      "demo"
    ),
    {
      publicId: "folioblocks/uploads/resume.pdf",
      resourceType: "raw",
    }
  );
});

test("recursively collects only Cloudinary URLs from persisted portfolio data", () => {
  const value = {
    branding: {
      faviconUrl:
        "https://res.cloudinary.com/demo/image/upload/v1/folioblocks/uploads/favicon.png",
    },
    nested: [
      {
        resume:
          "https://res.cloudinary.com/demo/image/upload/v1/folioblocks/uploads/resume.pdf",
      },
      { external: "https://example.com/not-cloudinary.png" },
    ],
  };

  assert.deepEqual(
    collectCloudinaryUrls(value, "demo").sort(),
    [
      "https://res.cloudinary.com/demo/image/upload/v1/folioblocks/uploads/favicon.png",
      "https://res.cloudinary.com/demo/image/upload/v1/folioblocks/uploads/resume.pdf",
    ].sort()
  );
});

test("portfolio deletion keeps assets still referenced by another portfolio", () => {
  const shared =
    "https://res.cloudinary.com/demo/image/upload/v1/folioblocks/uploads/shared.png";
  const unique =
    "https://res.cloudinary.com/demo/image/upload/v1/folioblocks/uploads/unique.png";

  assert.deepEqual(
    selectUnreferencedAssetUrls([shared, unique], [shared]),
    [unique]
  );
});

test("Cloudinary ownership tags are deterministic and scoped", () => {
  assert.equal(
    cloudinaryUserTag("c0e01d99-0000-0000-0000-000000000000"),
    "fb-user-c0e01d99000000000000000000000000"
  );
  assert.equal(
    cloudinaryPortfolioTag(
      "c0e01d99-0000-0000-0000-000000000000",
      "Backend & Platform"
    ),
    "fb-portfolio-c0e01d99000000000000000000000000-backend-platform-0b515d0c"
  );
});

test("asset cleanup only keeps assets the deleting user uploaded", async () => {
  const { selectOwnedAssetUrls } = await import("../lib/cloudinary-assets.ts");
  const cloud = "demo-cloud";
  const mine = `https://res.cloudinary.com/${cloud}/image/upload/v1/folioblocks/uploads/mine.png`;
  const theirs = `https://res.cloudinary.com/${cloud}/image/upload/v2/folioblocks/uploads/theirs.png`;
  // Same asset as `mine`, different version and a transformation.
  const mineAgain = `https://res.cloudinary.com/${cloud}/image/upload/c_fill,w_400/v9/folioblocks/uploads/mine.png`;
  const owned = [`https://res.cloudinary.com/${cloud}/image/upload/v1/folioblocks/uploads/mine.png`];

  assert.deepEqual(
    selectOwnedAssetUrls([mine, theirs, mineAgain], owned, cloud),
    [mine, mineAgain]
  );
  assert.deepEqual(selectOwnedAssetUrls([theirs], [], cloud), []);
});
