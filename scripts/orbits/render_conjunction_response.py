"""Render the conjunction-response run as a sped-up MP4 plus a summary PNG.

Reads docs/conjunction-response/cosmos-2612-response.json (from
build_conjunction_response.py) and writes, next to it:
  cosmos-2612-response.mp4   sped-up sequence with live data panel (H.264)
  cosmos-2612-response.png   static summary (separation history and touches)

Requires numpy, matplotlib and an ffmpeg with libx264: $FFMPEG, the
imageio-ffmpeg wheel, or PATH, in that order.
Run from the repository root:
    python3 scripts/orbits/render_conjunction_response.py
"""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib import animation  # noqa: E402
from matplotlib.patches import Circle  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "docs/conjunction-response/cosmos-2612-response.json"
MP4 = DATA.with_suffix(".mp4")
PNG = DATA.with_suffix(".png")
def ffmpeg_path() -> str:
    if os.environ.get("FFMPEG"):
        return os.environ["FFMPEG"]
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return shutil.which("ffmpeg") or "ffmpeg"


FFMPEG = ffmpeg_path()

INK, MUTED, DIM, LINE = "#f3efe8", "#a5a19b", "#6f6b66", "#2a2c30"
BG, PANEL = "#070809", "#0e1013"
VIOLET, CYAN, AMBER, GREEN, RED, GREY = "#d9b3ff", "#75c9d2", "#f2c66d", "#72d19d", "#f57868", "#9bacb6"
MONO = "DejaVu Sans Mono"

scene = json.loads(DATA.read_text())
S = scene["samples"]
summary = scene["summary"]
params = scene["parameters"]
touches = scene["touches"]
t = np.array([s["t"] for s in S]) / 3600.0
intr = np.array([s["intruderRtnKm"] for s in S])  # radial, along, cross (km)
base = np.array([s["baselineRtnKm"] for s in S])
las = np.array([s["laserRtnKm"] for s in S])
sep = np.array([s["rangeAssetIntruderKm"] for s in S])
sep_base = np.linalg.norm(base, axis=1)
firing = np.array([s["firing"] for s in S])
dv = np.array([s["dvRetroCmS"] for s in S])
energy = np.array([s["energyOnTargetJ"] for s in S])
pred_min = np.array([s["predictedMissKm"] for s in S])
pred_tca = np.array([s["predictedAtTcaKm"] for s in S])
tca_h = summary["unperturbedTcaS"] / 3600.0
floor = summary["safetyFloorKm"]
screen = summary["screeningMissKm"] * summary["margin"]
exhaust = params["exhaustKmS"] * 1000.0
coupling = scene["laserDesign"]["couplingNsPerJ"] * scene["bodies"]["intruder"]["recoil_efficiency"]

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "text.color": INK,
    "axes.edgecolor": LINE,
    "axes.labelcolor": MUTED,
    "xtick.color": MUTED,
    "ytick.color": MUTED,
    "axes.facecolor": PANEL,
    "figure.facecolor": BG,
    "savefig.facecolor": BG,
    "axes.titlecolor": INK,
    "grid.color": LINE,
    "grid.linewidth": 0.6,
})


def style(ax, title: str) -> None:
    ax.set_title(title, loc="left", fontsize=9, color=MUTED, fontfamily=MONO, pad=6)
    ax.grid(True, alpha=0.5)
    for spine in ax.spines.values():
        spine.set_color(LINE)
    ax.tick_params(labelsize=7)


