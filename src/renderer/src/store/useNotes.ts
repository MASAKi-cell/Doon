import { unwrap } from 'jotai/utils'
import { v7 as uuidv7 } from 'uuid'
import { atom } from 'jotai'

/** tyes */
import { NoteInfo } from '@renderer/contents/note'

const getNotes = async (): Promise<NoteInfo[]> => {
  const notes: NoteInfo[] = await window.electron.getNotes()
  return notes.sort((a, b) => b.lastEditTime.getTime() - a.lastEditTime.getTime())
}
const notesAtomAsync = atom<NoteInfo[] | Promise<NoteInfo[]>>(getNotes())
export const notesAtom = unwrap(notesAtomAsync, (prev) => prev)

export const selectedNoteIndexAtom = atom<number | null>(0)

/**
 * note選択
 */
const selectedNoteAtomAsync = atom(async (get) => {
  const notes: NoteInfo[] | undefined = get(notesAtom)
  const index = get(selectedNoteIndexAtom)

  if (!notes) {
    return null
  }

  const selectedNote: NoteInfo = notes[index ?? 1]
  const noteContent = await window.electron.readNote(selectedNote?.uuid)

  return {
    ...selectedNote,
    content: noteContent
  }
})

export const selectedNoteAtom = unwrap(
  selectedNoteAtomAsync,
  (prev) =>
    prev ?? {
      uuid: uuidv7(),
      title: '',
      content: '',
      lastEditTime: new Date()
    }
)

/**
 * noteの保存
 */
export const saveNoteAtom = atom(null, (get, set) => {
  const notes = get(notesAtom)
  const selectedNote = get(selectedNoteAtom)

  if (!selectedNote || !notes) return

  set(
    notesAtom,
    notes.map((note) => {
      if (note.uuid === selectedNote.uuid) {
        return {
          ...note,
          lastEditTime: new Date()
        }
      }

      return note
    })
  )
})

/**
 * noteの新規作成
 */
export const createNoteAtom = atom(null, async (get, set, newNote: NoteInfo) => {
  const notes = get(notesAtom)
  if (!notes) {
    return
  }

  set(notesAtom, [newNote, ...notes.filter((note) => note.uuid !== newNote.uuid)])
  set(selectedNoteIndexAtom, 0)
})

/**
 * noteの削除
 */
export const deleteNoteAtom = atom(null, async (get, set) => {
  const notes = get(notesAtom)
  const selectedNote = get(selectedNoteAtom)

  if (!notes || !selectedNote) {
    return
  }

  set(
    notesAtom,
    notes.filter((note) => note.uuid !== selectedNote.uuid)
  )
  set(selectedNoteIndexAtom, 0)
})
