"""日本語フォント(Noto Sans JP)から、アプリで使う文字だけを取り出して WOFF2 にする。

使い方(ふつうは npm run fonts から呼ばれる):
    python3 scripts/fonts/subset.py <文字の一覧ファイル> <出力フォルダ> <元フォント500> <元フォント700>

必要なもの: pip install fonttools brotli
出力:
    <出力フォルダ>/boki-jp-500.woff2  … 本文用(Medium)
    <出力フォルダ>/boki-jp-700.woff2  … 見出し・太字用(Bold)
    <出力フォルダ>/charset.txt        … 実際にフォントに入った文字の一覧(テストで使う)
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont


def make(src: str, out: Path, text: str) -> set[str]:
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]  # 数字の等幅(tnum)などの機能を残す
    options.hinting = False
    options.recalc_timestamp = False  # 同じ入力なら同じファイルになるように
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6]
    font = subset.load_font(src, options)
    sub = subset.Subsetter(options)
    sub.populate(text=text)
    sub.subset(font)
    subset.save_font(font, str(out), options)
    covered = {chr(c) for c in TTFont(str(out)).getBestCmap()}
    return covered


def main() -> None:
    chars_file, out_dir, src500, src700 = sys.argv[1:5]
    text = Path(chars_file).read_text(encoding="utf-8")
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    c500 = make(src500, out / "boki-jp-500.woff2", text)
    c700 = make(src700, out / "boki-jp-700.woff2", text)
    covered = sorted(c500 & c700)
    (out / "charset.txt").write_text("".join(covered) + "\n", encoding="utf-8")
    missing = sorted(set(text) - set(covered) - {"\n"})
    print(f"フォントに入れた文字: {len(covered)}")
    if missing:
        print("元フォントにないため入らなかった文字(端末のフォントで表示):", "".join(missing))


if __name__ == "__main__":
    main()
