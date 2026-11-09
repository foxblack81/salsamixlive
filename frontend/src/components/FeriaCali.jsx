import React, { useState } from 'react';
import './FeriaCali.css';

// Jointed silhouettes animate independently so the dancers step, turn and sway.
function Couple({ x, color, delay }) {
  return (
    <g transform={`translate(${x} 45)`} style={{ '--costume': color, '--beat-delay': delay }}>
      <ellipse cx="85" cy="248" rx="80" ry="9" fill="#000" opacity=".3" />
      <g className="feria-partner feria-partner-man">
        <g className="feria-leg feria-leg-left"><path d="M61 150 L48 194 L21 232" /></g>
        <g className="feria-leg feria-leg-right"><path d="M72 150 L91 193 L83 233" /></g>
        <path d="M51 71 Q66 64 79 73 L85 150 Q66 160 47 150Z" fill="var(--costume)" />
        <path d="M61 71 L67 108 L73 71" fill="#ffe9b9" />
        <circle cx="65" cy="49" r="18" fill="#e9a66d" />
        <path d="M44 38 Q64 17 83 39 L84 46 L44 46Z" fill="#fff0c4" />
        <path d="M37 43 H91" stroke="#fff0c4" strokeWidth="6" strokeLinecap="round" />
        <g className="feria-arm feria-man-arm"><path d="M77 83 L102 65 L120 33" /></g>
        <path d="M50 84 L30 112 L9 101" fill="none" stroke="#e9a66d" strokeWidth="10" strokeLinecap="round" />
        <path d="M15 234 L29 236 M77 235 L92 235" stroke="#fff0c4" strokeWidth="8" strokeLinecap="round" />
      </g>
      <g className="feria-partner feria-partner-woman">
        <g className="feria-woman-leg feria-leg-left"><path d="M125 172 L120 207 L101 232" /></g>
        <g className="feria-woman-leg feria-leg-right"><path d="M140 171 L156 203 L169 230" /></g>
        <circle cx="132" cy="62" r="17" fill="#bd754d" />
        <path d="M116 56 Q114 29 138 40 Q151 41 150 62 L142 51Z" fill="#21102a" />
        <circle cx="148" cy="42" r="10" fill="var(--costume)" />
        <path d="M121 83 Q132 77 143 84 L146 124 L119 124Z" fill="var(--costume)" />
        <g className="feria-skirt">
          <path d="M119 119 Q102 145 90 167 Q132 202 177 166 Q153 143 145 119Z" fill="var(--costume)" />
          <path d="M92 165 Q130 189 174 165" fill="none" stroke="#ffe9b9" strokeWidth="8" />
          <path d="M108 157 L120 136 M129 168 L132 138 M151 157 L143 136" stroke="#fff" opacity=".25" strokeWidth="4" />
        </g>
        <g className="feria-arm feria-woman-arm"><path d="M122 91 L109 67 L120 33" /></g>
        <path d="M142 93 L161 115 L178 100" fill="none" stroke="#bd754d" strokeWidth="9" strokeLinecap="round" />
        <path d="M98 234 L110 234 M163 232 L176 231" stroke="var(--costume)" strokeWidth="7" strokeLinecap="round" />
        <circle cx="118" cy="70" r="3" fill="#ffe9b9" />
      </g>
    </g>
  );
}

export default function FeriaCali() {
  const [paused, setPaused] = useState(false);
  return (
    <section className={`feria-cali${paused ? ' feria-paused' : ''}`} aria-labelledby="feria-cali-title">
      <div className="feria-lights" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
      </div>
      <div className="feria-copy">
        <p className="feria-eyebrow">NAVIDAD CON SABOR CALEÑO</p>
        <h2 id="feria-cali-title">¡Cali es <em>salsa!</em></h2>
        <p>El espíritu de la Feria de Cali se baila en SalsaMixLive.</p>
        <span className="feria-location">CALI, COLOMBIA · ALEGRÍA QUE NOS UNE</span>
      </div>
      <div className="feria-stage">
        <svg viewBox="0 0 720 320" role="img" aria-label="Tres parejas de bailarines de salsa con pasos, brazos y faldas animados, inspirados en la Feria de Cali">
          <defs>
            <radialGradient id="feria-floor"><stop stopColor="#ffd779" stopOpacity=".25" /><stop offset="1" stopColor="#ffd779" stopOpacity="0" /></radialGradient>
          </defs>
          <ellipse cx="360" cy="275" rx="350" ry="45" fill="url(#feria-floor)" />
          <g className="feria-sparkles" fill="#ffe3a1">
            {[ [30,75], [221,35], [467,60], [685,40], [350,25], [570,105] ].map(([x,y], i) => <path key={i} d={`M${x} ${y-7} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z`} style={{ animationDelay: `${i * .3}s` }} />)}
          </g>
          <Couple x={12} color="#f34564" delay="0s" />
          <Couple x={252} color="#ffc94c" delay="-.28s" />
          <Couple x={492} color="#2cd6aa" delay="-.56s" />
        </svg>
        <div className="feria-stage-caption">TRES PAREJAS · UN SOLO CORAZÓN SALSERO</div>
      </div>
      <button className="feria-motion" type="button" onClick={() => setPaused(!paused)} aria-pressed={paused}>
        {paused ? '▶ Activar movimiento' : 'Ⅱ Pausar movimiento'}
      </button>
    </section>
  );
}
