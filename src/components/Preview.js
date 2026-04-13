import React from "react";
import ReactMarkdown from "react-markdown";

function Preview({ content }) {
  return (
    <div className="preview-wrapper">
      <div className="preview-header">Live Preview</div>
      <div className="preview-content markdown-body">
        <ReactMarkdown>{content || "_Start typing to preview markdown..._"}</ReactMarkdown>
      </div>
    </div>
  );
}

export default Preview;
