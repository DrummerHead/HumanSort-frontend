import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { RankMeta, RankGallery, SetState } from './types';
import {
  getPivot,
  setFreshRankGallery,
  upPressed,
  rightPressed,
  downPressed,
  leftPressed,
  rankGalleryToRankMeta,
} from './tinyFunctions';
import {
  moveFocusedToSide,
  moveFocusedToRank,
  selectFocused,
  moveSelectedToSide,
  establishNewRankOrder,
} from './rankGallery';

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
