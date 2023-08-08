interface KeyMeta {
  hint: string;
  disabled: boolean;
  pressed: boolean;
}
interface Arrows {
  up: KeyMeta;
  right: KeyMeta;
  down: KeyMeta;
  left: KeyMeta;
}

interface KeyHintsProps {
  arrows: Arrows;
}
const keyCss = (arrow: KeyMeta): string =>
  `${arrow.disabled ? 'disabled' : ''} ${arrow.pressed ? 'pressed' : ''}`;
const KeyHints = ({ arrows }: KeyHintsProps) => {
  return (
    <div className="keyHints" title="Use the keyboard ⌨️ ">
      <ol>
        <li className={`arrow up ${keyCss(arrows.up)}`}>
          &#8593; <span>{arrows.up.hint}</span>
        </li>
        <li className={`arrow left ${keyCss(arrows.left)}`}>
          &#8592; <span>{arrows.left.hint}</span>
        </li>
        <li className={`arrow down ${keyCss(arrows.down)}`}>
          &#8595; <span>{arrows.down.hint}</span>
        </li>
        <li className={`arrow right ${keyCss(arrows.right)}`}>
          &#8594; <span>{arrows.right.hint}</span>
        </li>
      </ol>
    </div>
  );
};

export default KeyHints;
