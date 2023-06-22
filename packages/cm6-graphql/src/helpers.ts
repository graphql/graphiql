import { Text } from '@codemirror/state';

export function posToOffset(doc: Text, pos: IPosition) {
  return doc.line(pos.line + 1).from + pos.character;
}
export function offsetToPos(doc: Text, offset: number): Position {
  const line = doc.lineAt(offset);
  return new Position(line.number - 1, offset - line.from);
}

export interface IPosition {
  line: number;
  character: number;
  setLine(line: number): void;
  setCharacter(character: number): void;
  lessThanOrEqualTo(position: IPosition): boolean;
}

export class Position implements IPosition {
  constructor(
    public line: number,
    public character: number,
  ) {}

  setLine(line: number) {
    this.line = line;
  }

  setCharacter(character: number) {
    this.character = character;
  }

  lessThanOrEqualTo(position: IPosition) {
    return (
      this.line < position.line ||
      (this.line === position.line && this.character <= position.character)
    );
  }
}

const isMac = () => /mac/i.test(navigator.platform);
export const isMetaKeyPressed = (e: MouseEvent) =>
  isMac() ? e.metaKey : e.ctrlKey;
