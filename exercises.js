// exercises.js -- quest library ported from the Antigravity redesign (2026-07-03)
// See docs/superpowers/specs/2026-07-03-antigravity-ui-merge-design.md
export const EXERCISES = [
  {
    "id": "posture-reset",
    "name": "Posture Reset",
    "category": "mobility",
    "tier": "easy",
    "xp": 80,
    "duration": 4,
    "targetArea": "shoulders",
    "desc": "Neck + shoulder release to offset desk stiffness.",
    "steps": [
      {
        "title": "Shoulder Rolls",
        "desc": "Roll shoulders backward slowly. Breathe deeply.",
        "duration": 60,
        "animation": "animate-shoulders",
        "svg": "shoulders"
      },
      {
        "title": "Neck Release",
        "desc": "Tilt ear to shoulder, hold 15s each side.",
        "duration": 60,
        "animation": "animate-neck",
        "svg": "neck"
      },
      {
        "title": "Wrist Flex",
        "desc": "Flex fingers back gently. Release tightness.",
        "duration": 60,
        "animation": "animate-wrist",
        "svg": "wrist"
      },
      {
        "title": "Chest Stretch",
        "desc": "Interlock fingers behind back and pull shoulders back.",
        "duration": 60,
        "animation": "animate-shoulders",
        "svg": "shoulders"
      }
    ]
  },
  {
    "id": "wrist-stretch",
    "name": "Wrist Stretch",
    "category": "stretch",
    "tier": "easy",
    "xp": 60,
    "duration": 3,
    "targetArea": "wrists",
    "desc": "Flexing tendons, releasing carpal tunnel compression.",
    "steps": [
      {
        "title": "Wrist Flex",
        "desc": "Flex fingers back gently. Release tightness.",
        "duration": 60,
        "animation": "animate-wrist",
        "svg": "wrist"
      },
      {
        "title": "Finger Fans",
        "desc": "Spread fingers wide, then make tight fists.",
        "duration": 60,
        "animation": "animate-wrist",
        "svg": "wrist"
      },
      {
        "title": "Forearm Rub",
        "desc": "Massage tight extensor muscles on forearms.",
        "duration": 60,
        "animation": "animate-wrist",
        "svg": "wrist"
      }
    ]
  },
  {
    "id": "back-twist",
    "name": "Spine Twist",
    "category": "mobility",
    "tier": "easy",
    "xp": 100,
    "duration": 5,
    "targetArea": "core",
    "desc": "Seated twist to mobilize ribcage and stretch spine muscles.",
    "steps": [
      {
        "title": "Seated Spine Twist",
        "desc": "Twist upper body left, hold 15s, then right.",
        "duration": 100,
        "animation": "animate-twist",
        "svg": "twist"
      },
      {
        "title": "Shoulder Retraction",
        "desc": "Pinch shoulder blades together and release.",
        "duration": 100,
        "animation": "animate-shoulders",
        "svg": "shoulders"
      },
      {
        "title": "Neck Stretches",
        "desc": "Look over left shoulder, hold, then right.",
        "duration": 100,
        "animation": "animate-neck",
        "svg": "neck"
      }
    ]
  },
  {
    "id": "calf-raises",
    "name": "Calf Raises",
    "category": "strength",
    "tier": "medium",
    "xp": 60,
    "duration": 3,
    "targetArea": "legs",
    "desc": "Standing heel lifts to re-activate leg circulatory pumps.",
    "steps": [
      {
        "title": "Soleus Venous Pump",
        "desc": "Raise heels off floor, squeeze calf muscles. Lift and hold 2s.",
        "duration": 60,
        "animation": "animate-calf",
        "svg": "calf"
      },
      {
        "title": "Soleus Stretch",
        "desc": "Press one heel back into floor, stretching calf muscle.",
        "duration": 120,
        "animation": "animate-sidebend",
        "svg": "sidebend"
      }
    ]
  },
  {
    "id": "seated-plank",
    "name": "Seated Plank",
    "category": "strength",
    "tier": "medium",
    "xp": 80,
    "duration": 4,
    "targetArea": "core",
    "desc": "Isometric core holds to counteract hip flexion fatigue.",
    "steps": [
      {
        "title": "Core Engagement",
        "desc": "Sit on chair edge, lean back 45 degrees, lift feet slightly, hold abdominal core tight.",
        "duration": 120,
        "animation": "animate-plank",
        "svg": "seated_plank"
      },
      {
        "title": "Diaphragm Breaths",
        "desc": "Inhale for 4s, hold, exhale 4s while maintaining abdominal core tension.",
        "duration": 120,
        "animation": "animate-plank",
        "svg": "seated_plank"
      }
    ]
  },
  {
    "id": "eye-focus",
    "name": "Eye Focus Flow",
    "category": "quiet",
    "tier": "easy",
    "xp": 40,
    "duration": 2,
    "targetArea": "neck",
    "desc": "Near-far optical adjustments for screen strain relief.",
    "steps": [
      {
        "title": "Look Near & Far",
        "desc": "Focus on your thumb held near, then focus on a distant object. Repeat.",
        "duration": 60,
        "animation": "animate-eyes",
        "svg": "eyes"
      },
      {
        "title": "Lateral Eye Movements",
        "desc": "Look as far left as possible, then look far right. Move slowly.",
        "duration": 60,
        "animation": "animate-eyes",
        "svg": "eyes"
      }
    ]
  },
  {
    "id": "shoulder-rolls",
    "name": "Desk Shoulder Rolls",
    "category": "mobility",
    "tier": "easy",
    "xp": 65,
    "duration": 3,
    "targetArea": "shoulders",
    "desc": "Continuous shoulder rotations for tension relief.",
    "steps": [
      {
        "title": "Dynamic Rolls",
        "desc": "Roll shoulders and neck smoothly.",
        "duration": 60,
        "animation": "animate-shoulders",
        "svg": "shoulders"
      },
      {
        "title": "Tension Release",
        "desc": "Inhale shrug shoulders up, exhale drop them.",
        "duration": 60,
        "animation": "animate-shoulders",
        "svg": "shoulders"
      },
      {
        "title": "Diaphragm Breaths",
        "desc": "Inhale for 4s, hold 4s, exhale 4s.",
        "duration": 60,
        "animation": "animate-lungs",
        "svg": "lungs"
      }
    ]
  },
  {
    "id": "deep-breaths",
    "name": "Deep Belly Breath",
    "category": "quiet",
    "tier": "easy",
    "xp": 50,
    "duration": 3,
    "targetArea": "core",
    "desc": "Relaxing diaphragm breath loops to lower heart rate.",
    "steps": [
      {
        "title": "Inhale & Expand",
        "desc": "Inhale deep through your nose, expanding your abdomen and lungs.",
        "duration": 60,
        "animation": "animate-lungs",
        "svg": "lungs"
      },
      {
        "title": "Exhale & Contract",
        "desc": "Exhale slow and empty your chest. Feel the diaphragm release.",
        "duration": 120,
        "animation": "animate-lungs",
        "svg": "lungs"
      }
    ]
  },
  {
    "id": "seated-spinal-twist",
    "name": "Seated Spinal Twists",
    "category": "mobility",
    "tier": "easy",
    "xp": 40,
    "duration": 1,
    "targetArea": "core",
    "desc": "Restores rotational thoracic spine mobility and hydrates vertebral discs.",
    "steps": [
      {
        "title": "Twist Left",
        "desc": "Twist upper body left, hold ribcage, breathe.",
        "duration": 30,
        "animation": "animate-twist",
        "svg": "twist"
      },
      {
        "title": "Twist Right",
        "desc": "Twist upper body right, stretch spinal columns.",
        "duration": 30,
        "animation": "animate-twist",
        "svg": "twist"
      }
    ]
  },
  {
    "id": "figure-4-stretch",
    "name": "Seated Figure-4 Stretch",
    "category": "stretch",
    "tier": "easy",
    "xp": 50,
    "duration": 2,
    "targetArea": "legs",
    "desc": "Relieves piriformis tension and combats lower back stiffness from seating.",
    "steps": [
      {
        "title": "Left Leg",
        "desc": "Cross left ankle over right knee. Lean forward from hips.",
        "duration": 45,
        "animation": "animate-fig4",
        "svg": "figure4"
      },
      {
        "title": "Right Leg",
        "desc": "Cross right ankle over left knee. Lean forward from hips.",
        "duration": 75,
        "animation": "animate-fig4",
        "svg": "figure4"
      }
    ]
  },
  {
    "id": "chin-tucks",
    "name": "Chin Tucks",
    "category": "mobility",
    "tier": "easy",
    "xp": 30,
    "duration": 1,
    "targetArea": "neck",
    "desc": "Reverses forward head monitor carriage and unloads cervical joints.",
    "steps": [
      {
        "title": "Neck Retraction",
        "desc": "Pull chin straight back (make double chin). Hold 3s. Repeat 10 times.",
        "duration": 60,
        "animation": "animate-chin",
        "svg": "chin_tucks"
      }
    ]
  },
  {
    "id": "wrist-extensor",
    "name": "Wrist Extensor Stretch",
    "category": "stretch",
    "tier": "easy",
    "xp": 45,
    "duration": 2,
    "targetArea": "wrists",
    "desc": "Prevents repetitive strain and carpal tightness from sustained mouse work.",
    "steps": [
      {
        "title": "Extensor Stretch",
        "desc": "Extend arm, pull fingers down toward body. Hold 30s.",
        "duration": 60,
        "animation": "animate-wrist",
        "svg": "wrist"
      },
      {
        "title": "Flexor Stretch",
        "desc": "Extend arm, pull fingers back toward ceiling. Hold 30s.",
        "duration": 60,
        "animation": "animate-wrist",
        "svg": "wrist"
      }
    ]
  },
  {
    "id": "glute-squeezes",
    "name": "Seated Glute Squeezes",
    "category": "strength",
    "tier": "easy",
    "xp": 35,
    "duration": 1,
    "targetArea": "legs",
    "desc": "Combats glute amnesia by re-activating gluteal firing mechanisms.",
    "steps": [
      {
        "title": "Glute Firing",
        "desc": "Squeeze glutes maximum. Hold 5s. Repeat 10 times.",
        "duration": 60,
        "animation": "animate-squat",
        "svg": "legs"
      }
    ]
  },
  {
    "id": "scapular-retractions",
    "name": "Scapular Retractions",
    "category": "mobility",
    "tier": "easy",
    "xp": 40,
    "duration": 1,
    "targetArea": "shoulders",
    "desc": "Activates rhomboids to pull shoulder blades back, fighting desk slumps.",
    "steps": [
      {
        "title": "Rhomboid Squeezes",
        "desc": "Pinch shoulder blades back. Hold 2s. Repeat 15 times.",
        "duration": 60,
        "animation": "animate-shoulders",
        "svg": "shoulders"
      }
    ]
  },
  {
    "id": "doorway-stretch",
    "name": "Doorway Chest Stretch",
    "category": "stretch",
    "tier": "easy",
    "xp": 50,
    "duration": 2,
    "targetArea": "shoulders",
    "desc": "Stretches chest pectorals and deltoids back to their natural length.",
    "steps": [
      {
        "title": "Pectoral Stretch",
        "desc": "Place forearms on doorframe, lean chest forward.",
        "duration": 60,
        "animation": "animate-doorway",
        "svg": "doorway_stretch"
      },
      {
        "title": "Breathing",
        "desc": "Hold doorway stretch and breathe deep.",
        "duration": 60,
        "animation": "animate-doorway",
        "svg": "doorway_stretch"
      }
    ]
  },
  {
    "id": "side-bends",
    "name": "Standing Side Bends",
    "category": "stretch",
    "tier": "medium",
    "xp": 45,
    "duration": 2,
    "targetArea": "core",
    "desc": "Lengthens obliques and lateral QL lumbar muscles to relieve back strain.",
    "steps": [
      {
        "title": "Left Bend",
        "desc": "Reach right arm overhead, bend upper body left.",
        "duration": 60,
        "animation": "animate-sidebend",
        "svg": "sidebend"
      },
      {
        "title": "Right Bend",
        "desc": "Reach left arm overhead, bend upper body right.",
        "duration": 60,
        "animation": "animate-sidebend",
        "svg": "sidebend"
      }
    ]
  },
  {
    "id": "hip-flexor-stretch",
    "name": "Standing Hip Flexor Stretch",
    "category": "stretch",
    "tier": "medium",
    "xp": 50,
    "duration": 2,
    "targetArea": "legs",
    "desc": "Opens short hip flexors, releasing forward pelvis tension on back.",
    "steps": [
      {
        "title": "Left Lunge Stretch",
        "desc": "Step right foot forward in supported lunge, tuck pelvis.",
        "duration": 45,
        "animation": "animate-lunge",
        "svg": "lunge"
      },
      {
        "title": "Right Lunge Stretch",
        "desc": "Step left foot forward in supported lunge, tuck pelvis.",
        "duration": 75,
        "animation": "animate-lunge",
        "svg": "lunge"
      }
    ]
  },
  {
    "id": "hamstring-sweeps",
    "name": "Dynamic Hamstring Sweeps",
    "category": "mobility",
    "tier": "medium",
    "xp": 40,
    "duration": 1,
    "targetArea": "legs",
    "desc": "Safely lengthens shortened hamstrings dynamically without pulling cold tissue.",
    "steps": [
      {
        "title": "Alternating Sweeps",
        "desc": "Step forward, extend leg, hinge at hips and sweep arms low.",
        "duration": 60,
        "animation": "animate-sweep",
        "svg": "hamstring_sweep"
      }
    ]
  },
  {
    "id": "sit-to-stand",
    "name": "Sit-to-Stand Squats",
    "category": "strength",
    "tier": "medium",
    "xp": 55,
    "duration": 1,
    "targetArea": "legs",
    "desc": "Chair squats forcing quads to lift body weight, spiking blood flow.",
    "steps": [
      {
        "title": "Chair Squats",
        "desc": "Stand up from chair using glutes and quads. Sit back down.",
        "duration": 60,
        "animation": "animate-squat",
        "svg": "squats"
      }
    ]
  },
  {
    "id": "standing-calf-raises",
    "name": "Standing Calf Raises",
    "category": "strength",
    "tier": "medium",
    "xp": 50,
    "duration": 1,
    "targetArea": "legs",
    "desc": "Activates calf soleus venous pumps to clear glucose and boost circulation.",
    "steps": [
      {
        "title": "Soleus Venous Pump",
        "desc": "Raise heels off floor, squeeze calf muscles. Lift and hold 2s.",
        "duration": 60,
        "animation": "animate-calf",
        "svg": "calf"
      }
    ]
  },
  {
    "id": "air-squats",
    "name": "Air Squats",
    "category": "strength",
    "tier": "medium",
    "xp": 60,
    "duration": 1,
    "targetArea": "legs",
    "desc": "Raises heart rate and lubricates hip and knee joint cavities.",
    "steps": [
      {
        "title": "Air Squats",
        "desc": "Squat down, hips back, knees out. Aim for 15-20 reps.",
        "duration": 60,
        "animation": "animate-squat",
        "svg": "squats"
      }
    ]
  },
  {
    "id": "leg-extensions",
    "name": "Seated Leg Extensions",
    "category": "strength",
    "tier": "easy",
    "xp": 45,
    "duration": 2,
    "targetArea": "legs",
    "desc": "Engages quadriceps and maintains synovial knee fluid motion.",
    "steps": [
      {
        "title": "Left Extension",
        "desc": "Extend left leg straight out. Hold 30s.",
        "duration": 60,
        "animation": "animate-leg-ext",
        "svg": "leg_extension"
      },
      {
        "title": "Right Extension",
        "desc": "Extend right leg straight out. Hold 30s.",
        "duration": 60,
        "animation": "animate-leg-ext",
        "svg": "leg_extension"
      }
    ]
  },
  {
    "id": "desk-pushups",
    "name": "Desk Push-Ups",
    "category": "strength",
    "tier": "medium",
    "xp": 50,
    "duration": 1,
    "targetArea": "shoulders",
    "desc": "Engages chest and core with less joint shear stress than floor pushes.",
    "steps": [
      {
        "title": "Desk Incline Pushups",
        "desc": "Hands on desk edge, keep straight body line. Flex arms.",
        "duration": 60,
        "animation": "animate-pushup",
        "svg": "pushups"
      }
    ]
  },
  {
    "id": "stair-climbing",
    "name": "Brisk Stair Climbing",
    "category": "strength",
    "tier": "hard",
    "xp": 75,
    "duration": 2,
    "targetArea": "legs",
    "desc": "Hourly vascular booster that elevates cardiorespiratory fitness.",
    "steps": [
      {
        "title": "Stair snack climbing",
        "desc": "Briskly walk/climb stairs up and down continuously.",
        "duration": 120,
        "animation": "animate-march",
        "svg": "march"
      }
    ]
  },
  {
    "id": "desk-plank",
    "name": "The Desk Plank",
    "category": "strength",
    "tier": "medium",
    "xp": 55,
    "duration": 1,
    "targetArea": "core",
    "desc": "Isometrically engages core muscles that go slack in computer chairs.",
    "steps": [
      {
        "title": "Isometric Desk Plank",
        "desc": "Forearms on desk edge, hold straight plank. Engage abs.",
        "duration": 60,
        "animation": "animate-plank",
        "svg": "desk_plank"
      }
    ]
  },
  {
    "id": "high-knees",
    "name": "Marching in Place",
    "category": "strength",
    "tier": "medium",
    "xp": 50,
    "duration": 1,
    "targetArea": "legs",
    "desc": "Elevates heart rate and drives hip flexors dynamically for energy.",
    "steps": [
      {
        "title": "Marching in place",
        "desc": "Drive knees high to waist level. Swing arms.",
        "duration": 60,
        "animation": "animate-march",
        "svg": "march"
      }
    ]
  },
  {
    "id": "rebounding",
    "name": "Rebounding Bounces",
    "category": "quiet",
    "tier": "easy",
    "xp": 40,
    "duration": 1,
    "targetArea": "legs",
    "desc": "Light impact bouncing that stimulates lymphatic drainage and bone density.",
    "steps": [
      {
        "title": "Lymphatic Bounces",
        "desc": "Bounce lightly in place, absorb impact through knees.",
        "duration": 60,
        "animation": "animate-bounce",
        "svg": "rebound"
      }
    ]
  },
  {
    "id": "pacing",
    "name": "Pacing Phone Call",
    "category": "quiet",
    "tier": "easy",
    "xp": 80,
    "duration": 5,
    "targetArea": "legs",
    "desc": "Baseline thermogenesis (NEAT) walking that boosts call cognitive focus.",
    "steps": [
      {
        "title": "Walking call pacing",
        "desc": "Walk slowly around your room/office during active call.",
        "duration": 300,
        "animation": "animate-march",
        "svg": "march"
      }
    ]
  }
];
