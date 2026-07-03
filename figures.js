// figures.js -- 21 animated SVG movement archetypes from the Antigravity redesign
export const FIGURES = {
  shoulders: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <path d="M20 50 C20 40, 80 40, 80 50 L75 60 L25 60 Z" fill="rgba(46, 125, 103, 0.2)" stroke="var(--primary)" stroke-width="2"></path>
            <g class="head-node">
                <rect x="47" y="22" width="6" height="12" fill="var(--text-color)"></rect>
                <circle cx="50" cy="18" r="10" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
            </g>
            <circle class="shoulder-joint" cx="28" cy="42" r="5" fill="var(--coral)"></circle>
            <circle class="shoulder-joint" cx="72" cy="42" r="5" fill="var(--coral)"></circle>
        </svg>
    `,
  neck: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <path d="M20 50 C20 42, 80 42, 80 50 L75 60 L25 60 Z" fill="rgba(105, 183, 214, 0.2)" stroke="var(--sky)" stroke-width="2"></path>
            <g class="head-node">
                <rect x="47" y="25" width="6" height="10" fill="var(--text-color)"></rect>
                <circle cx="50" cy="19" r="9" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
            </g>
        </svg>
    `,
  wrist: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Extended Arm (underneath) -->
            <path d="M10 32 L46 32 C48 32, 50 30, 50 26 L52 14 C52 10, 48 8, 48 8 L44 26 L10 26 Z" fill="rgba(243, 196, 92, 0.2)" stroke="var(--text-muted)" stroke-width="1.5"></path>
            <!-- Stretching Hand (extended upward) -->
            <g class="wrist-node">
                <!-- Palm & Fingers extending up/back -->
                <path d="M46 26 L54 6 C55 4, 57 4, 58 6 L59 20 L48 28 Z" fill="var(--coral)" stroke="var(--text-color)" stroke-width="1.5"></path>
                <!-- Thumb -->
                <path d="M46 24 L40 18 L38 20 L44 26 Z" fill="var(--coral)" stroke="var(--text-color)" stroke-width="1"></path>
            </g>
        </svg>
    `,
  twist: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <path d="M20 50 C20 40, 80 40, 80 50 L75 60 L25 60 Z" fill="rgba(46, 125, 103, 0.2)" stroke="var(--primary)" stroke-width="2"></path>
            <g class="torso-node">
                <rect x="38" y="34" width="24" height="12" fill="var(--coral)" stroke="var(--text-color)" stroke-width="1.5"></rect>
                <circle cx="50" cy="20" r="8" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
            </g>
        </svg>
    `,
  legs: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <rect x="42" y="10" width="16" height="24" rx="4" fill="rgba(105, 183, 214, 0.2)" stroke="var(--sky)" stroke-width="2"></path>
            <g class="leg-extended">
                <rect x="44" y="32" width="6" height="18" rx="2" fill="var(--text-color)"></rect>
                <rect x="44" y="46" width="14" height="5" rx="2" fill="var(--coral)"></rect>
            </g>
            <circle cx="50" cy="6" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
        </svg>
    `,
  squats: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <g class="squat-node">
                <circle cx="50" cy="12" r="7" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
                <path d="M40 20 H60 L55 38 H45 Z" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="2"></path>
                <path d="M45 38 L40 54 M55 38 L60 54" stroke="var(--text-color)" stroke-width="2.5"></path>
            </g>
        </svg>
    `,
  pushups: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <line x1="75" y1="20" x2="75" y2="58" stroke="var(--text-color)" stroke-width="3"></line>
            <g class="pushup-node">
                <circle cx="45" cy="18" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <line x1="45" y1="24" x2="25" y2="48" stroke="var(--coral)" stroke-width="6" stroke-linecap="round"></line>
                <polyline points="42 28 65 30 75 30" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </g>
        </svg>
    `,
  march: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <circle cx="50" cy="14" r="7" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
            <rect x="44" y="22" width="12" height="18" fill="rgba(105, 183, 214, 0.2)" stroke="var(--sky)" stroke-width="2"></rect>
            <rect class="leg-left" x="43" y="40" width="4" height="15" fill="var(--coral)"></rect>
            <rect class="leg-right" x="53" y="40" width="4" height="15" fill="var(--primary)"></rect>
        </svg>
    `,
  sidebend: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <g class="upper-body">
                <circle cx="50" cy="14" r="7" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
                <path d="M42 22 L58 22 L54 44 L46 44 Z" fill="var(--primary-light)" stroke="var(--primary)" stroke-width="2"></path>
            </g>
            <rect x="45" y="44" width="4" height="14" fill="var(--text-muted)"></rect>
            <rect x="51" y="44" width="4" height="14" fill="var(--text-muted)"></rect>
        </svg>
    `,
  eyes: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Left Eye -->
            <path d="M22 30 Q36 15 50 30 Q36 45 22 30 Z" fill="none" stroke="var(--text-color)" stroke-width="2"></path>
            <!-- Right Eye -->
            <path d="M50 30 Q64 15 78 30 Q64 45 50 30 Z" fill="none" stroke="var(--text-color)" stroke-width="2"></path>
            <!-- Pupils -->
            <g class="eyes-pupils">
                <circle class="pupil-left" cx="36" cy="30" r="5" fill="var(--coral)"></circle>
                <circle class="pupil-right" cx="64" cy="30" r="5" fill="var(--coral)"></circle>
            </g>
        </svg>
    `,
  calf: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <line x1="10" y1="50" x2="90" y2="50" stroke="var(--text-muted)" stroke-width="2"></line>
            <g class="calf-raise-node">
                <!-- Shin and Calf profile -->
                <path d="M44 14 L49 38 L32 46 L46 48 L50 14 Z" fill="rgba(46, 125, 103, 0.2)" stroke="var(--primary)" stroke-width="2"></path>
                <!-- Foot profile -->
                <path d="M32 46 L14 47 L20 50 L46 48 Z" fill="var(--coral)" stroke="var(--text-color)" stroke-width="1.5"></path>
            </g>
        </svg>
    `,
  seated_plank: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Chair frame -->
            <path d="M22 24 H38 V40 H22 Z M38 32 H46 L44 54 M27 40 L25 54 M35 40 L33 54" stroke="var(--text-muted)" stroke-width="1.5" fill="none"></path>
            <!-- Leaning plank body -->
            <g class="plank-body">
                <circle cx="44" cy="18" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Core area -->
                <path d="M42 24 L32 38 L38 42 L48 26 Z" fill="rgba(243, 107, 84, 0.3)" stroke="var(--coral)" stroke-width="2"></path>
                <!-- Legs raised straight out -->
                <line x1="38" y1="42" x2="64" y2="40" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
                <line x1="64" y1="40" x2="74" y2="48" stroke="var(--text-color)" stroke-width="2.5" stroke-linecap="round"></line>
            </g>
        </svg>
    `,
  figure4: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Chair frame -->
            <path d="M28 26 H43 V44 H28 Z M43 36 H50 L48 54 M33 44 L31 54 M41 44 L39 54" stroke="var(--text-muted)" stroke-width="1.5" fill="none"></path>
            <g class="figure4-body">
                <!-- Torso leaning forward -->
                <circle cx="54" cy="16" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <path d="M50 22 L40 38 L30 38 L42 22 Z" fill="rgba(46, 125, 103, 0.2)" stroke="var(--primary)" stroke-width="2"></path>
            </g>
            <!-- Standing leg -->
            <line x1="40" y1="38" x2="40" y2="54" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
            <!-- Crossed leg in 4 position -->
            <polyline points="40 38 24 40 40 44" fill="none" stroke="var(--coral)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
        </svg>
    `,
  lunge: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Wall on the left -->
            <line x1="20" y1="10" x2="20" y2="52" stroke="var(--text-muted)" stroke-width="3"></line>
            <!-- Ground plane -->
            <line x1="10" y1="52" x2="95" y2="52" stroke="var(--text-muted)" stroke-width="2"></line>
            <!-- Lunge figure -->
            <g class="lunge-hips">
                <circle cx="45" cy="14" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Torso leaning forward slightly -->
                <line x1="45" y1="20" x2="45" y2="36" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
                <!-- Arms pressing against wall -->
                <polyline points="45 20 28 20 20 20" fill="none" stroke="var(--text-color)" stroke-width="2" stroke-linecap="round"></polyline>
                <!-- Front bent leg -->
                <polyline points="45 36 34 40 34 52" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <!-- Rear extended leg straight back (coral highlight for calf) -->
                <polyline points="45 36 58 42 70 52" fill="none" stroke="var(--coral)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </g>
        </svg>
    `,
  desk_plank: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Desk -->
            <path d="M60 28 M60 28 H90 M85 28 L85 52 M65 28 L65 52" stroke="var(--text-muted)" stroke-width="2" fill="none"></path>
            <!-- Plank body -->
            <g class="plank-body">
                <circle cx="56" cy="16" r="5" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Trunk and legs as a straight plank -->
                <line x1="53" y1="21" x2="25" y2="48" stroke="var(--coral)" stroke-width="5" stroke-linecap="round"></line>
                <!-- Arm resting on desk surface -->
                <polyline points="53 23 60 28 66 28" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </g>
        </svg>
    `,
  leg_extension: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Chair -->
            <path d="M28 26 H44 V42 H28 Z M44 34 H48 L46 54 M32 42 L30 54 M40 42 L38 54" stroke="var(--text-muted)" stroke-width="1.5" fill="none"></path>
            <!-- Sitting torso -->
            <circle cx="36" cy="14" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
            <line x1="36" y1="20" x2="36" y2="36" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
            <!-- Stationary bent leg -->
            <polyline points="36 36 42 42 42 54" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"></polyline>
            <!-- Extending leg -->
            <g class="leg-extending-node">
                <!-- Thigh -->
                <line x1="36" y1="36" x2="48" y2="36" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"></line>
                <!-- Shin extending from knee (48, 36) -->
                <line class="shin-path" x1="48" y1="36" x2="48" y2="48" stroke="var(--coral)" stroke-width="2.5" stroke-linecap="round"></line>
            </g>
        </svg>
    `,
  hamstring_sweep: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Floor line -->
            <line x1="10" y1="52" x2="90" y2="52" stroke="var(--text-muted)" stroke-width="2"></line>
            <!-- Standing Leg -->
            <line x1="40" y1="34" x2="40" y2="52" stroke="var(--text-muted)" stroke-width="3" stroke-linecap="round"></line>
            <!-- Extended Hamstring Leg (heel on floor) -->
            <line x1="40" y1="34" x2="56" y2="50" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"></line>
            <!-- Hinging Torso and Arm sweeping -->
            <g class="sweep-torso">
                <circle cx="48" cy="14" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Upper body spine -->
                <line x1="40" y1="34" x2="48" y2="20" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round"></line>
                <!-- Sweeping arm -->
                <line class="sweep-arm" x1="48" y1="20" x2="48" y2="38" stroke="var(--coral)" stroke-width="2" stroke-linecap="round"></line>
            </g>
        </svg>
    `,
  doorway_stretch: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Left & Right Doorframe lines -->
            <line x1="25" y1="10" x2="25" y2="52" stroke="var(--text-muted)" stroke-width="2.5"></line>
            <line x1="75" y1="10" x2="75" y2="52" stroke="var(--text-muted)" stroke-width="2.5"></line>
            <!-- Figure standing between frames, chest pushing forward -->
            <g class="doorway-chest">
                <circle cx="50" cy="14" r="6" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Chest/Shoulder bar -->
                <line x1="38" y1="22" x2="62" y2="22" stroke="var(--text-color)" stroke-width="3"></line>
                <!-- Arms hooked on frames -->
                <polyline points="38 22 25 22 25 34" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"></polyline>
                <polyline points="62 22 75 22 75 34" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"></polyline>
                <!-- Spine & Legs -->
                <line x1="50" y1="22" x2="50" y2="40" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"></line>
                <line x1="50" y1="40" x2="44" y2="52" stroke="var(--text-muted)" stroke-width="2.5"></line>
                <line x1="50" y1="40" x2="56" y2="52" stroke="var(--text-muted)" stroke-width="2.5"></line>
            </g>
        </svg>
    `,
  chin_tucks: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Spine column -->
            <path d="M46 50 Q48 38 46 26" fill="none" stroke="var(--text-muted)" stroke-width="4" stroke-linecap="round"></path>
            <!-- Sliding head and jaw profile -->
            <g class="chin-node">
                <!-- Neck connection -->
                <rect x="42" y="22" width="7" height="12" fill="var(--text-color)"></rect>
                <!-- Head -->
                <circle cx="48" cy="16" r="8" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1.5"></circle>
                <!-- Jaw and nose facing left -->
                <path d="M40 16 L34 16 L34 20 L40 22 Z" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="1"></path>
            </g>
        </svg>
    `,
  rebound: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Floor line -->
            <line x1="20" y1="52" x2="80" y2="52" stroke="var(--text-muted)" stroke-width="2"></line>
            <!-- Bouncing Figure -->
            <g class="bounce-body">
                <circle cx="50" cy="14" r="7" fill="#FFE5D9" stroke="var(--text-color)" stroke-width="2"></circle>
                <!-- Torso -->
                <rect x="44" y="22" width="12" height="18" fill="rgba(105, 183, 214, 0.2)" stroke="var(--sky)" stroke-width="2"></rect>
                <!-- Left Leg (slightly bent) -->
                <polyline points="46 40 46 48 42 52" fill="none" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <!-- Right Leg (slightly bent) -->
                <polyline points="54 40 54 48 58 52" fill="none" stroke="var(--text-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
            </g>
        </svg>
    `,
  lungs: `
        <svg class="exercise-svg" viewBox="0 0 100 60">
            <!-- Trachea -->
            <path d="M50 10 L50 22 M47 13 H53 M47 17 H53" stroke="var(--text-muted)" stroke-width="2" fill="none"></path>
            <!-- Lungs lobes -->
            <g class="lungs-lobes">
                <!-- Left Lung -->
                <path d="M48 22 C40 20, 26 24, 28 42 C30 50, 44 48, 48 40 Z" fill="rgba(243, 107, 84, 0.2)" stroke="var(--coral)" stroke-width="2"></path>
                <!-- Right Lung -->
                <path d="M52 22 C60 20, 74 24, 72 42 C70 50, 56 48, 52 40 Z" fill="rgba(243, 107, 84, 0.2)" stroke="var(--coral)" stroke-width="2"></path>
            </g>
        </svg>
    `
};

export function getFigure(key) {
  return FIGURES[key] || FIGURES.shoulders;
}
