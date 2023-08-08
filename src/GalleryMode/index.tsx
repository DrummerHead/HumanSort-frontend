import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import type { AxiosResponse } from 'axios';

import {
  moveFocusedToSide,
  moveFocusedToRank,
  selectFocused,
  moveSelectedToSide,
  establishNewRankOrder,
} from './rankGallery';
import {
  getPivot,
  setFreshRankGallery,
  upPressed,
  rightPressed,
  downPressed,
  leftPressed,
  rankGalleryToRankMeta,
} from '../tinyFunctions';
import KeyHints from '../KeyHints';
import type {
  NewRankOrderRequestBody,
  NewRankOrderResponseSuccess,
} from '../shared/types';
import type { RankMeta, RankGallery, SetState, Direction } from '../types';

interface GalleryModeProps {
  ranking: RankMeta[];
  setRanking: SetState<RankMeta[]>;
}
const GalleryMode = ({ ranking, setRanking }: GalleryModeProps) => {
  const [rankGallery, setRankGallery] = useState<RankGallery[]>(
    setFreshRankGallery(ranking)
  );
  const [movingMode, setMovingMode] = useState<boolean>(false);
  const [arrowPressed, setArrowPressed] = useState<Direction>(null);
  const focusedElement = useRef<HTMLLIElement | null>(null);
  const pivot: RankMeta = getPivot(ranking);

  useEffect(() => {
    const keyHandler = (ev: KeyboardEvent): void => {
      if (upPressed(ev)) {
        if (!movingMode) {
          setArrowPressed('up');
          setRankGallery((rg) => selectFocused(rg));
          setMovingMode(true);
        }
      } else if (downPressed(ev)) {
        if (movingMode) {
          setArrowPressed('down');
          const { newRankGallery, moved } = establishNewRankOrder(rankGallery);
          setRankGallery(newRankGallery);
          setMovingMode(false);
          setRanking(rankGalleryToRankMeta(newRankGallery));

          if (moved.originalRank !== moved.newRank) {
            axios
              .post<
                NewRankOrderResponseSuccess,
                AxiosResponse<NewRankOrderResponseSuccess>,
                NewRankOrderRequestBody
              >('/api/v1/new-rank-order', moved)
              .then(function (response) {
                console.log('POST /api/v1/new-rank-order response:');
                console.log(response.data);
              })
              .catch(function (error) {
                toast.error(error.response.data.error);
                console.log(error);
              });
          }
        }
      } else if (rightPressed(ev)) {
        ev.preventDefault();
        setArrowPressed('right');
        setRankGallery((rg) =>
          movingMode
            ? moveSelectedToSide(rg, true)
            : moveFocusedToSide(rg, true)
        );
      } else if (leftPressed(ev)) {
        ev.preventDefault();
        setArrowPressed('left');
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
    const keyHandler = (): void => {
      setArrowPressed(null);
    };
    document.addEventListener('keyup', keyHandler);
    return () => {
      document.removeEventListener('keyup', keyHandler);
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
              <img
                src={rank.path}
                alt={rank.name}
                onClick={movingMode ? () => null : goTo(rank.newRank)}
              />
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
      <KeyHints
        arrows={{
          up: {
            hint: movingMode ? '' : 'Pick up',
            disabled: movingMode,
            pressed: arrowPressed === 'up',
          },
          right: {
            hint: movingMode ? 'Higher rank' : 'Right',
            disabled: false,
            pressed: arrowPressed === 'right',
          },
          down: {
            hint: movingMode ? 'Place in new rank' : '',
            disabled: !movingMode,
            pressed: arrowPressed === 'down',
          },
          left: {
            hint: movingMode ? 'Lower rank' : 'Left',
            disabled: false,
            pressed: arrowPressed === 'left',
          },
        }}
      />
    </div>
  );
};

export default GalleryMode;
