import React, { useState, useEffect, useRef } from 'react';
import type { RankMeta, RankGallery } from './types';
import {
  getPivot,
  setFreshRankGallery,
  upPressed,
  rightPressed,
  downPressed,
  leftPressed,
} from './tinyFunctions';
import { defaultRankGallery } from './defaultObjects';

// Predicate to determine if we should not do any modifications because
// user wants to move past the edges, either first place or last
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
const itIsTheNonSubjectBeingModified = (
  moveRight: boolean,
  nonSubjectRank: number,
  subjectRank: number
) =>
  (moveRight && nonSubjectRank === subjectRank - 1) ||
  (!moveRight && nonSubjectRank === subjectRank + 1);

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

const moveFocusedToRank = (
  rankGallery: RankGallery[],
  rank: number
): RankGallery[] =>
  rankGallery.map((r) =>
    r.originalRank === rank ? { ...r, focused: true } : { ...r, focused: false }
  );

const selectFocused = (rankGallery: RankGallery[]): RankGallery[] =>
  rankGallery.map((r) => (r.focused ? { ...r, selected: true } : r));

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

interface GalleryModeProps {
  ranking: RankMeta[];
}
const GalleryMode = ({ ranking }: GalleryModeProps) => {
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
      } else if (downPressed(ev)) {
        console.log('down');
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('keydown', keyHandler);
    };
  }, [movingMode]);

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
              key={rank.originalRank}
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
        <button onClick={goTo(ranking.length)}>last</button>
        <button onClick={goTo(pivot.rank)}>center</button>
        <button onClick={goTo(1)}>first</button>
      </nav>
    </div>
  );
};

export default GalleryMode;
