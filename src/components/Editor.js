import React from "react";

function Editor({ title, content, onTitleChange, onContentChange, onSave, saving }) {
  return (
    <div className="editor-wrapper">
      <div className="editor-topbar">
        <input
          className="title-input"
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Note title"
        />
        <button className="btn btn-primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <textarea
        className="editor-textarea"
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        placeholder={"Write markdown here...\n\n# Heading\n## Subheading\n- List item\n`inline code`\n```js\nconsole.log('code block');\n```"}
      />
    </div>
  );
}

export default Editor;