def build_figure():
    fig = plt.figure(figsize=(16, 9), dpi=100)
    gs = fig.add_gridspec(3, 3, left=0.045, right=0.985, top=0.9, bottom=0.08, hspace=0.42, wspace=0.22,
                          width_ratios=[1.35, 1.35, 1.0], height_ratios=[1, 1, 0.85])
    ax_wide = fig.add_subplot(gs[0, :2])
    ax_zoom = fig.add_subplot(gs[1, :2])
    ax_sep = fig.add_subplot(gs[2, :2])
    ax_data = fig.add_subplot(gs[:, 2])
    ax_data.axis("off")

    fig.text(0.045, 0.955, "Minimal-touch ablation response · COSMOS 2612 / ICEYE-X36 stand-in", fontsize=15, color=INK, weight="bold")
    fig.text(0.045, 0.925, "Representative 545 km sun-synchronous orbit · fictional epoch · approximate physics · not an element set or a spacecraft design",
             fontsize=8.5, color=DIM, fontfamily=MONO)

    # Wide relative frame centred on the protected asset
    style(ax_wide, "RELATIVE FRAME CENTRED ON ICEYE-X36 · along-track (km) vs radial (km) · laser trailing on a safety ellipse")
    ax_wide.set_xlim(-215, 25)
    ax_wide.set_ylim(-22, 22)
    ax_wide.set_xlabel("along-track, km (positive = ahead of ICEYE-X36)", fontsize=7.5)
    ax_wide.set_ylabel("radial, km", fontsize=7.5)
    ax_wide.plot(las[:, 1], las[:, 0], color=VIOLET, lw=0.5, alpha=0.25)
    wide_laser, = ax_wide.plot([], [], marker="D", ms=7, color=VIOLET, ls="none", label="LAS-1 ablation satellite")
    wide_intr, = ax_wide.plot([], [], marker="o", ms=7, color=AMBER, ls="none", label="COSMOS 2612 stand-in")
    wide_asset, = ax_wide.plot([0], [0], marker="o", ms=7, color=CYAN, ls="none", label="ICEYE-X36 stand-in")
    wide_beam, = ax_wide.plot([], [], color=VIOLET, lw=2.2, alpha=0.95)
    ax_wide.legend(loc="upper left", fontsize=7, frameon=False, labelcolor=MUTED, ncol=3)

    # Zoomed frame
    style(ax_zoom, "ZOOM · the approach and the re-opened gap · grey dashed = unperturbed path · rings = 2 km floor and 6.25 km re-open target")
    ax_zoom.set_xlim(-14, 3)
    ax_zoom.set_ylim(-1.6, 1.6)
    ax_zoom.set_xlabel("along-track, km", fontsize=7.5)
    ax_zoom.set_ylabel("radial, km", fontsize=7.5)
    ax_zoom.add_patch(Circle((0, 0), floor, fill=False, ec=RED, lw=0.9, ls="--", alpha=0.8))
    ax_zoom.add_patch(Circle((0, 0), screen, fill=False, ec=GREEN, lw=0.9, ls="--", alpha=0.7))
    ax_zoom.plot(base[:, 1], base[:, 0], color=GREY, lw=0.9, ls="--", alpha=0.7)
    zoom_trail, = ax_zoom.plot([], [], color=AMBER, lw=1.4, alpha=0.9)
    zoom_intr, = ax_zoom.plot([], [], marker="o", ms=7, color=AMBER, ls="none")
    zoom_base, = ax_zoom.plot([], [], marker="o", ms=5, color=GREY, ls="none", alpha=0.8)
    ax_zoom.plot([0], [0], marker="o", ms=7, color=CYAN, ls="none")
    zoom_beam, = ax_zoom.plot([], [], color=VIOLET, lw=2.2, alpha=0.95)
    ax_zoom.text(0.25, 0.18, "ICEYE-X36", color=CYAN, fontsize=7, fontfamily=MONO)

    # Separation history
    style(ax_sep, "SEPARATION ICEYE-X36 ↔ COSMOS 2612 · km · dashed grey = no intervention")
    ax_sep.set_xlim(0, t[-1])
    ax_sep.set_ylim(0, 9)
    ax_sep.set_xlabel("hours from first touch", fontsize=7.5)
    ax_sep.plot(t, sep_base, color=GREY, lw=1.0, ls="--", alpha=0.8)
    ax_sep.axhline(floor, color=RED, lw=0.8, ls=":")
    ax_sep.axhline(screen, color=GREEN, lw=0.8, ls=":")
    ax_sep.axvline(tca_h, color=DIM, lw=0.8)
    ax_sep.text(tca_h + 0.1, 8.4, "original TCA", color=DIM, fontsize=7, fontfamily=MONO)
    ax_sep.text(0.1, floor + 0.15, "2 km floor", color=RED, fontsize=7, fontfamily=MONO)
    ax_sep.text(0.1, screen + 0.15, "6.25 km re-open target", color=GREEN, fontsize=7, fontfamily=MONO)
    for touch in touches:
        ax_sep.axvspan(touch["start"] / 3600, touch["end"] / 3600 + 0.02, color=VIOLET, alpha=0.35)
    sep_line, = ax_sep.plot([], [], color=AMBER, lw=1.6)
    sep_cursor = ax_sep.axvline(0, color=INK, lw=0.8, alpha=0.8)

    data_text = ax_data.text(0.0, 1.0, "", va="top", ha="left", fontsize=9.2, fontfamily=MONO, color=INK, linespacing=1.55,
                             transform=ax_data.transAxes)
    status_text = ax_data.text(0.0, 0.0, "", va="bottom", ha="left", fontsize=7.6, fontfamily=MONO, color=DIM, linespacing=1.5,
                               transform=ax_data.transAxes, wrap=True)
    status_text.set_text(
        "Rules in force\n"
        "• touches ≤ 90 s, then a 10 min re-prediction\n"
        "• fire only from behind, prograde, 60–300 km\n"
        "• ICEYE-X36 ≥ 0.10° off the beam axis beyond the target\n"
        "• stop when predicted separation ≥ 2 km floor\n"
        "  and ≥ 6.25 km at the original TCA\n\n"
        "Surface effect estimate assumes optimum-fluence\n"
        "pulses (0.85 J/cm²) on structure; optics, radiators\n"
        "and solar cells are damaged at far lower fluence."
    )
    artists = dict(wide_laser=wide_laser, wide_intr=wide_intr, wide_beam=wide_beam, zoom_trail=zoom_trail, zoom_intr=zoom_intr,
                   zoom_base=zoom_base, zoom_beam=zoom_beam, sep_line=sep_line, sep_cursor=sep_cursor, data_text=data_text)
    return fig, artists


