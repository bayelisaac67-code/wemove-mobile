import React, { useMemo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  /** Thread colour as RGB 0..1. Default = WeMove gold. */
  color?: [number, number, number];
  /** Wave intensity. */
  amplitude?: number;
  /** Spacing offset between lines. */
  distance?: number;
  /** Target frames-per-second. Throttled low for lower-end phones. */
  fps?: number;
  style?: StyleProp<ViewStyle>;
};

// WeMove gold (#F5B800) in 0..1 RGB — the brand accent, on the navy background.
const GOLD: [number, number, number] = [0.96, 0.72, 0.0];

/**
 * Animated "Threads" WebGL background (flowing gold lines) for the welcome
 * screen only. Renders the ogl shader inside a transparent WebView so it
 * layers over the navy screen. Tuned for lower-end Ghanaian Android phones:
 * 30fps throttle, 18 lines (vs 40), capped internal resolution.
 *
 * Touch passes straight through (pointerEvents="none") to the buttons behind.
 */
export default function ThreadsBackground({
  color = GOLD,
  amplitude = 1.2,
  distance = 0.25,
  fps = 30,
  style,
}: Props) {
  const html = useMemo(() => {
    const [r, g, b] = color;
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>
  html, body { margin:0; padding:0; width:100%; height:100%; background:transparent; overflow:hidden; }
  canvas { display:block; width:100%; height:100%; }
</style>
</head>
<body>
<script id="vert" type="x-shader/x-vertex">
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
</script>
<script id="frag" type="x-shader/x-fragment">
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform vec3 uColor;
uniform float uAmplitude;
uniform float uDistance;
uniform vec2 uMouse;

#define PI 3.1415926538

const int u_line_count = 18;
const float u_line_width = 7.0;
const float u_line_blur = 10.0;

float Perlin2D(vec2 P) {
    vec2 Pi = floor(P);
    vec4 Pf_Pfmin1 = P.xyxy - vec4(Pi, Pi + 1.0);
    vec4 Pt = vec4(Pi.xy, Pi.xy + 1.0);
    Pt = Pt - floor(Pt * (1.0 / 71.0)) * 71.0;
    Pt += vec2(26.0, 161.0).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    vec4 hash_x = fract(Pt * (1.0 / 951.135664));
    vec4 hash_y = fract(Pt * (1.0 / 642.949883));
    vec4 grad_x = hash_x - 0.49999;
    vec4 grad_y = hash_y - 0.49999;
    vec4 grad_results = inversesqrt(grad_x * grad_x + grad_y * grad_y)
        * (grad_x * Pf_Pfmin1.xzxz + grad_y * Pf_Pfmin1.yyww);
    grad_results *= 1.4142135623730950;
    vec2 blend = Pf_Pfmin1.xy * Pf_Pfmin1.xy * Pf_Pfmin1.xy
               * (Pf_Pfmin1.xy * (Pf_Pfmin1.xy * 6.0 - 15.0) + 10.0);
    vec4 blend2 = vec4(blend, vec2(1.0 - blend));
    return dot(grad_results, blend2.zxzx * blend2.wwyy);
}

float pixel(float count, vec2 resolution) {
    return (1.0 / max(resolution.x, resolution.y)) * count;
}

float lineFn(vec2 st, float width, float perc, float offset, vec2 mouse, float time, float amplitude, float distance) {
    float split_offset = (perc * 0.4);
    float split_point = 0.1 + split_offset;

    float amplitude_normal = smoothstep(split_point, 0.7, st.x);
    float amplitude_strength = 0.5;
    float finalAmplitude = amplitude_normal * amplitude_strength
                           * amplitude * (1.0 + (mouse.y - 0.5) * 0.2);

    float time_scaled = time / 10.0 + (mouse.x - 0.5) * 1.0;
    float blur = smoothstep(split_point, split_point + 0.05, st.x) * perc;

    float xnoise = mix(
        Perlin2D(vec2(time_scaled, st.x + perc) * 2.5),
        Perlin2D(vec2(time_scaled, st.x + time_scaled) * 3.5) / 1.5,
        st.x * 0.3
    );

    float y = 0.5 + (perc - 0.5) * distance + xnoise / 2.0 * finalAmplitude;

    float line_start = smoothstep(
        y + (width / 2.0) + (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        y,
        st.y
    );

    float line_end = smoothstep(
        y,
        y - (width / 2.0) - (u_line_blur * pixel(1.0, iResolution.xy) * blur),
        st.y
    );

    return clamp(
        (line_start - line_end) * (1.0 - smoothstep(0.0, 1.0, pow(perc, 0.3))),
        0.0,
        1.0
    );
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float line_strength = 1.0;
    for (int i = 0; i < u_line_count; i++) {
        float p = float(i) / float(u_line_count);
        line_strength *= (1.0 - lineFn(
            uv,
            u_line_width * pixel(1.0, iResolution.xy) * (1.0 - p),
            p,
            (PI * 1.0) * p,
            uMouse,
            iTime,
            uAmplitude,
            uDistance
        ));
    }

    float colorVal = 1.0 - line_strength;
    fragColor = vec4(uColor * colorVal, colorVal);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
</script>
<script type="module">
  import { Renderer, Program, Mesh, Triangle, Color } from 'https://esm.sh/ogl@1.0.11';

  const vertexShader = document.getElementById('vert').textContent;
  const fragmentShader = document.getElementById('frag').textContent;

  const FPS = ${fps};
  const frameInterval = 1000 / FPS;
  let lastRender = 0;

  const renderer = new Renderer({ alpha: true });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  document.body.appendChild(gl.canvas);

  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      iTime: { value: 0 },
      iResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
      uColor: { value: new Color(${r}, ${g}, ${b}) },
      uAmplitude: { value: ${amplitude} },
      uDistance: { value: ${distance} },
      uMouse: { value: new Float32Array([0.5, 0.5]) }
    }
  });
  const mesh = new Mesh(gl, { geometry, program });

  // Cap internal render resolution low for mid-range phones.
  const MAX_RENDER_DIM = 1280;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const baseDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const longest = Math.max(w, h) * baseDpr;
    const dpr = longest > MAX_RENDER_DIM ? (baseDpr * MAX_RENDER_DIM) / longest : baseDpr;
    renderer.dpr = dpr;
    renderer.setSize(w, h);
    program.uniforms.iResolution.value.r = gl.canvas.width;
    program.uniforms.iResolution.value.g = gl.canvas.height;
    program.uniforms.iResolution.value.b = gl.canvas.width / gl.canvas.height;
  }
  window.addEventListener('resize', resize);
  resize();

  function update(t) {
    requestAnimationFrame(update);
    if (document.hidden) return;
    if (t - lastRender < frameInterval) return;   // 30fps throttle
    lastRender = t;
    program.uniforms.iTime.value = t * 0.001;
    renderer.render({ scene: mesh });
  }
  requestAnimationFrame(update);
</script>
</body>
</html>`;
  }, [color, amplitude, distance, fps]);

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        pointerEvents="none"
        scrollEnabled={false}
        opaque={false}
        androidLayerType="hardware"
        // transparent so the navy screen shows through behind the gold lines
        // @ts-ignore - backgroundColor transparent is valid on WebView
        backgroundColor="transparent"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: 'transparent' },
});
