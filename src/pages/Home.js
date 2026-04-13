import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NotesList from "../components/NotesList";
import Editor from "../components/Editor";
import Preview from "../components/Preview";
import {
  createNote,
  deleteNote as deleteNoteRequest,
  fetchNotes,
  updateNote as updateNoteRequest
} from "../services/api";

const AUTO_SAVE_DELAY_MS = 650;
const THEME_STORAGE_KEY = "markdown-notes-theme";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const buildLocalNote = (note = {}) => ({
  id: note.id || null,
  title: note.title || "",
  content: note.content || ""
});

function Home() {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(buildLocalNote());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);

  const autoSaveTimerRef = useRef(null);
  const skipNextAutosaveRef = useRef(false);

  const filteredNotes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return notes;
    }

    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(keyword) ||
        note.content.toLowerCase().includes(keyword)
    );
  }, [notes, search]);

  const loadNotes = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchNotes();
      const fetchedNotes = response.data || [];
      setNotes(fetchedNotes);

      if (fetchedNotes.length > 0) {
        skipNextAutosaveRef.current = true;
        setActiveNote(buildLocalNote(fetchedNotes[0]));
      } else {
        skipNextAutosaveRef.current = true;
        setActiveNote(buildLocalNote());
      }
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const upsertNoteInList = useCallback((note) => {
    setNotes((prevNotes) => {
      const existingIndex = prevNotes.findIndex((item) => item.id === note.id);

      if (existingIndex === -1) {
        return [note, ...prevNotes];
      }

      const updated = [...prevNotes];
      updated[existingIndex] = note;
      updated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      return updated;
    });
  }, []);

  const persistNote = useCallback(async (noteToSave) => {
    if (!noteToSave.title.trim() && !noteToSave.content.trim()) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      let response;
      if (noteToSave.id) {
        response = await updateNoteRequest(noteToSave.id, {
          title: noteToSave.title,
          content: noteToSave.content
        });
      } else {
        response = await createNote({
          title: noteToSave.title,
          content: noteToSave.content
        });
      }

      const savedNote = response.data;
      upsertNoteInList(savedNote);
      setActiveNote(buildLocalNote(savedNote));
      setLastSavedAt(new Date());
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  }, [upsertNoteInList]);

  const onTitleChange = (value) => {
    skipNextAutosaveRef.current = false;
    setActiveNote((prev) => ({ ...prev, title: value }));
  };

  const onContentChange = (value) => {
    skipNextAutosaveRef.current = false;
    setActiveNote((prev) => ({ ...prev, content: value }));
  };

  const onCreate = () => {
    skipNextAutosaveRef.current = true;
    setActiveNote(buildLocalNote());
    setError("");
  };

  const onSelect = (note) => {
    skipNextAutosaveRef.current = true;
    setActiveNote(buildLocalNote(note));
    setError("");
  };

  const onDelete = async (id) => {
    setError("");

    try {
      await deleteNoteRequest(id);

      let nextActiveNote = null;
      setNotes((prev) => {
        const remaining = prev.filter((note) => note.id !== id);

        if (activeNote.id === id) {
          nextActiveNote =
            remaining.length > 0 ? buildLocalNote(remaining[0]) : buildLocalNote()
        }

        return remaining;
      });

      if (nextActiveNote) {
        skipNextAutosaveRef.current = true;
        setActiveNote(nextActiveNote);
      }
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete note");
    }
  };

  useEffect(() => {
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      persistNote(activeNote);
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [activeNote, persistNote]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="layout">
      <NotesList
        notes={filteredNotes}
        activeId={activeNote.id}
        search={search}
        onSearchChange={setSearch}
        onSelect={onSelect}
        onCreate={onCreate}
        onDelete={onDelete}
      />

      <main className="main-panel">
        <div className="status-bar">
          {loading ? "Loading notes..." : "Ready"}
          {saving && <span className="status-saving">Saving changes...</span>}
          {!saving && lastSavedAt && (
            <span className="status-saved">
              Saved at {lastSavedAt.toLocaleTimeString()}
            </span>
          )}
          {error && <span className="status-error">{error}</span>}
          <button className="btn btn-theme" onClick={toggleTheme}>
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>

        <div className="workspace">
          <Editor
            title={activeNote.title}
            content={activeNote.content}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
            onSave={() => persistNote(activeNote)}
            saving={saving}
          />
          <Preview content={activeNote.content} />
        </div>
      </main>
    </div>
  );
}

export default Home;
