"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

/** Silver-halide style grain — discrete crystal sites + soft emulsion envelope. */
const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uIntensity;

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float silverHalide(vec2 fragCoord, float time) {
    vec2 p = fragCoord * 0.82;
    float frame = floor(time * 24.0);

    float crystals = hash21(floor(p) + frame * 97.0);
    float envelope = vnoise(p * 0.08 + frame * 0.13) * 0.32 + 0.68;
    float micro = hash21(floor(p * 2.35 + 0.5) + frame * 53.0) * 0.2;

    return (crystals * envelope + micro) * 2.0 - 1.0;
  }

  void main() {
    float g = silverHalide(gl_FragCoord.xy, uTime);
    float modulate = g * uIntensity;
    gl_FragColor = vec4(0.5 + modulate, 0.5 + modulate, 0.5 + modulate, 1.0);
  }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

type FilmGrainLayerProps = {
  className?: string;
  /** Luminance modulation inside the shader (keep low for photographic subtlety). */
  intensity?: number;
  /** Canvas compositing opacity — not a substitute for grain density. */
  opacity?: number;
};

export function FilmGrainLayer({
  className,
  intensity = 0.14,
  opacity = 0.055,
}: FilmGrainLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const program = createProgram(gl);
    if (!program) return;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPosition = gl.getAttribLocation(program, "aPosition");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uIntensity = gl.getUniformLocation(program, "uIntensity");

    let raf = 0;
    let width = 0;
    let height = 0;
    const start = performance.now();

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(parent.clientWidth * dpr));
      const h = Math.max(1, Math.floor(parent.clientHeight * dpr));
      if (w === width && h === height) return;

      width = w;
      height = h;
      canvas!.width = w;
      canvas!.height = h;
      canvas!.style.width = `${parent.clientWidth}px`;
      canvas!.style.height = `${parent.clientHeight}px`;
      gl!.viewport(0, 0, w, h);
    }

    function draw(now: number) {
      resize();

      gl!.useProgram(program);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buffer);
      gl!.enableVertexAttribArray(aPosition);
      gl!.vertexAttribPointer(aPosition, 2, gl!.FLOAT, false, 0, 0);
      gl!.uniform2f(uResolution, width, height);
      gl!.uniform1f(uTime, reducedMotion ? 0 : (now - start) / 1000);
      gl!.uniform1f(uIntensity, intensity);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }

    function frame(now: number) {
      draw(now);
      if (!reducedMotion) {
        raf = requestAnimationFrame(frame);
      }
    }

    const observer = new ResizeObserver(() => draw(performance.now()));
    const parent = canvas.parentElement;
    if (parent) observer.observe(parent);

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("edith-film-grain-canvas", className)}
      aria-hidden
      style={{ opacity }}
    />
  );
}