def frame_plan() -> list[tuple[int, int]]:
    """(sample index, playback multiplier label) with slow motion while touching."""
    plan: list[tuple[int, int]] = []
    touch_end_h = max(tc["end"] for tc in touches) / 3600.0 + 0.15
    for i in range(len(S)):
        if t[i] <= touch_end_h:
            plan.extend([(i, 300)] * 3)  # 30 s sample held 3 frames at 30 fps -> 300x
        elif i % 2 == 0:
            plan.append((i, 1800))  # every other sample -> 1800x
    return plan


def panel_text(i: int, speed: int) -> str:
    s = S[i]
    n_touch = sum(1 for tc in touches if tc["end"] <= s["t"] + 1e-6) + (1 if s["firing"] else 0)
    status = s["status"]
    reason = s["reason"]
    firing_line = (
        f"pulse        {s['pulseJ']:.0f} J × {s['repHz']:.1f} Hz\n"
        f"on target    {s['powerOnTargetW']:.0f} W\n"
        if s["firing"] else "pulse        —\non target    —\n"
    )
    ablated_g = energy[i] * coupling / exhaust * 1000.0
    hrs = s["t"] / 3600.0
    return (
        f"T+ {int(hrs):02d}:{int((hrs * 60) % 60):02d}:{int(s['t'] % 60):02d}   playback ×{speed}\n"
        f"status       {status}\n"
        f"{reason[:46] if reason else ''}\n\n"
        f"touches      {n_touch} of {len(touches)}\n"
        f"range LAS→C  {s['rangeLaserIntruderKm']:.0f} km\n"
        f"beam clear.  {s['beamClearanceDeg']:.2f}° (asset off axis)\n"
        f"{firing_line}"
        f"Δv applied   {dv[i]:.2f} cm/s prograde\n"
        f"energy       {energy[i] / 1000:.0f} kJ on target\n"
        f"pulses       {int(round(energy[i] / 831600 * summary['pulses'])) if summary['energyOnTargetJ'] else 0:,}\n"
        f"surface      ≈ {ablated_g:.2f} g ablated, ~0.19 m spot\n\n"
        f"separation   {sep[i]:.2f} km (no action: {sep_base[i]:.2f} km)\n"
        f"predicted    min {pred_min[i]:.2f} km\n"
        f"             {pred_tca[i]:.2f} km at original TCA\n"
        f"orbit raise  +{summary['intruderSemiMajorAxisChangeM'] * min(1.0, dv[i] / max(dv[-1], 1e-9)):.0f} m semi-major axis\n"
    )


