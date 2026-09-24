/* Keepsakes that ship with the repo, so every device sees the same page.
   Add a file to photos-27/ or videos-27/, then list it here. */

export const BUILT_IN_PIECES = [
  { id: "builtin-27-photo-1", age: "27", kind: "photo", caption: "", src: "photos-27/photo-1.jpg" },
  { id: "builtin-27-photo-2", age: "27", kind: "photo", caption: "", src: "photos-27/photo-2.jpg" },
  { id: "builtin-27-photo-3", age: "27", kind: "photo", caption: "", src: "photos-27/photo-3.jpg" },
  { id: "builtin-27-clip-1", age: "27", kind: "video", caption: "", src: "videos-27/clip-1.mp4" },
  { id: "builtin-27-clip-2", age: "27", kind: "video", caption: "", src: "videos-27/clip-2.mp4" },
  { id: "builtin-27-clip-3", age: "27", kind: "video", caption: "", src: "videos-27/clip-3.mp4" },
  { id: "builtin-27-clip-4", age: "27", kind: "video", caption: "", src: "videos-27/clip-4.mp4" },
];

/* A season can wear a theme. Add an age here to dress its whole chapter. */
export const SEASON_THEMES = {
  27: "hogwarts",
};

export function themeForAge(age) {
  return SEASON_THEMES[Number(age)] || "";
}

export function builtInPiecesForKind(kind, age) {
  return BUILT_IN_PIECES.filter((piece) => {
    if (piece.kind !== kind) return false;
    if (age == null || age === "") return true;
    return String(piece.age) === String(age);
  }).map((piece, index) => ({
    ...piece,
    builtIn: true,
    createdAt: index,
  }));
}
