// coaching.js -- adaptive stiffness coaching: pick the tightest zone and its copy.
const TIE_ORDER = ['neck', 'shoulders', 'back', 'wrists', 'legs'];

export function tightestZone(bodyStiffness) {
  const s = bodyStiffness || {};
  let zone = null, max = 0;
  for (const key of TIE_ORDER) {
    const v = s[key] || 0;
    if (v > max) { max = v; zone = key; }
  }
  return zone;
}

export function preferredAreasFrom(bodyStiffness) {
  const s = bodyStiffness || {};
  return TIE_ORDER.filter(k => (s[k] || 0) > 0);
}

const COACHING = {
  neck: {
    headline: 'Coaching Focus: Cervical Spine Reset',
    body: 'Neck tightness logged. Performing neck stretches and retractions helps prevent nerve compression and strain.',
    bullets: [
      { text: 'Make sure your computer screen is at eye level to prevent neck strain.', critical: true },
      { text: 'Retracting your chin gently resets cervical alignment and reduces shoulder load.', critical: true }
    ]
  },
  shoulders: {
    headline: 'Coaching Focus: Chest & Shoulder Opening',
    body: 'Shoulder strain logged. Engaging chest and shoulder opening stretches to counter slouched posture.',
    bullets: [
      { text: 'Keep your shoulders pulled down and back while you sit to maintain scapular activation.', critical: true },
      { text: 'Doorway stretches open the front body and release respiratory restrictions.', critical: true }
    ]
  },
  back: {
    headline: 'Coaching Focus: Thoracic Spinal Twist',
    body: 'Lumbar pressure logged. Activating rotational extensions hydrates spinal discs to prevent bulging.',
    bullets: [
      { text: 'Use a lumbar support cushion or a rolled-up towel behind your lower back to maintain proper posture.', critical: true },
      { text: 'Rotational spine movement unloads deep back stabilizers and improves ribcage expansion.', critical: true }
    ]
  },
  wrists: {
    headline: 'Coaching Focus: Extremity Tendon Stretch',
    body: 'Wrist fatigue or finger numbness logged. Extending wrist flexors offsets sustained typing shear stress.',
    bullets: [
      { text: 'Keep frequently used items within easy reach on your desk to avoid excessive reaching and twisting.', critical: true },
      { text: 'Stretching your wrist back pulls on tight tendons, preventing carpal channel pressure build-up.', critical: true }
    ]
  },
  legs: {
    headline: 'Coaching Focus: Posterior Chain & Vascular Activation',
    body: 'Leg swelling, fluid build-up, or glute weakness logged. Activating glutes and moving spikes lower extremity circulation.',
    bullets: [
      { text: 'Take a brief activity break to stand up every 30 to 45 minutes to refresh circulation.', critical: true },
      { text: 'Cardio bursts contract major muscle pumps, forcing pooled blood out of the legs.', critical: true }
    ]
  }
};

const GENERIC = {
  headline: 'Coaching Focus: Posture Recovery',
  body: 'No active stiffness logged. Proposing standard mobility flows to protect your body against silent strain build-up.',
  bullets: [
    { text: 'Prolonged sitting triggers hidden posture stress even when you feel fine.', critical: false },
    { text: 'Every 45 minutes of keyboard use should be met with 3 minutes of shoulder extensions.', critical: false }
  ]
};

export function coachingFor(zone) {
  return COACHING[zone] || GENERIC;
}
