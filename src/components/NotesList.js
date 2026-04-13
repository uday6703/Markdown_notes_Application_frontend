import React from "react";

function NotesList({
  notes,
  activeId,
  search,
  onSearchChange,
  onSelect,
  onCreate,
  onDelete
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Markdown Notes</h1>
        <button className="btn btn-primary" onClick={onCreate}>
          + New
        </button>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search notes..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <ul className="notes-list">
        {notes.length === 0 && <li className="empty-state">No notes found</li>}

        {notes.map((note) => (
          <li
            key={note.id}
            className={`note-item ${activeId === note.id ? "active" : ""}`}
            onClick={() => onSelect(note)}
          >
            <div className="note-item-content">
              <h3>{note.title || "Untitled"}</h3>
              <p>{(note.content || "").slice(0, 80) || "No content"}</p>
            </div>
            <button
              className="btn btn-danger"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(note.id);
              }}
              aria-label={`Delete ${note.title || "Untitled"}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default NotesList;
