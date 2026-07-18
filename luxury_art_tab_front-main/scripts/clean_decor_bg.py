from pathlib import Path
from PIL import Image
import numpy as np
from collections import deque

decor = Path(r"c:\WFprojects\Luxury-Art-Tab-\luxury_art_tab_front-main\src\assets\decor")
files = list(decor.glob("paint-splash-*.png")) + list(decor.glob("brush-stroke-*.png"))


def clean(path: Path, tol: float = 42.0) -> None:
    im = Image.open(path).convert("RGBA")
    arr = np.asarray(im).copy().astype(np.int16)
    h, w = arr.shape[:2]
    # seed color = median of border pixels
    border = np.concatenate(
        [
            arr[0, :, :3].reshape(-1, 3),
            arr[-1, :, :3].reshape(-1, 3),
            arr[:, 0, :3].reshape(-1, 3),
            arr[:, -1, :3].reshape(-1, 3),
        ],
        axis=0,
    )
    seed = np.median(border, axis=0)

    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    def try_push(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or visited[y, x]:
            return
        pix = arr[y, x, :3]
        dist = float(np.linalg.norm(pix - seed))
        if dist <= tol:
            q.append((x, y))
            visited[y, x] = True

    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        x, y = q.popleft()
        arr[y, x, 3] = 0
        try_push(x + 1, y)
        try_push(x - 1, y)
        try_push(x, y + 1)
        try_push(x, y - 1)

    out = arr.astype(np.uint8)
    Image.fromarray(out, "RGBA").save(path, optimize=True)
    print(f"cleaned {path.name} seed={seed.tolist()}")


for f in files:
    clean(f)
print("done")
