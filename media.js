/* Keepsakes that ship with the repo, so every device sees the same page.
   Add a file to photos-27/ or videos-27/, then list it here. */

/* Paste the lyrics between the backticks. Line breaks are kept as typed. */
const KAISE_AB_KAHEIN = `
Maine Jaana Mujhmein Tu Hai
Maine Jaana Mujhmein Tu Hai
Dil Hai Nadaan Kaise Ab Kahein

Tere Aas Paas Din Saara
Na Jaana Kab Main Dil Haara
Thoda Sa Tune Behkaya
Behlaya Dil Ko Sehlaya
Maine Jana Mujhme Tu Hai
Dil Hai Nadaan Kaise Ab Kahein

Jab Se Milji Tujhko Dekha Naya Rang Hai Yaari Si Hai Zyada Pyar Se Kam Hai
Gutar Gu Mein Chupa Pehla Pehla Ishq Hai
Is'se Zyada Kaise Kahun Main
Haan Intezar Mujhko Bhi Hai

Tere Aas Paas Din Sara
Na Jaana Kab Main Dil Hara
Thoda Sa Tune Behkaya
Behlaya Dil Ko Sehlaya
Maine Jana Mujhme Tu Hai
Dil Hai Nadaan Kaise Ab Kahein?

-Kaise Ab Kahein, Gutur Gu
`.trim();

export const BUILT_IN_PIECES = [
  { id: "builtin-27-photo-1", age: "27", kind: "photo", caption: "", src: "photos-27/photo-1.jpg" },
  { id: "builtin-27-photo-2", age: "27", kind: "photo", caption: "", src: "photos-27/photo-2.jpg" },
  { id: "builtin-27-photo-3", age: "27", kind: "photo", caption: "", src: "photos-27/photo-3.jpg" },
  { id: "builtin-27-clip-1", age: "27", kind: "video", caption: "", src: "videos-27/clip-1.mp4" },
  { id: "builtin-27-clip-2", age: "27", kind: "video", caption: "", src: "videos-27/clip-2.mp4" },
  { id: "builtin-27-clip-3", age: "27", kind: "video", caption: "", src: "videos-27/clip-3.mp4" },
  { id: "builtin-27-clip-4", age: "27", kind: "video", caption: "", src: "videos-27/clip-4.mp4" },
  {
    id: "builtin-27-letter-1",
    age: "27",
    kind: "letter",
    caption: "Song of the year",
    letter: KAISE_AB_KAHEIN,
  },
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
