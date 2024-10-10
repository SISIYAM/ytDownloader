import React from "react";

function DownloadingBtn() {
  return (
    <button class="btn btn-primary" type="button" disabled>
      <span
        class="spinner-border spinner-border-sm"
        role="status"
        aria-hidden="true"
      ></span>
      Downloading...
    </button>
  );
}

export default DownloadingBtn;
