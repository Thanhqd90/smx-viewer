"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { normalizeEditInput } from "@/lib/smx/editInput";

export default function EditLookup() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const displayId = normalizeEditInput(value);

    if (!displayId) {
      setError("Enter an edit code or edits.stepmaniax.com URL.");
      return;
    }

    setError(null);
    router.push(`/edit/${encodeURIComponent(displayId)}`);
  };

  return (
    <form
      className="edit-lookup"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label htmlFor="edit-input">Edit code or StepManiaX URL</label>
      <div className="edit-lookup-row">
        <input
          id="edit-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "edit-input-error" : undefined}
          placeholder="2P6-239 or https://edits.stepmaniax.com/..."
        />
        <button type="submit">View Edit</button>
      </div>
      {error && (
        <p id="edit-input-error" className="input-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
