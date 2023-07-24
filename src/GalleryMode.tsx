import React, { useState, useEffect, useRef } from 'react';
import type { RankMeta, RankGallery } from './types';
import {
  getPivot,
  setFreshRankGallery,
  leftPressed,
  rightPressed,
} from './tinyFunctions';
import { defaultRankGallery } from './defaultObjects';

const moveFocused = (
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
        setRankGallery((rg) => moveFocused(rg, false));
      } else if (rightPressed(ev)) {
        setRankGallery((rg) => moveFocused(rg, true));
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
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
  }, [rankGallery]);

  return (
    <div id="galleryMode">
      <ol className="gallery">
        {rankGallery.map((rank) => (
          <li
            key={rank.previousRank}
            id={`rank${rank.previousRank}`}
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
        <a href={`#rank${ranking.length}`}>last</a>
        <a href={`#rank${pivot.rank}`}>center</a>
        <a href={`#rank1`}>first</a>
      </nav>
    </div>
  );
};

export default GalleryMode;
