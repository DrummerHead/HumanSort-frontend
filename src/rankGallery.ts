import type { RankGallery } from './types';
import { defaultRankGallery } from './defaultObjects';
import { today } from './tinyFunctions';

//
// in non moving mode (represented by movingMode:boolean state inside
// GalleryMode React component) we move the focus of RankGallery to navigate
// towards the image whose rank we believe must either upgrade or demote
//
// in moving mode we have already focused a RankGallery and are ready to
// move it left or right in order to decide on the new rank
//
// When mentioning "subject" below it is referring to either the focused
// or the selected RankMeta
//

// Predicate to determine if we should not do any modifications because
// user wants to move past the edges, either first place or last
//
const itWantsToMovePastTheEdge = (
  moveRight: boolean,
  subjectRank: number,
  rankGalleryLength: number
): boolean =>
  (moveRight && subjectRank === 1) ||
  (!moveRight && subjectRank === rankGalleryLength);

// Predicate to determine if the RankGallery object to the side
// of the subject (eithed focused or selected) is the one that has to
// be modified in some way.
//
const itIsTheNonSubjectBeingModified = (
  moveRight: boolean,
  nonSubjectRank: number,
  subjectRank: number
): boolean =>
  (moveRight && nonSubjectRank === subjectRank - 1) ||
  (!moveRight && nonSubjectRank === subjectRank + 1);

// In non moving mode, move focused RankMeta to either the
// right or left to navigate around the gallery to eventually
// select one to move
//
export const moveFocusedToSide = (
  rankGallery: RankGallery[],
  moveRight: boolean
): RankGallery[] => {
  const currentFocused =
    rankGallery.find((rank) => rank.focused) || defaultRankGallery;

  // Don't move past the edges
  if (
    itWantsToMovePastTheEdge(
      moveRight,
      currentFocused.originalRank,
      rankGallery.length
    )
  ) {
    return rankGallery;
  }

  return rankGallery.map((rank) => {
    if (
      itIsTheNonSubjectBeingModified(
        moveRight,
        rank.originalRank,
        currentFocused.originalRank
      )
    ) {
      return {
        ...rank,
        focused: true,
      };
    }
    if (rank.originalRank === currentFocused.originalRank) {
      return {
        ...rank,
        focused: false,
      };
    }
    return rank;
  });
};

// Jump focus to any specific rank, used by navigation buttons
// last, center, first
//
export const moveFocusedToRank = (
  rankGallery: RankGallery[],
  rank: number
): RankGallery[] =>
  rankGallery.map((r) =>
    r.originalRank === rank ? { ...r, focused: true } : { ...r, focused: false }
  );

// Upgrade focused to selected to being moving it and changing order
//
export const selectFocused = (rankGallery: RankGallery[]): RankGallery[] =>
  rankGallery.map((r) => (r.focused ? { ...r, selected: true } : r));

// In moving mode, move selected RankMeta to either the
// right or left to change order of ranking and eventually
// decide on an order
//
export const moveSelectedToSide = (
  rankGallery: RankGallery[],
  moveRight: boolean
): RankGallery[] => {
  const currentSelected =
    rankGallery.find((rank) => rank.selected) || defaultRankGallery;

  // Don't move past the edges
  if (
    itWantsToMovePastTheEdge(
      moveRight,
      currentSelected.newRank,
      rankGallery.length
    )
  ) {
    return rankGallery;
  }

  return rankGallery
    .map((rank) => {
      if (
        itIsTheNonSubjectBeingModified(
          moveRight,
          rank.newRank,
          currentSelected.newRank
        )
      ) {
        return {
          ...rank,
          newRank: moveRight ? rank.newRank + 1 : rank.newRank - 1,
        };
      }
      if (rank.selected) {
        return {
          ...rank,
          newRank: moveRight ? rank.newRank - 1 : rank.newRank + 1,
        };
      }
      return rank;
    })
    .sort((a, b) => a.newRank - b.newRank);
};

// Last part of the process of reordering, happens after being in
// moving mode and user is happy with new rank order
//
interface EstablishNewRankOrderReturn {
  newRankGallery: RankGallery[];
  moved: RankGallery;
}
export const establishNewRankOrder = (
  rankGallery: RankGallery[]
): EstablishNewRankOrderReturn => ({
  newRankGallery: rankGallery.map((rank) => ({
    ...rank,
    originalRank: rank.newRank,
    rankedOn: rank.selected ? today() : rank.rankedOn,
    selected: false,
  })),
  moved: {
    ...(rankGallery.find((rank) => rank.selected) || defaultRankGallery),
    rankedOn: today(),
  },
});