def render_video() -> None:
    fig, A = build_figure()
    plan = frame_plan()

    def update(k: int):
        i, speed = plan[k]
        A["wide_laser"].set_data([las[i, 1]], [las[i, 0]])
        A["wide_intr"].set_data([intr[i, 1]], [intr[i, 0]])
        A["zoom_trail"].set_data(intr[: i + 1, 1], intr[: i + 1, 0])
        A["zoom_intr"].set_data([intr[i, 1]], [intr[i, 0]])
        A["zoom_base"].set_data([base[i, 1]], [base[i, 0]])
        if firing[i]:
            A["wide_beam"].set_data([las[i, 1], intr[i, 1]], [las[i, 0], intr[i, 0]])
            A["zoom_beam"].set_data([intr[i, 1] - 2.5, intr[i, 1]], [intr[i, 0] - 0.18, intr[i, 0]])
        else:
            A["wide_beam"].set_data([], [])
            A["zoom_beam"].set_data([], [])
        A["sep_line"].set_data(t[: i + 1], sep[: i + 1])
        A["sep_cursor"].set_xdata([t[i], t[i]])
        A["data_text"].set_text(panel_text(i, speed))
        return list(A.values())

    writer = animation.FFMpegWriter(fps=30, bitrate=3200, codec="libx264", extra_args=["-pix_fmt", "yuv420p", "-preset", "medium"])
    anim = animation.FuncAnimation(fig, update, frames=len(plan), interval=1000 / 30, blit=False)
    anim.save(str(MP4), writer=writer, dpi=100)
    plt.close(fig)
    print(f"Wrote {MP4} ({MP4.stat().st_size:,} bytes, {len(plan)} frames, {len(plan) / 30:.0f} s)")


def render_summary() -> None:
    fig, A = build_figure()
    i = len(S) - 1
    A["wide_laser"].set_data([las[i, 1]], [las[i, 0]])
    A["wide_intr"].set_data([intr[i, 1]], [intr[i, 0]])
    A["zoom_trail"].set_data(intr[:, 1], intr[:, 0])
    A["zoom_intr"].set_data([intr[i, 1]], [intr[i, 0]])
    A["zoom_base"].set_data([base[i, 1]], [base[i, 0]])
    A["sep_line"].set_data(t, sep)
    A["sep_cursor"].set_xdata([t[i], t[i]])
    A["data_text"].set_text(panel_text(i, 0).replace("playback ×0", "end of run"))
    fig.savefig(PNG, dpi=110)
    plt.close(fig)
    print(f"Wrote {PNG} ({PNG.stat().st_size:,} bytes)")


if __name__ == "__main__":
    matplotlib.rcParams["animation.ffmpeg_path"] = FFMPEG
    render_summary()
    render_video()
