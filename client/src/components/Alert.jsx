import React from "react";

function Alert({ color, message }) {
  return (
    <div
      class={`alert alert-${color} alert-dismissible fade show`}
      role="alert"
    >
      {message}
    </div>
  );
}

export default Alert;
