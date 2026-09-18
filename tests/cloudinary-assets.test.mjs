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
    "fb-portfolio-c0e01d99000000000000000000000000-backend-platform"
  );
});
