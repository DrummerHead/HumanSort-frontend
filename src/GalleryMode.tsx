import type { RankMeta } from './types';
import { getPivot } from './tinyFunctions';

interface GalleryModeProps {
  ranking: RankMeta[];
}
const GalleryMode = ({ ranking }: GalleryModeProps) => {
  const pivot: RankMeta = getPivot(ranking);
  return (
    <div id="galleryMode">
      <ol className="gallery">
        {ranking.map((rank) => (
          <li key={rank.rank} id={`rank${rank.rank}`}>
            <span>{rank.rank}</span>
            <p>{rank.name}</p>
            <img src={rank.path} alt={rank.name} />
          </li>
        ))}
      </ol>
      <nav>
        <a href={`#rank${ranking.length}`}>last</a>
        <a href={`#rank${pivot.rank}`}>pivot</a>
        <a href={`#rank1`}>first</a>
      </nav>
    </div>
  );
};

export default GalleryMode;
