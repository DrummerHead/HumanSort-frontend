import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { RankMeta, RankGallery, SetState } from './types';
import {
  getPivot,
  setFreshRankGallery,
  today,
  upPressed,
  rightPressed,
  downPressed,
  leftPressed,
  rankGalleryToRankMeta,
} from './tinyFunctions';
import { defaultRankGallery } from './defaultObjects';

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
const moveFocusedToSide = (
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
const moveFocusedToRank = (
  rankGallery: RankGallery[],
  rank: number
): RankGallery[] =>
  rankGallery.map((r) =>
    r.originalRank === rank ? { ...r, focused: true } : { ...r, focused: false }
  );

// Upgrade focused to selected to being moving it and changing order
//
const selectFocused = (rankGallery: RankGallery[]): RankGallery[] =>
  rankGallery.map((r) => (r.focused ? { ...r, selected: true } : r));

// In moving mode, move selected RankMeta to either the
// right or left to change order of ranking and eventually
// decide on an order
//
const moveSelectedToSide = (
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
const establishNewRankOrder = (
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

interface GalleryModeProps {
  ranking: RankMeta[];
  setRanking: SetState<RankMeta[]>;
}
const GalleryMode = ({ ranking, setRanking }: GalleryModeProps) => {
  const [rankGallery, setRankGallery] = useState<RankGallery[]>(
    setFreshRankGallery(ranking)
  );
  const [movingMode, setMovingMode] = useState<boolean>(false);
  const focusedElement = useRef<HTMLLIElement | null>(null);
  const pivot: RankMeta = getPivot(ranking);

  useEffect(() => {
    const keyHandler = (ev: KeyboardEvent): void => {
      ev.preventDefault();

      if (upPressed(ev)) {
        setRankGallery((rg) => selectFocused(rg));
        setMovingMode(true);
      } else if (downPressed(ev)) {
        const { newRankGallery, moved } = establishNewRankOrder(rankGallery);
        setRankGallery(newRankGallery);
        setMovingMode(false);
        setRanking(rankGalleryToRankMeta(newRankGallery));

        if (moved.originalRank !== moved.newRank) {
          axios
            .post('/api/v1/new-rank-order', moved)
            .then(function (response) {
              console.log('POST /api/v1/new-rank-order response:');
              console.log(response.data);
            })
            .catch(function (error) {
              toast.error(error.response.data.error);
              console.log(error);
            });
        }
      } else if (rightPressed(ev)) {
        setRankGallery((rg) =>
          movingMode
            ? moveSelectedToSide(rg, true)
            : moveFocusedToSide(rg, true)
        );
      } else if (leftPressed(ev)) {
        setRankGallery((rg) =>
          movingMode
            ? moveSelectedToSide(rg, false)
            : moveFocusedToSide(rg, false)
        );
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('keydown', keyHandler);
    };
  }, [movingMode, rankGallery, setRanking]);

  useEffect(() => {
    if (focusedElement.current) {
      focusedElement.current.scrollIntoView({
        behavior: 'smooth', // colludes with CSS
        block: 'center',
        inline: 'center',
      });
    }
  }, [rankGallery]);

  const goTo = (rank: number) => () =>
    setRankGallery((r) => moveFocusedToRank(r, rank));

  return (
    <div id="galleryMode">
      <ol className="gallery">
        {rankGallery.map((rank) => {
          const rankModified = rank.originalRank !== rank.newRank;
          return (
            <li
              key={rank.newRank}
              className={
                rank.selected
                  ? 'selected'
                  : rank.focused
                  ? 'focused'
                  : undefined
              }
              ref={rank.focused ? focusedElement : null}
            >
              <span
                className={`originalRank ${
                  rankModified ? 'rankWillBeChanged' : undefined
                }`}
              >
                {rank.originalRank}
              </span>
              <span
                className={`newRank ${
                  rankModified ? 'rankWillBeChanged' : undefined
                }`}
              >
                {rank.newRank}
              </span>
              <p>{rank.name}</p>
              <img src={rank.path} alt={rank.name} />
            </li>
          );
        })}
      </ol>
      <nav>
        <button onClick={goTo(ranking.length)} disabled={movingMode}>
          last
        </button>
        <button onClick={goTo(pivot.rank)} disabled={movingMode}>
          center
        </button>
        <button onClick={goTo(1)} disabled={movingMode}>
          first
        </button>
      </nav>
    </div>
  );
};

export default GalleryMode;
