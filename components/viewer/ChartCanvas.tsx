"use client";

import { useEffect, useRef, useState } from "react";

import {
  beatToY,
  getHoldGeometry,
  getLaneGeometry,
  getBeatQuantization,
  isNoteVisible,
  laneCenterX,
  QUANTIZATION_COLORS,
  SINGLE_NOTE_SCALE,
} from "@/lib/smx/rendering";
import {
  getMineSprite,
  getNoteHeadSprite,
  getPitBodyRegion,
  getRollBodyRegion,
  SMX_ARROW_SHEET,
} from "@/lib/smx/sprites";
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

      const laneGeometry = getLaneGeometry(width, chart.tracks, chart.mode);
      const laneWidth = laneGeometry.laneWidth;
      const noteScale = chart.mode === "single" ? SINGLE_NOTE_SCALE : 0.94;

      for (let lane = 0; lane < chart.tracks; lane += 1) {
        const laneLeft =
          laneGeometry.left + lane * (laneWidth + laneGeometry.gap);

        context.fillStyle = lane % 2 === 0 ? "#17212b" : "#1d2934";
        context.fillRect(laneLeft, 0, laneWidth, height);

        context.strokeStyle = "#344554";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(laneLeft, 0);
        context.lineTo(laneLeft, height);
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
        if (
          note.type !== "tap" &&
          note.type !== "hold" &&
          note.type !== "mine" &&
          note.type !== "pit" &&
          note.type !== "roll"
        ) {
          continue;
        }

        if (
          !isNoteVisible(note, currentBeat, height, RECEPTOR_Y, pixelsPerBeat)
        ) {
          continue;
        }

        const centerX = laneCenterX(laneGeometry, note.lane);
        const noteSize = Math.min(laneWidth * noteScale, 112);
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
          const holdGeometry = getHoldGeometry(startY, endY, noteSize);

          context.fillStyle = "#52b788";
          context.fillRect(
            centerX - noteSize * 0.18,
            holdGeometry.top,
            noteSize * 0.36,
            holdGeometry.bodyHeight,
          );
          context.beginPath();
          context.fillStyle = "#b7f0cf";
          context.ellipse(
            centerX,
            holdGeometry.tailY,
            holdGeometry.tailRadius,
            holdGeometry.tailRadius * 0.7,
            0,
            0,
            Math.PI * 2,
          );
          context.fill();
          drawNoteHead(
            context,
            noteSize,
            centerX,
            startY,
            note.lane,
            quantization,
            noteColor,
          );
        } else if (note.type === "mine") {
          drawMine(context, noteSize, centerX, startY);
        } else if (note.type === "pit" && note.endBeat !== undefined) {
          const endY = beatToY(
            note.endBeat,
            currentBeat,
            RECEPTOR_Y,
            pixelsPerBeat,
          );
          const holdGeometry = getHoldGeometry(startY, endY, noteSize);

          drawObstacleBody(
            context,
            getPitBodyRegion(),
            centerX,
            holdGeometry.top,
            noteSize,
            holdGeometry.bodyHeight,
          );
          drawMine(context, noteSize, centerX, startY);
        } else if (note.type === "roll" && note.endBeat !== undefined) {
          const endY = beatToY(
            note.endBeat,
            currentBeat,
            RECEPTOR_Y,
            pixelsPerBeat,
          );
          const holdGeometry = getHoldGeometry(startY, endY, noteSize);

          drawObstacleBody(
            context,
            getRollBodyRegion(),
            centerX,
            holdGeometry.top,
            noteSize,
            holdGeometry.bodyHeight,
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

          if (note.requiredHits !== undefined) {
            const labelY = startY + noteSize * 0.42;
            const labelHeight = 16;
            const labelWidth = noteSize * 0.5;

            context.fillStyle = "#101720";
            context.fillRect(
              centerX - labelWidth / 2,
              labelY - labelHeight / 2,
              labelWidth,
              labelHeight,
            );
            context.strokeStyle = "#f4c95d";
            context.lineWidth = 1;
            context.strokeRect(
              centerX - labelWidth / 2,
              labelY - labelHeight / 2,
              labelWidth,
              labelHeight,
            );
            context.fillStyle = "#f4c95d";
            context.font = "bold 12px sans-serif";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(String(note.requiredHits), centerX, labelY + 1);
          }
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

    const drawMine = (
      context: CanvasRenderingContext2D,
      size: number,
      centerX: number,
      centerY: number,
    ) => {
      const sprite = getMineSprite();

      if (!spriteSheet) {
        context.beginPath();
        context.fillStyle = "#e63946";
        context.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        context.fill();
        return;
      }

      context.drawImage(
        spriteSheet,
        sprite.region.x,
        sprite.region.y,
        sprite.region.width,
        sprite.region.height,
        centerX - size / 2,
        centerY - size / 2,
        size,
        size,
      );
    };

    const drawObstacleBody = (
      context: CanvasRenderingContext2D,
      region: { x: number; y: number; width: number; height: number },
      centerX: number,
      top: number,
      size: number,
      bodyHeight: number,
    ) => {
      const bodyWidth = size * 0.36;

      if (!spriteSheet) {
        context.fillStyle = "#e63946";
        context.fillRect(centerX - bodyWidth / 2, top, bodyWidth, bodyHeight);
        return;
      }

      context.drawImage(
        spriteSheet,
        region.x,
        region.y,
        region.width,
        region.height,
        centerX - bodyWidth / 2,
        top,
        bodyWidth,
        bodyHeight,
      );
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
