"use client";

import { useEffect, useRef } from "react";

import {
  beatToY,
  getBeatQuantization,
  isNoteVisible,
  laneX,
  QUANTIZATION_COLORS,
} from "@/lib/smx/rendering";
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
        const noteWidth = Math.max(12, laneWidth * 0.42);
        const noteColor = QUANTIZATION_COLORS[getBeatQuantization(note.beat)];
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
            centerX - noteWidth / 4,
            top,
            noteWidth / 2,
            bodyHeight,
          );
          context.fillStyle = noteColor;
          context.fillRect(centerX - noteWidth / 2, startY - 7, noteWidth, 14);
        } else {
          context.fillStyle = noteColor;
          context.fillRect(centerX - noteWidth / 2, startY - 7, noteWidth, 14);
        }
      }
    };

    draw();

    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);

    return () => resizeObserver.disconnect();
  }, [chart, currentBeat, pixelsPerBeat]);

  return (
    <canvas ref={canvasRef} className="chart-canvas" aria-label="SMX chart" />
  );
}
