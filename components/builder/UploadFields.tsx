import { useState } from "react";
import {
  uploadImageToCloudinary,
  uploadResumeToCloudinary,
  type CloudinaryUploadScope,
} from "@/lib/cloudinary";

export function ImageUploadField({
  label,
  value,
  onChange,
  help,
  uploadScope = { scope: "shared" },
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  uploadScope?: CloudinaryUploadScope;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file.");
      return;
    }

    setBusy(true);
    setStatus("Uploading…");

    try {
      const result = await uploadImageToCloudinary(file, uploadScope);
      onChange(result.secure_url);
      setStatus("Uploaded");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field image-upload-field">
      <span>{label}</span>
      {value ? (
        <div className="image-upload-preview">
          <img src={value} alt="" />
          <button type="button" className="danger-link" onClick={() => onChange("")}>
            Remove
          </button>
        </div>
      ) : null}
      <label className={`image-upload-button ${busy ? "disabled" : ""}`}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          disabled={busy}
          onChange={(event) => upload(event.target.files?.[0])}
        />
        {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
      </label>
      {help && <small className="field-help">{help}</small>}
      {status && <small className="upload-status">{status}</small>}
    </div>
  );
}

export function ResumeUploadField({
  value,
  variantKey,
  openUrl,
  onChange,
}: {
  value: {
    url: string;
    publicId: string;
    fileName: string;
    showInHero: boolean;
    hideSectionWhenHeroLink: boolean;
  };
  variantKey: string;
  openUrl?: string;
  onChange: (value: {
    url: string;
    publicId: string;
    fileName: string;
    showInHero: boolean;
    hideSectionWhenHeroLink: boolean;
  }) => void;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;

    setBusy(true);
    setStatus("Uploading…");

    try {
      const result = await uploadResumeToCloudinary(file, variantKey);
      onChange({
        ...value,
        url: result.secure_url,
        publicId: result.public_id,
        fileName: file.name,
        showInHero: value.url ? value.showInHero : true,
      });
      setStatus("Resume uploaded");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field resume-upload-field">
      <span>Public resume PDF</span>
      {value.url ? (
        <div className="resume-upload-current">
          <div>
            <strong>{value.fileName || "Resume.pdf"}</strong>
            <a href={openUrl || value.url} target="_blank" rel="noreferrer">
              Open PDF ↗
            </a>
          </div>
          <button
            type="button"
            className="danger-link"
            onClick={() =>
              onChange({
                ...value,
                url: "",
                publicId: "",
                fileName: "",
              })
            }
          >
            Remove
          </button>
        </div>
      ) : null}
      <label className={`image-upload-button ${busy ? "disabled" : ""}`}>
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(event) => upload(event.target.files?.[0])}
        />
        {busy ? "Uploading…" : value.url ? "Replace resume" : "Upload PDF"}
      </label>
      <small className="field-help">
        PDF only, up to 5 MB. Visitors can view it inside the portfolio or open it in a new tab.
      </small>
      {status ? <small className="upload-status">{status}</small> : null}
    </div>
  );
}
