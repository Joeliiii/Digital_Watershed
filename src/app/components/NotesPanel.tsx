import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StickyNote, Plus, Edit3, Trash2, X, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface NotesPanelProps {
  entityId: string;
  entityModel: 'Artwork' | 'Item' | 'Project' | 'Tag';
}

const NotesPanel = ({ entityId, entityModel }: NotesPanelProps) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // New note form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await api.getNotes(entityId, entityModel);
        setNotes(data);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setLoading(false);
      }
    };
    if (entityId) fetchNotes();
  }, [entityId, entityModel]);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const note = await api.createNote({
        entityId,
        entityModel,
        content: newContent.trim(),
        ...(newTitle.trim() && { title: newTitle.trim() }),
      });
      setNotes(prev => [note, ...prev]);
      setNewTitle('');
      setNewContent('');
      setShowNewForm(false);
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateNote(id, {
        title: editTitle.trim() || undefined,
        content: editContent.trim(),
      });
      setNotes(prev => prev.map(n => n._id === id ? updated : n));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const startEditing = (note: any) => {
    setEditingId(note._id);
    setEditTitle(note.title || '');
    setEditContent(note.content);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 hover:from-amber-100/60 hover:to-yellow-100/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <StickyNote className="size-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-900">Notes</h3>
          <span className="text-sm text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
            {notes.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNewForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="size-3.5" />
              Add Note
            </button>
          )}
          {isExpanded ? <ChevronUp className="size-4 text-amber-500" /> : <ChevronDown className="size-4 text-amber-500" />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-6">
          {/* New Note Form */}
          {showNewForm && (
            <div className="mb-6 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Note title (optional)"
                className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm font-medium focus:ring-2 focus:ring-amber-400 outline-none mb-2 bg-white"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your note..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:ring-2 focus:ring-amber-400 outline-none resize-none mb-3 bg-white"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowNewForm(false); setNewTitle(''); setNewContent(''); }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newContent.trim() || saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  Save Note
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 text-amber-500 animate-spin" />
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note._id} className="group relative p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-yellow-50/30 border border-amber-100 hover:border-amber-200 transition-colors">
                  {editingId === note._id ? (
                    // Editing mode
                    <div>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Note title (optional)"
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm font-medium focus:ring-2 focus:ring-amber-400 outline-none mb-2 bg-white"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm focus:ring-2 focus:ring-amber-400 outline-none resize-none mb-3 bg-white"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="size-4" />
                        </button>
                        <button
                          onClick={() => handleUpdate(note._id)}
                          disabled={!editContent.trim() || saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div>
                      {note.title && (
                        <h4 className="text-sm font-semibold text-amber-900 mb-1">{note.title}</h4>
                      )}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[11px] text-gray-400">{formatDate(note.createdAt)}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                            title="Edit note"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(note._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <StickyNote className="size-10 text-amber-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No notes yet</p>
              {!showNewForm && (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium"
                >
                  Add your first note
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesPanel;
