import React, { useState, useEffect, useRef } from 'react';
import type { RankMeta, RankGallery } from './types';
import {
  getPivot,
  setFreshRankGallery,
  leftPressed,
  rightPressed,
} from './tinyFunctions';
import { defaultRankGallery } from './defaultObjects';

const moveFocusedToSide = (
  rankGallery: RankGallery[],
  moveRight: boolean
): RankGallery[] => {
  const currentFocused =
    rankGallery.find((rank) => rank.focused) || defaultRankGallery;

  // Don't move past the edges
  if (
    (moveRight && currentFocused.previousRank === 1) ||
    (!moveRight && currentFocused.previousRank === rankGallery.length)
  ) {
    return rankGallery;
  }

  return rankGallery.map((rank) => {
    if (
      (moveRight && rank.previousRank === currentFocused.previousRank - 1) ||
      (!moveRight && rank.previousRank === currentFocused.previousRank + 1)
    ) {
      return {
        ...rank,
        focused: true,
      };
    }
    if (rank.previousRank === currentFocused.previousRank) {
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
    r.previousRank === rank ? { ...r, focused: true } : { ...r, focused: false }
  );

interface GalleryModeProps {
  ranking: RankMeta[];
}
const GalleryMode = ({ ranking }: GalleryModeProps) => {
  const [rankGallery, setRankGallery] = useState<RankGallery[]>(
    setFreshRankGallery(ranking)
  );
  const focusedElement = useRef<HTMLLIElement | null>(null);
  const pivot: RankMeta = getPivot(ranking);

  useEffect(() => {
    const keyHandler = (ev: KeyboardEvent): void => {
      ev.preventDefault();
      if (leftPressed(ev)) {
        setRankGallery((rg) => moveFocusedToSide(rg, false));
      } else if (rightPressed(ev)) {
        setRankGallery((rg) => moveFocusedToSide(rg, true));
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

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
        {rankGallery.map((rank) => (
          <li
            key={rank.previousRank}
            className={rank.focused ? 'focused' : undefined}
            ref={rank.focused ? focusedElement : null}
          >
            <span>{rank.previousRank}</span>
            <p>{rank.name}</p>
            <img src={rank.path} alt={rank.name} />
          </li>
        ))}
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
