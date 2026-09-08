"use client";

import { useEffect, useRef, useState } from "react";

import {
  beatToY,
  getBeatQuantization,
  isNoteVisible,
  laneX,
  QUANTIZATION_COLORS,
} from "@/lib/smx/rendering";
import { getNoteHeadSprite, SMX_ARROW_SHEET } from "@/lib/smx/sprites";
import type { PlayableSMXChart } from "@/lib/smx/types";

interface ChartCanvasProps {
  chart: PlayableSMXChart;
  currentBeat: number;
  pixelsPerBeat: number;
}

const RECEPTOR_Y = 88;

export default function ChartCanvas({
  chart,
  currentBeat,
  pixelsPerBeat,
}: ChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spriteSheet, setSpriteSheet] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new Image();
    image.onload = () => setSpriteSheet(image);
    image.src = SMX_ARROW_SHEET.src;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const devicePixelRatio = window.devicePixelRatio || 1;

      if (width === 0 || height === 0) {
        return;
      }

      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);

      const context = canvas.getContext("2d");

      if (!context) {
        return;
      }

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      context.fillStyle = "#101720";
      context.fillRect(0, 0, width, height);

      const laneWidth = width / chart.tracks;

      for (let lane = 0; lane < chart.tracks; lane += 1) {
        context.fillStyle = lane % 2 === 0 ? "#17212b" : "#1d2934";
        context.fillRect(lane * laneWidth, 0, laneWidth, height);

        context.strokeStyle = "#344554";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(lane * laneWidth, 0);
        context.lineTo(lane * laneWidth, height);
        context.stroke();
      }

      context.strokeStyle = "#66798a";
      context.beginPath();
      context.moveTo(width, 0);
      context.lineTo(width, height);
      context.stroke();

      context.strokeStyle = "#f4c95d";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(0, RECEPTOR_Y);
      context.lineTo(width, RECEPTOR_Y);
      context.stroke();

      for (const note of chart.notes) {
        if (note.type !== "tap" && note.type !== "hold") {
          continue;
        }

        if (
          !isNoteVisible(note, currentBeat, height, RECEPTOR_Y, pixelsPerBeat)
        ) {
          continue;
        }

        const centerX = laneX(width, chart.tracks, note.lane);
        const noteSize = Math.min(laneWidth * 0.9, 96);
        const quantization = getBeatQuantization(note.beat);
        const noteColor = QUANTIZATION_COLORS[quantization];
        const startY = beatToY(
          note.beat,
          currentBeat,
          RECEPTOR_Y,
          pixelsPerBeat,
        );

        if (note.type === "hold" && note.endBeat !== undefined) {
          const endY = beatToY(
            note.endBeat,
            currentBeat,
            RECEPTOR_Y,
            pixelsPerBeat,
          );
          const top = Math.min(startY, endY);
          const bodyHeight = Math.max(6, Math.abs(endY - startY));

          context.fillStyle = "#52b788";
          context.fillRect(
            centerX - noteSize * 0.18,
            top,
            noteSize * 0.36,
            bodyHeight,
          );
          drawNoteHead(
            context,
            noteSize,
            centerX,
            startY,
            note.lane,
            quantization,
            noteColor,
          );
        } else {
          drawNoteHead(
            context,
            noteSize,
            centerX,
            startY,
            note.lane,
            quantization,
            noteColor,
          );
        }
      }
    };

    const drawNoteHead = (
      context: CanvasRenderingContext2D,
      size: number,
      centerX: number,
      centerY: number,
      track: number,
      quantization: ReturnType<typeof getBeatQuantization>,
      fallbackColor: string,
    ) => {
      const sprite = getNoteHeadSprite(track, chart.mode, quantization);

      if (!spriteSheet || !sprite) {
        context.fillStyle = fallbackColor;
        context.fillRect(centerX - size / 2, centerY - 7, size, 14);
        return;
      }

      context.save();
      context.translate(centerX, centerY);
      context.rotate((sprite.rotationDegrees * Math.PI) / 180);
      context.drawImage(
        spriteSheet,
        sprite.region.x,
        sprite.region.y,
        sprite.region.width,
        sprite.region.height,
        -size / 2,
        -size / 2,
        size,
        size,
      );
      context.restore();
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, [chart, currentBeat, pixelsPerBeat, spriteSheet]);

  return (
    <canvas ref={canvasRef} className="chart-canvas" aria-label="SMX chart" />
  );
}
